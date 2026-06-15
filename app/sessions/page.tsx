import Link from "next/link";

import { Button } from "@/components/ui/button";
import { requireApproved } from "@/lib/guard";
import { listApprovedMembers, listSessions } from "@/lib/sessions";
import {
  buildSessionArchiveHref,
  parseSessionArchiveParams,
  type SessionArchiveSearchParams,
} from "@/lib/session-filters";

import { EmptyState } from "./_components/EmptyState";
import { FilterBar } from "./_components/FilterBar";
import { SessionCard } from "./_components/SessionCard";

export const dynamic = "force-dynamic";

type SearchParams = SessionArchiveSearchParams;

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function SessionsArchivePage({ searchParams }: PageProps) {
  await requireApproved();

  const sp = await searchParams;
  const { cursorId, filters, hasActiveFilters } = parseSessionArchiveParams(sp);

  const [page, members] = await Promise.all([
    listSessions({ cursorId, filters }),
    listApprovedMembers(),
  ]);

  const nextHref =
    page.nextCursorId != null
      ? buildSessionArchiveHref({ ...sp, cursor: String(page.nextCursorId) })
      : null;

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

      <FilterBar
        q={sp.q ?? ""}
        memberId={sp.member ?? ""}
        month={sp.month ?? ""}
        pmin={sp.pmin ?? ""}
        pmax={sp.pmax ?? ""}
        members={members}
        hasActiveFilters={hasActiveFilters}
      />

      {page.items.length === 0 ? (
        hasActiveFilters ? (
          <EmptyFilterResult />
        ) : (
          <EmptyState />
        )
      ) : (
        <>
          <ul className="flex flex-col gap-4">
            {page.items.map((s) => (
              <li key={s.id}>
                <SessionCard {...s} />
              </li>
            ))}
          </ul>

          {nextHref && (
            <div className="mt-6 flex justify-center">
              <Link href={nextHref}>
                <Button variant="outline">더 보기</Button>
              </Link>
            </div>
          )}
        </>
      )}
    </main>
  );
}

function EmptyFilterResult() {
  return (
    <section className="flex flex-col items-center gap-3 rounded-md border border-dashed p-10 text-center">
      <p className="text-sm text-muted-foreground">
        조건에 맞는 세션이 없어요.
      </p>
      <Link
        href="/sessions"
        className="text-xs underline underline-offset-4"
      >
        필터 초기화
      </Link>
    </section>
  );
}

