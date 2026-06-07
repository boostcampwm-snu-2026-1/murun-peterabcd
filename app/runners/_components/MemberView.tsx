import Link from "next/link";

import {
  formatDistanceKm,
  formatDurationSec,
  formatPace,
} from "@/lib/pace";
import type { MemberStats } from "@/lib/members";

import { PaceChart } from "./PaceChart";

type Props = {
  stats: MemberStats;
  /** 현재 보고 있는 사람이 본인 페이지인지 (헤더 라벨에만 영향). */
  isSelf: boolean;
};

export function MemberView({ stats, isSelf }: Props) {
  return (
    <main className="container mx-auto max-w-2xl p-6">
      <nav className="mb-4 text-xs text-muted-foreground">
        <Link href="/" className="underline-offset-4 hover:underline">
          ← 홈
        </Link>
        <span className="mx-2">·</span>
        <Link
          href="/sessions"
          className="underline-offset-4 hover:underline"
        >
          아카이브
        </Link>
      </nav>

      <header className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {stats.name}
          {stats.role === "ADMIN" && (
            <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-xs">
              ADMIN
            </span>
          )}
        </h1>
        <p className="text-xs text-muted-foreground">
          {isSelf ? "내 기록" : "러너 기록"} · 가입{" "}
          {new Intl.DateTimeFormat("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(stats.joinedAt)}
        </p>
      </header>

      <section className="mb-8 grid grid-cols-3 gap-3">
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

      <section className="mb-8 flex flex-col gap-3 rounded-md border p-4">
        <header className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase text-muted-foreground">
            최근 페이스 추이
          </h2>
          {stats.paceHistory.length > 0 && (
            <span className="text-xs text-muted-foreground">
              최근 {stats.paceHistory.length} 개
            </span>
          )}
        </header>
        <PaceChart points={stats.paceHistory} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground">
          최근 참여 ({stats.recent.length})
        </h2>
        {stats.recent.length === 0 ? (
          <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            아직 참여한 세션이 없어요.
          </p>
        ) : (
          <ul className="flex flex-col divide-y rounded-md border">
            {stats.recent.map((r) => (
              <li
                key={`${r.sessionId}-${r.date.toISOString()}`}
                className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <Link
                  href={`/sessions/${r.sessionId}`}
                  className="flex flex-col gap-0.5"
                >
                  <span className="text-sm font-medium">
                    {new Intl.DateTimeFormat("ko-KR", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    }).format(r.date)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {r.location}
                  </span>
                </Link>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{formatDistanceKm(r.distanceKm)}</span>
                  <span>{formatDurationSec(r.durationSec)}</span>
                  <span className="font-mono">
                    {formatPace(r.paceSecPerKm)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
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
    <div className="flex flex-col gap-1 rounded-md border p-3">
      <span className="text-xs uppercase text-muted-foreground">{label}</span>
      <span className={`text-lg font-semibold ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}
