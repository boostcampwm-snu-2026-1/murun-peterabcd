import { notFound } from "next/navigation";

import { getMemberStats } from "@/lib/members";
import { requireApproved } from "@/lib/guard";

import { MemberView } from "@/app/runners/_components/MemberView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "내 기록",
};

export default async function MePage() {
  const user = await requireApproved();
  const stats = await getMemberStats(user.id);
  if (!stats) notFound();
  return <MemberView stats={stats} isSelf />;
}
