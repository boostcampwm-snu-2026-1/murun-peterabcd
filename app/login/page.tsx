import { redirect } from "next/navigation";

import { auth, signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

function getAuthErrorMessage(error?: string) {
  switch (error) {
    case "AccessDenied":
      return "SNU 구글 계정이 아니거나 이메일 인증이 완료되지 않아 로그인할 수 없습니다.";
    case "Configuration":
      return "서버의 Google 로그인 설정 또는 외부 연결 상태를 확인해야 합니다.";
    case "OAuthCallback":
    case "OAuthSignin":
      return "Google 로그인 처리 중 문제가 발생했습니다. 잠시 후 다시 시도하세요.";
    case undefined:
      return null;
    default:
      return "로그인에 실패했습니다. 다시 시도해도 반복되면 서버 로그를 확인하세요.";
  }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.approved ? "/" : "/pending");
  }

  const { callbackUrl, error } = await searchParams;
  const callback = callbackUrl ?? "/";
  const errorMessage = getAuthErrorMessage(error);

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

      {errorMessage ? (
        <div
          role="alert"
          className="w-full rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      ) : null}

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
