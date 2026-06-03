import { redirect } from "next/navigation";

import { auth, signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.approved ? "/" : "/pending");
  }

  const { callbackUrl } = await searchParams;
  const callback = callbackUrl ?? "/";

  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: callback });
  }

  return (
    <main className="container mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight">뮤런</h1>
        <p className="text-sm text-muted-foreground">
          애니뮤 러닝 소모임 내부 아카이브.
          <br />
          SNU 구글 계정(<span className="font-mono">@snu.ac.kr</span>)으로 로그인하세요.
        </p>
      </div>

      <form action={signInWithGoogle} className="w-full">
        <Button type="submit" className="w-full" size="lg">
          SNU 구글로 계속하기
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        첫 로그인 후 관리자 승인이 필요합니다.
      </p>
    </main>
  );
}
