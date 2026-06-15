import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { requireHostOrAdmin } from "@/lib/guard";
import { dateInputValue } from "@/lib/session-form";

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
    <main className="container mx-auto max-w-2xl p-6">
      <nav className="mb-4 text-xs text-muted-foreground">
        <Link
          href={`/sessions/${session.id}`}
          className="underline-offset-4 hover:underline"
        >
          ← 세션으로 돌아가기
        </Link>
      </nav>

      <header className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">세션 수정</h1>
        <p className="text-sm text-muted-foreground">
          날짜·장소·시간·날씨·메모를 수정하거나 세션을 삭제합니다.
        </p>
      </header>

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
    </main>
  );
}

async function parseIdFromParams(params: Promise<{ id: string }>) {
  const { id: raw } = await params;
  const id = Number.parseInt(raw, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}
