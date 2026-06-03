// Server Component / Server Action 의 진입점에서 호출하는 인증·권한 가드.
// 권한 매트릭스는 docs/wiki/03-Screen-Flow.md §5 참조.

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  approved: boolean;
  role: "MEMBER" | "ADMIN";
};

/**
 * 로그인 안 되어 있으면 /login 으로. 그 외엔 SessionUser 반환.
 * 승인 여부는 검사하지 않는다 — /pending 같은 페이지에서 쓴다.
 */
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user as SessionUser;
}

/**
 * 로그인 + approved=true 둘 다 필요. 보호된 도메인 페이지/액션에서 쓴다.
 *   - 로그인 X → /login
 *   - approved=false → /pending
 */
export async function requireApproved(): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.approved) redirect("/pending");
  return user;
}

/**
 * 로그인 + approved + role=ADMIN. /admin/* 와 운영자 액션에서 쓴다.
 *   - 비ADMIN → 404 (페이지 자체를 숨김)
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireApproved();
  if (user.role !== "ADMIN") {
    // notFound 대신 403 redirect 도 가능하지만, 운영자 페이지의 존재를
    // 일반 멤버에게 노출하지 않도록 404 처리.
    const { notFound } = await import("next/navigation");
    notFound();
  }
  return user;
}
