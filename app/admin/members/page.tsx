import { requireAdmin } from "@/lib/guard";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";

import { approveUser, rejectUser } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  const admin = await requireAdmin();

  const pending = await db.user.findMany({
    where: { approved: false },
    orderBy: { joinedAt: "asc" },
    select: { id: true, name: true, email: true, joinedAt: true },
  });

  const active = await db.user.findMany({
    where: { approved: true },
    orderBy: [{ role: "desc" }, { joinedAt: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      joinedAt: true,
      approvedAt: true,
    },
  });

  return (
    <main className="container mx-auto max-w-2xl p-6">
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">회원 관리</h1>
        <p className="text-xs text-muted-foreground">
          관리자: {admin.email}
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
          승인 대기 ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">대기 중인 가입 요청이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {pending.map((u) => (
              <li
                key={u.id}
                className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{u.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {u.email}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    가입 요청 {formatDate(u.joinedAt)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <form action={approveUser}>
                    <input type="hidden" name="userId" value={u.id} />
                    <Button type="submit" size="sm">
                      승인
                    </Button>
                  </form>
                  <form action={rejectUser}>
                    <input type="hidden" name="userId" value={u.id} />
                    <Button type="submit" variant="outline" size="sm">
                      거절
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
          활동 회원 ({active.length})
        </h2>
        <ul className="flex flex-col gap-2">
          {active.map((u) => (
            <li
              key={u.id}
              className="flex flex-col gap-1 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col">
                <span className="font-medium">
                  {u.name}
                  {u.role === "ADMIN" && (
                    <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-xs">
                      ADMIN
                    </span>
                  )}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {u.email}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                승인 {u.approvedAt ? formatDate(u.approvedAt) : "—"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}
