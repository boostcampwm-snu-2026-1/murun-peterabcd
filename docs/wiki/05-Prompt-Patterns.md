# 05 · AI 요청 프롬프트 패턴 초안

> 같은 형식의 컨텍스트를 매번 주면 Agent의 결과가 안정된다. 처음부터 완성형은 아니고, 매주 회고에서 수정한다.

## 1. 공통 원칙

1. **컨텍스트 → 작업 → 수용 기준 → 비변경** 순서로 적는다.
2. 파일 경로는 항상 repo root 기준 상대 경로.
3. "잘 부탁해" 같은 말은 빼고, **무엇을 만들고 무엇을 만들지 말지**를 명확히.
4. Agent가 추측하지 않게 **참고할 기존 코드 1곳**을 항상 명시한다.
5. 끝에 항상 **"끝낸 후 변경한 파일 목록과 미해결 TODO를 적어"** 를 붙인다.

## 2. 패턴 A — Feature 구현

```
[컨텍스트]
- 이 repo는 Next.js 15 App Router + Prisma + Supabase. 자세한 건 docs/wiki/02-Tech-Stack.md.
- 관련 스키마: prisma/schema.prisma 의 Session, Participation.
- 기존 유사 패턴: app/(app)/sessions/new/page.tsx
- 사용자 스토리: .gjc/specs/<feature>.md

[작업]
<한 문장으로>

[수용 기준]
- [ ] 모바일(375px)에서 폼이 안 깨진다
- [ ] zod 검증 실패 시 필드 옆에 에러 표시
- [ ] 성공 시 /sessions/[id] 로 리다이렉트
- [ ] pnpm typecheck / pnpm lint 통과
- [ ] tests/<feature>.test.ts 스모크 1개

[비변경]
- prisma/schema.prisma 외 schema 파일
- app/(public)/* 디렉터리
- 다른 라우트의 layout.tsx

[출력]
끝낸 후 변경한 파일 목록과 미해결 TODO 를 적어라.
```

## 3. 패턴 B — 버그 수정

원인부터 묻고, 수정 코드는 그 다음에 받는다. **수정과 가설을 한 번에 받지 않는다.**

```
[증상]
/sessions/new 에서 [저장] 누르면 500. Vercel 로그에 "PrismaClientValidationError".

[재현]
1. 로그인
2. /sessions/new 진입
3. 거리만 입력, 기록 비움
4. 저장

[기대]
거리만 있고 기록이 없어도 저장된다 (Participation.durationSec 은 nullable).

[지금까지 해본 것]
- prisma/schema.prisma 의 durationSec 은 Int? 로 nullable
- form 의 zod schema 도 optional

[요청]
원인 가설 3개를 우선순위로 적고, 각각 어느 파일 어느 줄을 확인해야 하는지만 말해라. 아직 코드 수정은 하지 마라.
```

가설 확인 후 별도 메시지로:

```
[확정 원인]
... 이었다.

[수정 범위]
- lib/sessions/createSession.ts: durationSec 빈문자열 → null 변환 누락
- 위 파일만 수정해라. 다른 파일은 만지지 마라.
```

## 4. 패턴 C — 리팩터링

```
[대상]
app/(app)/sessions/new/page.tsx 의 onSubmit 핸들러 (현재 ~120줄)

[이유]
1. 검증 + 변환 + 호출이 한 함수에 섞여 있어 테스트 불가
2. 같은 변환 로직이 sessions/[id]/edit/page.tsx 에도 곧 들어갈 예정

[목표]
- 변환 로직만 lib/sessions/normalize.ts 로 분리 (순수 함수)
- 페이지의 onSubmit 은 normalize → action 호출만 하도록

[불변량]
- 외부에서 본 동작은 동일
- import 경로 외 다른 파일 변경 없음

[검증]
- pnpm test lib/sessions/normalize.test.ts (새로 만들고 케이스 3개)
- /sessions/new 수동 1회 통과
```

## 5. 패턴 D — Schema 변경 (가장 위험)

Agent에게 schema 변경을 시킬 때는 **항상 migration plan부터 받는다.**

```
[작업]
Session 에 distanceTotalKm Float? 필드 추가. (참여자 distance 합산 캐시)

[요청 1단계 — 코드 수정 금지]
다음을 표로 답해라:
1. 변경할 prisma/schema.prisma 의 정확한 diff
2. migration 이름 제안
3. 데이터 backfill 필요 여부와 SQL 초안
4. 이 필드에 의존하는 기존 쿼리/UI 가 있는지 grep 결과

여기까지 OK 받기 전엔 절대 schema 파일을 수정하지 마라.
```

승인 후:

```
[2단계]
위 plan 그대로 진행. migrate dev 명령은 직접 실행하지 말고, 명령어만 출력해라. 내가 실행한다.
```

## 6. 패턴 E — 모르는 도메인/라이브러리 조사

```
[목적]
Next.js App Router 에서 단체사진 업로드를 Server Action 으로 받을 때
1) 파일 크기 제한
2) Supabase Storage 로의 안전한 업로드 흐름 (서명 URL vs server에서 forward)
중 어느 쪽을 우리가 택해야 하는지 결정하고 싶다.

[요청]
- 양쪽 흐름의 장단점 4줄씩
- 우리 스택(이 repo)에서 권장하는 것 1개와 이유
- 참고할 만한 공식 문서/예제 링크 (가짜 링크 만들지 마라)
- 결정 후 영향받는 파일 목록

아직 코드는 만들지 마라.
```

## 7. 안티 패턴 (내가 자주 하는 실수 메모)

- ❌ "세션 관련 화면 좀 만들어줘" → 작업 범위 무한팽창. **항상 한 화면, 한 동작**.
- ❌ Agent가 만든 코드를 그대로 `git add .` → diff를 안 읽으면 의미 없다. **반드시 diff 봐서 OK한 파일만 stage**.
- ❌ "에러 났는데 고쳐줘" + 에러 로그 안 붙임 → 가설만 무한 생성. **로그 원문을 그대로 붙인다**.
- ❌ 같은 컨텍스트를 매번 다시 설명 → `.gjc/skills/` 에 적어두고 참조시킨다.
