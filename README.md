# murun-peterabcd

> 애니뮤 러닝 소모임의 정기 운동 기록을 아카이브하는 서비스
> Boostcamp WM 2026 · SNU · 개인 프로젝트 (3주)

## 1. 프로젝트 개요

**뮤런(Murun)** 은 동아리 "애니뮤" 러닝 소모임이 매주 진행하는 정기 운동의 기록을 가볍게 남기고, 시즌이 쌓일수록 단단해지는 아카이브가 되는 것을 목표로 한다.

기록 단위는 **세션(Session, 한 번의 정기 운동)** 이며, 모델은 게시글-댓글에 가깝다.

- **호스트**가 그날의 세션 페이지를 만든다 — 날짜·장소·시작 시각·날씨·단체사진·코스 메모
- **참여자**는 본인 행을 직접 추가한다 — 거리(km)·기록(시간)·노트 (모두 optional)
- **관리자**는 신규 가입(SNU 구글 계정)을 승인한다

자세한 기획·기술·워크플로우 문서는 [`docs/wiki/`](./docs/wiki) (GitHub Wiki 미러)를 참고.

## 2. 저장소 정보

- 저장소: [`boostcampwm-snu-2026-1/murun-peterabcd`](https://github.com/boostcampwm-snu-2026-1/murun-peterabcd)
- 작성자: 이현민 (peterabcd)
- 기간: 2026-05-25 ~ 2026-06-14 (3주)

## 3. 브랜치 전략

```
main   ← 배포 가능한 상태만 (보호 브랜치, dev → main PR로만 merge)
dev    ← 통합 브랜치, 모든 feature가 PR로 모임
feat/* ← 작업 단위. PR 대상은 항상 dev
fix/*  ← 버그 수정
chore/*← 설정/문서/리팩터링
```

PR 규칙:
- `feat/* → dev` 는 self-review + 체크리스트 통과 후 merge (squash)
- `dev → main` 은 매주 마지막에 배포 가능 상태에서 merge
- PR 제목: `[feat] 세션 등록 폼 (#12)` 형태

## 4. 개발/문서 관리

| 항목 | 위치 |
|------|------|
| 기획/설계 문서 | [GitHub Wiki](https://github.com/boostcampwm-snu-2026-1/murun-peterabcd/wiki) (소스: [`docs/wiki/`](./docs/wiki)) |
| Task 관리 | [GitHub Issues](https://github.com/boostcampwm-snu-2026-1/murun-peterabcd/issues) |
| 작업 단위 | feature 단위 (vertical slice) — [`docs/wiki/04-Agent-Workflow.md`](./docs/wiki/04-Agent-Workflow.md) 참고 |
| Agent skill | [`.gjc/skills/murun-feature/SKILL.md`](./.gjc/skills/murun-feature/SKILL.md) |
| 회고 | [`docs/wiki/Retrospective-Week1.md`](./docs/wiki/Retrospective-Week1.md) |

## 5. 빠른 시작

### 로컬 개발

```bash
corepack enable
pnpm install
cp .env.example .env.local      # 후속 PR에서 키 채워짐
pnpm dev                        # http://localhost:3000
```

체크:

```bash
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint .
pnpm build        # Next.js 빌드 (Windows에선 standalone 비활성)
pnpm check        # 위 셋 일괄
```

### 자체 서버 (N100) 배포

[`deploy/README.md`](./deploy/README.md) 참고. 요약:

```bash
cd deploy
cp .env.example .env
docker compose up -d --build
```

## 6. 라이선스

Boostcamp 교육 과정 산출물. 추후 결정.
