// Auth.js Session/JWT 의 user 객체에 도메인 필드 (id/approved/role) 를 추가한다.
// callbacks 에서 token/session 에 동일 키로 박는다 — lib/auth.ts 참조.

import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      approved: boolean;
      role: "MEMBER" | "ADMIN";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    approved?: boolean;
    role?: "MEMBER" | "ADMIN";
  }
}
