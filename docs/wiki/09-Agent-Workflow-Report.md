# 09 · Week 3 Agent 워크플로우 기술 리포트

> 3주 동안 뮤런을 만들면서 정착시킨 **나만의 Agent 기반 개발 방식**이다. 목표는 다음 프로젝트에서도 그대로 복붙해 쓸 수 있는 셀프 가이드다.

## 1. 내가 만든 흐름 요약

뮤런의 최종 워크플로우는 한 문장으로 정리하면 다음과 같다.

> **Issue로 일을 작게 고정하고, Agent에게 vertical slice를 맡기되, 테스트와 배포 smoke로 실제 동작을 사람이 검증한다.**

기본 루프:

```text
Issue 작성
  → 영향 파일/수용 기준 확인
  → feature/fix branch 생성
  → domain logic 먼저 분리
  → UI/Server Action 구현
  → Vitest/RTL로 단위·컴포넌트 테스트
  → Playwright로 최소 사용자 smoke
  → PR + CI
  → main merge 시 N100 prod 자동 배포
  → 배포 후 핵심 화면 직접 확인
```

## 2. 작업 단위 쪼개기 기준

### 2.1 원칙: 한 PR = 한 사용자 의미

좋은 PR 단위:

- 세션 생성 흐름 하나
- 참여 기록 저장/수정 흐름 하나
- 사진 업로드 제한/오류 처리 하나
- 회원 관리 접근 권한 버그 하나
- 테스트 인프라 + 그 테스트가 검증하는 리팩터링 하나

나쁜 PR 단위:

- UI만 만들어 놓고 저장은 다음 PR
- DB 스키마만 바꾸고 화면은 없음
- 여러 기능을 한꺼번에 묶음
- 버그 수정 중 관계없는 리팩터링을 같이 섞음

### 2.2 Vertical slice 내부 순서

```text
1. 도메인/검증 로직
2. 서버 액션 또는 DB 쿼리
3. 화면 컴포넌트
4. 테스트
5. 문서/운영 가이드
```

이 순서를 지키면 Agent가 화면부터 그럴듯하게 만들고 핵심 검증을 빼먹는 일이 줄어든다.

## 3. Agent에게 주는 요청 패턴

### 3.1 구현 요청

```markdown
[맥락]
- 이 repo는 Next.js App Router + Prisma + SQLite + Auth.js v5.
- N100 prod는 main 기준으로만 배포한다.
- 관련 기존 패턴: <파일 경로>

[작업]
<사용자 관점 동작 1개>

[수용 기준]
- [ ] happy path
- [ ] negative case
- [ ] 권한/인증 경계
- [ ] 테스트 추가 또는 기존 테스트 갱신
- [ ] pnpm check 통과

[비변경]
- 이번 PR에서 건드리지 않을 파일/기능

[출력]
변경 파일, 검증 명령, 남은 TODO를 적어라.
```

### 3.2 버그 수정 요청

버그는 바로 수정시키지 않는다. 먼저 원인을 분리한다.

```markdown
[증상]
실제 화면/로그 원문

[재현]
1. ...
2. ...

[기대]
원래 되어야 하는 동작

[요청]
수정하지 말고 원인 후보와 확인할 파일부터 말해라.
```

원인을 확인한 뒤에만 수정 범위를 지정한다.

## 4. 사람이 직접 판단하는 체크포인트

Agent가 가장 자주 틀리는 지점은 문법이 아니라 **해석**이었다.

그래서 merge 전에는 [`06-Checkpoints`](06-Checkpoints)를 기준으로 다음을 본다.

- 내가 시킨 일을 정확히 했는가
- 시키지 않은 일을 끼워 넣지 않았는가
- 귀찮은 negative case를 줄이지 않았는가
- 기존 접근법을 임의로 바꾸지 않았는가
- “검증했다”는 말이 실제 명령/로그/화면으로 증명되는가
- diff 크기가 요청에 비례하는가
- 내가 직접 사용자 시나리오를 한 번 흘려봤는가

## 5. 테스트 전략

Week 3에서 테스트 피라미드를 실제 repo에 넣었다.

### 5.1 Unit test

대상:

- 참여 기록 입력값 파싱
- 세션 검색 필터 파싱
- 업로드 파일 제한

원칙:

- DB, Auth, 네트워크 없는 순수 함수부터 테스트한다.
- “실패하면 사용자가 어떤 메시지를 보게 되는가”를 함께 검증한다.
- 숫자 파싱처럼 Agent가 조용히 대충 처리하기 쉬운 경계를 테스트한다.

### 5.2 Component test

대상:

- `ErrorAlert`
- `/sessions` 필터바

원칙:

- 내부 state가 아니라 사용자가 보는 label, role, text로 찾는다.
- props in → UI out 컴포넌트를 먼저 테스트한다.

### 5.3 E2E smoke

대상:

- 비로그인 사용자가 홈에서 로그인 화면으로 이동하는지
- OAuth 에러가 Auth.js 기본 에러 페이지가 아니라 로그인 화면에서 안내되는지

원칙:

- E2E는 많이 만들지 않는다.
- 로그인/외부 OAuth 전체를 매번 자동화하려고 하지 않고, 깨지면 치명적인 얇은 smoke만 둔다.
- 배포 후에는 자동 E2E와 별개로 사람이 prod에서 핵심 흐름을 직접 본다.

## 6. 동료 사례에서 반영한 점

- `auto-develop` 사례: 한 명령으로 plan → implement → PR까지 가는 흐름은 좋지만, 뮤런은 prod 배포가 붙어 있어 **사람의 merge 판단**을 남겼다.
- 단계별 skill 사례: design/implement/review를 분리하는 아이디어를 받아, `.gjc/skills/murun-feature`에 단계와 금지사항을 명시했다.
- hook 사례: 커밋 전 강제 hook까지는 과하지만, CI에 `typecheck + lint + test + build + e2e`를 넣어 PR 단위 안전망을 만들었다.
- atomic PR 사례: 하나의 의미 있는 task를 하나의 PR로 묶는 기준을 유지했다.
- 테스트 강의: Vitest/RTL은 빠른 안전망, Playwright는 최소 smoke라는 역할 분담을 적용했다.

## 7. 자랑

뮤런은 단순히 “AI가 코드를 많이 짠 프로젝트”가 아니라, **AI가 자주 틀리는 지점을 내가 워크플로우로 막아낸 프로젝트**가 됐다.

특히 기억할 만한 개선:

- 큰 JPG 업로드가 Next Server Action 기본 1MB 제한에서 죽던 문제를 찾아, framework limit과 앱 자체 limit을 분리했다.
- `/admin/members`가 middleware의 오래된 role 정보 때문에 404가 되던 문제를 실제 prod 증상 기준으로 고쳤다.
- 참여 기록의 “거리/기록/메모 중 최소 한 가지” 같은 도메인 규칙을 서버 예외가 아니라 사용자가 이해 가능한 inline error로 바꿨다.
- 마지막 주차에는 그 동작들을 테스트로 고정했다.
- dogfooding 이후 세션 수정/삭제 UI와 인증된 사용자 E2E smoke까지 추가했다.

## 8. 교육 이후 개선 TODO

- [x] Playwright에 non-production E2E bypass를 설계해서 “세션 생성 → 참여 기록 → 세션 수정/삭제” smoke 추가
- [x] PR template에 `pnpm test`, `pnpm test:e2e`, 배포 smoke 기준 추가
- [ ] `.gjc/skills/murun-feature`를 `/auto-develop <issue>`에 더 가깝게 자동화
- [x] N100 배포 후 `/api/health`와 로그인 오류 안내를 확인하는 post-deploy smoke 추가
- [ ] DB 백업/복구 리허설을 정기 작업으로 분리
- [ ] 모바일 실제 기기 QA 체크리스트 추가
