import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

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
    <main className="container mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 p-6">
      <header className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">뮤런</h1>
        <p className="text-sm text-muted-foreground">
          안녕하세요, {session.user.name}.
        </p>
      </header>

      <div className="flex w-full flex-col gap-3">
        <Link href="/sessions/new" className="w-full">
          <Button className="w-full" size="lg">
            새 세션 만들기
          </Button>
        </Link>
        <Link href="/sessions" className="w-full">
          <Button className="w-full" variant="outline" size="lg">
            전체 아카이브
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {session.user.role === "ADMIN" && (
          <Link
            href="/admin/members"
            className="text-sm font-medium underline underline-offset-4"
          >
            회원 관리
          </Link>
        )}
        <form action={logout}>
          <Button type="submit" variant="ghost" size="sm">
            로그아웃
          </Button>
        </form>
      </div>
    </main>
  );
}
