# 02 · 기술 스택 선택과 이유

## 1. 결정 요약

| 영역 | 선택 | 한 줄 이유 |
|------|------|------------|
| 언어 | TypeScript | 풀스택 단일 언어. 타입으로 Agent 실수를 잡는다. |
| 프레임워크 | **Next.js 15 (App Router)** | 풀스택 단일 배포물, Server Action으로 API 보일러플레이트 제거. |
| 스타일 | **Tailwind CSS + shadcn/ui** | 디자인 결정 비용 최소화. 컴포넌트 코드를 직접 갖고 있어 Agent가 수정 가능. |
| 폼/검증 | **react-hook-form + zod** | 클라이언트/서버 동일 스키마. |
| DB | **PostgreSQL (Supabase)** | 무료 티어, 백업, SQL 표준. |
| ORM | **Prisma** | 타입 안전, migration이 Agent에게도 명확. |
| 인증 | **Supabase Auth** (매직링크 우선, Discord OAuth 후순위) | 비밀번호 관리 위험 제거. 동아리 인증 흐름과 맞음. |
| 스토리지 (사진) | **Supabase Storage** | DB와 같은 콘솔에서 권한 정책 관리. |
| 차트 | **Recharts** | 가벼움, Week 3 stretch용. |
| 배포 | **Vercel** | GitHub push → 자동 배포. 무료. |
| 패키지 매니저 | **pnpm** | 빠르고 디스크 효율 + Next 공식 친화. |
| 테스트 | **Vitest + Playwright(스모크 1~2개만)** | unit은 Vitest, 핵심 시나리오만 e2e. |
| 코드 품질 | **ESLint (next/core-web-vitals) + Prettier** | 기본값 그대로. |
| CI | **GitHub Actions** (lint + typecheck + build) | PR → dev 머지 전 통과 필수. |

## 2. 왜 이 조합인가 (긴 버전)

### 2.1 단일 언어/단일 런타임 원칙

3주 + 솔로 + Agent 협업 환경에서 **언어가 둘 이상이면 컨텍스트 비용이 폭발**한다. TypeScript로 풀스택을 통일하고, Server Action으로 별도 백엔드 서비스를 두지 않는다. Agent에게 "타입이 깨졌어"라고만 말해도 문제 지점이 좁혀진다.

### 2.2 Next.js를 고른 이유 (vs Vite + Hono / SvelteKit / Remix)

- **App Router + Server Action**: 인증된 form submit → DB 저장이 API route 없이 단일 함수로 끝난다. 세션 등록처럼 단발성 mutation이 많은 이번 도메인과 잘 맞는다.
- **Vercel 배포 비용 0**, preview deploy가 PR마다 붙는다. → 사람 리뷰 + Agent QA에 직접 활용.
- **이미지 컴포넌트 (`next/image`)**: 단체사진 썸네일을 자동 최적화. Lighthouse 점수 확보에 유리.

### 2.3 Supabase를 고른 이유 (vs PlanetScale + Auth.js, Firebase)

- DB·Auth·Storage가 한 콘솔에 있다 → 운영 시 디버깅 동선이 짧다.
- Postgres이므로 추후 self-host로 이전 가능 (lock-in 낮음).
- RLS(Row Level Security)로 "본인 세션만 수정" 같은 권한을 DB 수준에서 강제 → Agent가 비즈니스 로직에서 빠뜨려도 1차 안전망.

### 2.4 Prisma vs Drizzle

- **Prisma 선택.** schema.prisma 한 파일이 데이터 모델의 **단일 진실의 원천**이 되며, Agent가 보고 작업하기에 가장 명확.
- 단점(쿼리 빌더 한계)은 이 규모에선 문제 없음.

### 2.5 shadcn/ui를 고른 이유

- "디자인 결정을 미루기 위한 라이브러리"가 아니라, **컴포넌트 코드를 내 repo에 복사**해서 갖는 구조.
- → Agent가 그 컴포넌트 자체를 수정/확장할 수 있다. (블랙박스 의존성 제거)
- 디자인 시스템을 직접 만들 시간/이유가 없음.

## 3. 채택하지 않은 것

| 후보 | 채택 안 한 이유 |
|------|----------------|
| Native 모바일 앱 (RN/Expo) | 3주 + 솔로 + 동아리 내부용. PWA로 충분. |
| 마이크로서비스 / 별도 API 서버 | 운영 비용 ↑, 가치 ↓. |
| 자체 인증 (이메일 + 비밀번호) | 비밀번호 관리/리셋 메일 인프라 부담. |
| GraphQL | 클라이언트 한 종류, 화면 수 적음. tRPC도 Server Action 있으면 굳이 불필요. |
| Tanstack Query | App Router에서는 서버 컴포넌트 + Server Action으로 대부분 해결. 필요시 일부 페이지에만 도입. |

## 4. 환경 변수 초안

```dotenv
# .env.example
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # 서버 전용
DATABASE_URL=                  # Prisma용 (pooled)
DIRECT_URL=                    # Prisma migration용
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 5. 폴더 구조 초안 (Week 2 진입 시점)

```
murun-peterabcd/
├─ app/
│  ├─ (public)/           # 비로그인 접근 가능
│  ├─ (app)/              # 로그인 필요
│  │  ├─ sessions/
│  │  │  ├─ page.tsx                # 아카이브 리스트
│  │  │  ├─ new/page.tsx            # 세션 등록
│  │  │  └─ [id]/page.tsx           # 세션 상세
│  │  ├─ runners/[id]/page.tsx
│  │  └─ me/page.tsx
│  ├─ login/page.tsx
│  ├─ layout.tsx
│  └─ globals.css
├─ components/
│  ├─ ui/                 # shadcn 복사본
│  └─ session/            # 도메인 컴포넌트
├─ lib/
│  ├─ db.ts               # Prisma client
│  ├─ supabase/           # client/server helpers
│  ├─ auth.ts
│  └─ pace.ts             # 페이스 계산 등 순수 함수
├─ prisma/
│  └─ schema.prisma
├─ docs/wiki/
├─ .gjc/
└─ tests/
```
