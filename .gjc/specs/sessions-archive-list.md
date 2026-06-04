# Spec · sessions-archive-list

> #11. 세션 아카이브 리스트 `/sessions`. 시즌이 쌓일수록 자라나는 페이지.
> 같은 PR 안에 워크플로우 개선 사항 (SKILL.md, 06-Checkpoints) 함께 박음.

## Story

승인된 멤버가 `/sessions` 진입하면 최신순 카드 리스트를 본다. 각 카드 = 단체사진 썸네일 + 날짜 + 장소 + 참여자 수. 카드 클릭 → 상세. 비어 있으면 "아직 활동 기록이 없어요." + CTA. 홈에서 "전체 아카이브" 링크가 활성화된다.

## Closes

- #11 세션 아카이브 리스트 (/sessions)

## Acceptance

### 페이지
- [ ] `/sessions` 라우트, `requireApproved` 가드
- [ ] 카드 = 사진 (있으면 next/image 16:9, 없으면 회색 placeholder) + 날짜 (yyyy-MM-dd 요일) + 장소 + 참여자 수 + (있으면) 호스트 이름
- [ ] 정렬: `date desc, createdAt desc` (같은 날짜면 최근 생성순)
- [ ] 빈 상태: 텍스트 + "새 세션 만들기" CTA
- [ ] 모바일 375px: 1열, 데스크탑: 1열 유지 (사진 가독성 위해 좁은 column 카드형)
- [ ] 카드는 `<Link href={`/sessions/${id}`}>` 로 wrap

### 페이지네이션
- [ ] 페이지당 20개. URL `?cursor=<id>` 로 다음 페이지. cursor 기반 keyset pagination.
- [ ] 다음 페이지 있으면 하단 "더 보기" 버튼 (`<Link>` 로 query 갱신, JS 없이도 동작)
- [ ] 첫 페이지 진입 시 cursor 없음

### 홈 화면 업데이트
- [ ] `app/page.tsx` 의 "아카이브 리스트는 다음 PR에서" placeholder 제거
- [ ] "전체 아카이브" 링크 활성화 (`/sessions`)

### 데이터 쿼리 (`lib/sessions.ts` 신설)
- [ ] `listSessions({ cursorId? }): { items, nextCursor }` — 도메인 쿼리를 한 곳에 모음
- [ ] `getSessionDetail(id)` 도 같이 옮김 (현재 페이지 안에 inline 으로 박혀 있음) — 다음 PR 에서 통합 가능, 이번 PR 은 listSessions 만

### 워크플로우 보강 (같은 PR 안에)

- [ ] `.gjc/skills/murun-feature/SKILL.md` 에 "Step 4.5 — 폼/입력 표준 체크리스트" 추가
- [ ] `docs/wiki/06-Checkpoints.md` 의 `#7 End-to-end smoke` 항목에 negative case 명시 추가

## Out of scope

- 검색·필터 (참여 인원 수 등) — Week 3 (#14)
- 월/시즌 그룹화 — Week 3
- 무한 스크롤 (intersection observer) — 더 보기 버튼으로 충분
- 사진 lazy load — `next/image` 가 알아서
- OG 이미지 — Week 3 (#15)
- 아카이브 카드에 "내가 참여" 뱃지 — 별 PR
- `lib/sessions.ts` 로 getSessionDetail 통합 — 별 PR

## Touched files (예상)

| 파일 | new/edit | 요지 |
|------|----------|------|
| `lib/sessions.ts` | new | listSessions(cursor) keyset pagination |
| `app/sessions/page.tsx` | new | 아카이브 리스트 + 더 보기 |
| `app/sessions/_components/SessionCard.tsx` | new | 카드 1개 |
| `app/sessions/_components/EmptyState.tsx` | new | 빈 상태 |
| `app/page.tsx` | edit | "전체 아카이브" 링크 활성화 |
| `.gjc/skills/murun-feature/SKILL.md` | edit | 폼/입력 표준 체크리스트 |
| `docs/wiki/06-Checkpoints.md` | edit | #7 negative case |

## Verification (사용자가 직접)

머지 후:
1. `/` 에서 "전체 아카이브" 링크 → `/sessions` 진입
2. 빈 상태일 때 (세션 0개) → "아직 활동 기록이 없어요." + CTA 노출
3. 세션 1~5개 만든 상태에서 → 카드 리스트, 최신순
4. 21개 이상이면 하단 "더 보기" 버튼 → 클릭 시 `?cursor=<id>` URL, 다음 페이지 표시
5. 사진 있는 세션은 썸네일, 없는 세션은 placeholder
6. 모바일 375px: 카드 1열, 가로 스크롤 없음
7. 비승인 사용자 진입 시 `/pending`
