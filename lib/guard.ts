// Server Component / Server Action 의 진입점에서 호출하는 인증·권한 가드.
// 권한 매트릭스는 docs/wiki/03-Screen-Flow.md §5 참조.

import "server-only";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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
    notFound();
  }
  return user;
}

/**
 * 세션의 호스트 본인 또는 ADMIN. 그 외 (다른 승인된 멤버 포함) → notFound().
 * 호스트만 보이는 UI 요소를 다루는 server action 의 첫 줄에서 호출.
 */
export async function requireHostOrAdmin(
  sessionId: number,
): Promise<SessionUser> {
  const user = await requireApproved();
  if (user.role === "ADMIN") return user;
  const session = await db.session.findUnique({
    where: { id: sessionId },
    select: { hostId: true },
  });
  if (!session) notFound();
  if (session.hostId !== user.id) notFound();
  return user;
}
