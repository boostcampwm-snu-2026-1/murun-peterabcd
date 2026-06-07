// Edge runtime 1차 가드. authConfig (Edge-safe) 만 import.
// DB-fresh 검증은 page-level guard (lib/guard.ts) 에서 한다.

import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const approved = req.auth?.user?.approved;

  const path = nextUrl.pathname;

  // 카톡/슬랙 등 외부 미리보기 크롤러용 OG/twitter 이미지 — 의도적으로 public.
  // 메타데이터(날짜/장소/사진) 노출은 동아리 내부 서비스 + URL 추측이 아주 어렵지 않은
  // 점을 알면서도, 카톡 공유 UX 가치를 더 크게 봐서 수용.
  if (path.endsWith("/opengraph-image") || path.endsWith("/twitter-image")) {
    return;
  }

  // /login 은 비로그인만. 로그인된 사용자는 상태에 맞춰 보냄.
  if (path === "/login") {
    if (isLoggedIn) {
      const target = approved ? "/" : "/pending";
      return NextResponse.redirect(new URL(target, nextUrl));
    }
    return;
  }

  // 비로그인이 보호 영역 진입 시도 → /login
  if (!isLoggedIn) {
    const url = new URL("/login", nextUrl);
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }

  // 주의:
  //   /admin/* 의 권한 판정은 middleware 에서 하지 않는다.
  //   Edge-safe authConfig 는 DB fresh fetch 를 못 해서 role/approved 가 stale 하거나
  //   아예 없는 상태가 될 수 있다. 실제 권한은 page/action 진입점의 requireAdmin()
  //   이 DB 기준으로 최종 판정한다.

  return;
});

export const config = {
  matcher: [
    // exclude: api/auth, api/health, PWA manifest, Next icons, our /icons/[size],
    // static assets, common image extensions.
    "/((?!api/auth|api/health|manifest\\.webmanifest|icon|apple-icon|icons/|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico)).*)",
  ],
};
