// Auth.js v5 server-side 설정. DB (Prisma) 를 건드리는 부분이 여기 들어간다.
// middleware 처럼 Edge runtime 인 쪽은 auth.config.ts 의 Edge-safe 버전을 쓴다.
//
// 흐름:
//   1. /login → Google OAuth
//   2. authorization params 의 hd 로 1차 필터 (사용자가 우회 가능하므로 미신뢰)
//   3. signIn callback 에서 이메일 도메인 재검증 (서버측 진실)
//   4. PrismaAdapter 가 User+Account row 자동 생성 (approved 기본 false)
//   5. jwt callback 에서 매 요청마다 approved/role 을 DB fresh fetch
//      → 관리자가 승인하면 다음 요청부터 즉시 반영 (재로그인 불필요)
//   6. session callback 이 user.id/approved/role 을 Session 객체에 노출

import "server-only";
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { db } from "@/lib/db";
import { authConfig } from "@/auth.config";

const REQUIRED_HD = process.env.AUTH_GOOGLE_HD ?? "snu.ac.kr";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ profile }) {
      const email = (profile as { email?: string } | undefined)?.email ?? "";
      const verified =
        (profile as { email_verified?: boolean } | undefined)?.email_verified ??
        false;
      if (!email.endsWith(`@${REQUIRED_HD}`)) return false;
      if (!verified) return false;
      return true;
    },
    async jwt({ token, user }) {
      const userId = (user as { id?: string } | undefined)?.id ?? token.sub;
      if (!userId) return token;
      token.id = userId;
      const fresh = await db.user.findUnique({
        where: { id: userId },
        select: { approved: true, role: true },
      });
      if (fresh) {
        token.approved = fresh.approved;
        token.role = fresh.role === "ADMIN" ? "ADMIN" : "MEMBER";
      } else {
        token.approved = false;
        token.role = "MEMBER";
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id;
      session.user.approved = token.approved ?? false;
      session.user.role = token.role ?? "MEMBER";
      return session;
    },
  },
});
