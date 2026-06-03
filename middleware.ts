// Edge runtime 1차 가드. authConfig (Edge-safe) 만 import.
// DB-fresh 검증은 page-level guard (lib/guard.ts) 에서 한다.

import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const approved = req.auth?.user?.approved;

  const path = nextUrl.pathname;

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

  // /admin/* 는 ADMIN 만. 그 외는 404 처럼 처리.
  if (path.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.rewrite(new URL("/404-not-found", nextUrl));
  }

  return;
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico)).*)",
  ],
};
