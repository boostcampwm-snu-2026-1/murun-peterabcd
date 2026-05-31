# 04 · Agent 개발 workflow 흐름 초안

> 이 문서는 **내가 Agent와 함께 한 feature를 끝낼 때 따르는 절차**다. 1주차 초안이며, 매주 회고에서 수정한다.

## 0. 전제

- 코딩 에이전트는 **로컬 GJC (Gajae Code)** + 보조로 ChatGPT/Claude 웹.
- "Agent skill" = 반복되는 작업 절차를 MD로 정리한 것. → repo의 [`.gjc/skills/murun-feature/SKILL.md`](https://github.com/boostcampwm-snu-2026-1/murun-peterabcd/blob/main/.gjc/skills/murun-feature/SKILL.md) 참고.
- Wiki는 사람을 위한 진실의 원천, `.gjc/`는 Agent에게 주는 컨텍스트.

## 1. 작업 단위 쪼개기 기준

### 1.1 1순위: Vertical slice (기능 단위)

**한 PR = 한 사용자 스토리를 끝까지.**

> "운영진이 세션을 등록할 수 있다" = Prisma schema 변경 + Server Action + 폼 페이지 + 성공 후 리다이렉트 + 1개 스모크 테스트

이유:
- 항상 `dev` 브랜치가 동작하는 상태로 유지된다 → preview deploy로 즉시 확인.
- 회고/리뷰가 "이 기능 켜고 끄기" 단위로 떨어진다.

### 1.2 2순위: 그 안에서 컴포넌트 단위로 쪼갬 (선택적)

Vertical slice가 2시간을 넘기면 안에서 다음 순서로 sub-task를 만든다.

```
1. schema (Prisma)
2. server (Server Action / loader)
3. ui   (page + components)
4. test (스모크 1개)
```

각 sub-task는 별도 PR이 아니라 **같은 PR 안의 커밋**으로 둔다. PR 1개 = feature 1개.

### 1.3 절대 안 하는 쪼개기

- "UI만 먼저, 데이터는 다음 주" → dev에 죽은 화면이 쌓인다.
- "여러 feature를 한 PR에" → 리뷰 비용 폭발.

## 2. Feature 1개를 끝내는 7단계 흐름

각 단계마다 **누가 하는지**(👤=나, 🤖=Agent)를 표시한다.

```
0. issue 작성             👤    "왜·무엇·수용 기준"을 issue에 먼저 쓴다
1. spec MD 작성           👤+🤖 .gjc/specs/<feature>.md 1쪽
2. plan                   🤖    spec → 파일 변경 계획. 👤가 검토/수정
3. branch + scaffold      🤖    feat/<n>-<slug>
4. implement              🤖    schema → server → ui → test 순서
5. self-verify           👤    체크포인트 06 통과
6. PR open                🤖    템플릿 채워서 dev로 PR
7. squash merge           👤    preview deploy 확인 후
```

### 단계별 상세

#### 1. spec MD 작성 — `.gjc/specs/<feature>.md`

내가 5줄짜리 초안을 쓰고 Agent에게 "수용 기준"·"엣지 케이스"·"이번에 안 하는 것"을 채우라고 시킨다. 내가 마지막에 검토.

템플릿:

```markdown
# <feature>

## Story
운영진으로서 ... 하기 위해 ... 하고 싶다.

## Acceptance
- [ ] ...
- [ ] ...

## Out of scope
- ...

## Touched files (예상)
- prisma/schema.prisma
- app/(app)/sessions/new/page.tsx
- lib/...

## Open questions
- ...
```

#### 2. plan

Agent에게:
> "이 spec을 보고, 변경할 파일 목록과 각 파일 변경 요지를 표로 만들어. 새 파일/수정 파일을 구분하고, schema 변경이 있다면 migration 명령도 같이 적어."

👤 검토 포인트:
- schema 변경이 있는데 spec엔 없었나? → spec 먼저 수정.
- 기존 패턴 무시하고 새 추상화를 만들었나? → "기존 X 패턴을 따르라"고 다시 지시.

#### 3. branch + scaffold

```bash
git switch dev && git pull
git switch -c feat/12-session-create
```

Agent가 빈 파일 + import 정도만 먼저 만들고 commit. 그래야 그 다음 변경 diff가 작아진다.

#### 4. implement

- **schema → server → ui → test** 순서를 어기지 않는다.
- schema 변경 후엔 항상 `pnpm prisma generate && pnpm prisma migrate dev --name <slug>`.
- Server Action은 항상 zod input schema부터.
- UI는 `loading.tsx` / `error.tsx` / 빈 상태를 포함해 짠다.

#### 5. self-verify

→ [`06-Checkpoints`](06-Checkpoints) 의 체크리스트를 **사람이** 본다. Agent가 "통과했다"고 적은 줄은 그대로 믿지 않는다.

#### 6. PR

PR 본문은 issue 자동 연결(`Closes #N`) + 변경 요약 + 스크린샷(모바일/데스크탑) + 체크리스트.

#### 7. merge

- preview deploy에서 직접 확인 (로그인까지 한 번 흘려보냄).
- squash merge로 dev 히스토리 깔끔하게.
- merge 후 issue 자동 닫힘 확인.

## 3. 워크플로우 다이어그램

```
  ┌──────────────┐
  │ Idea / Issue │  👤
  └──────┬───────┘
         │
         ▼
  ┌──────────────────┐
  │ .gjc/specs/*.md  │  👤+🤖
  └──────┬───────────┘
         │
         ▼
  ┌──────────────────┐
  │ plan (file list) │  🤖 → 👤 review
  └──────┬───────────┘
         │
         ▼
  ┌──────────────────┐
  │ feat branch      │
  │ schema → server  │
  │ → ui → test      │  🤖
  └──────┬───────────┘
         │
         ▼
  ┌──────────────────┐
  │ Checkpoints      │  👤  ← 여기가 사람의 책임
  └──────┬───────────┘
         │
         ▼
  ┌──────────────────┐
  │ PR → dev → merge │  🤖 open / 👤 merge
  └──────┬───────────┘
         │
         ▼
  ┌──────────────────┐
  │ Vercel preview/  │
  │ prod 확인         │  👤
  └──────────────────┘
```

## 4. Agent에게 절대 위임하지 않는 것

- **DB migration 적용** (`prisma migrate deploy`)
- **`main` 브랜치로의 merge**
- **secret / env 값 변경**
- **외부 서비스(Supabase, Vercel) 콘솔 설정 변경**
- **요구사항 자체의 수정** (spec MD는 내가 최종본을 가진다)

## 5. 발전 방향 (3주에 걸쳐 다듬을 것)

- Week 1 → 7단계 흐름 정착, spec/plan 템플릿 확정.
- Week 2 → 자주 쓰는 Agent skill 2~3개 추출 (`session-feature`, `bugfix`, `schema-migration`).
- Week 3 → "Agent가 만든 PR을 내가 리뷰할 때 보는 패턴"을 별도 문서로.
