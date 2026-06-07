// 멤버 누적 통계 + 페이스 추이.
//
// 페이지는 본인 (`/me`) 과 다른 사람 (`/runners/[id]`) 둘 다 같은 데이터 셰이프를 본다.
// 동아리 규모상 한 멤버의 참여 수는 많아야 수십~백여 건이라 in-memory aggregation 으로 충분.

import "server-only";

import { db } from "@/lib/db";

export type PaceHistoryPoint = {
  sessionId: number;
  date: Date;
  location: string;
  distanceKm: number;
  durationSec: number;
  paceSecPerKm: number;
};

export type RecentParticipation = {
  sessionId: number;
  date: Date;
  location: string;
  distanceKm: number | null;
  durationSec: number | null;
  paceSecPerKm: number | null;
};

export type MemberStats = {
  id: string;
  name: string;
  email: string;
  joinedAt: Date;
  role: "MEMBER" | "ADMIN";
  totalDistanceKm: number;
  participationCount: number;
  avgPaceSecPerKm: number | null;
  /** 페이스가 계산 가능한 참여만, 시간 오름차순. 차트 X축 = 시간순. */
  paceHistory: PaceHistoryPoint[];
  /** 최신 10건. 페이스 계산 가능 여부 무관. */
  recent: RecentParticipation[];
};

const PACE_HISTORY_LIMIT = 30;
const RECENT_LIMIT = 10;

export async function getMemberStats(
  userId: string,
): Promise<MemberStats | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      joinedAt: true,
      role: true,
      approved: true,
    },
  });
  if (!user || !user.approved) return null;

  const parts = await db.participation.findMany({
    where: { userId },
    orderBy: [{ session: { date: "asc" } }, { id: "asc" }],
    select: {
      distanceKm: true,
      durationSec: true,
      session: { select: { id: true, date: true, location: true } },
    },
  });

  const totalDistanceKm = parts.reduce(
    (sum, p) => sum + (p.distanceKm ?? 0),
    0,
  );
  const participationCount = parts.length;

  const paced = parts
    .map((p) => {
      const d = p.distanceKm;
      const t = p.durationSec;
      if (!d || !t || d <= 0 || t <= 0) return null;
      return {
        sessionId: p.session.id,
        date: p.session.date,
        location: p.session.location,
        distanceKm: d,
        durationSec: t,
        paceSecPerKm: t / d,
      } satisfies PaceHistoryPoint;
    })
    .filter((x): x is PaceHistoryPoint => x !== null);

  const avgPaceSecPerKm =
    paced.length > 0
      ? paced.reduce((sum, p) => sum + p.paceSecPerKm, 0) / paced.length
      : null;

  // 차트는 가장 최근 PACE_HISTORY_LIMIT 개만. 시간순 (오래된 → 최근) 유지.
  const paceHistory =
    paced.length > PACE_HISTORY_LIMIT
      ? paced.slice(paced.length - PACE_HISTORY_LIMIT)
      : paced;

  const recent: RecentParticipation[] = parts
    .slice(-RECENT_LIMIT)
    .reverse()
    .map((p) => {
      const d = p.distanceKm;
      const t = p.durationSec;
      const pace = d && t && d > 0 && t > 0 ? t / d : null;
      return {
        sessionId: p.session.id,
        date: p.session.date,
        location: p.session.location,
        distanceKm: p.distanceKm,
        durationSec: p.durationSec,
        paceSecPerKm: pace,
      };
    });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    joinedAt: user.joinedAt,
    role: user.role === "ADMIN" ? "ADMIN" : "MEMBER",
    totalDistanceKm,
    participationCount,
    avgPaceSecPerKm,
    paceHistory,
    recent,
  };
}
