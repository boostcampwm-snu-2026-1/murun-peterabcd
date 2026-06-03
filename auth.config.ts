// Edge-safe Auth.js 설정.
// middleware 는 Edge runtime 이라 Prisma (Node API 의존) 를 import 하면 안 된다.
// 이 파일은 provider 목록 + JWT 토큰 검증에만 필요한 callbacks 만 두고,
// DB 접근이 들어가는 callbacks 는 lib/auth.ts 에서 합친다.
//
// 참고: https://authjs.dev/getting-started/installation?framework=Next.js#edge-compatibility

import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

const REQUIRED_HD = process.env.AUTH_GOOGLE_HD ?? "snu.ac.kr";

export const authConfig = {
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          hd: REQUIRED_HD,
          prompt: "select_account",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // signIn callback 의 도메인 검증은 server-only (DB 안 건드리지만 안전하게 lib/auth 에 둔다).
    // jwt/session 의 fresh fetch 도 server-only. 여기는 placeholder.
  },
} satisfies NextAuthConfig;
