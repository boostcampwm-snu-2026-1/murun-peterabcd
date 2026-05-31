# 초기 GitHub Issues (Week 1 도출)

> 이 파일은 **Week 1 산출물**(개발 기능을 위한 task 도출)이다. gh CLI 인증 후 아래 스크립트로 한 번에 생성할 수 있다.

## 라벨 정책

| 라벨 | 의미 |
|------|------|
| `type:feat` | 사용자 기능 (vertical slice 1개) |
| `type:chore` | 설정/문서/리팩터링 |
| `type:bug` | 버그 |
| `area:infra` | 배포·env·CI |
| `area:db` | Prisma schema / migration |
| `area:ui` | Next.js page / component |
| `area:auth` | 인증·권한 |
| `prio:p1` | MVP 필수 |
| `prio:p2` | MVP 후 |
| `week:1` / `week:2` / `week:3` | 주차 |

## 도출된 task (15건)

### Week 1 — 기획 / 인프라 (지금 진행 중)

1. **[chore] 저장소 초기 설정 & wiki 작성** — `type:chore` `week:1` `prio:p1`
   - dev 브랜치, README, wiki 문서 6종, 이슈/PR 템플릿, `.gjc/skills/`
   - DoD: `dev` 브랜치 push, README와 docs/wiki/* 존재
2. **[chore] GitHub Wiki 초기화 & docs/wiki 복사** — `type:chore` `week:1` `prio:p1`
   - GitHub 웹에서 wiki 첫 페이지 생성 → `git clone .wiki.git` → docs/wiki 내용 push
3. **[chore] Vercel 프로젝트 연결 + preview deploy 확인** — `type:chore` `area:infra` `week:1` `prio:p1`
4. **[chore] Supabase 프로젝트 생성 + env.example 세팅** — `type:chore` `area:infra` `week:1` `prio:p1`
5. **[chore] CI: lint + typecheck + build on PR** — `type:chore` `area:infra` `week:1` `prio:p2`

### Week 2 — MVP 구현

6. **[feat] Next.js 15 + Tailwind + shadcn 스캐폴드** — `type:chore` `week:2` `prio:p1`
   - DoD: `pnpm dev`로 빈 `/` 페이지 뜸, shadcn `Button` 1개 임포트
7. **[feat] Prisma 초기 schema + 1차 migration** — `type:feat` `area:db` `week:2` `prio:p1`
   - User / Session / Participation, unique(sessionId, userId)
8. **[feat] Supabase 매직링크 로그인** — `type:feat` `area:auth` `week:2` `prio:p1`
   - `/login`, 로그인 후 `/sessions` 리다이렉트, 미로그인 보호 페이지 처리
9. **[feat] 세션 등록 (`/sessions/new`)** — `type:feat` `area:ui` `area:db` `week:2` `prio:p1`
   - 날짜·장소·시간·날씨·사진 + 참여자 N명 × (거리, 기록) 일괄 저장
10. **[feat] 세션 상세 (`/sessions/[id]`)** — `type:feat` `area:ui` `week:2` `prio:p1`
    - 사진, 참여자 표(페이스 자동 계산), 코멘트
11. **[feat] 세션 아카이브 리스트 (`/sessions`)** — `type:feat` `area:ui` `week:2` `prio:p1`
    - 최신순 카드, 사진 썸네일, 페이지네이션 또는 더보기
12. **[feat] 단체사진 업로드 (Supabase Storage)** — `type:feat` `area:infra` `week:2` `prio:p1`
    - 클라이언트 리사이즈(1600px) 후 업로드, 실패 시 에러 표시

### Week 3 — 완성도 / Stretch

13. **[feat] 멤버 페이지 + 누적 거리/페이스 추이** — `type:feat` `area:ui` `week:3` `prio:p2`
14. **[feat] 검색·필터 (장소·멤버·기간)** — `type:feat` `area:ui` `week:3` `prio:p2`
15. **[feat] OG 이미지 (단체사진) + PWA 매니페스트** — `type:feat` `area:ui` `week:3` `prio:p2`

---

## 한 번에 생성하는 bash 스크립트 (gh 인증 후 실행)

```bash
# 사전: gh auth login 으로 인증 완료된 상태여야 함
cd "$(git rev-parse --show-toplevel)"
bash scripts/bootstrap-issues.sh
```

스크립트 본체는 [`scripts/bootstrap-issues.sh`](../scripts/bootstrap-issues.sh).
