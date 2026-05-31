# 06 · 직접 검증/판단 체크포인트

> Agent에게 위임하지 않고 **사람이 반드시 본다**. PR을 merge 하기 전 단계.

## A. 모든 PR 공통

- [ ] PR 본문에 issue 번호와 스크린샷(모바일/데스크탑 각 1장)이 있다
- [ ] **diff를 처음부터 끝까지 읽었다** — 의미 없는 import, 죽은 코드, 주석 처리된 옛 로직 없음
- [ ] `pnpm typecheck` 통과
- [ ] `pnpm lint` 통과 (warning도 0을 목표로)
- [ ] `pnpm build` 통과
- [ ] preview deploy URL에서 1회 직접 시나리오 실행
- [ ] 새 환경변수가 생겼다면 `.env.example` 도 업데이트
- [ ] 새 의존성이 생겼다면 정말 필요한지 한 번 더 자문

## B. UI가 바뀌었을 때

- [ ] **모바일 375px** 에서 가로 스크롤이 생기지 않는다
- [ ] **빈 상태**(데이터 0건)에서 화면이 안 깨지고 의미있는 메시지가 나온다
- [ ] **로딩 상태**: skeleton 또는 spinner가 있다 (깜빡이는 빈 화면 X)
- [ ] **에러 상태**: try/catch 후 사용자에게 보이는 메시지가 있다 (콘솔에만 찍히지 않는다)
- [ ] 텍스트 컨트라스트 (회색 위 회색 ❌)
- [ ] 폼: label과 input이 연결되어 있다 (`htmlFor` / `aria-label`)
- [ ] 폼: 제출 중 버튼 disabled + 중복 제출 방지
- [ ] 콘솔에 error / warning 0개 (hydration mismatch 포함)

## C. 데이터를 쓰는 변경일 때 (가장 중요)

- [ ] zod schema가 server action 진입점에 있다
- [ ] 인증 체크가 server action 첫 줄에 있다 (`getUser()` 등)
- [ ] 권한 체크가 있다 (본인 것만 수정? 운영진만 삭제?)
- [ ] **동일 리소스 중복 생성**이 막힌다 (DB unique 또는 트랜잭션 검사)
- [ ] 트랜잭션이 필요한 multi-write 가 한 트랜잭션 안에 있다
- [ ] `onDelete` cascade가 의도한 대로다 (특히 Participation)
- [ ] Storage 업로드가 실패해도 DB는 일관성 있는 상태로 남는다 (선 업로드 → 후 DB 저장 권장)

## D. 인증/권한 변경일 때

- [ ] **로그아웃 상태**로 보호 페이지 → /login 리다이렉트
- [ ] **다른 유저로 로그인**해서 본인 것만 수정/삭제 가능한지 확인
- [ ] 운영진만 보는 화면을 일반 멤버로 접근 → 막힘
- [ ] 세션 만료 후 동작 (쿠키 삭제 후 새로고침)

## E. Schema/Migration 변경일 때

- [ ] migration 파일 이름이 의미 있다 (`add_session_distance_total` O, `change` X)
- [ ] **데이터 손실이 있는 변경**(컬럼 drop, 타입 축소)을 했다면 README/PR 본문에 명시
- [ ] `prisma db push` 가 아니라 `migrate dev`로 만들었다
- [ ] dev DB 외에 prod DB에도 적용했는지 별도 체크
- [ ] generated client (`node_modules/.prisma`) 갱신 확인 — 호스트별 차이 주의

## F. 성능

- [ ] N+1 쿼리 없음 — Prisma `include` 또는 명시적 join
- [ ] `next/image` 사용 (단체사진은 특히)
- [ ] 외부에 노출되는 데이터에 민감 정보 안 섞임 (`select` 명시)
- [ ] Lighthouse mobile Performance ≥ 80 (배포 후 1회)

## G. Agent 결과물 점검 (메타)

Agent가 만든 결과를 신뢰하기 전에:

- [ ] Agent가 "테스트 통과했다"고 적었으면 **나도 직접 한 번 더 돌렸다**
- [ ] Agent가 "기존 패턴을 따랐다"고 적었으면 **참조했다는 파일을 열어 비교했다**
- [ ] Agent가 새 추상화를 만들었다면 (`utils.ts`, `helpers.ts` 류) **정말 필요한지 자문**
- [ ] Agent가 spec에 없던 기능을 추가했다면 **삭제하거나 spec을 갱신**

---

## 사용법

각 PR 본문에 위 섹션 중 해당하는 것만 복사해 체크리스트로 붙인다. 체크 안 된 박스가 있으면 merge 금지.
