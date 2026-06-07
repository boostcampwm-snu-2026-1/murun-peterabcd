# N100 Prod Migration (staging → prod 단일)

Week 3 부터 N100 에서는 **prod 만** 운영한다. dev push 는 GHCR 이미지 빌드까지만, N100 SSH 는 main push 일 때만. 이 문서는 호스트(나)가 N100 콘솔에서 한 번 하는 절차를 정리한다.

기준 시점: PR #36 이후. v0.2.0 태그가 main 에 찍힌 상태.

---

## 0. 사전 준비

- [ ] DuckDNS: `murun.duckdns.org` 등록 + 현재 N100 공인 IP 매핑 (확인: `dig +short murun.duckdns.org`)
- [ ] 공유기: 외부 80/443 → N100 내부 IP 80/443 포트포워딩
- [ ] Google Cloud Console: 기존 `Murun Staging` OAuth client 이름을 `Murun Prod` 로 바꾸고 (보안키 그대로 재사용), Authorized redirect URI 에 아래 추가:
  - `https://murun.duckdns.org/api/auth/callback/google`
- [ ] GitHub repo Secrets 등록 상태 확인 (`gh secret list` on N100 또는 로컬):
  - `N100_HOST` = 공인 IP 또는 `murun.duckdns.org`
  - `N100_USER`
  - `N100_SSH_KEY`

---

## 1. 기존 staging 컨테이너 폐기

테스트 시점에 떴던 `murun-staging` 은 그냥 버린다. 데이터(테스트용 가입 1건 등)는 보존 안 함.

```bash
cd ~/murun-peterabcd/deploy

# 1) staging 컨테이너 down + 볼륨 제거
docker compose -p murun-staging --env-file .env.staging down -v

# 2) 혹시 남은 dangling volume 정리
docker volume ls | grep murun-staging   # 비어있는지 확인
docker volume prune -f                  # (선택) 다른 dangling volume 정리

# 3) staging 용 env 파일 제거 (host-only, gitignore 됨)
rm -f .env.staging
```

확인:

```bash
docker compose ls               # murun-staging 없어야 함
docker volume ls | grep murun   # 비어있어야 함
```

---

## 2. main 브랜치로 repo 동기화

deploy workflow 는 N100 의 `~/murun-peterabcd` 가 main branch 를 가리킨다는 가정. 첫 셋업 때 `dev` 였으면 main 으로 바꿔둔다.

```bash
cd ~/murun-peterabcd
git fetch origin
git checkout main
git pull origin main
```

이후 자동 배포가 SSH 로 들어와서 `git fetch + checkout -B main FETCH_HEAD` 로 갱신한다.

---

## 3. `.env.prod` 작성

```bash
cd ~/murun-peterabcd/deploy
cp .env.example .env.prod
```

`.env.prod` 안의 값:

```env
# --- compose / image ---
IMAGE_TAG=prod          # GH Actions main push 가 prod-<sha> 로 덮어씀

# --- Caddy ---
DOMAIN=murun.duckdns.org
CADDY_HTTP_PORT=80
CADDY_HTTPS_PORT=443

# --- App ---
NODE_ENV=production
DATABASE_URL=file:/app/data/murun.db
NEXT_PUBLIC_APP_URL=https://murun.duckdns.org
UPLOADS_DIR=/app/uploads

# --- Auth.js v5 ---
AUTH_URL=https://murun.duckdns.org
AUTH_SECRET=<openssl rand -base64 32 결과>
AUTH_TRUST_HOST=true

# --- Google OAuth ---
AUTH_GOOGLE_ID=<Murun Prod (=구 Murun Staging) client id>
AUTH_GOOGLE_SECRET=<동일 secret>
AUTH_GOOGLE_HD=snu.ac.kr
```

AUTH_SECRET 생성:

```bash
openssl rand -base64 32
```

권한 확인 (다른 유저 못 읽게):

```bash
chmod 600 .env.prod
```

---

## 4. 첫 prod 기동 (수동 한 번)

GHCR 에서 `prod` 이미지를 받아 띄운다. main push 가 이미 한 번 이미지를 올려둔 상태 (v0.2.0 = `prod-579064b`).

```bash
cd ~/murun-peterabcd/deploy

export MURUN_ENV_FILE=.env.prod

# (선택) ghcr.io pull 인증. repo 가 public 이면 skip 가능.
echo "<PAT_with_read:packages>" | docker login ghcr.io -u peterabcd --password-stdin

docker compose -p murun-prod --env-file .env.prod pull
docker compose -p murun-prod --env-file .env.prod up -d
docker compose -p murun-prod --env-file .env.prod ps
```

기대 상태:

```
NAME                IMAGE                                                    STATUS
murun-prod-app-1    ghcr.io/.../murun-peterabcd:prod-...                      healthy
murun-prod-caddy-1  caddy:2-alpine                                            running
```

로그:

```bash
docker compose -p murun-prod --env-file .env.prod logs -f app
docker compose -p murun-prod --env-file .env.prod logs -f caddy   # cert 발급 확인
```

Caddy 로그에서 "certificate obtained" / "served HTTPS for murun.duckdns.org" 확인.

---

## 5. 첫 로그인 + ADMIN 승인

`https://murun.duckdns.org` 에 접속 → Google 로그인 (SNU 계정) → `/pending` 으로 이동.

같은 N100 에서 본인 계정을 직접 admin 으로 승격:

```bash
cd ~/murun-peterabcd/deploy
docker compose -p murun-prod --env-file .env.prod exec app node
```

Node REPL:

```js
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

await db.user.updateMany({
  where: { email: "본인@snu.ac.kr" },
  data: {
    approved: true,
    role: "ADMIN",
    approvedAt: new Date(),
  },
});

await db.$disconnect();
.exit
```

브라우저에서 새로고침 → `/admin/members` 접근 가능 여부 확인.

---

## 6. 자동 배포 확인

다음 dev → main 머지 시 자동 진행:

```
GitHub Actions
  ├─ Build & push image   → ghcr.io ... :prod-<sha>
  ├─ Check deploy secrets → pass
  └─ Deploy to prod
       ├─ N100 SSH
       ├─ git checkout -B main FETCH_HEAD
       ├─ docker compose pull
       └─ docker compose up -d --remove-orphans
```

수동 트리거가 필요할 때:

```bash
gh workflow run deploy.yml --ref main -f target=prod
```

---

## 7. 트러블슈팅 컷

| 증상 | 원인/확인 | 조치 |
|------|----------|------|
| Caddy `tls obtain failed` | 80/443 외부 접근 불가 | 공유기 포트포워딩 / 방화벽 (`ufw status`) 재확인 |
| `couldn't find env file: ./.env.prod` | `.env.prod` 누락 | 위 §3 다시 |
| Google `redirect_uri_mismatch` | OAuth client 에 prod URI 미등록 | Authorized redirect URI 에 추가 |
| `Invalid host header` | `AUTH_URL` mismatch | `AUTH_URL=https://murun.duckdns.org` 확인 |
| 로그인 후 `/pending` 영원 | DB user `approved=false` | 위 §5 admin 승인 |
| `prisma migrate deploy` 실패 | volume 권한 / 잘못된 DATABASE_URL | `docker volume inspect murun-prod_data` → `/app/data` 마운트 경로 확인 |

---

## 8. 백업 (간단판)

prod 데이터 = SQLite 파일 + uploads 디렉터리. 둘 다 host volume.

```bash
sudo tar czf ~/murun-backup-$(date +%Y%m%d).tar.gz \
  /var/lib/docker/volumes/murun-prod_data/_data \
  /var/lib/docker/volumes/murun-prod_uploads/_data
```

cron 등록은 추후 (`scripts/backup.sh`).

---

## 9. 롤백

```bash
cd ~/murun-peterabcd/deploy

# 직전 태그 확인
docker images ghcr.io/boostcampwm-snu-2026-1/murun-peterabcd --format '{{.Tag}}\t{{.CreatedAt}}'

# 이전 prod-<sha> 로 되돌리기
IMAGE_TAG=prod-<previous-sha> MURUN_ENV_FILE=.env.prod \
  docker compose -p murun-prod --env-file .env.prod up -d
```

Schema 변경이 있던 release 면 migration rollback 까지 별도 작업 필요. v0.2.0 까지는 추가 migration 없음.
