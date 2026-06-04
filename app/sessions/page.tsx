import Link from "next/link";

import { requireApproved } from "@/lib/guard";
import { listSessions } from "@/lib/sessions";
import { Button } from "@/components/ui/button";

import { EmptyState } from "./_components/EmptyState";
import { SessionCard } from "./_components/SessionCard";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ cursor?: string }>;
};

export default async function SessionsArchivePage({ searchParams }: PageProps) {
  await requireApproved();

  const { cursor } = await searchParams;
  const cursorId = parseCursor(cursor);

  const page = await listSessions({ cursorId });

  return (
    <main className="container mx-auto max-w-2xl p-6">
      <nav className="mb-4 text-xs text-muted-foreground">
        <Link href="/" className="underline-offset-4 hover:underline">
          ← 홈
        </Link>
      </nav>

      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">아카이브</h1>
        <Link href="/sessions/new">
          <Button size="sm">새 세션</Button>
        </Link>
      </header>

      {page.items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <ul className="flex flex-col gap-4">
            {page.items.map((s) => (
              <li key={s.id}>
                <SessionCard {...s} />
              </li>
            ))}
          </ul>

          {page.nextCursorId != null && (
            <div className="mt-6 flex justify-center">
              <Link href={`/sessions?cursor=${page.nextCursorId}`}>
                <Button variant="outline">더 보기</Button>
              </Link>
            </div>
          )}
        </>
      )}
    </main>
  );
}

function parseCursor(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
