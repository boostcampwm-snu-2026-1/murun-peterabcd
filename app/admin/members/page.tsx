import { requireAdmin } from "@/lib/guard";
import { db } from "@/lib/db";
import {
  PageHeader,
  PageShell,
  SectionLabel,
  SubNav,
  UtilityCard,
} from "@/components/layout/AppChrome";

import { PendingMemberActions } from "./_components/PendingMemberActions";

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
    <>
      <SubNav title="회원 관리" />
      <PageShell width="content" surface="parchment">
        <PageHeader
          eyebrow="Admin"
          title="회원 관리"
          description={`관리자: ${admin.email}`}
        />

        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <UtilityCard>
            <SectionLabel>승인 대기 ({pending.length})</SectionLabel>
            {pending.length === 0 ? (
              <p className="font-text text-sm leading-[1.43] tracking-[-0.224px] text-apple-muted-48">
                대기 중인 가입 요청이 없습니다.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {pending.map((u) => (
                  <li
                    key={u.id}
                    className="flex flex-col gap-4 rounded-[18px] border border-apple-hairline bg-apple-parchment p-4"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-text text-[17px] font-semibold leading-[1.24] tracking-[-0.374px]">
                        {u.name}
                      </span>
                      <span className="font-mono text-xs text-apple-muted-48">
                        {u.email}
                      </span>
                      <span className="font-text text-xs leading-none tracking-[-0.12px] text-apple-muted-48">
                        가입 요청 {formatDate(u.joinedAt)}
                      </span>
                    </div>
                    <PendingMemberActions userId={u.id} />
                  </li>
                ))}
              </ul>
            )}
          </UtilityCard>

          <UtilityCard>
            <SectionLabel>활동 회원 ({active.length})</SectionLabel>
            <ul className="flex flex-col gap-3">
              {active.map((u) => (
                <li
                  key={u.id}
                  className="flex flex-col gap-3 rounded-[18px] border border-apple-hairline bg-apple-parchment p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-text text-[17px] font-semibold leading-[1.24] tracking-[-0.374px]">
                      {u.name}
                      {u.role === "ADMIN" && (
                        <span className="ml-2 rounded-full bg-apple-canvas px-2 py-1 font-text text-xs font-normal leading-none tracking-[-0.12px] text-apple-primary">
                          ADMIN
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-xs text-apple-muted-48">
                      {u.email}
                    </span>
                  </div>
                  <span className="font-text text-xs leading-none tracking-[-0.12px] text-apple-muted-48">
                    승인 {u.approvedAt ? formatDate(u.approvedAt) : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </UtilityCard>
        </div>
      </PageShell>
    </>
  );
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}
