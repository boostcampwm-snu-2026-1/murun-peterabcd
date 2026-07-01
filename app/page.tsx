import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  PageShell,
  UtilityCard,
} from "@/components/layout/AppChrome";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.approved) redirect("/pending");

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <PageShell width="narrow" surface="parchment">
      <PageHeader
        align="center"
        eyebrow="Animu Running Archive"
        title="뮤런"
        description={<>안녕하세요, {session.user.name}. 오늘의 러닝 기록을 남겨요.</>}
      />

      <UtilityCard className="flex flex-col gap-3">
        <Button asChild size="lg" className="w-full">
          <Link href="/sessions/new">새 세션 만들기</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link href="/sessions">전체 아카이브</Link>
        </Button>
        <Button asChild variant="secondary" size="lg" className="w-full">
          <Link href="/me">내 기록</Link>
        </Button>
      </UtilityCard>

      <div className="mt-8 flex items-center justify-center gap-5 font-text text-sm leading-[1.29] tracking-[-0.224px]">
        {session.user.role === "ADMIN" && (
          <Link href="/admin/members" className="text-apple-primary underline-offset-4 hover:underline">
            회원 관리
          </Link>
        )}
        <form action={logout}>
          <Button type="submit" variant="ghost" size="sm">
            로그아웃
          </Button>
        </form>
      </div>
    </PageShell>
  );
}
