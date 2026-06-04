# 뮤런 · Deploy

자체 N100 호스트에서 Docker Compose 로 띄우는 절차. 사람(호스트)만 본다.

## 0. CI/CD (자동 배포) 사용 시 (권장)

GitHub Actions 가 dev push → staging, main push → prod 로 자동 배포한다.
첫 셋업 한 번만 호스트에서 manual init 후, 그 다음부턴 코드만 push 하면 됨.

### 호스트 1회 init

```bash
# 1) repo clone (한 번만)
git clone https://github.com/boostcampwm-snu-2026-1/murun-peterabcd.git
cd murun-peterabcd/deploy

# 2) staging / prod 각각 .env 준비
cp .env.example .env.staging
cp .env.example .env.prod
# (DOMAIN, AUTH_*, GOOGLE_*, DATABASE_URL, NEXT_PUBLIC_APP_URL 채우기)

# 3) ghcr.io pull 인증 (한 번만, repo 가 public 이면 skip 가능)
echo "<PAT_with_read:packages>" | docker login ghcr.io -u <github_user> --password-stdin

# 4) 첫 가동 (이미지 빌드는 GH Actions 가 대신, 여기선 pull 만)
docker compose -p murun-staging --env-file .env.staging pull
docker compose -p murun-staging --env-file .env.staging up -d
```

### GitHub Actions secrets 등록 (Settings → Secrets and variables → Actions)

| 키 | 값 |
|----|------|
| `N100_HOST` | N100 의 공인 IP 또는 DDNS 도메인 |
| `N100_USER` | SSH 로그인 유저 |
| `N100_SSH_KEY` | private SSH key 내용 전체 (BEGIN/END 포함). 공개키는 N100 의 `~/.ssh/authorized_keys` 에 등록 |

SSH key 생성 (호스트에서):
```bash
ssh-keygen -t ed25519 -C "gh-actions-murun-deploy" -f ~/.ssh/n100_gh_deploy
cat ~/.ssh/n100_gh_deploy.pub >> ~/.ssh/authorized_keys
# private key 를 GitHub secret 에 등록:
gh secret set N100_SSH_KEY < ~/.ssh/n100_gh_deploy
gh secret set N100_HOST --body "<ip-or-domain>"
gh secret set N100_USER --body "<user>"
```

### (옵션) prod environment 보호

main 으로의 자동 배포 전에 수동 승인이 필요하면 Settings → Environments → "prod" 생성 후 "Required reviewers" 본인 추가.

## 1. 수동 배포 (CI/CD 우회) — 첫 배포 또는 디버깅

```bash
# 호스트에 git clone
git clone https://github.com/boostcampwm-snu-2026-1/murun-peterabcd.git
cd murun-peterabcd/deploy

# compose용 env
cp .env.example .env
# (도메인 붙기 전엔 DOMAIN=:80 그대로 두기)

# app 환경변수 (지금은 비어 있어도 OK, 후속 PR에서 채워짐)
touch .env       # app 서비스 env_file 이 ./.env 라서 같은 파일이 두 용도 겸함
                 # — 추후 app.env 로 분리 예정

# 빌드 + 기동
docker compose up -d --build

# 헬스체크
curl -fsS http://localhost/ && echo OK
```

## 2. 업데이트 배포

```bash
cd murun-peterabcd
git pull
cd deploy
docker compose up -d --build
docker image prune -f
```

## 3. staging + prod 동시 운영

같은 디렉터리에 `.env.staging`, `.env.prod` 를 별도로 두고 project name 으로 분리.

```bash
# staging (포트 8080)
CADDY_HTTP_PORT=8080 docker compose -p murun-staging --env-file .env.staging up -d --build

# prod (포트 80)
docker compose -p murun-prod --env-file .env.prod up -d --build
```

볼륨은 project name prefix 가 자동으로 붙어 분리됨 (`murun-staging_data` vs `murun-prod_data`).

## 4. 데이터 위치 (백업 대상)

| docker volume | 호스트 경로 (Linux 기본) | 용도 |
|---------------|--------------------------|------|
| `murun_data`     | `/var/lib/docker/volumes/murun_data/_data`     | SQLite 파일 |
| `murun_uploads`  | `/var/lib/docker/volumes/murun_uploads/_data`  | 단체사진 원본 + next/image 캐시 |
| `murun_caddy_data` | `/var/lib/docker/volumes/murun_caddy_data/_data` | Let's Encrypt 인증서 |

백업 cron 은 후속 PR 에서 (`scripts/backup.sh`).

## 5. 롤백

```bash
# 직전 이미지 태그 확인
docker images ghcr.io/boostcampwm-snu-2026-1/murun --format '{{.Tag}}\t{{.CreatedAt}}'

# 특정 태그로 되돌리기
IMAGE_TAG=<sha> docker compose up -d
```

## 6. 트러블슈팅

```bash
# 컨테이너 상태
docker compose ps

# app 로그
docker compose logs -f app

# caddy 로그
docker compose logs -f caddy

# 강제 재기동
docker compose restart app
```

## 7. 도메인 붙인 후 (예: duckdns)

1. duckdns 에서 `murun.duckdns.org` 발급 + 현재 공인 IP 등록
2. 공유기 80/443 포트포워딩 → N100 내부 IP
3. `deploy/.env` 에 `DOMAIN=murun.duckdns.org` 로 변경
4. `docker compose up -d` (Caddy 재기동되며 Let's Encrypt 자동 발급)
5. 첫 인증서 발급 후 `docker compose logs caddy` 에서 "certificate obtained" 확인
