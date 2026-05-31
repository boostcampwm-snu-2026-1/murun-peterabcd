# Skill · murun-feature

> Murun 프로젝트에서 한 feature(vertical slice)를 끝낼 때 Agent가 따르는 절차.
> 사람용 설명은 [`docs/wiki/04-Agent-Workflow.md`](../../../docs/wiki/04-Agent-Workflow.md).

## Trigger
사용자가 다음 중 하나를 요청했을 때 이 skill을 활성화한다.
- "X 기능을 추가해줘"
- "<feature> spec 줄게, 구현해"
- 이미 `.gjc/specs/<feature>.md` 가 있는 경우

## Required context
이 repo는 다음 전제 위에 있다. 어기지 마라.

- **Stack**: Next.js 15 App Router · TypeScript · Tailwind · shadcn/ui · Prisma · Supabase (Auth/Storage/Postgres) · Vercel
- **풀스택은 한 repo, Server Action 우선**, 별도 API route는 정말 필요할 때만
- **Schema의 진실의 원천**: `prisma/schema.prisma`
- **인증 진입점**: `lib/auth.ts` (Server Action 첫 줄에서 호출)
- **PR 대상은 항상 `dev`**. `main`에는 절대 직접 PR/커밋 금지.

## Steps

### 1. Spec 확인
- `.gjc/specs/<feature>.md` 가 없으면, 만들 spec 초안을 사용자에게 먼저 보여주고 승인받는다.
- spec에 없는 동작은 구현하지 않는다.

### 2. Plan
다음 표를 출력하고 사용자 승인을 기다린다.

| 파일 | new/edit | 변경 요지 |
|------|----------|-----------|

Schema 변경이 있다면 별도로:
- `migrate dev --name <slug>` 명령어
- 데이터 backfill 필요 여부
- 영향받는 기존 쿼리/UI grep 결과

### 3. Branch
```bash
git switch dev && git pull
git switch -c feat/<issue-num>-<slug>
```

### 4. Implement (순서 고정)
1. `prisma/schema.prisma` 수정 → `pnpm prisma generate` 명령어 출력만 하고 사용자 실행 대기
2. `lib/...` 의 Server Action (zod schema → auth check → 비즈니스 로직 → revalidate)
3. `app/(app)/...` 의 page/component
4. `loading.tsx`, `error.tsx`, 빈 상태 처리 누락 없는지 확인
5. `tests/<feature>.test.ts` 스모크 1개

### 5. Self-check (PR 본문 체크리스트에 박스 채우기)
[`docs/wiki/06-Checkpoints.md`](../../../docs/wiki/06-Checkpoints.md)의 A·B 항목, 데이터 쓰기면 C, 인증이면 D, schema 변경이면 E도.

### 6. PR 본문 작성
- `Closes #<issue-num>`
- 변경 요약 (bullet 5줄 이내)
- 스크린샷 자리(`<!-- screenshot:mobile -->`, `<!-- screenshot:desktop -->`) — 캡처는 사용자가 붙임
- 체크리스트

## Hard constraints (절대 금지)
- `prisma migrate deploy`, `prisma db push` 직접 실행
- `main` 브랜치 변경 / merge
- `.env*` 파일에 실제 키 작성
- Supabase / Vercel 콘솔 설정 변경 시도
- spec에 없는 기능 추가
- 기존 패턴을 무시한 새 추상화 생성 (`utils.ts`, `helpers.ts` 신설은 사용자 승인 필요)

## Done criteria
- 작업이 끝나면 다음을 출력한다:
  1. 변경 파일 목록
  2. 사용자가 직접 실행해야 할 명령어 목록 (migrate, env 추가 등)
  3. 미해결 TODO (있다면)
  4. PR 본문 (markdown)
