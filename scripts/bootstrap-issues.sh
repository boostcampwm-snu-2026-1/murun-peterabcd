#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  DEPRECATED — DO NOT RUN.                                                ║
# ║                                                                          ║
# ║  This script was used once on 2026-05-31 to seed the initial 15 issues. ║
# ║  The stack and feature model has since changed (Vercel/Supabase →       ║
# ║  N100 self-host, magic link → Google OAuth, batch input → host/         ║
# ║  participant post-comment model). Re-running this script will create    ║
# ║  duplicate, outdated issues.                                            ║
# ║                                                                          ║
# ║  To apply the post-Week-1 changes to the existing 15 issues, use:       ║
# ║      bash scripts/update-issues.sh                                      ║
# ║                                                                          ║
# ║  Kept for git history and as a reference of the original Week-1 task    ║
# ║  decomposition. See docs/initial-issues.md for the current state.       ║
# ╚══════════════════════════════════════════════════════════════════════════╝
echo "scripts/bootstrap-issues.sh is DEPRECATED. Use scripts/update-issues.sh." >&2
exit 1

# --- ORIGINAL SCRIPT BELOW (left as historical reference) ---

set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found. Install from https://cli.github.com/" >&2
  exit 1
fi

REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
echo "Target repo: $REPO"

create_label () {
  local name="$1" color="$2" desc="$3"
  if gh label list --limit 200 | awk '{print $1}' | grep -Fxq "$name"; then
    echo "label exists: $name"
  else
    gh label create "$name" --color "$color" --description "$desc"
  fi
}

# --- labels ---
create_label "type:feat"   "1f883d" "사용자 기능 (vertical slice)"
create_label "type:chore"  "8b949e" "설정/문서/리팩터링"
create_label "type:bug"    "d1242f" "버그"
create_label "area:infra"  "0969da" "배포/env/CI"
create_label "area:db"     "8250df" "Prisma schema / migration"
create_label "area:ui"     "bf8700" "Next.js page / component"
create_label "area:auth"   "9a6700" "인증/권한"
create_label "prio:p1"     "b60205" "MVP 필수"
create_label "prio:p2"     "fbca04" "MVP 후 / stretch"
create_label "week:1"      "c5def5" "Week 1"
create_label "week:2"      "c5def5" "Week 2"
create_label "week:3"      "c5def5" "Week 3"

# --- issues ---
mk () {
  local title="$1"; shift
  local body="$1"; shift
  # remaining args are labels
  gh issue create --title "$title" --body "$body" "$@"
}

mk "[chore] 저장소 초기 설정 & wiki 작성" \
"dev 브랜치, README, docs/wiki 6종, 이슈/PR 템플릿, .gjc/skills 초안.

## Done when
- [x] dev 브랜치 push
- [x] docs/wiki/*.md 6종 존재
- [ ] PR → main 머지 (또는 후속 issue에서)" \
  --label "type:chore" --label "week:1" --label "prio:p1"

mk "[chore] GitHub Wiki 초기화 & docs/wiki 복사" \
"GitHub 웹에서 wiki 첫 페이지 생성 → 로컬에 wiki repo clone → docs/wiki/*.md 복사 후 push.

## Done when
- [ ] https://github.com/${REPO}/wiki 에 Home 외 6 페이지 존재" \
  --label "type:chore" --label "week:1" --label "prio:p1"

mk "[chore] Vercel 프로젝트 연결 + preview deploy" \
"main/dev 양쪽 자동 배포. PR 별 preview URL.

## Done when
- [ ] dev push 시 preview URL 생성
- [ ] main push 시 prod URL 갱신" \
  --label "type:chore" --label "area:infra" --label "week:1" --label "prio:p1"

mk "[chore] Supabase 프로젝트 생성 + .env.example" \
"Auth(매직링크) + Postgres + Storage(bucket: group-photos).

## Done when
- [ ] .env.example 에 모든 키 등록
- [ ] RLS 기본 정책 메모를 docs/wiki/02-Tech-Stack.md 에 추가" \
  --label "type:chore" --label "area:infra" --label "week:1" --label "prio:p1"

mk "[chore] CI: lint + typecheck + build on PR" \
"GitHub Actions 워크플로우.

## Done when
- [ ] PR 마다 3개 체크가 돌고 dev 머지 전 필수가 됨" \
  --label "type:chore" --label "area:infra" --label "week:1" --label "prio:p2"

mk "[chore] Next.js 15 + Tailwind + shadcn 스캐폴드" \
"pnpm create next-app, tailwind 설정, shadcn 초기화.

## Done when
- [ ] pnpm dev 로 / 페이지가 뜸
- [ ] shadcn Button 1개 import 되어 렌더링" \
  --label "type:chore" --label "week:2" --label "prio:p1"

mk "[feat] Prisma 초기 schema + 1차 migration" \
"User / Session / Participation. 자세한 모델은 docs/wiki/03-Screen-Flow.md.

## Acceptance
- [ ] schema.prisma 작성
- [ ] migration init 적용
- [ ] (sessionId, userId) unique 동작 확인 (수동 1회)" \
  --label "type:feat" --label "area:db" --label "week:2" --label "prio:p1"

mk "[feat] Supabase 매직링크 로그인" \
"## Acceptance
- [ ] /login 이메일 → 메일 수신 → 로그인 성공 시 /sessions 리다이렉트
- [ ] 미로그인 상태에서 /sessions/new 접근 시 /login 으로 리다이렉트
- [ ] 로그아웃 동작" \
  --label "type:feat" --label "area:auth" --label "week:2" --label "prio:p1"

mk "[feat] 세션 등록 페이지 (/sessions/new)" \
"## Acceptance
- [ ] 날짜·장소·시간·날씨·코스메모 입력
- [ ] 참여자 다중 선택 + 행마다 거리/기록 입력
- [ ] 단체사진 1장 업로드
- [ ] 저장 후 /sessions/[id] 리다이렉트
- [ ] 모바일 375px 정상" \
  --label "type:feat" --label "area:ui" --label "area:db" --label "week:2" --label "prio:p1"

mk "[feat] 세션 상세 페이지 (/sessions/[id])" \
"## Acceptance
- [ ] 단체사진 (next/image)
- [ ] 참여자 표 + 페이스 자동 계산 (lib/pace.ts)
- [ ] 작성자 또는 운영진만 [수정] 버튼 노출
- [ ] OG 이미지로 단체사진 사용" \
  --label "type:feat" --label "area:ui" --label "week:2" --label "prio:p1"

mk "[feat] 세션 아카이브 리스트 (/sessions)" \
"## Acceptance
- [ ] 최신순 카드형, 사진 썸네일 + 날짜 + 장소 + 참여자 수
- [ ] 빈 상태 메시지
- [ ] 페이지네이션 또는 더보기" \
  --label "type:feat" --label "area:ui" --label "week:2" --label "prio:p1"

mk "[feat] 단체사진 업로드 파이프라인" \
"클라이언트 리사이즈(최대 1600px) → Supabase Storage(서명 URL) → DB.

## Acceptance
- [ ] 5MB 초과 사진도 업로드 성공 (리사이즈 결과)
- [ ] 업로드 실패 시 사용자에게 에러 표시 + DB 변경 없음" \
  --label "type:feat" --label "area:infra" --label "week:2" --label "prio:p1"

mk "[feat] 멤버 페이지 + 누적/추이" \
"## Acceptance
- [ ] /me, /runners/[id]
- [ ] 누적 거리, 참여 횟수, 평균 페이스, 최근 페이스 추이 차트" \
  --label "type:feat" --label "area:ui" --label "week:3" --label "prio:p2"

mk "[feat] 검색/필터" \
"장소 substring, 멤버, 기간(month picker).

## Acceptance
- [ ] /sessions 상단 필터 UI
- [ ] URL 쿼리 상태 동기화 (공유 가능)" \
  --label "type:feat" --label "area:ui" --label "week:3" --label "prio:p2"

mk "[feat] OG 이미지 + PWA 매니페스트" \
"## Acceptance
- [ ] /sessions/[id] OG 이미지가 단체사진 (없으면 기본 이미지)
- [ ] manifest.json + 192/512 아이콘
- [ ] iOS/안드로이드 홈화면 추가 동작" \
  --label "type:feat" --label "area:ui" --label "week:3" --label "prio:p2"

echo "Done. Review issues: gh issue list"
