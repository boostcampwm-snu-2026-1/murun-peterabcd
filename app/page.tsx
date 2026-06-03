import { redirect } from "next/navigation";

import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.approved) redirect("/pending");

  // 다음 PR (#9) 에서 이 페이지는 /sessions 로 리다이렉트되거나
  // "최근 활동" 카드를 보여주게 된다. 지금은 placeholder.
  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <main className="container mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">뮤런</h1>
      <p className="text-center text-sm text-muted-foreground">
        안녕하세요, {session.user.name}.
        <br />
        다음 PR에서 활동 기록 기능이 들어옵니다.
      </p>
      {session.user.role === "ADMIN" && (
        <a
          href="/admin/members"
          className="text-sm font-medium underline underline-offset-4"
        >
          → 회원 관리
        </a>
      )}
      <form action={logout}>
        <Button type="submit" variant="outline" size="sm">
          로그아웃
        </Button>
      </form>
    </main>
  );
}
