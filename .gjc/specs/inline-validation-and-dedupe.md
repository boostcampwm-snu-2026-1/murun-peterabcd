# Spec · inline-validation-and-dedupe

> 직전 PR #28 머지 후 dev 검증에서 두 가지 UX 사고 발견:
>   1. 빈 입력/잘못된 입력 시 사용자에게 알림이 없음 (silently noop 정책의 부작용)
>   2. [세션 만들기] / [추가] 버튼 빠른 더블 클릭 시 row가 중복 생성됨
> 둘 다 React 19 표준 패턴(`useActionState` + `useFormStatus`)으로 해결.

## Story

1. 잘못된 입력 (음수, 60 이상의 초, 문자, 빈 폼) 시 사용자에게 한 줄짜리 알림이 폼 위에 떠야 한다.
2. 사용자가 submit 버튼을 빠르게 두 번 눌러도 row가 한 번만 생성돼야 한다.
3. 정상 입력 시 기존 흐름 유지 (세션 생성 → 리다이렉트, 참여 행 upsert → 페이지 갱신).

## Closes

(직접 close되는 이슈 없음 — PR #26/#27/#28 follow-up. 새 issue 만들지 않고 PR로 끝냄.)

## Acceptance

### 검증 (inline 알림)

세션 생성 폼 (`/sessions/new`):
- [ ] 장소 빈 값으로 [세션 만들기] → "장소를 입력하세요." 알림
- [ ] 장소 120자 초과 → "장소는 120자 이내로." 알림
- [ ] 날씨 120자 초과 → 동일 패턴 알림
- [ ] 메모 2000자 초과 → 동일

참여 기록 폼 (세션 상세):
- [ ] 거리/분/초/메모 모두 빈 값 → "거리 / 기록 / 메모 중 최소 한 가지를 입력하세요."
- [ ] 거리에 음수 → "거리(km)는 0보다 커야 합니다."
- [ ] 거리에 문자 → "거리(km)는 숫자만 입력하세요."
- [ ] 거리 1000 초과 → "거리(km)는 1000 이하여야 합니다."
- [ ] 분에 음수 → "분은 0 이상이어야 합니다."
- [ ] 분 1440 초과 → "분은 1440 이하여야 합니다."
- [ ] 초에 60 이상 → "초는 60 미만이어야 합니다."  (사용자가 5분 0초를 4'60"로 적으면 잡힘)
- [ ] 초에 음수/문자 → 동일 패턴
- [ ] 메모 500자 초과 → "메모는 500자 이내로."

알림 표시:
- [ ] 폼 상단에 `role="alert"` div, destructive 색상
- [ ] 페이지 자체는 그대로, 에러 페이지 X
- [ ] 입력값은 폼 안에 보존 (재제출 가능) — `defaultValue` 가 form state 에 의존하지 않음 (이번 PR 한정. 모든 필드 보존은 stretch)

### Double-submit 방지

- [ ] 세션 만들기 버튼: submit 중 disabled + "만드는 중..." 텍스트
- [ ] 참여 [추가] / [수정] 버튼: submit 중 disabled + "저장 중..."
- [ ] 참여 [삭제] 버튼: submit 중 disabled + "삭제 중..."
- [ ] 빠른 더블 클릭: 첫 클릭 후 button disabled → 두 번째 클릭 무시 → DB row 한 번만 생성

### 코드 측

- [ ] Server action signature 변경:
  - `createSession(prev, formData) => Promise<ActionResult>`
  - `upsertParticipation(prev, formData) => Promise<ActionResult>`
  - `deleteParticipation(prev, formData) => Promise<ActionResult>`
  - `ActionResult = { ok: true } | { ok: false; error: string }`
- [ ] 폼 컴포넌트는 client component:
  - `app/sessions/new/_components/NewSessionForm.tsx` (new)
  - `app/sessions/[id]/_components/MyParticipationForm.tsx` (server → client)
  - `useActionState(action, null)` 로 상태 받기
  - `useFormStatus()` 로 pending → SubmitButton disable
- [ ] 검증 helper (`lib/pace.ts`):
  - `parseOptionalDecimal(raw, { min, max, field })`: 빈 값 OK, 숫자 검증 + 범위 검증, 에러 메시지 한국어
  - `parseOptionalInt(raw, ...)`: 정수 강제 추가
  - 기존 `parseDistanceInput` / `parseDurationInput` 은 제거 (호출처가 actions.ts 1곳뿐)
  - `splitDurationSec` 유지 (prefill 용)
- [ ] `pnpm check` 통과

## Out of scope

- **사진 업로드 폼**의 inline error 와 dedupe (같은 패턴 적용 가능하나 UX 결이 다름 — 파일 input 자체에 OS picker가 끼므로 사용자가 더블 클릭하기 어렵고, 에러는 파일 형식/크기 정도뿐. 후속 PR.)
- 검증 실패 시 입력 값 유지 (defaultValue) — 부분 유지는 되지만 완전한 form state 복원은 별 PR
- **필드별** 에러 (현재는 "첫 번째 에러 1개" 만). zod 의 fieldErrors 활용은 stretch
- Toast UI / shadcn Alert 컴포넌트 도입 — 이번엔 inline div with role="alert"
- 서버 측 idempotency token (random uuid → dedupe). 현재 클라이언트 측 disable 로 충분, 사고 시 다음 PR

## Touched files (예상)

| 파일 | new/edit | 요지 |
|------|----------|------|
| `lib/pace.ts` | edit | parseOptionalDecimal/parseOptionalInt 추가, 기존 parse* 제거 |
| `app/sessions/new/actions.ts` | edit | signature 변경 + ActionResult |
| `app/sessions/new/page.tsx` | edit | 폼 부분을 NewSessionForm 으로 추출 |
| `app/sessions/new/_components/NewSessionForm.tsx` | new | client component |
| `app/sessions/[id]/actions.ts` | edit | 두 액션 signature 변경 + 강화된 검증 |
| `app/sessions/[id]/_components/MyParticipationForm.tsx` | edit | server → client + useActionState + useFormStatus |
| `components/form/SubmitButton.tsx` | new | useFormStatus 기반 공통 컴포넌트 (재사용) |
| `components/form/ErrorAlert.tsx` | new | inline 알림 div (공통) |

## Verification (사용자가 직접)

머지 후 dev 에서:
1. `/sessions/new` 빈 폼 [세션 만들기] → 알림 표시, 페이지 그대로
2. 정상 입력 → 정상 생성 + 리다이렉트
3. [세션 만들기] 빠르게 3번 연속 클릭 → 1개 세션만 생성됨 (DB 확인)
4. `/sessions/[id]` "내 기록" 영역에서:
   - 다 비우고 [추가] → 알림
   - 거리에 -1 → 알림
   - 초에 75 → 알림
   - 거리만 0.5 입력 → 정상 저장
5. [추가] 빠르게 두 번 클릭 → 본인 행 1개만 생성 ((sessionId, userId) unique 가 2차 안전망)
