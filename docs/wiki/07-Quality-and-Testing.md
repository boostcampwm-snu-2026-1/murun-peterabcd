# 07 · 품질 개선과 테스트 전략

> Week 3에서 추가한 테스트 안전망과 품질 개선 활동을 정리한다. 목적은 커버리지 숫자 자체가 아니라, 뮤런의 핵심 흐름이 깨졌을 때 빠르게 알아차리는 것이다.

## 1. 왜 테스트를 추가했나

Week 2까지는 `typecheck → lint → build`가 주된 안전망이었다. 하지만 dogfooding과 prod 운영 과정에서 다음 문제가 드러났다.

- 빈 입력/잘못된 입력이 사용자에게 제대로 안내되지 않음
- 큰 JPG가 Next Server Action 기본 1MB 제한에서 generic 413으로 죽음
- `/admin/members`가 middleware stale role 때문에 404가 됨
- distance input의 `min=0.01`, `step=0.1` 조합처럼 브라우저 기본 검증이 실제 제출을 막는 문제

즉, 빌드가 통과해도 **사용자 흐름**과 **입력 경계**는 깨질 수 있었다.

## 2. 도구별 역할

| 도구 | 역할 | 이번 프로젝트 적용 |
|------|------|------------------|
| Vitest | 빠른 단위 테스트 러너 | 순수 함수 검증 |
| React Testing Library | 사용자 관점 컴포넌트 테스트 | `ErrorAlert`, `/sessions` 필터바 |
| Playwright | 실제 브라우저 smoke | 로그인 진입, OAuth 오류 안내, 세션 생성/기록/수정/삭제 |
| GitHub Actions | PR 자동 안전망 | typecheck, lint, test, build, e2e |

## 3. 현재 테스트 범위

### 3.1 Unit

- `lib/participation-form.ts`
  - 거리/기록/메모 정규화
  - 빈 입력 에러
  - 초 60 이상 에러
  - 음수/소수 분 에러
- `lib/session-form.ts`
  - 세션 생성/수정 폼 검증
  - 선택 필드 null 변환
  - 날짜 input 포맷
- `lib/session-filters.ts`
  - 장소/멤버/월/참여 인원 필터 파싱
  - 깨진 숫자 파라미터 무시
  - cursor 링크 생성
- `lib/upload-limits.ts`
  - 15MB 제한
  - MIME 제한
  - 빈 파일/파일 없음

### 3.2 Component

- `components/form/ErrorAlert.tsx`
  - 메시지가 없으면 렌더링하지 않음
  - 메시지가 있으면 `role="alert"`로 노출
- `app/sessions/_components/FilterBar.tsx`
  - 필터 현재값 반영
  - 활성 필터가 없으면 초기화 링크 숨김

### 3.3 E2E smoke

- 비로그인 홈 접근 → `/login`으로 이동
- OAuth 설정 오류 → Auth.js 기본 에러 페이지 대신 로그인 화면에서 안내
- E2E 전용 non-production bypass로 승인된 사용자 흐름 확인
  - 세션 생성
  - 본인 기록 입력
  - 세션 수정
  - 세션 삭제

E2E bypass는 `E2E_TEST_MODE=true`이고 `NODE_ENV !== "production"`일 때만 동작한다. production에서는 환경변수를 실수로 켜도 우회하지 않는다.

## 4. CI에서 도는 명령

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

로컬에서 전체 확인:

```bash
pnpm check
pnpm test:e2e
```

커버리지 확인:

```bash
pnpm test:coverage
```

커버리지는 목표 점수가 아니라 참고 지표다. 특히 뮤런에서는 브랜치/에러 케이스를 빠뜨리지 않았는지를 더 중요하게 본다.

## 5. 테스트하기 쉽게 바꾼 구조

기존에는 Server Action 내부에 검증/변환/DB 호출이 섞여 있었다. Week 3에서 다음 로직을 순수 함수로 분리했다.

- `parseParticipationForm`
- `parseSessionForm`
- `parseSessionArchiveParams`
- `checkUploadFile`

이렇게 분리하니 DB/Auth 없이도 입력 경계 테스트가 가능해졌다.

## 6. 아직 남은 테스트 TODO

- 사진 업로드/교체/삭제까지 포함한 E2E 확장
- `/admin/members` 승인/거절 흐름 E2E
- post-deploy smoke를 `/api/health` 외 주요 페이지까지 점진적으로 확장
- 실제 모바일 브라우저 수동 QA 기록
