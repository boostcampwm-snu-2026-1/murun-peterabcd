// 세션 도메인 쿼리.
//
// keyset pagination 사용 — 큰 데이터에도 안정적이고 cursor URL 이 공유 가능.
// 정렬은 (date desc, id desc). id 도 같이 두는 이유: 같은 날짜의 안정적 tie-break.

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
 * 최신순 keyset pagination.
 *   - cursorId 미지정: 첫 페이지
 *   - cursorId 지정: 그 id 보다 *오래된* (id 가 작은) 세션부터 PAGE_SIZE 개
 */
export async function listSessions(opts: {
  cursorId?: number;
}): Promise<SessionListPage> {
  const where = opts.cursorId ? { id: { lt: opts.cursorId } } : undefined;

  const rows = await db.session.findMany({
    where,
    orderBy: [{ date: "desc" }, { id: "desc" }],
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
