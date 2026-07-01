import Link from "next/link";

import { Button } from "@/components/ui/button";
import { requireApproved } from "@/lib/guard";
import { listApprovedMembers, listSessions } from "@/lib/sessions";
import {
  buildSessionArchiveHref,
  parseSessionArchiveParams,
  type SessionArchiveSearchParams,
} from "@/lib/session-filters";
import {
  PageHeader,
  PageShell,
  SubNav,
  UtilityCard,
} from "@/components/layout/AppChrome";

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
    <>
      <SubNav title="아카이브">
        <Button asChild size="sm">
          <Link href="/sessions/new">새 세션</Link>
        </Button>
      </SubNav>

      <PageShell width="content" surface="parchment">
        <PageHeader
          eyebrow="Sessions"
          title="러닝 아카이브"
          description="날짜, 장소, 참여 멤버로 애니뮤 러닝 세션을 찾아보세요."
        />

        <FilterBar
          q={filters.q ?? ""}
          memberIds={filters.memberIds ?? []}
          month={filters.month ?? ""}
          pmin={filters.pmin != null ? String(filters.pmin) : ""}
          pmax={filters.pmax != null ? String(filters.pmax) : ""}
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
            <ul className="grid gap-6 md:grid-cols-2">
              {page.items.map((s) => (
                <li key={s.id}>
                  <SessionCard {...s} />
                </li>
              ))}
            </ul>

            {nextHref && (
              <div className="mt-10 flex justify-center">
                <Button asChild variant="outline">
                  <Link href={nextHref}>더 보기</Link>
                </Button>
              </div>
            )}
          </>
        )}
      </PageShell>
    </>
  );
}

function EmptyFilterResult() {
  return (
    <UtilityCard className="flex flex-col items-center gap-4 border-dashed text-center">
      <p className="font-display text-[24px] font-light leading-[1.5] tracking-normal text-apple-muted-80">
        조건에 맞는 세션이 없어요.
      </p>
      <Link
        href="/sessions"
        className="font-text text-sm leading-[1.29] tracking-[-0.224px] text-apple-primary underline-offset-4 hover:underline"
      >
        필터 초기화
      </Link>
    </UtilityCard>
  );
}
