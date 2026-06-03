# 뮤런 · Deploy

자체 N100 호스트에서 Docker Compose 로 띄우는 절차. 사람(호스트)만 본다.

## 1. 첫 배포 (한 번만)

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
