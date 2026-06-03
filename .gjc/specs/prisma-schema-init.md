# Spec · prisma-schema-init

> #7. SQLite + Prisma 도입. 모델은 docs/wiki/03-Screen-Flow.md §4 그대로 옮긴다.
> 자체 호스팅 시 컨테이너가 매 기동마다 `prisma migrate deploy` 를 돌려 idempotent 하게 적용한다.

## Story

호스트가 이 PR을 머지하고 N100에서 `docker compose up -d --build` 하면, 컨테이너 entrypoint가 자동으로 migration을 적용하고 `/app/data/murun.db` 가 호스트 볼륨에 생성된다. 코드에선 `import { db } from "@/lib/db"` 한 줄로 어디서든 typed query 가능.

## Closes

- #7 Prisma 초기 schema + 1차 migration (SQLite)

## Acceptance

### Schema 측
- [ ] `prisma/schema.prisma`:
  - `datasource db` provider = `sqlite`, url = `env("DATABASE_URL")`
  - `generator client` provider = `prisma-client-js`, `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]`
- [ ] 모델 3개 (03-Screen-Flow §4 그대로):
  - **User**: googleSub unique, email unique, approved/approvedById/approvedAt, role (MEMBER/ADMIN), 자기참조 Approver 관계
  - **Session**: hostId FK, date, startTime, weather, groupPhotoPath, notes, createdAt/updatedAt
  - **Participation**: (sessionId, userId) **unique**, distanceKm/durationSec nullable, note, Cascade on session delete
- [ ] `Role` enum (SQLite는 enum 미지원 → schema에선 String + zod로 표현. 메모로 명시.)

### Migration / Tooling
- [ ] `prisma/migrations/<ts>_init/migration.sql` 커밋 (자동 생성물)
- [ ] `package.json` scripts:
  - `db:generate`, `db:migrate`, `db:studio`, `db:push` (긴급 dev용)
- [ ] `lib/db.ts`: PrismaClient 싱글톤 (Next dev hot-reload 대비)
- [ ] `.env.example` 에 `DATABASE_URL=file:./data/murun.db` uncommented

### Docker 통합
- [ ] Dockerfile에 `openssl` 패키지 설치 (Prisma engine 의존)
- [ ] builder stage: `prisma generate` 실행
- [ ] runner stage: prisma CLI + 생성된 client + schema 명시 복사
- [ ] `deploy/entrypoint.sh`: `prisma migrate deploy && node server.js`
- [ ] `next.config.ts` 의 `outputFileTracingIncludes` 로 `.prisma/client/**`, `prisma/**` 명시
- [ ] data 볼륨 마운트는 기존대로 (`/app/data`)

### 검증 (사용자가 직접)
- [ ] `pnpm install` 통과
- [ ] `pnpm db:migrate` (이름 `init`) → migration.sql 생성, dev DB 파일이 `./data/murun.db` 에 만들어짐
- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm build` 통과
- [ ] 스모크: `pnpm db:studio` 로 빈 테이블 3개(User/Session/Participation) 보이는지

## Out of scope (이번 PR에서 안 함)

- Auth.js / OAuth — 다음 PR
- 권한 가드 (`lib/guard.ts`) — 다음 PR
- 도메인 페이지 (로그인/세션/관리)
- Seed 데이터
- SQLite WAL 모드 활성화 (기본 rollback journal 로 충분, 필요시 추후)
- Prisma 외 백업 스크립트 (Week 3)
- GH Actions에서 migration 검증

## Touched files (예상)

| 파일 | new/edit | 요지 |
|------|----------|------|
| `package.json` | edit | prisma 의존 추가 (`prisma`, `@prisma/client`), db:* scripts |
| `pnpm-lock.yaml` | edit | |
| `prisma/schema.prisma` | new | |
| `prisma/migrations/<ts>_init/migration.sql` | new | 자동 생성 |
| `prisma/migrations/migration_lock.toml` | new | provider lock |
| `lib/db.ts` | new | PrismaClient 싱글톤 |
| `.env.example` | edit | DATABASE_URL uncomment |
| `next.config.ts` | edit | outputFileTracingIncludes |
| `deploy/Dockerfile` | edit | openssl, prisma generate, runner stage 복사, entrypoint |
| `deploy/entrypoint.sh` | new | migrate deploy → node server.js |
| `deploy/docker-compose.yml` | edit | env_file에 DATABASE_URL 들어갈 자리 |
| `.gitignore` | edit | data/*.db, prisma/dev.db* |

## Open questions

- Role을 String으로 둘지 별도 SQLite-friendly 표현으로 둘지 → **String + lib 레벨 zod enum 검증** 으로 결정 (Prisma 6 sqlite도 enum 미지원)
- migrate dev DB 파일 위치 → `./data/murun.db` (docker compose data 볼륨과 같은 상대 이름, gitignore)

## Verification (사용자가 직접 — Fidelity)

1. `pnpm install && pnpm db:migrate` → migration init 생성, exit 0
2. `pnpm db:studio` → User/Session/Participation 빈 테이블 3개 보임
3. `pnpm check` → typecheck/lint/build 통과
4. (호스트, 머지 후) Docker 빌드 → 첫 기동 시 `prisma migrate deploy` 로그 → `/app/data/murun.db` 호스트 볼륨에 생성
