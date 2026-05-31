## Summary

Closes #

<!-- 변경 요약 5줄 이내 -->
-

## Screenshots

| Mobile (375px) | Desktop |
|---|---|
|  |  |

## Checklist (사람이 직접 본다 — `docs/wiki/06-Checkpoints.md`)

### 공통
- [ ] diff 처음부터 끝까지 읽음
- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm build` 통과
- [ ] preview deploy URL에서 시나리오 1회 실행
- [ ] 새 env / dep 있다면 `.env.example`·README 업데이트

### UI 변경 시
- [ ] 모바일 375px 가로 스크롤 없음
- [ ] 빈/로딩/에러 상태 처리
- [ ] 콘솔 error/warning 0

### 데이터 쓰기 시
- [ ] Server Action 첫 줄에 인증·권한 체크
- [ ] zod 스키마 통과
- [ ] 중복 생성 차단 (DB unique 또는 트랜잭션)

### Schema/Migration 시
- [ ] migration 이름 의미 있음
- [ ] 데이터 손실 변경이면 PR 본문에 명시

## Notes

(있다면)
