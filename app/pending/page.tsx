import { redirect } from "next/navigation";

import { requireUser } from "@/lib/guard";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  PageShell,
  UtilityCard,
} from "@/components/layout/AppChrome";

export default async function PendingPage() {
  const user = await requireUser();
  if (user.approved) redirect("/");

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <PageShell width="narrow" surface="parchment">
      <PageHeader
        align="center"
        eyebrow="Approval required"
        title="승인 대기 중"
        description={
          <>
            <span className="font-mono text-[0.9em]">{user.email}</span> 으로 가입 요청을 보냈습니다.
            <br />운영진 승인 후 이용할 수 있어요.
          </>
        }
      />

      <UtilityCard className="flex flex-col gap-5 text-center">
        <p className="font-text text-sm leading-[1.43] tracking-[-0.224px] text-apple-muted-48">
          단톡방에 운영진에게 가입 요청을 보냈다고 알려주세요.
        </p>
        <form action={logout}>
          <Button type="submit" variant="outline" className="w-full">
            로그아웃
          </Button>
        </form>
      </UtilityCard>
    </PageShell>
  );
}
