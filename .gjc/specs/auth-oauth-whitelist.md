# Spec · auth-oauth-whitelist

> #18 + #19 묶음. Auth.js v5 Google OAuth + `hd: snu.ac.kr` 도메인 강제 + User.approved 화이트리스트 + `/admin/members` 승인 페이지.
> 둘을 따로 분리하면 "로그인은 되는데 권한 체크는 없음" 같은 어색한 중간 상태가 생겨서 한 PR로 묶음.

## Story

1. 신규 부원이 `/login` 에서 "SNU 구글로 계속하기" 클릭 → @snu.ac.kr OAuth → User 레코드 (`approved=false`) 자동 생성 → `/pending` 안내
2. 관리자가 `/admin/members` 에서 [승인] 클릭 → DB의 `approved=true`, `approvedById`, `approvedAt` 기록
3. 부원이 새로고침 → 정상적으로 보호 페이지 진입 가능 (아직은 빈 `/` 만 있음)

## Closes

- #18 Auth.js v5 Google OAuth + @snu.ac.kr 도메인 강제
- #19 가입 화이트리스트 + /admin/members 승인 페이지

## Acceptance

### 인증
- [ ] `next-auth@5.x` + `@auth/prisma-adapter` 설치
- [ ] Google provider 1개. `authorization.params.hd` 로 `@snu.ac.kr` 도메인 우선 필터 + `signIn` callback 에서 이메일 도메인 재검증 (hd 파라미터는 클라이언트가 우회 가능)
- [ ] Session strategy = `jwt` (우리 도메인 `Session` 모델과 이름 충돌 회피 + DB 호출 감소)
- [ ] JWT callback 에서 매 요청마다 `approved`/`role` 을 DB에서 fresh fetch (관리자 승인 즉시 반영)
- [ ] Session 객체에 `user.id`, `user.approved`, `user.role` 추가 (types 확장)

### Schema 변경
- [ ] User 모델 갱신 (Auth.js Prisma Adapter 표준 호환):
  - `googleSub` 제거 (Account.providerAccountId 가 대체)
  - `avatarUrl` → `image` 로 rename (Adapter 표준)
  - `emailVerified DateTime?` 추가
  - `name` 은 String 유지 (Google이 항상 제공)
- [ ] Account 모델 추가 (Auth.js 표준)
- [ ] VerificationToken 모델 추가 (이메일 인증 안 쓰지만 Adapter가 요구)
- [ ] migration 2 추가: `<ts>_auth_models`

### 페이지
- [ ] `/login`: Google OAuth 버튼만. 이미 로그인된 사용자가 진입하면 `/` 로 리다이렉트.
- [ ] `/pending`: 승인 대기 안내 + 로그아웃 버튼. 이미 승인된 사용자가 진입하면 `/` 로.
- [ ] `/admin/members`: ADMIN 만 접근. 승인 대기 / 활동 회원 두 섹션. 각 행에 [승인]/[거절] 버튼.
- [ ] `app/page.tsx`: 로그인 안 됨 → `/login`, 로그인 됐는데 approved=false → `/pending`, 그 외 → 빈 placeholder ("다음 PR에서 /sessions로 리다이렉트")

### Guard / 보호
- [ ] `lib/auth.ts`: NextAuth 설정. `handlers`, `auth`, `signIn`, `signOut` export.
- [ ] `lib/guard.ts`: `requireUser()`, `requireApproved()`, `requireAdmin()` 헬퍼 (Server Component / Server Action 에서 첫 줄 호출)
- [ ] `middleware.ts`: `/admin/*` 는 ADMIN, `/pending` 은 로그인된 사용자, `/login` 은 비로그인만 (이미 인증된 사용자는 `/`로 보냄)
- [ ] `app/api/auth/[...nextauth]/route.ts`: NextAuth handlers GET/POST export

### Server actions
- [ ] `app/admin/members/actions.ts`:
  - `approveUser(formData)`: ADMIN guard → User.update(approved=true, approvedById=현재 user, approvedAt=now). 본인은 승인 불가 (이미 부트스트랩됨)
  - `rejectUser(formData)`: ADMIN guard → User.delete. (재시도 가능. soft-delete는 OOS)
- [ ] zod 입력 검증
- [ ] revalidatePath("/admin/members")

### Env / 운영
- [ ] `.env.example` 의 NEXTAUTH_*, GOOGLE_* uncomment + 주석에 발급 절차
- [ ] `deploy/.env.example` 동일
- [ ] `README` 에 "첫 관리자 부트스트랩" 절차 추가 (DB에서 직접 `UPDATE User SET role='ADMIN' WHERE email='peterabcd@snu.ac.kr'`)

### 타입
- [ ] `types/next-auth.d.ts`: Session.user에 id/approved/role 확장

## Out of scope (이번 PR에서 안 함)

- 실제 OAuth 발급 (사용자가 별도로 Google Cloud Console에서 — 머지 후 .env.local 에 키 채워서 검증)
- 도메인 페이지 (`/sessions/*`) — 다음 PR
- 사진 업로드 — 다음 PR
- `/admin/members` 에서 회원 권한 (MEMBER→ADMIN) 토글 UI — 첫 관리자는 SQL 부트스트랩으로 충분
- 회원 삭제 시 cascading 정리 (호스트인 세션은 어떻게?) — 첫 운영에선 거절 자체가 드물고, 거절은 보통 가입 직후라 Session 없음
- 비밀번호/매직링크 fallback — 비목표

## Touched files (예상)

| 파일 | new/edit | 요지 |
|------|----------|------|
| `package.json` | edit | next-auth@beta, @auth/prisma-adapter |
| `pnpm-lock.yaml` | edit | |
| `prisma/schema.prisma` | edit | User 갱신 + Account + VerificationToken |
| `prisma/migrations/<ts>_auth_models/migration.sql` | new | 자동 |
| `.env.example` | edit | NEXTAUTH_*, GOOGLE_* uncomment |
| `deploy/.env.example` | edit | 동일 |
| `lib/auth.ts` | new | NextAuth config + callbacks |
| `lib/guard.ts` | new | require* helpers |
| `middleware.ts` | new | route protection |
| `types/next-auth.d.ts` | new | Session.user 확장 |
| `app/api/auth/[...nextauth]/route.ts` | new | handlers export |
| `app/login/page.tsx` | new | OAuth 버튼 |
| `app/pending/page.tsx` | new | 승인 대기 안내 |
| `app/admin/members/page.tsx` | new | 승인 페이지 |
| `app/admin/members/actions.ts` | new | approve/reject server actions |
| `app/page.tsx` | edit | 인증 상태 기반 리다이렉트 |
| `README.md` | edit | 첫 관리자 부트스트랩 절차 |

## Verification (사용자가 직접 — Fidelity)

코드 측 (.env.local의 OAuth 키 없이도 검증 가능):
1. `pnpm install` (postinstall 에서 prisma generate)
2. `pnpm db:migrate --name auth_models` → migration 2 적용
3. `pnpm check` 통과
4. `/login` 페이지가 빌드되고 (OAuth 키 없이도) 렌더링 ("OAuth 설정 필요" 같은 에러는 클릭 시점에)

실제 OAuth 동작 (OAuth 키 발급 후 — 머지 후):
1. Google Cloud Console에서 OAuth Client ID 발급, callback `http://localhost:3000/api/auth/callback/google`
2. `.env.local` 에 키 채워서 `pnpm dev` 재시작
3. `/login` → "SNU 구글로 계속하기" → 본인 @snu.ac.kr 계정 선택 → 자동 리다이렉트
4. 첫 로그인은 `/pending` 으로 떨어짐 (approved=false)
5. SQL 직접: `UPDATE User SET role='ADMIN', approved=1, approvedAt=datetime('now') WHERE email='peterabcd@snu.ac.kr'`
6. 새로고침 → `/admin/members` 진입 가능
7. (테스트용 두 번째 SNU 계정으로) 새 가입 → `/pending` 에 보임 → 첫 계정으로 `/admin/members` 에서 [승인] → 두 번째 계정 새로고침 → 정상 진입

## Open questions

- (없음 — 결정된 흐름 그대로)
