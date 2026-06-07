// 세션 도메인 쿼리.
//
// keyset pagination — 큰 데이터에도 안정적이고 cursor URL 이 공유 가능.
// 정렬은 (date desc, id desc). 두 키 모두 정렬 키에 들어가야 같은 날짜 안에서도
// 안정적이고, "오래된 날짜인데 늦게 생성돼 id 가 큰 세션" 도 누락되지 않는다.
// id-only cursor 는 후자 케이스에서 페이지가 끊긴다.

import "server-only";
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
 *   - cursor 미지정: 첫 페이지
 *   - cursor 지정: 정렬 순서상 그 id 행 *바로 다음* 부터 PAGE_SIZE 개.
 *     Prisma 의 cursor + skip:1 이 (date desc, id desc) 시퀀스에서 정확한
 *     keyset 위치를 잡아준다 — id 가 unique 라 행 위치가 모호하지 않다.
 */
export async function listSessions(opts: {
  cursorId?: number;
}): Promise<SessionListPage> {
  const rows = await db.session.findMany({
    orderBy: [{ date: "desc" }, { id: "desc" }],
    ...(opts.cursorId
      ? { cursor: { id: opts.cursorId }, skip: 1 }
      : {}),
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
