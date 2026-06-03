# Spec · scaffold-bootstrap

> Week 2 Day 1: 빈 repo에 Next.js 15 + 배포 파일 + env 템플릿을 깐다. 도메인 로직 0, 빈 페이지가 뜨고 Docker로 띄울 수 있는 상태가 목표.

## Story

호스트가 PR 1개를 dev에 머지하면, 그 시점부터 (a) 노트북에서 `pnpm dev`로 빈 / 페이지가 뜨고, (b) N100 SSH 후 `docker compose up -d`로 같은 페이지가 80 포트에 뜬다.

## Closes

- #6  Next.js 15 + Tailwind + shadcn 스캐폴드
- N-1 N100 서버 부트스트랩 + Docker + Caddy
- N-2 .env.example + NEXTAUTH_SECRET

(N-1의 "N100에서 docker compose up 성공" 항목은 호스트(나) 액션이라 PR 내에서 코드 acceptance만 충족. 실제 서버 검증은 머지 후.)

## Acceptance

### 코드 측
- [ ] `pnpm install && pnpm dev` → `http://localhost:3000` 에 "뮤런" 텍스트가 보이는 빈 페이지
- [ ] Tailwind CSS 동작 (적용 여부를 단순 클래스 1개로 확인)
- [ ] shadcn `Button` 1개 import 되어 렌더링
- [ ] `pnpm typecheck` 통과 (tsc --noEmit)
- [ ] `pnpm lint` 통과 (next lint)
- [ ] `pnpm build` 통과 (App Router standalone output)
- [ ] `.env.example` 에 W2/3에서 쓸 모든 키 자리만 (값 X)

### 배포 측 (코드만)
- [ ] `deploy/Dockerfile` — Next standalone, multi-stage, non-root user
- [ ] `deploy/docker-compose.yml` — caddy + app, 볼륨 2개 (data, uploads)
- [ ] `deploy/Caddyfile` — `:80` 진입 + app:3000 reverse_proxy (HTTPS는 도메인 붙은 후)
- [ ] `deploy/README.md` — 호스트(나)가 N100에서 실행할 명령 정리

## Out of scope (이번 PR에서 안 함)

- Prisma / DB 모델 (다음 PR)
- Auth.js / Google OAuth (다음 PR)
- 어떤 도메인 페이지든 (sessions, login, pending …)
- HTTPS / duckdns 도메인 등록
- GH Actions CI/CD 워크플로우 (별 PR)
- 테스트 (Vitest 셋업만, 케이스 X)

## Touched files (예상)

| 파일 | new/edit | 요지 |
|------|----------|------|
| `package.json` | new | next 15, react 19, ts, tailwind, shadcn deps, scripts |
| `pnpm-lock.yaml` | new | lockfile |
| `tsconfig.json` | new | strict, baseUrl `.` |
| `next.config.ts` | new | `output: 'standalone'` |
| `tailwind.config.ts` | new | content paths |
| `postcss.config.mjs` | new | |
| `eslint.config.mjs` | new | next/core-web-vitals + ts |
| `app/layout.tsx` | new | html/body, Tailwind import |
| `app/page.tsx` | new | "뮤런" + Button 1개 |
| `app/globals.css` | new | tailwind directives |
| `components/ui/button.tsx` | new | shadcn 복사본 |
| `lib/utils.ts` | new | shadcn cn() |
| `components.json` | new | shadcn config |
| `.env.example` | new | 모든 키 placeholder |
| `deploy/Dockerfile` | new | multi-stage standalone |
| `deploy/docker-compose.yml` | new | caddy + app |
| `deploy/Caddyfile` | new | reverse_proxy |
| `deploy/README.md` | new | 호스트 운영 명령 |
| `.dockerignore` | new | node_modules, .next, .env*, .git |
| `.gitignore` | edit | scaffold 생성물 반영 |
| `README.md` | edit | 빠른 시작 갱신 |
| `tests/` | new | vitest config, smoke test 0개 (다음 PR에서) |

## Open questions

(없음 — 결정된 스택 그대로)

## Verification (사용자가 직접)

1. `pnpm install` → 에러 0
2. `pnpm dev` → `localhost:3000` 에서 "뮤런" + 버튼 보임
3. `pnpm typecheck && pnpm lint && pnpm build` 셋 다 통과
4. (호스트 작업) N100에서 `cd deploy && docker compose up -d --build` 후 80 포트로 같은 페이지
