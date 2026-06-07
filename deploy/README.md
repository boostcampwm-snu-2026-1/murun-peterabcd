# 뮤런 · Deploy

자체 N100 호스트에서 Docker Compose 로 띄우는 절차. 사람(호스트)만 본다.

## 정책 요약 (Week 3 ~)

- **N100 = prod 단일.** staging 은 N100 에서 안 돌린다. dev 작업은 로컬에서 직접 `pnpm dev`.
- **자동 배포는 `main` push 일 때만.** `dev` push 는 GHCR 에 `staging-<sha>` 이미지를 빌드/푸시까지만 한다 ("컨테이너 빌드가 깨지지 않는가" 안전망용). N100 에는 떨어지지 않는다.
- **DuckDNS + Let's Encrypt HTTPS.** `DOMAIN=murun.duckdns.org` 로 Caddy 자동 발급.

## 0. CI/CD (자동 배포) 사용 시 (권장)

GitHub Actions 가 `main` push → prod 배포한다. 첫 셋업 한 번만 호스트에서 manual init 후, 그 다음부턴 main 에 PR 머지하면 자동 반영.

### 호스트 1회 init

```bash
# 1) repo clone (한 번만; deploy workflow 의 git sync 경로와 일치해야 함)
cd ~
git clone https://github.com/boostcampwm-snu-2026-1/murun-peterabcd.git
cd murun-peterabcd

# main 을 default 로 둠 (workflow 가 main ref 기준으로 fetch/checkout 한다)
git checkout main

cd deploy

# 2) prod .env 준비
cp .env.example .env.prod
# 안에서 채울 키:
#   DOMAIN=murun.duckdns.org
#   NEXT_PUBLIC_APP_URL=https://murun.duckdns.org
#   AUTH_URL=https://murun.duckdns.org
#   AUTH_SECRET=$(openssl rand -base64 32)
#   AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET (Google Cloud Console)
#   DATABASE_URL=file:/app/data/murun.db
#   UPLOADS_DIR=/app/uploads
#   AUTH_TRUST_HOST=true
#   AUTH_GOOGLE_HD=snu.ac.kr
#   IMAGE_TAG=prod   (GH Actions 가 main push 시 prod-<sha> 로 덮어씀)

# 3) (필요 시) ghcr.io pull 인증
echo "<PAT_with_read:packages>" | docker login ghcr.io -u <github_user> --password-stdin

# 4) 첫 가동
export MURUN_ENV_FILE=.env.prod
docker compose -p murun-prod --env-file .env.prod pull
docker compose -p murun-prod --env-file .env.prod up -d
```

### GitHub Actions secrets 등록 (Settings → Secrets and variables → Actions)

| 키 | 값 |
|----|------|
| `N100_HOST` | N100 의 공인 IP 또는 DDNS 도메인 (`murun.duckdns.org`) |
| `N100_USER` | SSH 로그인 유저 |
| `N100_SSH_KEY` | private SSH key 내용 전체 (BEGIN/END 포함). 공개키는 N100 의 `~/.ssh/authorized_keys` 에 등록 |

SSH key 생성 (호스트에서):

```bash
ssh-keygen -t ed25519 -C "gh-actions-murun-deploy" -f ~/.ssh/n100_gh_deploy
cat ~/.ssh/n100_gh_deploy.pub >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
# private key 를 GitHub secret 에 등록:
gh secret set N100_SSH_KEY < ~/.ssh/n100_gh_deploy
gh secret set N100_HOST --body "<ip-or-domain>"
gh secret set N100_USER --body "<user>"
```

Secrets 가 등록되어 있지 않으면 main push 도 image build/push 까지만 성공 처리하고, SSH deploy job 은 skip 된다.

### (옵션) prod environment 보호

main → prod 자동 배포 전에 수동 승인이 필요하면 Settings → Environments → `prod` 생성 후 "Required reviewers" 본인 추가.

### 수동 트리거

특정 ref 를 prod 로 즉시 배포:

```bash
gh workflow run deploy.yml --ref main -f target=prod
```

## 1. 수동 배포 (CI/CD 우회) — 디버깅 / 첫 배포

```bash
cd ~/murun-peterabcd/deploy

# 위의 .env.prod 가 이미 준비됐다고 가정
export MURUN_ENV_FILE=.env.prod

# 이미지가 없거나 강제로 rebuild 하고 싶을 때 (오래 걸림)
docker compose -p murun-prod --env-file .env.prod up -d --build

# 이미지를 GHCR 에서 pull 만 (보통은 이쪽)
docker compose -p murun-prod --env-file .env.prod pull
docker compose -p murun-prod --env-file .env.prod up -d
```

헬스체크:

```bash
docker compose -p murun-prod --env-file .env.prod ps
curl -fsS http://localhost/api/health && echo OK
```

## 2. 업데이트 배포 (수동)

```bash
cd ~/murun-peterabcd
git pull
cd deploy
MURUN_ENV_FILE=.env.prod docker compose -p murun-prod --env-file .env.prod pull
MURUN_ENV_FILE=.env.prod docker compose -p murun-prod --env-file .env.prod up -d
docker image prune -f
```

## 3. 데이터 위치 (백업 대상)

| docker volume | 호스트 경로 (Linux 기본) | 용도 |
|---------------|--------------------------|------|
| `murun-prod_data`        | `/var/lib/docker/volumes/murun-prod_data/_data`        | SQLite 파일 |
| `murun-prod_uploads`     | `/var/lib/docker/volumes/murun-prod_uploads/_data`     | 단체사진 원본 + next/image 캐시 |
| `murun-prod_caddy_data`  | `/var/lib/docker/volumes/murun-prod_caddy_data/_data`  | Let's Encrypt 인증서 |

백업 cron 은 후속 작업 (`scripts/backup.sh`).

## 4. 롤백

```bash
# 직전 이미지 태그 확인
docker images ghcr.io/boostcampwm-snu-2026-1/murun-peterabcd --format '{{.Tag}}\t{{.CreatedAt}}'

# 특정 태그로 되돌리기 (예: 직전 prod 빌드)
IMAGE_TAG=prod-<sha> MURUN_ENV_FILE=.env.prod docker compose -p murun-prod --env-file .env.prod up -d
```

## 5. 트러블슈팅

```bash
# 컨테이너 상태
docker compose -p murun-prod --env-file .env.prod ps

# app 로그
docker compose -p murun-prod --env-file .env.prod logs -f app

# caddy 로그 (인증서 발급 / TLS 문제)
docker compose -p murun-prod --env-file .env.prod logs -f caddy

# 강제 재기동
docker compose -p murun-prod --env-file .env.prod restart app
```

## 6. DuckDNS HTTPS 활성 절차

1. DuckDNS 에서 `murun.duckdns.org` 발급 + N100 공인 IP 등록 (DDNS 클라이언트로 자동 갱신 권장)
2. 공유기에서 외부 80/443 → N100 내부 IP 의 80/443 포트포워딩
3. `deploy/.env.prod` 의 값 확인:
   ```env
   DOMAIN=murun.duckdns.org
   NEXT_PUBLIC_APP_URL=https://murun.duckdns.org
   AUTH_URL=https://murun.duckdns.org
   ```
4. `docker compose -p murun-prod --env-file .env.prod up -d` (Caddy 재기동 → Let's Encrypt 자동 발급)
5. `docker compose ... logs caddy` 에서 "certificate obtained for murun.duckdns.org" 확인

## 7. Staging 환경 (옵션, N100 외 어딘가에서 돌릴 때)

기본 정책상 N100 에서는 staging 을 돌리지 않는다. 필요하면 다른 호스트/포트로:

```bash
MURUN_ENV_FILE=.env.staging \
  CADDY_HTTP_PORT=8080 CADDY_HTTPS_PORT=8443 \
  docker compose -p murun-staging --env-file .env.staging up -d --build
```

이 경우에도 GH Actions 자동 배포 대상은 아님. 항상 수동.
