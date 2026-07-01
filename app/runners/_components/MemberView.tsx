import Link from "next/link";

import {
  formatDistanceKm,
  formatDurationSec,
  formatPace,
} from "@/lib/pace";
import type { MemberStats } from "@/lib/members";
import {
  BackLink,
  HeroBand,
  PageShell,
  SectionLabel,
  SubNav,
  UtilityCard,
} from "@/components/layout/AppChrome";

import { PaceChart } from "./PaceChart";

type Props = {
  stats: MemberStats;
  /** 현재 보고 있는 사람이 본인 페이지인지 (헤더 라벨에만 영향). */
  isSelf: boolean;
};

export function MemberView({ stats, isSelf }: Props) {
  return (
    <>
      <SubNav title={isSelf ? "내 기록" : "러너 기록"}>
        <BackLink href="/sessions">아카이브</BackLink>
      </SubNav>
      <HeroBand
        eyebrow={
          <>
            {isSelf ? "My running" : "Runner"} · 가입 {formatDate(stats.joinedAt)}
          </>
        }
        title={
          <>
            {stats.name}
            {stats.role === "ADMIN" && (
              <span className="ml-3 align-middle rounded-full border border-white/20 px-3 py-1 font-text text-xs font-normal leading-none tracking-[-0.12px] text-white/80">
                ADMIN
              </span>
            )}
          </>
        }
        description="거리, 페이스, 최근 참여 기록을 한 화면에서 확인합니다."
      />

      <PageShell width="content" surface="parchment">

        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <Kpi
            label="누적 거리"
            value={
              stats.totalDistanceKm > 0
                ? `${stats.totalDistanceKm.toFixed(1)} km`
                : "—"
            }
          />
          <Kpi label="참여 횟수" value={`${stats.participationCount} 회`} />
          <Kpi
            label="평균 페이스"
            value={formatPace(stats.avgPaceSecPerKm)}
            mono
          />
        </section>

        <UtilityCard className="mb-8">
          <div className="mb-4 flex items-baseline justify-between">
            <SectionLabel>최근 페이스 추이</SectionLabel>
            {stats.paceHistory.length > 0 && (
              <span className="font-text text-xs leading-none tracking-[-0.12px] text-apple-muted-48">
                최근 {stats.paceHistory.length} 개
              </span>
            )}
          </div>
          <PaceChart points={stats.paceHistory} />
        </UtilityCard>

        <UtilityCard>
          <SectionLabel>최근 참여 ({stats.recent.length})</SectionLabel>
          {stats.recent.length === 0 ? (
            <p className="rounded-[18px] border border-dashed border-apple-hairline bg-apple-parchment p-8 text-center font-text text-sm leading-[1.43] tracking-[-0.224px] text-apple-muted-48">
              아직 참여한 세션이 없어요.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {stats.recent.map((r) => (
                <li
                  key={`${r.sessionId}-${r.date.toISOString()}`}
                  className="flex flex-col gap-3 rounded-[18px] border border-apple-hairline bg-apple-parchment p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <Link
                    href={`/sessions/${r.sessionId}`}
                    className="flex flex-col gap-1"
                  >
                    <span className="font-text text-[17px] font-semibold leading-[1.24] tracking-[-0.374px] text-apple-primary underline-offset-4 hover:underline">
                      {formatDate(r.date)}
                    </span>
                    <span className="font-text text-sm leading-[1.43] tracking-[-0.224px] text-apple-muted-48">
                      {r.location}
                    </span>
                  </Link>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-text text-sm leading-[1.43] tracking-[-0.224px] text-apple-muted-48">
                    <span>{formatDistanceKm(r.distanceKm)}</span>
                    <span>{formatDurationSec(r.durationSec)}</span>
                    <span className="font-mono">{formatPace(r.paceSecPerKm)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </UtilityCard>
      </PageShell>
    </>
  );
}

function Kpi({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <UtilityCard className="flex flex-col gap-2">
      <span className="font-text text-xs uppercase leading-none tracking-[-0.12px] text-apple-muted-48">
        {label}
      </span>
      <span
        className={`font-display text-[28px] font-semibold leading-[1.14] tracking-[0.196px] ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </UtilityCard>
  );
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}
