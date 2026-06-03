import { redirect } from "next/navigation";

import { requireUser } from "@/lib/guard";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function PendingPage() {
  const user = await requireUser();
  if (user.approved) redirect("/");

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <main className="container mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-2xl font-bold tracking-tight">승인 대기 중</h1>
        <p className="text-sm text-muted-foreground">
          <span className="font-mono">{user.email}</span> 으로 가입 요청을 보냈습니다.
          <br />
          애니뮤 운영진의 승인 후 이용할 수 있어요.
        </p>
        <p className="text-xs text-muted-foreground">
          단톡방에 운영진에게 가입 요청을 보냈다고 알려주세요.
        </p>
      </div>

      <form action={logout} className="w-full">
        <Button type="submit" variant="outline" className="w-full">
          로그아웃
        </Button>
      </form>
    </main>
  );
}
