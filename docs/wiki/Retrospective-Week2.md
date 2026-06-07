# 회고 · Week 2

기간: 2026-06-01 ~ 2026-06-08

이번 주는 처음으로 코드가 도는 주차였다. 1주차에 정한 결정들을 끼워 맞춰 보니 사람이 보는 surface 가 한 번 다 깔렸고 — 동시에, 내가 정한 워크플로우 룰이 실제로 어떤 부분에서 약했는지가 드러났다.

---

## 무엇을 만들었나

| Surface | PR |
|---------|----|
| Next.js 15 + Tailwind + shadcn + Docker/Caddy 부트스트랩 | #23 |
| Prisma 6 + SQLite + 초기 migration | #24 |
| Auth.js v5 Google OAuth + `@snu.ac.kr` 화이트리스트 + `/admin/members` | #25 |
| 세션 생성 + 상세 + 본인 행 입력 (페이스 자동) | #26 |
| 단체사진 업로드 (로컬 볼륨, 원본 보존) | #27 |
| Hotfix: 빈 입력 noop / encType 제거 / `Session.id` cuid→Int | #28 |
| 폼 inline validation + double-submit 차단 (`useActionState` + `useFormStatus`) | #29 |
| `/sessions` 아카이브 리스트 + 워크플로우 보강 (SKILL §4.5) | #30 |
| 사진/admin 폼 retrofit + CI + Deploy + 회고 | #31 |
| Hotfix: Docker image build (public/ 누락, GHCR 이름 불일치, deploy secrets 분기) | #32 |
| Hotfix: Prisma runtime deps + healthcheck `/api/health` + N100 git sync | #33 |
| 코드 audit: cursor 페이지네이션 / 죽은 env / server-only 가드 | (이 PR) |

11 + 1 PR. 모두 `dev` 에 머지. `main` 은 Week 2 마지막에 `v0.1.0` 태그와 함께 첫 머지.

---

## 워크플로우의 약점이 드러난 두 번의 사고

1주차에 06-Checkpoints 7개를 "AI 가 내 지시를 잘못 해석한 부분을 잡는 가이드라인" 으로 재정의했다. 결과적으로 fidelity 측면 — 시킨 일을 시킨 만큼 했는지 — 은 잘 잡혔다. 그런데 그게 사용자 경험까지 보장하진 못한다는 게 두 번의 사고에서 드러났다.

**사고 1.** 빈 입력 / 잘못된 입력에 알림이 없는 채로 PR 두 번이 머지됐다 (#26, #28). 내가 spec 의 "Out of scope" 에 "react-hook-form 도입 시" 라고 박아두고 미뤘는데, 그게 합리적 분리의 도구가 아니라 미루기의 핑계로 쓰였다. 사용자가 빈 폼 [추가] 를 누르면 풀스크린 에러 페이지 → silent noop 으로 한 번 hotfix 했지만, 둘 다 사용자 경험은 깨져 있었다.

**사고 2.** [세션 만들기] 빠른 더블 클릭으로 row 가 두 번 생성됐다. `useFormStatus` 한 줄이면 막히는 흔한 패턴인데, server action 만 박고 React 19 표준 패턴을 빼먹었다. 처음 PR #26 부터 박혀 있었어야 했다.

둘 다 build 가 그린이고, 06-Checkpoints fidelity 7개도 다 통과했다. 통과한 게 사실 거짓말이었다는 게 아니라, "happy path 코드가 도는가" 와 "사용자가 잘못된 행동을 했을 때 어떻게 되는가" 가 같은 질문이 아니라는 게 정확하다.

수정: PR #30 에 두 곳을 박았다.
- `.gjc/skills/murun-feature/SKILL.md` §4.5 — 새 폼/입력 추가할 때 negative case alert / `useActionState` / `useFormStatus` / DB unique 안전망을 **체크 없이 진행 금지** 로 명시.
- `docs/wiki/06-Checkpoints.md` #7 — "happy path 만으로는 부족, 빈 입력 / 잘못된 타입 / 더블 클릭 / 권한 없는 사용자를 머릿속에서라도 흘려본다."

PR #31 에서 그 룰을 이미 있는 폼(사진 업로드, admin 승인/거절) 에 소급 적용했다. 처음부터 박혔어야 할 코드가 늦게 들어간 거라 새로운 가치는 없지만, **룰이 실제로 문서에 머무르지 않고 다음 PR 에 영향을 줬다는 게 1주차에 정한 것과의 차이**.

---

## 사고 시즌 2: 배포 사이클의 hotfix 3연발

CI/Deploy 파이프라인을 올리고 N100 에 처음 SSH 배포를 굴리면서 사고 3건이 추가로 터졌다 (#32, #33, 이번 PR). 코드는 로컬에서 그린이었는데, 환경이 바뀌니 한 번도 같이 돌려본 적 없는 조합에서 깨졌다.

**사고 3. `public/` 디렉터리가 없는데 Dockerfile 이 무조건 COPY (#32).**
앱 빌드는 통과하는데 컨테이너 빌드만 깨졌다. 로컬 `pnpm build` 만 보던 안전망의 사각.

**사고 4. compose 의 image 이름이 GHCR push 이름과 달랐다 (#32).**
build 는 통과, push 도 통과 — N100 에서 pull 만 못 했을 케이스. 직접 N100 배포까지 가지 않았으면 한참 묻혀있었다.

**사고 5. Prisma `migrate deploy` runtime 의존 (#33).**
Dockerfile 이 `node_modules/prisma`, `node_modules/@prisma` 만 복사해서 `effect` 같은 transitive deps 가 누락 → entrypoint 가 부팅 단계에서 죽음. Healthcheck 도 `/` 를 보고 있었는데 그게 로그인 redirect 라 healthy 가 영영 안 됐다. 인증과 무관한 `/api/health` 로 따로 뺐다.

**사고 6. 이번 audit 에서 잡힌 cursor 페이지네이션 누락.**
`orderBy: (date desc, id desc)` 인데 cursor 는 `id < cursorId` 만 봤다. 오래된 날짜인데 늦게 만들어진(=id 가 큰) 세션이 페이지 사이에서 누락. 데이터가 한 자리수일 땐 안 보이는 버그. 이건 사용자가 못 발견했어도 시간 문제였다.

같이 잡은 audit 항목:
- 죽은 `NEXT_PUBLIC_APP_URL` 변수 → `layout.tsx` 의 `metadataBase` 로 실제 사용.
- `lib/uploads.ts` 가 client 컴포넌트의 transitive import 로 끌려갈 위험 → `import "server-only"` 가드 + URL helper 분리.
- `[세션 수정 — 다음 PR에서 추가]` placeholder 노출 → 제거.

**이 시즌의 공통 패턴.** 모두 "로컬에서 한 가지 경로만 굴려보고 그린이면 통과 보고" 였다. 코드는 같은 환경에서 같은 입력으로만 굴렸고, 다른 환경 (Docker, GHCR, N100, edge case 데이터) 은 한 번도 같이 굴려본 적 없었다. Hotfix 가 3번 연달아 터지면서 알게 된 것:

- **로컬 build 그린 ≠ 컨테이너 build 그린**. Docker 단계는 다른 안전망이 필요.
- **컨테이너 부팅 ≠ 앱 healthy**. healthcheck 가 진짜 ready 신호를 봐야 함.
- **앱이 healthy ≠ 새 코드가 N100 에 도달**. deploy pipeline 의 git sync 가 빠지면 image 만 새거고 compose 파일은 옛것.

수정: `.gjc/skills/murun-feature/SKILL.md` 와 `06-Checkpoints.md` 에 "환경별 검증 분리" 를 추가한다 (3주차에서 보강).

---

## AI 가 스스로 못 잡은 것

직전 사고를 자기 점검해보면 일관된 패턴이 있다.

- AI 는 코드 측 검증(typecheck/lint/build) 결과를 보고 "통과" 라고 보고했다. 그건 정확했다.
- AI 는 PR 본문에 "사용자가 직접 E2E 검증" 이라고 박았다. 그것도 정확했다.
- 그런데 그 사이에 — "사용자에게 시키기 전에 머릿속 시나리오로 한 번 흘려보는 단계" — 가 아예 빠졌다.

AI 가 실제 브라우저를 못 클릭하는 건 사실이다. 그렇다고 머릿속 시뮬레이션까지 못 할 이유는 없다. "이 폼이 빈 입력이면 어떻게 되지?" 같은 질문은 코드를 다시 한 번 읽으면 답이 나온다. 그걸 안 했을 뿐이다.

3주차에 적용할 변화는 세 개:
1. spec 의 "Out of scope" 가 정말 분리 가치가 있는지, 아니면 그냥 미루는 건지 구분한다. 미루는 것일 가능성이 보이면 OOS 에서 빼고 같은 PR 에 합친다.
2. PR 본문의 Fidelity check #7 에 negative case 머릿속 시나리오 1~2줄을 강제로 적는다 — "빈 입력 → ...", "권한 없는 사용자 → ..." 같은 한 줄.
3. 인프라/배포 PR 은 **로컬 build 그린 + 컨테이너 build 그린 + healthcheck 가 진짜 ready 를 보는가** 세 줄을 PR 본문에 명시. 코드만 보면 사고 시즌 2가 또 반복된다.

---

## 도메인 결정 측면

1주차에 정한 "호스트 = 세션 작성자, 참여자 = 본인 행을 적는" 모델은 어색함 없이 그대로 동작했다. 카톡 단톡방에 던지는 시나리오(아직 OG 이미지 없어 미리보기는 빠짐) 를 가정하고 짠 흐름이 실제로 운영진/참여자 모두에게 자연스러운지는 — Week 3 의 실제 운동 1회 dogfooding 에서 검증된다.

작게 뒤집은 결정:
- `Session.id` cuid → autoincrement Int (#28). enumeration 차단 가치 < 가독성. 동아리 30명 내부용에 더 맞음.
- 검증 강화에서 "초는 0~59" 로 강제 (#29). 사용자가 5분 0초를 4'60" 로 적는 흔한 실수를 막음.

---

## 인프라 측면

자체 N100 + Docker + Caddy + SQLite 결정이 운영 측에서 깔끔하게 안정됐다.

- 이번 PR 의 CI 워크플로우 — PR 마다 typecheck/lint/build 자동. 솔로 프로젝트지만, "내가 매번 로컬에서 돌리는 단계" 를 GH 가 대신 해주는 게 안전망.
- 이번 PR 의 Deploy 워크플로우 — dev push → ghcr.io build → SSH → N100 staging 자동. main 은 environment 보호 후 수동 승인.
- SSH key + N100_HOST 등 secrets 등록은 호스트(나) 의 책임. README 에 절차가 있고, 등록 전에는 이미지 build/push 까지만 성공시키고 SSH deploy 는 skip 하도록 했다.

남은 호스트 작업 (Week 2 안에 끝남):
- N100 에서 `docker compose up -d` 로 staging 기동 — 자동 배포 파이프라인 통과 확인
- `dev → main` 첫 머지 + `v0.1.0` 태그

Week 3 로 미루는 호스트 작업:
- duckdns 도메인 + HTTPS
- prod environment 보호 + main → prod 라인 첫 발사

---

## 다르게 한다면 (3주차에서 바꾸는 것)

1. **spec 작성 시 OOS 항목을 "정말 미루는가" 한 번 자문**. PR #26/#28 의 inline validation 처럼, OOS 가 사실 사용자 경험을 직접 망치는 거면 같은 PR 에 합친다.
2. **PR 본문 Fidelity #7 에 negative case 한 줄 명시 강제**. "빈 입력 → alert", "더블 클릭 → dedupe 동작" 같이 머릿속 시나리오를 글로.
3. **AI 가 만든 PR 을 머지하기 전 코드 측 검증 + 머릿속 시나리오 둘 다 통과한 다음에만 사용자에게 검증 요청**. 빌드 그린만 보고 "검증 가능" 이라고 보고하는 패턴 폐기.
4. **PR scope 묶기/쪼개기 결정을 한 줄 메모로**. 4 commit 1 PR 도 합리적, 작은 PR 여러 개도 합리적. 결정 기준은 "사용자 머지 부담" 과 "도메인 응집도".
5. **dev → main 머지 주기를 정해둠**. 매 PR 마다 하지 않더라도, Week 끝마다 v0.x.0 태그와 함께 일괄. main 이 비어있는 채로 가는 기간이 너무 길지 않게.
6. **배포 PR 은 다른 환경까지 한 사이클 굴려본 다음 머지**. local pnpm check 그린만 보고 배포 PR 머지하지 않는다. workflow_dispatch 로 한 번 굴려본 다음 그린이면 머지.

---

## 3주차 계획

핵심은 **사용자 입장에서 실제로 한 번 굴려보는 주**. 코드는 거의 다 됐고, 진짜 모임 1회의 기록을 끝까지 흘려본 다음에 발견되는 어색함 들을 잡는다.

- [ ] N100 에 실제 배포 (CI/CD secret 등록 후 dev push → staging 동작 확인)
- [ ] duckdns 도메인 + Caddy HTTPS
- [ ] Google OAuth redirect URI 에 prod 도메인 추가
- [ ] `dev → main` 첫 머지 + `v0.1.0`
- [ ] OG 이미지 (#15) — 카톡 공유 미리보기. 이게 빠지면 동아리 공유 UX 가 무미건조함.
- [ ] (시간 되면) 검색·필터 (#14) — 참여 인원 수, 장소, 기간
- [ ] (시간 되면) 멤버 페이지 + 누적/페이스 추이 차트 (#13)
- [ ] **실제 동아리 운동 1회 dogfooding** — 호스트 시점 + 참여자 시점 양쪽으로 흘려보기
- [ ] 3주차 회고

3주차에 발견되는 사고들은 이번 주처럼 spec/OOS 누락이 아니라, **실제 사용자가 도메인을 어떻게 다르게 쓰는가** 에서 나올 것이다. 그게 가장 의미있는 학습일 것이라 본다.
