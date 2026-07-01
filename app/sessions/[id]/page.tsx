import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { requireApproved } from "@/lib/guard";
import {
  BackLink,
  PageHeader,
  PageShell,
  SectionLabel,
  SubNav,
  UtilityCard,
} from "@/components/layout/AppChrome";
import {
  calcPaceSecPerKm,
  formatDistanceKm,
  formatDurationSec,
  formatPace,
} from "@/lib/pace";

import { MyParticipationForm } from "./_components/MyParticipationForm";
import { PhotoSection } from "./_components/PhotoSection";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (!Number.isFinite(id) || id <= 0) return {};
  const session = await db.session.findUnique({
    where: { id },
    select: { date: true, location: true, host: { select: { name: true } } },
  });
  if (!session) return {};
  const dateText = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(session.date);
  const title = `${dateText} · ${session.location}`;
  const description = `호스트: ${session.host.name}`;
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title, description },
  };
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SessionDetailPage({ params }: PageProps) {
  const user = await requireApproved();
  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (!Number.isFinite(id) || id <= 0) notFound();
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

  const metaLine = [
    sessionRow.startTime ? `시작 ${sessionRow.startTime}` : null,
    sessionRow.weather,
    `호스트 ${sessionRow.host.name}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <SubNav title="세션">
        <BackLink href="/sessions">아카이브</BackLink>
        {isHostOrAdmin && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/sessions/${sessionRow.id}/edit`}>세션 수정</Link>
          </Button>
        )}
      </SubNav>

      <PageShell width="content" surface="parchment">
        <PageHeader
          eyebrow={formatDateHeader(sessionRow.date)}
          title={sessionRow.location}
          description={metaLine}
        />

        <PhotoSection
          sessionId={sessionRow.id}
          groupPhotoPath={sessionRow.groupPhotoPath}
          canEdit={isHostOrAdmin}
          altText={`${formatDateHeader(sessionRow.date)} ${sessionRow.location} 단체사진`}
        />

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-8">
            <UtilityCard>
              <SectionLabel>
                참여자 ({sessionRow.participations.length})
                {totalDistance > 0 && (
                  <span className="ml-2 normal-case text-apple-muted-80">
                    · 총 {totalDistance.toFixed(1)} km
                  </span>
                )}
              </SectionLabel>

              {sessionRow.participations.length === 0 ? (
                <p className="font-text text-sm leading-[1.43] tracking-[-0.224px] text-apple-muted-48">
                  아직 참여자가 없습니다. 아래에서 본인 기록을 추가하세요.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {sessionRow.participations.map((p) => {
                    const pace = calcPaceSecPerKm(p.distanceKm, p.durationSec);
                    const isMine = p.userId === user.id;
                    return (
                      <li
                        key={p.id}
                        className="rounded-[18px] border border-apple-hairline bg-apple-parchment p-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-baseline gap-2">
                            <Link
                              href={isMine ? "/me" : `/runners/${p.userId}`}
                              className="font-text text-[17px] font-semibold leading-[1.24] tracking-[-0.374px] text-apple-primary underline-offset-4 hover:underline"
                            >
                              {p.user.name}
                            </Link>
                            {isMine && (
                              <span className="font-text text-xs leading-none tracking-[-0.12px] text-apple-muted-48">
                                (나)
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 font-text text-sm leading-[1.43] tracking-[-0.224px] text-apple-muted-48">
                            <span>{formatDistanceKm(p.distanceKm)}</span>
                            <span>{formatDurationSec(p.durationSec)}</span>
                            <span className="font-mono">{formatPace(pace)}</span>
                          </div>
                        </div>
                        {p.note && (
                          <p className="mt-2 font-text text-sm leading-[1.43] tracking-[-0.224px] text-apple-muted-48">
                            {p.note}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </UtilityCard>

            {sessionRow.notes && (
              <UtilityCard>
                <SectionLabel>코스 메모</SectionLabel>
                <p className="whitespace-pre-wrap font-text text-[17px] leading-[1.47] tracking-[-0.374px] text-apple-ink">
                  {sessionRow.notes}
                </p>
              </UtilityCard>
            )}
          </div>

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
        </div>
      </PageShell>
    </>
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
