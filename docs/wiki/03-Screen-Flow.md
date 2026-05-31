# 03 · 화면 흐름 / 데이터 모델 초안

## 1. 사용자 흐름 (Happy path)

### 1.1 운영진 — 운동 직후 기록 남기기 (가장 핵심)

```
[모바일] /login (매직링크)
        ↓
[모바일] /sessions/new
        ├─ 날짜·장소·시간 입력 (오늘이 default)
        ├─ 단체사진 1장 업로드 (선택)
        ├─ "참여자 추가" → 멤버 검색·체크
        ├─ 멤버별로 [거리, 기록] 입력 (페이스 자동 계산)
        └─ [저장]
        ↓
[모바일] /sessions/[id]  ← 자동 리다이렉트, 카톡 공유용 링크
```

목표 소요: **90초 이내**.

### 1.2 일반 부원 — 내 기록 확인

```
[웹/모바일] /            (최근 활동 카드 3장)
            ↓
[웹/모바일] /me
            ├─ 누적 거리, 참여 횟수, 평균 페이스
            └─ 참여한 세션 리스트
```

### 1.3 신입/예비 부원 — 둘러보기 (공개 범위 정책에 따라)

```
[웹] /sessions  (아카이브 리스트, 사진 카드)
     ↓
[웹] /sessions/[id]  (사진 + 참여자 수 + 코스 메모, 개인 기록은 비공개일 수 있음)
```

## 2. 페이지 목록 (MVP 기준)

| 경로 | 인증 | 설명 |
|------|------|------|
| `/login` | public | 매직링크 입력 |
| `/` | public | 최근 활동 3건 + CTA |
| `/sessions` | public(or 멤버) | 아카이브 리스트, 카드형, 무한스크롤(또는 더보기) |
| `/sessions/new` | 멤버 | 세션 등록 |
| `/sessions/[id]` | public(or 멤버) | 세션 상세 |
| `/sessions/[id]/edit` | 작성자 or 운영진 | 세션 수정 |
| `/runners/[id]` | 멤버 | 멤버 통계 (Week 3) |
| `/me` | 본인 | 내 기록 |

## 3. 화면별 컴포넌트 초안

### `/sessions/[id]` (가장 중요한 페이지)

```
┌─ Header (날짜 · 장소 · 날씨) ──────────────┐
│  2026-05-31 (일) · 서울숲 · ☀️ 22°C       │
├─────────────────────────────────────────┤
│  [단체사진 — full width, aspect 16:9]   │
├─────────────────────────────────────────┤
│  참여자 8명 · 총 거리 42.0 km           │
├─────────────────────────────────────────┤
│  이름      거리   기록    페이스        │
│  김러너    5.0    25:00   5'00"/km     │
│  ...                                    │
├─────────────────────────────────────────┤
│  코스 메모 / 코멘트                      │
└─────────────────────────────────────────┘
```

### `/sessions/new`

- Step UI는 쓰지 않음 (1페이지 폼). 스크롤로 끝까지.
- "참여자 추가" 모달 → 멤버 다중 선택 → 행으로 추가 → 행마다 거리/기록 입력.
- 거리·기록은 모두 optional (DNF 또는 산책 인정).

## 4. 데이터 모델 초안 (Prisma 의사 스키마)

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  nickname     String?
  avatarUrl    String?
  role         Role     @default(MEMBER)   // MEMBER | ADMIN
  joinedAt     DateTime @default(now())

  participations Participation[]
  createdSessions Session[]       @relation("CreatedBy")
}

enum Role {
  MEMBER
  ADMIN
}

model Session {
  id            String   @id @default(cuid())
  date          DateTime              // 활동일 (date only)
  startTime     String?               // "19:30" 같은 표시용
  location      String
  weather       String?               // "맑음/22°C" 같은 자유 문자열 (Week 2엔 단순)
  groupPhotoUrl String?
  notes         String?               // 코스 메모

  createdById   String
  createdBy     User     @relation("CreatedBy", fields: [createdById], references: [id])
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  participations Participation[]

  @@index([date])
}

model Participation {
  id          String   @id @default(cuid())
  sessionId   String
  userId      String

  distanceKm  Float?   // null = 참여만, 미측정
  durationSec Int?     // null = 미측정
  // paceSecPerKm 은 view/계산값으로 들고 다님 (저장 안 함, 일관성 우선)

  note        String?

  session     Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id])

  @@unique([sessionId, userId])      // 동일 세션 중복 참가 방지
  @@index([userId])
}
```

### 모델 결정 메모

- **페이스는 저장하지 않는다.** `distanceKm`과 `durationSec`이 있으면 derived. 데이터 일관성 우선. 통계 쿼리에선 SQL 측 expression 또는 앱에서 계산.
- **`Participation`이 1차 키**가 아니라 `(sessionId, userId)` unique를 둔다. 같은 세션에 두 번 등록 방지.
- 사진은 URL만 들고 있고 실제 파일은 Supabase Storage에 저장 (DB ↔ Storage 분리).
- `weather`는 Week 2엔 자유 문자열, 필요시 Week 3에서 enum화.

## 5. URL/공유

- `/sessions/[id]`는 카톡으로 던질 수 있게 OG 이미지가 단체사진이 되도록 한다 → `app/sessions/[id]/opengraph-image.tsx` (Next.js OG).

## 6. 접근성/모바일

- 입력 폼은 모든 input이 ≥ 44px 터치 타깃.
- 페이스는 색상에만 의존하지 않고 텍스트로 명시.
- 다크모드는 MVP 비목표 (Week 3 stretch).
