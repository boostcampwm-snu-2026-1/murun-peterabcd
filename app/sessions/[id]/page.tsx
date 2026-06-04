import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { requireApproved } from "@/lib/guard";
import {
  calcPaceSecPerKm,
  formatDistanceKm,
  formatDurationSec,
  formatPace,
} from "@/lib/pace";

import { MyParticipationForm } from "./_components/MyParticipationForm";
import { PhotoSection } from "./_components/PhotoSection";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SessionDetailPage({ params }: PageProps) {
  const user = await requireApproved();
  const { id } = await params;

  const sessionRow = await db.session.findUnique({
    where: { id },
    include: {
      host: { select: { id: true, name: true } },
      participations: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!sessionRow) notFound();

  const isHostOrAdmin =
    sessionRow.hostId === user.id || user.role === "ADMIN";

  const myRow =
    sessionRow.participations.find((p) => p.userId === user.id) ?? null;

  const totalDistance = sessionRow.participations.reduce(
    (sum, p) => sum + (p.distanceKm ?? 0),
    0,
  );

  return (
    <main className="container mx-auto max-w-2xl p-6">
      <nav className="mb-4 text-xs text-muted-foreground">
        <Link href="/" className="underline-offset-4 hover:underline">
          ← 홈
        </Link>
      </nav>

      <header className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {formatDateHeader(sessionRow.date)} · {sessionRow.location}
        </h1>
        <p className="text-sm text-muted-foreground">
          {sessionRow.startTime && (
            <span>시작 {sessionRow.startTime} · </span>
          )}
          {sessionRow.weather && <span>{sessionRow.weather} · </span>}
          호스트: {sessionRow.host.name}
        </p>
        {isHostOrAdmin && (
          <p className="text-xs text-muted-foreground">
            [세션 수정 — 다음 PR에서 추가]
          </p>
        )}
      </header>

      <PhotoSection
        sessionId={sessionRow.id}
        groupPhotoPath={sessionRow.groupPhotoPath}
        canEdit={isHostOrAdmin}
        altText={`${formatDateHeader(sessionRow.date)} ${sessionRow.location} 단체사진`}
      />

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
          참여자 ({sessionRow.participations.length})
          {totalDistance > 0 && (
            <span className="ml-2 normal-case text-foreground/80">
              · 총 {totalDistance.toFixed(1)} km
            </span>
          )}
        </h2>

        {sessionRow.participations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            아직 참여자가 없습니다. 아래에서 본인 기록을 추가하세요.
          </p>
        ) : (
          <ul className="flex flex-col divide-y rounded-md border">
            {sessionRow.participations.map((p) => {
              const pace = calcPaceSecPerKm(p.distanceKm, p.durationSec);
              const isMine = p.userId === user.id;
              return (
                <li
                  key={p.id}
                  className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium">{p.user.name}</span>
                    {isMine && (
                      <span className="text-xs text-muted-foreground">(나)</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>{formatDistanceKm(p.distanceKm)}</span>
                    <span>{formatDurationSec(p.durationSec)}</span>
                    <span className="font-mono">{formatPace(pace)}</span>
                  </div>
                  {p.note && (
                    <p className="text-xs text-muted-foreground sm:hidden">
                      {p.note}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <MyParticipationForm
        sessionId={sessionRow.id}
        existing={
          myRow
            ? {
                distanceKm: myRow.distanceKm,
                durationSec: myRow.durationSec,
                note: myRow.note,
              }
            : null
        }
      />

      {sessionRow.notes && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">
            코스 메모
          </h2>
          <p className="whitespace-pre-wrap text-sm">{sessionRow.notes}</p>
        </section>
      )}
    </main>
  );
}

function formatDateHeader(d: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).format(d);
}
