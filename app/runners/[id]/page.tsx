import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getMemberStats } from "@/lib/members";
import { requireApproved } from "@/lib/guard";

import { MemberView } from "../_components/MemberView";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { id } = await params;
  const stats = await getMemberStats(id);
  if (!stats) return {};
  return {
    title: `${stats.name}의 기록`,
    description: `${stats.name} · 참여 ${stats.participationCount}회 · 누적 ${stats.totalDistanceKm.toFixed(1)}km`,
  };
}

export default async function RunnerPage({ params }: Props) {
  const me = await requireApproved();
  const { id } = await params;
  // 자기 자신 id 로 들어오면 /me 로 리다이렉트 (canonical URL 1개로 일원화).
  if (id === me.id) redirect("/me");

  const stats = await getMemberStats(id);
  if (!stats) notFound();
  return <MemberView stats={stats} isSelf={false} />;
}
