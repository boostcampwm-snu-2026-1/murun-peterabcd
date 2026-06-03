# GitHub Issues 갱신 (Week 1 말 — 스택/모델 변경 반영)

> 1주차 처음에 만든 15개 이슈를 새 결정 사항에 맞춰 정리한다.
>
> - 자체 N100 서버 + Docker + Caddy + SQLite + Auth.js Google OAuth + 화이트리스트
> - 권한 모델: 호스트가 세션 생성, 참여자 본인이 자기 행 입력
> - 단체사진 원본 보존 (`next/image`로 서빙 시 캐시)
>
> 자동 적용: [`scripts/update-issues.sh`](../scripts/update-issues.sh) — `gh auth login` 후 실행.

## 액션 표

| 액션 | #  | 제목 | 사유 |
|------|----|------|------|
| keep | 1  | 저장소 초기 설정 & wiki 작성 | 이미 진행 중, 본문만 가볍게 정리 |
| keep | 2  | GitHub Wiki 초기화 & docs/wiki 복사 | 그대로 |
| **CLOSE** | 3 | Vercel 프로젝트 연결 + preview deploy | 자체 서버로 변경 → 신규 이슈 N-1 |
| **CLOSE** | 4 | Supabase 프로젝트 생성 + .env.example | Supabase 미사용 → 신규 이슈 N-2 |
| keep | 5  | CI: lint + typecheck + build on PR | 그대로 |
| keep | 6  | Next.js 15 + Tailwind + shadcn 스캐폴드 | 그대로 |
| **EDIT** | 7  | Prisma 초기 schema + 1차 migration | 모델 변경: User.approved/role, Session.hostId, Participation. SQLite provider 명시. |
| **CLOSE** | 8 | Supabase 매직링크 로그인 | Auth.js Google OAuth로 교체 → 신규 이슈 N-3 |
| **EDIT** | 9  | 세션 등록 페이지 (/sessions/new) | "호스트가 세션 생성"으로 의미 변경. 참여자 일괄 입력 제거 (별도 N-5로 분리). |
| **EDIT** | 10 | 세션 상세 페이지 (/sessions/[id]) | "본인 행 추가/수정" 흐름 명시. |
| keep | 11 | 세션 아카이브 리스트 (/sessions) | 그대로 |
| **CLOSE** | 12 | 단체사진 업로드 파이프라인 | Supabase Storage 가정 → 로컬 디스크로 재정의 → 신규 이슈 N-6 |
| keep | 13 | 멤버 페이지 + 누적/추이 | 그대로 |
| **EDIT** | 14 | 검색/필터 | **참여 인원 수** 필터 추가 |
| keep | 15 | OG 이미지 + PWA 매니페스트 | 그대로 |
| **NEW N-1** | — | [chore] N100 서버 부트스트랩 + Docker + Caddy | 자체 호스팅 인프라 |
| **NEW N-2** | — | [chore] `.env.example` + Auth.js secret 생성 | SQLite path / Google OAuth / NEXTAUTH_* |
| **NEW N-3** | — | [feat] Auth.js v5 Google OAuth + @snu.ac.kr 도메인 강제 | hd 파라미터 검증 |
| **NEW N-4** | — | [feat] 가입 화이트리스트 + /admin/members 승인 페이지 | User.approved + 관리자 승인 흐름 |
| **NEW N-5** | — | [feat] 참여 기록 입력 (본인 행 추가/수정) | 세션 상세에서 본인 행 CRUD |
| **NEW N-6** | — | [feat] 단체사진 업로드 (로컬 볼륨, 원본 보존) | 15MB 상한 + `next/image` 캐시 |
| **NEW N-7** | — | [chore] GH Actions SSH deploy 파이프라인 (dev→staging, main→prod) | staging은 자동, prod는 수동 승인 |

## 라벨 추가

| 라벨 | 색 | 의미 |
|------|------|------|
| `area:deploy` | `5319e7` | Docker/Caddy/SSH/GH Actions |
| `area:host` | `1d76db` | N100 운영 (백업·인증서·도메인) |

## Week별 우선순위

- **Week 2 P1**: #5, #6, #7(edit), #9(edit), #10(edit), #11, N-1, N-2, N-3, N-4, N-5, N-6
- **Week 2 P2**: N-7
- **Week 3 P2**: #13, #14(edit), #15
