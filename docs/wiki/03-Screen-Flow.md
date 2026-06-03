# 03 · 화면 흐름 / 데이터 모델 초안

## 1. 사용자 흐름

### 1.1 신규 부원 — 최초 가입

```
[모바일/웹] /login
        └─ "SNU 구글로 계속하기" 클릭
        ↓
[Google] OAuth (hd=snu.ac.kr 강제)
        ↓
[서버] User 레코드 생성 (approved=false)
        ↓
[모바일/웹] /pending
        └─ "관리자 승인 대기 중" 안내
            (단톡방에 운영진에게 알리라는 가이드)
        ↓
[관리자] /admin/members 에서 [승인] 클릭
        ↓
[부원] 다음 진입 시 정상 사용
```

### 1.2 호스트 — 운동 직후 페이지 생성 (가장 핵심)

```
[모바일] /sessions/new
        ├─ 날짜·장소·시작 시간 (오늘 default)
        ├─ 날씨(자유 텍스트)
        ├─ 단체사진 1장 업로드
        ├─ 코스/메모
        └─ [세션 생성]
        ↓
[모바일] /sessions/[id]  ← 자동 리다이렉트
        └─ 단톡방에 이 URL 공유 (카톡 OG 미리보기 = 단체사진)
```

목표 소요: **60~90초**.

### 1.3 참여자 — 본인 기록 입력

```
[모바일] 단톡방 링크 클릭 → /sessions/[id]
        └─ 로그인되어 있다면 페이지 진입
        ↓
[모바일] "내 기록 추가" 버튼
        ├─ 거리(km) — optional
        ├─ 기록(분:초) — optional
        ├─ 노트 — optional
        └─ [저장]
        ↓
[모바일] 본인 행이 참여자 표에 즉시 표시
```

목표 소요: **≤ 30초**.

### 1.4 관리자 — 가입 승인

```
[웹] /admin/members
     └─ 승인 대기 N명 리스트
     └─ 각자 [승인] / [거절]
     └─ 승인 시 approvedBy / approvedAt 기록
```

## 2. 페이지 목록 (MVP 기준)

| 경로 | 인증/권한 | 설명 |
|------|-----------|------|
| `/login` | 비로그인 | Google OAuth 시작 |
| `/pending` | 로그인 + `approved=false` | 승인 대기 안내 |
| `/sessions` | 승인된 멤버 | 아카이브 리스트 (최신순 카드) |
| `/sessions/new` | 승인된 멤버 | 세션 생성 — 누구나 호스트 가능 |
| `/sessions/[id]` | 승인된 멤버 | 세션 상세 + 본인 기록 추가/수정 |
| `/sessions/[id]/edit` | 호스트 본인 또는 ADMIN | 세션 본문 수정 |
| `/sessions/[id]/opengraph-image` | 비로그인 OK (OG 크롤러용) | 단체사진 기반 OG 이미지 |
| `/me` | 본인 | 내 참여 기록 모음, (Week 3) 누적 통계 |
| `/runners/[id]` | 승인된 멤버 | 다른 멤버의 통계 (Week 3) |
| `/admin/members` | ADMIN | 가입 승인 |

## 3. 화면별 컴포넌트 초안

### `/sessions/[id]` (가장 중요한 페이지)

```
┌─ Header (날짜 · 장소 · 날씨 · 호스트) ────────────┐
│  2026-05-31 (일) · 서울숲 · ☀️ 22°C            │
│  호스트: 김러너                                  │
├─────────────────────────────────────────────────┤
│  [단체사진 — full width, aspect 16:9]          │
├─────────────────────────────────────────────────┤
│  참여자 8명 · 총 거리 42.0 km                   │
├─────────────────────────────────────────────────┤
│  이름      거리    기록     페이스   [수정]      │
│  김러너    5.0     25:00    5'00"   ✏️ (본인)    │
│  박러너    7.0     35:00    5'00"               │
│  ...                                            │
│                                                 │
│  [+ 내 기록 추가]   ← 본인 행 없을 때만 표시      │
├─────────────────────────────────────────────────┤
│  코스 메모 (호스트 작성)                         │
└─────────────────────────────────────────────────┘
```

권한 표시:
- 호스트면 헤더에 "수정" 버튼
- 본인 행에만 ✏️ 노출
- 다른 사람 행은 읽기 전용 (ADMIN 제외)

### `/sessions/new` (호스트)

- 1페이지 폼 (스텝 UI 안 씀)
- 사진 업로드는 선택. 없어도 생성 가능
- 저장 후 자동 `/sessions/[id]` 리다이렉트

### `/admin/members` (관리자)

```
┌─ 승인 대기 (3) ─────────────────────────────────┐
│  이현민 (peterabcd@snu.ac.kr) 가입 2026-05-31   │
│   [승인]  [거절]                                 │
│  ...                                            │
├─ 활동 회원 (12) ─────────────────────────────────┤
│  ... (검색 + 권한 변경)                          │
└─────────────────────────────────────────────────┘
```

## 4. 데이터 모델 초안 (Prisma 의사 스키마)

```prisma
generator client { provider = "prisma-client-js" }
datasource db    { provider = "sqlite"; url = env("DATABASE_URL") }

model User {
  id           String   @id @default(cuid())
  googleSub    String   @unique           // Google OAuth subject id
  email        String   @unique           // @snu.ac.kr 강제
  name         String
  avatarUrl    String?

  approved     Boolean  @default(false)
  approvedById String?
  approvedAt   DateTime?
  approvedBy   User?    @relation("Approver", fields: [approvedById], references: [id])
  approves     User[]   @relation("Approver")

  role         Role     @default(MEMBER)
  joinedAt     DateTime @default(now())

  hostedSessions  Session[]       @relation("Host")
  participations  Participation[]
}

enum Role { MEMBER  ADMIN }

model Session {
  id           String   @id @default(cuid())
  date         DateTime              // 활동일 (date only)
  startTime    String?               // "19:30" 표시용
  location     String
  weather      String?               // 자유 텍스트
  groupPhotoPath String?             // 호스트 디스크 상대 경로 (uploads/yyyy/mm/xxx.jpg)
  notes        String?               // 코스 메모

  hostId       String
  host         User     @relation("Host", fields: [hostId], references: [id])

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  participations Participation[]

  @@index([date])
}

model Participation {
  id          String   @id @default(cuid())
  sessionId   String
  userId      String

  distanceKm  Float?   // null = 참여만, 미측정
  durationSec Int?     // null = 미측정
  note        String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  session     Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id])

  @@unique([sessionId, userId])      // 본인은 세션당 1행만
  @@index([userId])
}
```

### 모델 결정 메모

- **`approved=false` 인 User도 레코드는 생성**. OAuth 직후 승인 대기 상태가 명확.
- **`role`은 별도**: ADMIN은 가입 정책과 무관하게 운영 권한. 화이트리스트 승인 ≠ 운영자 승격.
- **`hostId`로 호스트 표현** (role이 아님). 호스트는 "그 세션에 한정된 작성자" 권한이라 User.role과 분리.
- **페이스는 저장 안 함**. `distanceKm + durationSec` 둘 다 있으면 derived. 데이터 일관성 우선.
- **`(sessionId, userId)` unique**. 본인은 같은 세션에 행 1개만.
- **사진은 파일 경로만**. 원본 파일은 호스트 볼륨에 저장. `next/image`가 서빙 시 webp 캐시.

## 5. 권한 매트릭스

| 동작 | 본인 | 호스트 | ADMIN |
|------|------|--------|-------|
| 세션 생성 | ✅ (자동으로 호스트가 됨) | — | ✅ |
| 세션 본문 수정 | ❌ | ✅ | ✅ |
| 세션 삭제 | ❌ | ✅ | ✅ |
| 본인 참여 행 추가/수정/삭제 | ✅ | (본인 행이면) ✅ | ✅ |
| 다른 사람 참여 행 수정 | ❌ | ❌ | ✅ |
| 멤버 승인/거절 | ❌ | ❌ | ✅ |

이 표가 **Server Action 권한 체크의 진실의 원천**. [`SKILL.md`](https://github.com/boostcampwm-snu-2026-1/murun-peterabcd/blob/main/.gjc/skills/murun-feature/SKILL.md)에서 참조.

## 6. URL 공유 / OG

- `/sessions/[id]` 단톡방 공유 → `opengraph-image.tsx`가 단체사진 + 날짜·장소 합성.
- OG 이미지 라우트는 **비로그인 fetch 허용** (크롤러용). 단 이미지에 개인 식별 정보 노출 X (이름 X, 페이스 X).

## 7. 접근성 / 모바일

- 모든 입력 ≥ 44px 터치 타깃
- 페이스는 색상 의존 X, 텍스트 명시
- 다크모드는 Week 3 stretch
- 사진 alt 텍스트: "{date} {location} 단체사진"
