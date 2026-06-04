# Spec · session-create-and-participation

> #9 + #10 + #20 묶음. "호스트가 세션을 만들고, 참여자가 본인 행을 적고, 페이스가 자동 계산되는" 핵심 vertical slice 1개.
> 사진 업로드, 아카이브 리스트, 세션 수정/삭제, OG 이미지는 모두 OOS — 별 PR.

## Story

1. 호스트 = 승인된 멤버 누구나. `/sessions/new` 에서 그날의 운동 페이지 생성 → 자동으로 `/sessions/[id]` 리다이렉트.
2. 참여자 = 그 페이지 들어와서 "내 기록" 영역에 거리·기록·메모 입력. 본인 행 1개 (sessionId, userId) unique.
3. 참여자 표가 페이스(분'초"/km) 자동 계산해서 표시.
4. 호스트는 본인이 만든 세션도 상세 페이지에서 참여자로 자기 행 추가 가능.

## Closes

- #9  세션 생성 (`/sessions/new`) — 호스트
- #10 세션 상세 (`/sessions/[id]`)
- #20 참여 기록 입력 (본인 행 추가/수정)

## Acceptance

### `/sessions/new` (세션 생성)
- [ ] 폼 필드: 날짜(`<input type="date">`, 오늘 default), 시작 시간(`<input type="time">`, optional), 장소(필수), 날씨(자유 텍스트, optional), 코스 메모(optional)
- [ ] 사진 업로드 자리는 **이번 PR에 없음** (PR C 에서 추가, 호스트가 상세에서 사진 채워 넣음)
- [ ] Server Action 첫 줄 `requireApproved()` 호출
- [ ] `hostId = 현재 user.id` 로 Session row 생성
- [ ] 저장 후 `/sessions/[id]` 자동 리다이렉트
- [ ] zod 검증 실패 시 폼 위에 에러 메시지

### `/sessions/[id]` (세션 상세)
- [ ] 헤더: 날짜(yyyy-MM-dd 요일) + 장소 + 시작 시간(있으면) + 날씨(있으면) + 호스트 이름
- [ ] 사진 영역: 없으면 회색 placeholder ("사진 없음")
- [ ] 참여자 표: 이름 / 거리 / 기록 / 페이스. 페이스는 `lib/pace.ts` 의 순수 함수가 계산. 거리·기록 둘 다 있어야 페이스 표시, 한쪽만 있으면 "—".
- [ ] 본인 행이면 ✏️ 표시 (실제 inline edit 은 페이지 하단 "내 기록" 영역에서)
- [ ] 페이지 하단 "내 기록" 영역:
  - 본인 행 없음 → 빈 폼 + [추가] 버튼
  - 본인 행 있음 → prefill 폼 + [수정] / [삭제] 버튼
- [ ] 호스트 또는 ADMIN 진입 시 헤더에 "세션 수정" 자리 placeholder (실제 페이지는 다음 PR, 이번엔 disabled 또는 hidden)
- [ ] 비승인 사용자 진입 → `/pending` (`requireApproved`)
- [ ] 존재 안 하는 id → `notFound()`

### 참여 기록 server actions (`/sessions/[id]/actions.ts`)
- [ ] `upsertParticipation(formData)`: `requireApproved` + zod (sessionId, distanceKm?, durationSec?, note?) + Prisma `upsert` on (sessionId, userId). 본인 행만.
- [ ] `deleteParticipation(formData)`: `requireApproved` + 본인 행만 삭제. 다른 사람 행이면 throw.
- [ ] 둘 다 `revalidatePath("/sessions/${id}")`

### `lib/pace.ts` (순수 함수)
- [ ] `calcPaceSecPerKm(distanceKm, durationSec): number | null` — 둘 다 양수일 때만 값, 아니면 null
- [ ] `formatPace(secPerKm): string` — `5'00"/km` 형식. 60초 넘으면 분으로 자릿수 정리. 음수/NaN → "—"
- [ ] `formatDurationSec(sec): string` — 초 → `MM:SS` 또는 `H:MM:SS`
- [ ] `parseDurationInput(min, sec): number | null` — 폼 입력에서 사용

### `app/page.tsx` 변경
- [ ] approved 사용자가 진입하면 placeholder 대신 **"세션 만들기"** CTA + (이번엔 단순화) 안내 텍스트.
- [ ] 아카이브 리스트 링크는 placeholder (다음 PR에서 활성). 단, 호스트는 "내가 만든 세션" 1~2개 단순 리스트 표시 (Week 2 후속 PR에서 확장 가능)
- [ ] 위 "내 세션 리스트"는 단순함을 위해 이번엔 **생략**. CTA 1개만. 아카이브는 PR B에서.

### shadcn UI 컴포넌트 추가
- [ ] `components/ui/input.tsx`
- [ ] `components/ui/label.tsx`
- [ ] `components/ui/textarea.tsx`

(scaffold 때 Button 만 만들어둠. 폼 컴포넌트는 이번 PR에서 합류)

### 검증
- [ ] `pnpm typecheck / lint / build` 통과
- [ ] dev 서버에서 (로그인 + 승인된 상태로):
  - `/sessions/new` 폼 입력 → 저장 → `/sessions/[id]` 리다이렉트
  - `/sessions/[id]` 에서 본인 행 [추가] → 표에 반영
  - 같은 행 [수정] → 값 변경 → 표 갱신
  - 같은 행 [삭제] → 표에서 사라지고 폼이 다시 빈 상태
  - (테스트용 두 번째 계정) 같은 세션 진입 → 본인 행도 추가 → 표에 두 명 표시

## Out of scope (이번 PR에서 안 함)

- 사진 업로드 (PR C)
- 아카이브 리스트 `/sessions` (PR B)
- 세션 수정/삭제 UI 페이지 (다음 PR)
- ADMIN이 다른 사람 Participation 수정 (Week 3 stretch)
- OG 이미지 (Week 3)
- 모달/dialog 사용 (inline 폼으로 충분)
- 호스트 변경 / 참여자 일괄 등록
- 세션 검색/필터 (Week 3)
- react-hook-form 도입 — 단순 폼이라 server action 단독으로 충분

## Touched files (예상)

| 파일 | new/edit | 요지 |
|------|----------|------|
| `lib/pace.ts` | new | 순수 함수 4개 |
| `app/sessions/new/page.tsx` | new | 호스트 생성 폼 |
| `app/sessions/new/actions.ts` | new | createSession server action |
| `app/sessions/[id]/page.tsx` | new | 상세 + 참여자 표 + "내 기록" |
| `app/sessions/[id]/actions.ts` | new | upsert/delete Participation |
| `app/sessions/[id]/_components/MyParticipationForm.tsx` | new | 본인 행 폼 (server component, 액션 박힘) |
| `app/page.tsx` | edit | placeholder → "세션 만들기" CTA |
| `components/ui/input.tsx` | new | shadcn Input |
| `components/ui/label.tsx` | new | shadcn Label |
| `components/ui/textarea.tsx` | new | shadcn Textarea |
| `package.json` | edit | `@radix-ui/react-label` 추가 |

## Open questions

- 기록 입력 단위: "MM:SS" 단일 input vs 분/초 두 input? → **분/초 두 input** (모바일에서 number pad 빨리 치기 쉬움)
- 본인 행 [삭제] 확인 다이얼로그? → 이번엔 **확인 없이 즉시 삭제**. 본인 행 1개라 사고 영향 작음. 다이얼로그는 stretch.

## Verification (사용자가 직접 — Fidelity)

코드 측:
1. `pnpm install` (변경 없으면 skip)
2. `pnpm check` 통과
3. `pnpm dev` → `/sessions/new` 까지 진입 가능

E2E (실제 OAuth 발급 + 부트스트랩 끝나있는 상태 가정):
1. 본인 ADMIN 계정으로 로그인 → `/` 에 "세션 만들기" CTA
2. `/sessions/new` 폼 입력 → 저장 → `/sessions/[id]` 리다이렉트, 헤더에 본인 이름이 호스트로 표시
3. "내 기록" 영역에서 5km / 25분 / 메모 입력 → [추가] → 표에 본인 행 + 페이스 `5'00"/km`
4. 같은 영역에서 거리 6km 로 변경 → [수정] → 표 갱신 + 페이스 `4'10"/km`
5. [삭제] → 표에서 본인 행 사라지고 폼이 빈 상태로 복귀
6. (선택) 두 번째 SNU 계정 로그인 → `/admin/members` 에서 본인 계정으로 승인 → 두 번째 계정으로 같은 세션 페이지 진입 → 본인 행 추가 → 표에 두 명 표시
