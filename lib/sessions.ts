// 세션 도메인 쿼리.
//
// keyset pagination — 큰 데이터에도 안정적이고 cursor URL 이 공유 가능.
// 정렬은 (date desc, id desc). 두 키 모두 정렬 키에 들어가야 같은 날짜 안에서도
// 안정적이고, "오래된 날짜인데 늦게 생성돼 id 가 큰 세션" 도 누락되지 않는다.
// id-only cursor 는 후자 케이스에서 페이지가 끊긴다.

import "server-only";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

export const PAGE_SIZE = 20;

export type SessionCard = {
  id: number;
  date: Date;
  startTime: string | null;
  location: string;
  weather: string | null;
  groupPhotoPath: string | null;
  hostName: string;
  participantCount: number;
};

export type SessionListPage = {
  items: SessionCard[];
  nextCursorId: number | null;
};

/**
 * /sessions 아카이브 필터.
 *   - q          : 장소 substring (case-insensitive ASCII / 한글 그대로)
 *   - memberId   : 해당 user 가 *참여한* 세션만
 *   - month      : "YYYY-MM" — 해당 달의 세션만 (UTC 기준; 동아리는 KST 라 거의 일치)
 *   - pmin/pmax  : 참여 인원 수 범위. Prisma 가 relation _count where 를 직접
 *                  지원 안 해서 raw 로 ID 만 따로 추출한 뒤 IN 으로 필터.
 */
export type SessionFilters = {
  q?: string;
  memberId?: string;
  month?: string;
  pmin?: number;
  pmax?: number;
};

function parseMonthRange(month: string | undefined): {
  start: Date;
  endExclusive: Date;
} | null {
  if (!month) return null;
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return null;
  const year = Number.parseInt(m[1], 10);
  const mm = Number.parseInt(m[2], 10);
  if (!Number.isFinite(year) || mm < 1 || mm > 12) return null;
  // UTC 기준의 month boundary. createSession 이 date 를 UTC 정오로 저장하므로
  // KST 사용자에게도 동일 month 가 매칭됨.
  const start = new Date(Date.UTC(year, mm - 1, 1));
  const endExclusive = new Date(Date.UTC(year, mm, 1));
  return { start, endExclusive };
}

async function idsByParticipantCount(
  pmin: number | undefined,
  pmax: number | undefined,
): Promise<number[] | null> {
  if (pmin == null && pmax == null) return null;
  const min = pmin ?? 0;
  // SQLite COUNT(*) 는 정수 → 충분히 큰 상한.
  const max = pmax ?? 1_000_000;
  // raw 쿼리: 세션별 참여자 수가 [min, max] 인 id 만 추출.
  // LEFT JOIN 으로 참여자 0명 세션도 GROUP 에 포함되도록.
  const rows = await db.$queryRaw<{ id: number }[]>`
    SELECT s.id AS id
    FROM Session s
    LEFT JOIN Participation p ON p.sessionId = s.id
    GROUP BY s.id
    HAVING COUNT(p.id) BETWEEN ${min} AND ${max}
  `;
  return rows.map((r) => r.id);
}

function buildWhere(
  filters: SessionFilters | undefined,
  participantFilterIds: number[] | null,
): Prisma.SessionWhereInput | undefined {
  if (!filters && participantFilterIds == null) return undefined;
  const where: Prisma.SessionWhereInput = {};
  if (filters?.q && filters.q.trim()) {
    where.location = { contains: filters.q.trim() };
  }
  if (filters?.memberId) {
    where.participations = {
      some: { userId: filters.memberId },
    };
  }
  const range = parseMonthRange(filters?.month);
  if (range) {
    where.date = { gte: range.start, lt: range.endExclusive };
  }
  if (participantFilterIds != null) {
    if (participantFilterIds.length === 0) {
      // 빈 배열을 그대로 IN 에 넣으면 SQLite 가 syntax error.
      // "조건은 있는데 매칭 결과 0개" 를 표현하려면 불가능한 id 강제.
      where.id = { in: [-1] };
    } else {
      where.id = { in: participantFilterIds };
    }
  }
  return where;
}

/**
 * 최신순 keyset pagination + 선택적 필터.
 *   - cursor 미지정: 첫 페이지
 *   - cursor 지정: 정렬 순서상 그 id 행 *바로 다음* 부터 PAGE_SIZE 개.
 *     Prisma 의 cursor + skip:1 이 (date desc, id desc) 시퀀스에서 정확한
 *     keyset 위치를 잡아준다 — id 가 unique 라 행 위치가 모호하지 않다.
 */
export async function listSessions(opts: {
  cursorId?: number;
  filters?: SessionFilters;
}): Promise<SessionListPage> {
  const participantIds = await idsByParticipantCount(
    opts.filters?.pmin,
    opts.filters?.pmax,
  );
  const where = buildWhere(opts.filters, participantIds);

  const rows = await db.session.findMany({
    where,
    orderBy: [{ date: "desc" }, { id: "desc" }],
    ...(opts.cursorId ? { cursor: { id: opts.cursorId }, skip: 1 } : {}),
    take: PAGE_SIZE + 1, // 다음 페이지 존재 여부 판별용으로 +1
    select: {
      id: true,
      date: true,
      startTime: true,
      location: true,
      weather: true,
      groupPhotoPath: true,
      host: { select: { name: true } },
      _count: { select: { participations: true } },
    },
  });

  const hasNext = rows.length > PAGE_SIZE;
  const visible = hasNext ? rows.slice(0, PAGE_SIZE) : rows;
  const items: SessionCard[] = visible.map((r) => ({
    id: r.id,
    date: r.date,
    startTime: r.startTime,
    location: r.location,
    weather: r.weather,
    groupPhotoPath: r.groupPhotoPath,
    hostName: r.host.name,
    participantCount: r._count.participations,
  }));

  const nextCursorId = hasNext
    ? (visible[visible.length - 1]?.id ?? null)
    : null;

  return { items, nextCursorId };
}

/**
 * 멤버 dropdown 용 — approved 된 모든 user 목록.
 */
export async function listApprovedMembers() {
  return db.user.findMany({
    where: { approved: true },
    orderBy: [{ name: "asc" }],
    select: { id: true, name: true },
  });
}
