import Link from "next/link";

import { requireApproved } from "@/lib/guard";

import { NewSessionForm } from "./_components/NewSessionForm";

export const dynamic = "force-dynamic";

export default async function NewSessionPage() {
  await requireApproved();

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="container mx-auto max-w-md p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">세션 만들기</h1>
        <Link
          href="/"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          취소
        </Link>
      </header>

      <NewSessionForm today={today} />
    </main>
  );
}
