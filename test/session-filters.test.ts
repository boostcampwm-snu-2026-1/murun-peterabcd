import { describe, expect, test } from "vitest";

import {
  buildSessionArchiveHref,
  parseMonthRange,
  parseSessionArchiveParams,
} from "@/lib/session-filters";

describe("session archive filter parsing", () => {
  test("URL 검색 파라미터를 DB 조회용 필터로 정규화한다", () => {
    const parsed = parseSessionArchiveParams({
      cursor: "12",
      q: " 서울숲 ",
      member: ["user-1", " user-2 ", "user-1", ""],
      month: "2026-06",
      pmin: "2",
      pmax: "10",
    });

    expect(parsed).toEqual({
      cursorId: 12,
      filters: {
        q: "서울숲",
        memberIds: ["user-1", "user-2"],
        month: "2026-06",
        pmin: 2,
        pmax: 10,
      },
      hasActiveFilters: true,
    });
  });

  test("깨진 숫자 파라미터를 부분 parse 하지 않고 무시한다", () => {
    const parsed = parseSessionArchiveParams({
      cursor: "3abc",
      pmin: "1.5",
      pmax: "-2",
      month: "2026-13",
    });

    expect(parsed).toEqual({
      cursorId: undefined,
      filters: {
        q: undefined,
        memberIds: undefined,
        month: undefined,
        pmin: undefined,
        pmax: undefined,
      },
      hasActiveFilters: false,
    });
  });

  test("월 필터의 UTC 범위를 생성한다", () => {
    const range = parseMonthRange("2026-06");

    expect(range?.start.toISOString()).toBe("2026-06-01T00:00:00.000Z");
    expect(range?.endExclusive.toISOString()).toBe(
      "2026-07-01T00:00:00.000Z",
    );
  });

  test("페이지네이션 링크는 빈 값은 버리고 기존 필터와 cursor를 보존한다", () => {
    expect(
      buildSessionArchiveHref({
        q: "서울숲",
        member: ["u1", "", "u2"],
        month: "2026-06",
        cursor: "25",
      }),
    ).toBe(
      "/sessions?q=%EC%84%9C%EC%9A%B8%EC%88%B2&member=u1&member=u2&month=2026-06&cursor=25",
    );
  });
});
