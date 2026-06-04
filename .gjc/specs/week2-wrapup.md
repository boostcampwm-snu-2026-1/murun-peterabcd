# Spec · week2-wrapup

> 2주차 마무리 작업 한 PR. commit 단위로 분리해 review 가능하게, 머지는 한 번.

## Story

PR #30 까지 핵심 surface 가 다 살아있는 상태. 남은 작업은 1주차/2주차에 OOS 로 미뤘던 것 + 운영 인프라(CI, deploy) + 회고. 작은 작업이라 각각 PR 사이클 도는 비용 > 가치. 한 PR + 분리된 commit.

## Commits (순서대로)

### 1. fix(forms): photo & admin members inline alert + dedupe (SKILL 4.5 소급 적용)
- 사진 업로드/교체/삭제 폼 + admin approve/reject 폼에 PR #29 와 같은 패턴 적용
- server action 들을 `(prev, formData) => Promise<{ ok, error? }>` 로
- client form component + `useActionState` + `SubmitButton` (`useFormStatus`)
- inline `ErrorAlert` 표시
- "본인 승인 불가" 같은 메시지를 throw 대신 alert 로

### 2. chore(ci): PR 마다 typecheck + lint + build 자동 (#5)
- `.github/workflows/ci.yml`
- Node 22 + pnpm 11.5.1 + prisma generate + check
- PR to dev 트리거. dev/main push 시에도 한 번 더.

### 3. chore(deploy): GH Actions SSH deploy 파이프라인 (#22)
- `.github/workflows/deploy.yml`
- build job: Dockerfile 빌드 → ghcr.io 푸시 (tag `<sha>` + `staging` or `prod`)
- deploy job: SSH 로 N100 접속 → `docker compose pull && up -d`
- 트리거: dev push → staging 자동, main push → prod (environment approval)
- 필요 secrets (사용자 등록 — README 안내 추가):
  - `N100_HOST`, `N100_USER`, `N100_SSH_KEY`
  - `GHCR_TOKEN` 또는 `GITHUB_TOKEN` (자동)

### 4. docs(retro): Week 2 회고 (`docs/wiki/Retrospective-Week2.md`)
- 1주차 회고와 같은 결, AI 톤 X
- 핵심: AI 가 스스로 못 잡은 UX 사고들 + 워크플로우 보강의 이유 + 3주차에 들고 가는 것

## Closes

- #5 CI: lint + typecheck + build on PR
- #22 GH Actions SSH deploy 파이프라인

(사진 폼/admin 폼은 별도 issue 없음 — 직접 PR 본문에 기재)

## Acceptance

### 1. Form polish
- [ ] 사진 폼: 15MB 초과/MIME 거부/빈 파일 → inline alert
- [ ] 사진 업로드 중 [올리기] disabled + "올리는 중..."
- [ ] 사진 [삭제]/[교체] 중 disabled
- [ ] admin 승인/거절 폼: 본인 승인 시도 → inline alert (페이지 그대로)
- [ ] admin 승인/거절 중 button disabled + 라벨 교체

### 2. CI
- [ ] `.github/workflows/ci.yml` push/pr 에서 정상 동작 (시뮬레이션은 PR open 시점에)
- [ ] cache: pnpm store + .next/cache
- [ ] 빌드 시간 합리적 (< 5분 목표)

### 3. Deploy
- [ ] `.github/workflows/deploy.yml` 작성, secrets 누락 시 명확한 실패
- [ ] ghcr.io 이미지 태그 규칙 명확
- [ ] README + deploy/README 에 secret 등록 절차 추가

### 4. 회고
- [ ] 1주차 회고와 같은 톤. AI 생성 흔적 없음
- [ ] "다르게 한다면" 명시적 섹션 (3주차 가는 습관)
- [ ] 부트캠프 요구 사항 (워크플로우 문제 발견 + 동료 아이디어 자리 + 향후 가이드) 반영

## Out of scope (이 PR 에서도 안 함)

- 세션 수정/삭제 UI 페이지 (별 PR — 호스트가 오타·사진 고치는 흐름)
- HEIC → jpg 변환 (Week 3 stretch)
- Orphan 파일 정리 cron (Week 3)
- 백업 restic cron (Week 3)
- UPS / 정전 대응
- Wiki sync (사용자 직접)

## Verification (사용자가 직접)

머지 후:
1. `pnpm dev` → 사진 업로드 시 [올리기] 한 번 누름 후 빠르게 두 번째 → disable 확인
2. 큰 파일 (15MB+) 업로드 시도 → inline alert
3. `/admin/members` 에서 본인 행 [승인] 클릭 시도 → inline alert
4. (CI) PR 새로 열 때 Actions 탭에서 ci.yml 동작 확인
5. (Deploy) secrets 등록 후 dev 에 commit push → Actions 에서 deploy 동작 확인
   ```
   gh secret set N100_HOST --body "<ip>"
   gh secret set N100_USER --body "<user>"
   gh secret set N100_SSH_KEY < ~/.ssh/n100_deploy
   ```
6. 회고 read-through, 본인 어색하지 않은지
