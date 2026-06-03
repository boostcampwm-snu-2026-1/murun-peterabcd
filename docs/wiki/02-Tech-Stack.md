# 02 · 기술 스택 선택과 이유

## 1. 결정 요약

| 영역 | 선택 | 한 줄 이유 |
|------|------|------------|
| 언어 | TypeScript | 풀스택 단일 언어. 타입으로 Agent 실수 차단. |
| 프레임워크 | **Next.js 15 (App Router, standalone output)** | Server Action·`next/image`·OG 이미지가 본 도메인과 맞음. Vercel 없이도 단일 Node 프로세스로 동작. |
| 스타일 | **Tailwind CSS + shadcn/ui** | 컴포넌트 코드를 repo가 직접 갖고 있어 Agent가 수정 가능. |
| 폼/검증 | **react-hook-form + zod** | 클라이언트/서버 동일 스키마. |
| DB | **SQLite (파일)** | 별도 서버 프로세스 0. 백업 = 파일 1개 복사. 동아리 규모에 과한 게 없음. |
| ORM | **Prisma** | 타입 안전. SQLite provider 한 줄로 전환. |
| 인증 | **Auth.js v5 + Google OAuth (`hd: snu.ac.kr` 강제)** | 부원이 이미 가진 SNU 구글 계정 그대로. 이메일 발송 SaaS 0. |
| 가입 정책 | **화이트리스트(approved=true)** + 관리자 승인 | OAuth 통과해도 관리자가 승인해야 입장. |
| 사진 저장 | **로컬 볼륨 마운트** (`/var/lib/murun/uploads`) | DB와 분리. 원본 그대로 보존. |
| 이미지 최적화 | **`next/image` + sharp** (서빙 시 webp 변환·디스크 캐시) | 원본 품질 손상 0. N100 CPU 압박 미미. |
| 호스팅 | **자체 N100 서버** | 부트캠프 후에도 운영 가능. SaaS 의존 최소화. |
| 컨테이너 | **Docker + docker compose** | staging/prod를 같은 이미지로 동시에. 데이터는 호스트 볼륨. |
| 리버스 프록시 | **Caddy** | Let's Encrypt 자동, Caddyfile 10줄. |
| 도메인/HTTPS | **(Week 3) duckdns + Caddy 자동 인증서** | 당장은 IP:port + 로컬 hosts. |
| 차트 | **Recharts** | Week 3 stretch용. |
| 테스트 | **Vitest** (필요 시 Playwright 스모크 1개) | 도메인 함수만 단위, e2e는 욕심내지 않음. |
| 코드 품질 | **ESLint + Prettier** | 기본값. |
| CI | **GitHub Actions**: lint + typecheck + build → ghcr.io push | N100은 pull만. |
| CD | **GH Actions → SSH → `docker compose pull && up -d`** | staging은 자동, prod는 수동 승인 후. |
| 패키지 매니저 | **pnpm** | Next 친화, 디스크 효율. |
| 모니터링 (선택) | Uptime Kuma + `docker logs` | 운영 부담 최소화. |
| 백업 | cron + restic → 외부 디스크 (Week 3) | DB 파일 + uploads 디렉터리만. |

## 2. 큰 결정 4개 — 왜 그렇게 갔는가

### 2.1 자체 서버(N100) vs SaaS (Vercel + Supabase)

**선택: 자체 서버.** SaaS 잔존은 GitHub 1개뿐.

| 항목 | SaaS 조합 | 자체 서버 |
|------|-----------|-----------|
| 셋업 | 1시간 | 반나절~1일 |
| 운영비 | 무료티어 한도 위험 | 0 (서버 sunk cost) |
| 데이터 주권 | 외부 사업자 | 본인 |
| 학습 가치 | 메타프레임워크 | 풀스택 + 인프라 |
| 단점 | 락인 | SPOF, 인증서/포트포워딩 운영 부담 |

부트캠프 요구("3주 이후에도 지속가능한 소프트웨어 구조") + 동아리 내부용이라는 도메인 + 부원들이 외부 사업자에 사진/페이스 기록을 맡기지 않아도 되는 점 → 자체 서버가 명확.

### 2.2 SQLite vs Postgres

**선택: SQLite.** 동아리 30~50명 + 주 1회 쓰기 트래픽이라면 Postgres 컨테이너는 과함.

- 컨테이너 1개 줄어듦 (운영 동선 단순)
- 백업 = `cp murun.db murun.db.bak`
- Prisma 지원 동일, schema 표현력 손해 없음
- 미래에 Postgres 필요해지면 provider 한 줄 + migration 재실행으로 이전 가능

### 2.3 Next.js 15 vs Vite + (Hono/Express)

**선택: Next.js 유지.** 결정 요인은 우리 도메인 특성:

- **OG 이미지(카톡 공유)**: `opengraph-image.tsx` 한 파일이면 끝. SPA로는 별도 라우트·satori 직접.
- **`next/image`**: 단체사진 갤러리에 자동 webp/srcset/lazy. 직접 만들면 N100에서 안 만들 가능성 높음.
- **Server Action**: "1분 입력" 폼에 boilerplate 절반.
- **자체 호스팅 친화**: `output: 'standalone'` 모드 → 단일 `node server.js` + 마운트. Vercel 없이 동일하게 동작.
- 트레이드오프: FE/BE 경계 흐림, Server/Client component 학습 비용. 받아들임.

### 2.4 인증: Google OAuth + 화이트리스트 (vs 매직링크 / 단일 비번)

**선택: Auth.js v5 Google Provider + `hd: snu.ac.kr` + User.approved 화이트리스트.**

- 부원 모두 SNU 구글 계정을 이미 가짐 → 신규 가입 마찰 0
- 이메일 발송 SaaS(Resend) 불필요 → SaaS 잔존 0
- `hd` 파라미터로 @snu.ac.kr 도메인 1차 필터, 관리자 승인이 2차 필터
- "본인 인증된 사용자가 본인 행을 쓴다"는 게시글-댓글 모델에 필수

콜백 URL은 로컬 = `http://localhost:3000/api/auth/callback/google`, staging = duckdns 연결 후 등록. 도메인 없는 동안엔 로컬 OAuth만 동작 → MVP 진입 후순위는 OAuth 등록.

## 3. 환경 변수 초안

```dotenv
# .env.example
DATABASE_URL=file:./data/murun.db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_HD=snu.ac.kr          # 이메일 도메인 강제
UPLOADS_DIR=./uploads
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 4. 폴더 구조 초안 (Week 2 진입 시점)

```
murun-peterabcd/
├─ app/
│  ├─ (auth)/login/page.tsx
│  ├─ pending/page.tsx          # 가입 승인 대기
│  ├─ (app)/                    # 로그인 + approved 필요
│  │  ├─ sessions/
│  │  │  ├─ page.tsx
│  │  │  ├─ new/page.tsx
│  │  │  ├─ [id]/page.tsx
│  │  │  └─ [id]/opengraph-image.tsx
│  │  ├─ runners/[id]/page.tsx
│  │  ├─ me/page.tsx
│  │  └─ admin/members/page.tsx # 승인 페이지
│  ├─ api/auth/[...nextauth]/route.ts
│  ├─ layout.tsx
│  └─ globals.css
├─ components/
│  ├─ ui/                       # shadcn 복사본
│  └─ session/
├─ lib/
│  ├─ db.ts                     # Prisma client
│  ├─ auth.ts                   # Auth.js config + helpers
│  ├─ guard.ts                  # requireApproved() 등
│  ├─ pace.ts                   # 페이스 계산 (순수 함수)
│  └─ uploads.ts                # 파일 저장 헬퍼
├─ prisma/
│  └─ schema.prisma
├─ deploy/
│  ├─ Dockerfile
│  ├─ docker-compose.yml        # caddy + app
│  ├─ Caddyfile
│  └─ deploy.sh
├─ docs/wiki/
├─ .github/workflows/
│  ├─ ci.yml                    # PR: lint + typecheck + build
│  └─ deploy.yml                # dev → staging, main → prod
├─ .gjc/
└─ tests/
```

## 5. 배포 / Docker 구성

```
┌────────────────── N100 호스트 ───────────────────┐
│                                                 │
│  caddy 컨테이너   (80/443 노출, 자동 HTTPS)      │
│      └─→ app:3000 으로 프록시                    │
│                                                 │
│  app 컨테이너     (Next.js standalone)           │
│      ├─ 볼륨: /data    → /var/lib/murun/db      │
│      │  (SQLite 파일 murun.db)                  │
│      └─ 볼륨: /uploads → /var/lib/murun/uploads │
│         (단체사진 원본 + next/image 캐시)        │
│                                                 │
│  DB 컨테이너 없음 — SQLite는 app 안에서 동작      │
└─────────────────────────────────────────────────┘
        ▲
        │ GitHub Actions가 SSH로:
        │   docker compose pull && up -d
        │ staging: dev push → 자동
        │ prod:    main push → 수동 승인 후
```

- staging/prod 분리: 같은 이미지를 `-p murun-staging` / `-p murun-prod` 다른 project name으로 동시에. 볼륨·포트·서브도메인 전부 분리.
- 빌드는 GitHub Actions에서 → `ghcr.io/boostcampwm-snu-2026-1/murun:<sha>` 로 push. N100은 pull만.

## 6. 채택하지 않은 것

| 후보 | 채택 안 한 이유 |
|------|----------------|
| Vercel | 자체 서버 도입과 충돌 |
| Supabase | 자체 호스팅 + Auth.js로 대체 |
| Resend / SES (이메일) | Google OAuth 채택으로 이메일 발송 불필요 |
| Nginx | Caddy 대비 인증서 자동화에 추가 작업 (certbot + cron) 필요. 솔로 운영에서 가치 작음. |
| Traefik | 컨테이너 자동 감지는 서비스 1~2개 규모에선 셋업 비용 > 가치. |
| Postgres 컨테이너 | SQLite로 충분. 미래 이전 가능. |
| Native 모바일 앱 | PWA로 충분. |
| Drizzle ORM | Prisma의 schema 단일 진실 원천이 Agent 협업에 더 명확. |
| GraphQL / tRPC | Server Action으로 대부분 해결. |
| Matrix/IRC/Discord 로그인 | 본 동아리는 단톡방 중심. SNU 구글 계정이 가장 자연스러움. |
