import Link from "next/link";

import { Button } from "@/components/ui/button";
import { requireApproved } from "@/lib/guard";
import {
  listApprovedMembers,
  listSessions,
  type SessionFilters,
} from "@/lib/sessions";

import { EmptyState } from "./_components/EmptyState";
import { FilterBar } from "./_components/FilterBar";
import { SessionCard } from "./_components/SessionCard";

export const dynamic = "force-dynamic";

type SearchParams = {
  cursor?: string;
  q?: string;
  member?: string;
  month?: string;
  pmin?: string;
  pmax?: string;
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function SessionsArchivePage({ searchParams }: PageProps) {
  await requireApproved();

  const sp = await searchParams;
  const cursorId = parseCursor(sp.cursor);
  const filters: SessionFilters = {
    q: sp.q?.trim() || undefined,
    memberId: sp.member?.trim() || undefined,
    month: sp.month?.trim() || undefined,
    pmin: parsePositiveInt(sp.pmin),
    pmax: parsePositiveInt(sp.pmax),
  };
  const hasActiveFilters = Boolean(
    filters.q ||
      filters.memberId ||
      filters.month ||
      filters.pmin != null ||
      filters.pmax != null,
  );

  const [page, members] = await Promise.all([
    listSessions({ cursorId, filters }),
    listApprovedMembers(),
  ]);

  const nextHref =
    page.nextCursorId != null
      ? buildHref({ ...sp, cursor: String(page.nextCursorId) })
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

function parseCursor(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function parsePositiveInt(raw: string | undefined): number | undefined {
  if (raw == null || raw === "") return undefined;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

/**
 * 기존 searchParams 를 유지하면서 cursor 만 갈아끼운 URL.
 */
function buildHref(params: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") q.set(k, v);
  }
  const s = q.toString();
  return s ? `/sessions?${s}` : "/sessions";
}
