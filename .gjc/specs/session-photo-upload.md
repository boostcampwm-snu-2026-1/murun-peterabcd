# Spec · session-photo-upload

> #21. 호스트가 세션 상세에서 단체사진 1장을 업로드. 로컬 볼륨 저장 + 원본 보존 + `next/image` 서빙. 클라이언트 리사이즈 X.

## Story

1. 호스트(또는 ADMIN)가 `/sessions/[id]` 진입 → 사진이 없는 자리에 "사진 올리기" 폼이 보임.
2. 모바일/데스크탑에서 파일 선택 → 자동 제출 → 디스크에 저장 + DB의 `Session.groupPhotoPath` 갱신.
3. 사진이 있는 상태에선 `next/image` 로 16:9 영역에 표시. 호스트는 "사진 교체"/"사진 삭제" 가능.
4. 비호스트(승인된 일반 멤버)는 사진을 볼 수만 있음, 업로드/삭제 UI 안 보임.

## Closes

- #21 단체사진 업로드 (로컬 볼륨, 원본 보존)

## Acceptance

### 저장 흐름
- [ ] 업로드 파일 상한 **15MB** (서버측 검증; 클라이언트 input `accept="image/*"` + size 표시는 부수적)
- [ ] 허용 MIME: `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif` (HEIC는 iOS 기본)
- [ ] **클라이언트 리사이즈/변환 X** — 원본 그대로 디스크에
- [ ] 저장 경로 (컨테이너 안): `${UPLOADS_DIR}/sessions/yyyy/mm/<cuid>.<ext>`
- [ ] DB에는 `Session.groupPhotoPath = "sessions/yyyy/mm/<cuid>.<ext>"` (UPLOADS_DIR 제외한 상대 경로) 저장
- [ ] 업로드 실패 시 DB 변경 X — 디스크 쓰기 성공 후 DB update 순서. 트랜잭션은 단일 row 이라 별도 처리 X.
- [ ] 기존 사진이 있으면 새 업로드 성공 후 기존 파일 삭제 (best-effort, 실패해도 DB는 일관)

### 서빙 흐름
- [ ] `app/uploads/[...path]/route.ts` 같은 file streaming endpoint 만들지 않음. 대신 **`next/image` + custom loader** 또는 **`/api/uploads/[...path]` 라우트** 둘 중 선택. → **`/api/uploads/[...path]/route.ts` 라우트**로 결정 (next.config의 `images.remotePatterns` 불필요, path 검증 직접)
- [ ] 라우트는 `UPLOADS_DIR` 밖 경로(`../` 등) 절대 금지 — `path.resolve()` 후 prefix 검증
- [ ] `Cache-Control: public, max-age=31536000, immutable` (사진 path 가 cuid 포함 → 같은 path 면 같은 파일)
- [ ] `next/image` 가 자동 webp 변환 + srcset 생성

### 권한
- [ ] **업로드/교체/삭제**: 호스트 또는 ADMIN. `requireHostOrAdmin(sessionId)` 가드 신설
- [ ] **조회**: `/api/uploads/...` 는 `requireApproved()` (사진도 인증 필요. OG 이미지는 다음 PR에서 별도 라우트로 비로그인 허용 처리)

### UI
- [ ] `/sessions/[id]` 의 사진 영역:
  - 사진 없음 + 호스트/ADMIN → 파일 input + [올리기] 버튼 (form)
  - 사진 없음 + 일반 멤버 → "사진 없음" placeholder 유지
  - 사진 있음 + 누구나 → `next/image` 표시
  - 사진 있음 + 호스트/ADMIN → 우측 상단에 [교체] / [삭제] 버튼
- [ ] 파일 선택 시 즉시 제출 (`onChange` server action submit) 또는 명시적 [올리기] 버튼 — **명시적 버튼** 선택 (잘못 선택 시 취소 가능)

### Server actions (`app/sessions/[id]/photo-actions.ts`)
- [ ] `uploadSessionPhoto(formData)`: 호스트/ADMIN 가드 → 파일 검증 → 저장 → DB update → revalidate
- [ ] `removeSessionPhoto(formData)`: 호스트/ADMIN 가드 → DB clear → best-effort 파일 삭제 → revalidate

### lib helpers
- [ ] `lib/uploads.ts`:
  - `getUploadsDir()` — env 또는 default `./uploads`
  - `resolveUploadPath(rel: string): string | null` — UPLOADS_DIR 안인지 검증, escape 시도 차단
  - `saveUploadedFile(file: File, subDir: string): Promise<{ path: string }>` — `crypto.randomUUID()` 가 아닌 **cuid2 or crypto** 기반 짧은 id + ext (MIME 기반 결정)
- [ ] `lib/guard.ts`:
  - `requireHostOrAdmin(sessionId)` 추가 — host or ADMIN, 아니면 `notFound()` (호스트만 보는 동작이라 다른 사용자에겐 페이지 차이 노출 X)

### 환경 변수
- [ ] `.env.example` + `deploy/.env.example` 의 `UPLOADS_DIR` uncomment. 로컬은 `./uploads`, docker는 `/app/uploads`.
- [ ] `.gitignore` 에 `uploads/` 이미 있음

### Docker
- [ ] `deploy/docker-compose.yml` 의 `volumes: - uploads:/app/uploads` 이미 있음 — 변경 없음
- [ ] `deploy/Dockerfile` 의 mkdir uploads + chown 이미 있음 — 변경 없음

### 검증
- [ ] `pnpm check` 통과
- [ ] dev 서버: 작은 jpg (몇 KB) 업로드 → `./uploads/sessions/yyyy/mm/<id>.jpg` 생성 + DB `groupPhotoPath` 갱신 + 페이지 reload 시 사진 표시
- [ ] 15MB 초과 파일 업로드 → server action에서 명시적 에러
- [ ] `../`/`..\\` path traversal 시도 → 차단 (코드 검증)
- [ ] 비호스트 계정으로 `/api/uploads/sessions/...` 직접 접근 → 401/403 (또는 redirect)

## Out of scope (이번 PR에서 안 함)

- 이미지 갤러리 / 여러 장 — `groupPhotoPath` 단일 필드
- OG 이미지 — Week 3 stretch (#15)
- 이미지 crop / 회전 — 원본 보존 정책
- WebP/AVIF 클라이언트 강제 변환 — `next/image` 가 알아서
- CDN
- 백업 스크립트 (#22 또는 별도)

## Touched files (예상)

| 파일 | new/edit | 요지 |
|------|----------|------|
| `lib/uploads.ts` | new | dir resolve + 파일 저장 helper |
| `lib/guard.ts` | edit | `requireHostOrAdmin(sessionId)` 추가 |
| `app/sessions/[id]/photo-actions.ts` | new | upload/remove server actions |
| `app/sessions/[id]/_components/PhotoSection.tsx` | new | 사진 영역 + 호스트 폼 |
| `app/sessions/[id]/page.tsx` | edit | placeholder → PhotoSection 사용 |
| `app/api/uploads/[...path]/route.ts` | new | 파일 스트리밍 + 인증 |
| `.env.example` | edit | UPLOADS_DIR uncomment |
| `deploy/.env.example` | edit | (이미 있음) — 검토만 |

## Open questions

- `next/image` 의 remote URL 처리: `/api/uploads/...` 는 same-origin 이므로 `images.remotePatterns` 불필요. `<Image>` 컴포넌트가 path 받으면 그대로 동작.
- HEIC 처리: Safari 모바일은 기본 HEIC. 그대로 저장하면 브라우저가 못 보여줌 (Safari는 OK, 다른 브라우저는 깨짐). → **이번 PR**: HEIC도 받아서 저장하되, Safari 외 사용자에겐 깨질 수 있음을 README 메모. 실제 변환은 Week 3 stretch (sharp 로 1회 jpg 변환).

## Verification (사용자가 직접 — Fidelity)

코드 측:
1. `pnpm check` 통과
2. dev 서버: 호스트로 로그인 → 세션 상세 → 작은 jpg 업로드 → 페이지 새로고침 시 사진 표시
3. 같은 세션에서 [교체] → 다른 사진 → 갱신
4. [삭제] → 사진 placeholder 복귀, `./uploads/sessions/.../<id>.jpg` 도 제거됨
5. 비호스트 계정으로 같은 세션 → 사진은 보임, 폼/버튼 안 보임
