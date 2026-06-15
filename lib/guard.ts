// Server Component / Server Action 의 진입점에서 호출하는 인증·권한 가드.
// 권한 매트릭스는 docs/wiki/03-Screen-Flow.md §5 참조.

import "server-only";
import { notFound, redirect } from "next/navigation";
import { cookies, headers } from "next/headers";

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

async function requireE2eUser(): Promise<SessionUser | null> {
  // Playwright 전용 우회. production 에서는 env 가 켜져도 동작하지 않는다.
  if (
    process.env.E2E_TEST_MODE !== "true" ||
    process.env.NODE_ENV === "production"
  ) {
    return null;
  }

  const h = await headers();
  const c = await cookies();
  const email =
    h.get("x-murun-e2e-email")?.trim() ||
    c.get("murun-e2e-email")?.value.trim();
  if (!email) return null;

  const name =
    h.get("x-murun-e2e-name")?.trim() ||
    c.get("murun-e2e-name")?.value.trim() ||
    "E2E Runner";
  const roleHeader =
    h.get("x-murun-e2e-role")?.trim().toUpperCase() ||
    c.get("murun-e2e-role")?.value.trim().toUpperCase();
  const role = roleHeader === "ADMIN" ? "ADMIN" : "MEMBER";
  const now = new Date();

  const user = await db.user.upsert({
    where: { email },
    create: {
      email,
      name,
      emailVerified: now,
      approved: true,
      approvedAt: now,
      role,
    },
    update: {
      name,
      approved: true,
      approvedAt: now,
      role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      approved: true,
      role: true,
    },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    approved: user.approved,
    role: user.role === "ADMIN" ? "ADMIN" : "MEMBER",
  };
}

/**
 * 로그인 안 되어 있으면 /login 으로. 그 외엔 SessionUser 반환.
 * 승인 여부는 검사하지 않는다 — /pending 같은 페이지에서 쓴다.
 */
export async function requireUser(): Promise<SessionUser> {
  const e2eUser = await requireE2eUser();
  if (e2eUser) return e2eUser;

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
