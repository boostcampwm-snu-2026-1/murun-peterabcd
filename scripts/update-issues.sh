#!/usr/bin/env bash
# Apply Week 1-end stack/model changes to existing GitHub issues.
# Run from repo root after `gh auth login`.
#
# Idempotent for labels and for "already closed" issues. EDIT operations
# overwrite title/body — re-running is safe but loses manual edits.
#
# See docs/initial-issues.md for the action table.

set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found. Install from https://cli.github.com/" >&2
  exit 1
fi

REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
echo "Target repo: $REPO"
echo

# ----------------------------------------------------------------------------
# 1) New labels
# ----------------------------------------------------------------------------
create_label () {
  local name="$1" color="$2" desc="$3"
  if gh label list --limit 200 | awk -F'\t' '{print $1}' | grep -Fxq "$name"; then
    echo "label exists: $name"
  else
    gh label create "$name" --color "$color" --description "$desc"
  fi
}
create_label "area:deploy" "5319e7" "Docker/Caddy/SSH/GH Actions"
create_label "area:host"   "1d76db" "N100 운영 (백업·인증서·도메인)"
echo

# ----------------------------------------------------------------------------
# 2) Close obsoleted issues
# ----------------------------------------------------------------------------
close_with_reason () {
  local num="$1" reason="$2"
  echo "closing #$num"
  gh issue close "$num" --reason "not planned" --comment "$reason" || true
}

close_with_reason 3  "스택 변경: Vercel 대신 자체 N100 서버 + Docker + Caddy. 신규 이슈 N-1로 대체."
close_with_reason 4  "스택 변경: Supabase 미사용. 신규 이슈 N-2(.env.example)로 대체."
close_with_reason 8  "스택 변경: 매직링크 대신 Auth.js v5 Google OAuth + @snu.ac.kr 도메인 강제. 신규 이슈 N-3로 대체."
close_with_reason 12 "스택 변경: Supabase Storage 대신 로컬 볼륨, 원본 보존. 신규 이슈 N-6로 재정의."
echo

# ----------------------------------------------------------------------------
# 3) Edit existing issues (title + body overwrite)
# ----------------------------------------------------------------------------
edit_issue () {
  local num="$1" title="$2" body="$3"
  echo "editing #$num"
  gh issue edit "$num" --title "$title" --body "$body"
}

edit_issue 7 "[feat] Prisma 초기 schema + 1차 migration (SQLite)" "User / Session / Participation. 모델 상세는 docs/wiki/03-Screen-Flow.md §4.

## Acceptance
- [ ] datasource provider = sqlite, url = env(DATABASE_URL)
- [ ] User: googleSub unique, email unique, approved, role(MEMBER/ADMIN), approvedBy 자기참조
- [ ] Session: hostId FK, date, location, startTime, weather, groupPhotoPath, notes
- [ ] Participation: (sessionId, userId) unique, distanceKm/durationSec nullable
- [ ] prisma migrate dev --name init 1회 적용
- [ ] (sessionId, userId) unique 동작을 수동으로 확인 (같은 유저로 두 번 insert → 에러)"

edit_issue 9 "[feat] 세션 생성 (/sessions/new) — 호스트" "그날 운동의 호스트가 세션 페이지를 만든다. 참여자 기록 입력은 별 이슈(N-5)에서.

## Acceptance
- [ ] 폼: 날짜·장소·시작 시간·날씨(자유 텍스트)·코스 메모
- [ ] 단체사진 업로드는 N-6로 분리 (이 이슈에선 옵션 입력 자리만)
- [ ] Server Action 첫 줄 requireApproved 호출
- [ ] 저장 후 /sessions/[id] 리다이렉트
- [ ] 모바일 375px 정상
- [ ] 호스트는 자동으로 Session.hostId = 현재 사용자"

edit_issue 10 "[feat] 세션 상세 (/sessions/[id])" "단체사진 + 참여자 표 + 페이스 자동 계산. 본인 행 추가/수정은 N-5에서.

## Acceptance
- [ ] 사진 표시 (next/image)
- [ ] 참여자 표 + 페이스 자동 계산 (lib/pace.ts 순수 함수)
- [ ] 호스트 또는 ADMIN만 [수정] 버튼 노출
- [ ] 본인 행에만 ✏️ 노출
- [ ] OG 이미지로 단체사진 사용 (이 이슈에서 opengraph-image.tsx 1개)
- [ ] 비로그인 = 페이지 진입 불가 (OG 라우트만 허용)"

edit_issue 14 "[feat] 검색·필터 (참여 인원 수 포함)" "## Acceptance
- [ ] /sessions 상단 필터 UI
- [ ] **참여 인원 수** 필터 (min~max)
- [ ] 장소(substring), 멤버, 기간(month picker)
- [ ] URL 쿼리 상태 동기화 (공유 가능)"
echo

# ----------------------------------------------------------------------------
# 4) Create new issues
# ----------------------------------------------------------------------------
mk () {
  local title="$1"; shift
  local body="$1"; shift
  echo "creating: $title"
  gh issue create --title "$title" --body "$body" "$@"
}

mk "[chore] N100 서버 부트스트랩 + Docker Compose + Caddy" \
"자체 서버에 staging/prod 두 환경을 docker compose로 띄운다. 자세한 구성은 docs/wiki/02-Tech-Stack.md §5.

## Acceptance
- [ ] deploy/Dockerfile (Next.js standalone)
- [ ] deploy/docker-compose.yml (caddy + app, 볼륨 2개)
- [ ] deploy/Caddyfile
- [ ] N100에서 docker compose up -d 로 /sessions 까지 200 응답
- [ ] staging/prod 분리 (-p murun-staging / -p murun-prod)" \
  --label "type:chore" --label "area:deploy" --label "area:host" --label "week:2" --label "prio:p1"

mk "[chore] .env.example + Auth.js NEXTAUTH_SECRET 생성" \
"## Acceptance
- [ ] DATABASE_URL=file:./data/murun.db
- [ ] NEXTAUTH_URL, NEXTAUTH_SECRET (openssl rand -base64 32 명시)
- [ ] GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_HD=snu.ac.kr
- [ ] UPLOADS_DIR=./uploads
- [ ] NEXT_PUBLIC_APP_URL" \
  --label "type:chore" --label "area:infra" --label "week:2" --label "prio:p1"

mk "[feat] Auth.js v5 Google OAuth + @snu.ac.kr 도메인 강제" \
"## Acceptance
- [ ] Auth.js v5 Google provider 설정
- [ ] authorize 단계에서 hd=snu.ac.kr 강제, 다른 도메인은 reject
- [ ] /login 페이지에 \"SNU 구글로 계속하기\" 버튼만 노출
- [ ] 첫 로그인 시 User 레코드 생성 (approved=false)
- [ ] approved=false 인 사용자는 /pending 으로 리다이렉트
- [ ] approved=true 인 사용자만 /sessions 진입 가능 (guard: requireApproved)" \
  --label "type:feat" --label "area:auth" --label "week:2" --label "prio:p1"

mk "[feat] 가입 화이트리스트 + /admin/members 승인 페이지" \
"## Acceptance
- [ ] /admin/members 페이지 (ADMIN role 만)
- [ ] 승인 대기 리스트, 활동 회원 리스트 분리
- [ ] [승인] 클릭 시 approved=true + approvedById + approvedAt 기록
- [ ] [거절] 클릭 시 User 레코드 soft-delete 또는 hard-delete (결정 후 명시)
- [ ] 본인은 본인을 승인할 수 없음 (운영자 부트스트랩은 별도 seed로)" \
  --label "type:feat" --label "area:auth" --label "week:2" --label "prio:p1"

mk "[feat] 참여 기록 입력 (본인 행 추가/수정)" \
"세션 상세 페이지에서 참여자 본인이 자기 행을 직접 입력. 다른 사람 행은 못 건드림.

## Acceptance
- [ ] 본인 행이 없을 때 [+ 내 기록 추가] 버튼 노출
- [ ] 본인 행 있을 때 ✏️ 로 수정/삭제
- [ ] 입력: distanceKm(optional), durationSec(optional), note(optional)
- [ ] Server Action 첫 줄 requireApproved + (sessionId, userId) unique 검증
- [ ] 동일 세션 두 번 등록 시도 → 명확한 에러 메시지
- [ ] ADMIN은 다른 사람 행도 수정 가능 (가드 분기)" \
  --label "type:feat" --label "area:ui" --label "area:db" --label "week:2" --label "prio:p1"

mk "[feat] 단체사진 업로드 (로컬 볼륨, 원본 보존)" \
"호스트가 세션 생성/수정 시 단체사진 1장을 업로드.

## Acceptance
- [ ] 클라이언트 리사이즈 없이 원본 그대로 업로드
- [ ] 서버 측 상한 15MB (초과 시 명확한 에러)
- [ ] 저장 경로: \$UPLOADS_DIR/yyyy/mm/<cuid>.<ext>
- [ ] DB에는 Session.groupPhotoPath 만 저장
- [ ] next/image 로 서빙 (webp 자동 변환, 디스크 캐시)
- [ ] 업로드 실패 시 DB 변경 없음 (선 업로드 → 후 DB)" \
  --label "type:feat" --label "area:ui" --label "area:infra" --label "week:2" --label "prio:p1"

mk "[chore] GH Actions SSH deploy 파이프라인 (dev→staging, main→prod)" \
"## Acceptance
- [ ] build 단계가 ghcr.io 에 이미지 push (tag: <sha>, latest)
- [ ] dev push → staging 자동 배포 (docker compose pull && up -d -p murun-staging)
- [ ] main push → prod 배포 (workflow_dispatch 또는 environment approval)
- [ ] SSH 키는 GH Actions secrets (N100_SSH_KEY, N100_HOST, N100_USER)
- [ ] 배포 실패 시 이전 이미지 태그로 롤백 가능한 절차 README 작성" \
  --label "type:chore" --label "area:deploy" --label "week:2" --label "prio:p2"

echo
echo "Done. Review with: gh issue list --state all --limit 30"
