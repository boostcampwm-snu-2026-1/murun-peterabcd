# 회고 · Week 1 (2026-05-25 ~ 2026-05-31)

> "1주차에는 코드를 서두르지 않는다"는 요구를 받았다. 평소대로면 첫날부터 `pnpm create next-app` 부터 쳤을 텐데, 한 주를 통째로 기획·워크플로우 설계에 쓰는 게 어떤 차이를 만드는지 직접 체험하는 한 주였다.

## 1. 이번 주 한 일

- 서비스 정의: 애니뮤 러닝 소모임의 정기 운동 기록 아카이브 (Murun)
- MVP 범위와 비목표를 명시: "안 하는 것"을 적은 게 가장 도움이 됨
- 기술 스택: Next.js 15 + Supabase + Prisma + Vercel — 단일 언어/단일 배포물 원칙
- 페이지·데이터 모델 초안: Session ↔ Participation, (sessionId, userId) unique 결정
- Agent 개발 workflow 7단계 + 작업 단위 쪼개기 기준(vertical slice 우선)
- 프롬프트 패턴 5종(feature/bug/refactor/schema/research) + 안티패턴 메모
- 직접 검증 체크포인트 7섹션 (PR마다 복붙)
- `.gjc/skills/murun-feature/SKILL.md` Agent skill 초안
- 이슈/PR 템플릿, 라벨 정책, 초기 issue 15건 도출 + 일괄 생성 스크립트
- `dev` 브랜치 분리, README/wiki 미러 구조

## 2. 잘된 점

- **"안 한다"의 힘**: Non-goals를 명시했더니 MVP 폭이 자연스럽게 좁아졌다. 평소엔 "스트라바 연동도 하고 푸시도..." 하다가 일주일을 날렸을 것이다.
- **Agent에게 줄 컨텍스트가 미리 정리됨**: tech-stack / screen-flow / workflow MD가 그대로 프롬프트 컨텍스트가 된다. Week 2에 "어떻게 설명하지?"에 쓸 시간을 미리 당겨썼다.
- **체크포인트를 사람 책임으로 못 박았다**: 06-Checkpoints 를 PR 템플릿에 박았으니 "Agent가 통과했다고 했어요"는 안 통한다.

## 3. 어려웠던 점 / 막힌 곳

- **"기획만 하는 한 주"의 심리적 저항**: 코드 안 짜고 있으면 일을 안 하는 것 같은 느낌. 의식적으로 "지금 쓰는 문장이 다음 주 PR 5개의 품질을 결정한다"고 되뇌었다.
- **데이터 모델 결정 — 페이스를 저장할까 말까**: 결국 저장하지 않기로(파생값). 저장하면 빠르지만 일관성 깨질 위험이 더 큼. 작은 규모에선 매번 계산해도 0ms.
- **인증 방식**: 매직링크가 동아리에 가장 무난하지만, 이메일 안 보는 부원이 있을 가능성 → Week 2에서 카톡 공유 흐름을 같이 보고 다시 결정하기로.
- **Wiki vs docs/**: 둘 중 어디가 진실의 원천인가? → "docs/wiki/가 원본, GitHub Wiki는 미러"로 결정. wiki를 직접 편집하면 repo와 어긋난다.

## 4. 다음 주(Week 2) 계획

1. Vercel + Supabase 연결 (Day 1)
2. Next.js 스캐폴드 + shadcn (Day 1)
3. Prisma schema + 매직링크 로그인 (Day 2)
4. 세션 등록 + 상세 + 리스트 (Day 3-5) — 핵심
5. 사진 업로드 파이프라인 (Day 5-6)
6. 운영진 1명 + 본인 2계정으로 dogfooding 1회 (Day 7)

각 feature 시작 전에 `.gjc/specs/<feature>.md` 를 먼저 쓰는 규칙을 깨지 않는다.

## 5. Agent 워크플로우 측면에서 배운 것

- **컨텍스트 문서를 repo 안에 두는 게 큰 차이**: ChatGPT 채팅창에 다시 붙여넣지 않아도 됨. `.gjc/skills/` 와 `docs/wiki/` 가 그 역할.
- **Plan 단계를 분리한 효과**: Agent에게 "표만 그려, 코드는 아직 만들지 마"라고 시키는 패턴이 손해 본 적이 없다. Week 2에선 매 feature마다 강제할 것.
- **위임 금지 목록을 명시**: migration apply / main merge / env 변경 — 적어두지 않았으면 Agent가 알아서 했을 일들. 사고 예방.

## 6. 그룹 활동

- (작성 시점에 동료 PR 리뷰 1회 진행 / 또는 미진행)
- 다음 주에는 그룹 누군가의 PR에 "체크포인트 06"을 한 번 그대로 적용해 리뷰해보기.

---

_Updated: 2026-05-31_
