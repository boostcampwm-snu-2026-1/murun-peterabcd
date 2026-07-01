import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { requireHostOrAdmin } from "@/lib/guard";
import { dateInputValue } from "@/lib/session-form";
import {
  BackLink,
  PageHeader,
  PageShell,
  SubNav,
} from "@/components/layout/AppChrome";

import { EditSessionForm } from "./_components/EditSessionForm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const id = await parseIdFromParams(params);
  if (id == null) return {};

  const session = await db.session.findUnique({
    where: { id },
    select: { location: true },
  });
  if (!session) return {};

  return { title: `${session.location} 수정` };
}

export default async function EditSessionPage({ params }: PageProps) {
  const id = await parseIdFromParams(params);
  if (id == null) notFound();

  await requireHostOrAdmin(id);

  const session = await db.session.findUnique({
    where: { id },
    select: {
      id: true,
      date: true,
      startTime: true,
      location: true,
      weather: true,
      notes: true,
    },
  });
  if (!session) notFound();

  return (
    <>
      <SubNav title="세션 수정">
        <BackLink href={`/sessions/${session.id}`}>세션으로 돌아가기</BackLink>
      </SubNav>
      <PageShell width="content" surface="parchment">
        <PageHeader
          eyebrow="Edit"
          title="세션 수정"
          description="날짜·장소·시간·날씨·메모를 정리하거나 세션을 삭제합니다."
        />
        <EditSessionForm
          session={{
            id: session.id,
            date: dateInputValue(session.date),
            startTime: session.startTime ?? "",
            location: session.location,
            weather: session.weather ?? "",
            notes: session.notes ?? "",
          }}
        />
      </PageShell>
    </>
  );
}

async function parseIdFromParams(params: Promise<{ id: string }>) {
  const { id: raw } = await params;
  const id = Number.parseInt(raw, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}
