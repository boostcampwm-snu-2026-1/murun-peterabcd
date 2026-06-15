import { describe, expect, test } from "vitest";

import { dateInputValue, parseSessionForm } from "@/lib/session-form";

function form(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) fd.set(key, value);
  return fd;
}

describe("parseSessionForm", () => {
  test("세션 생성/수정 입력을 DB 저장값으로 정규화한다", () => {
    const parsed = parseSessionForm(
      form({
        date: "2026-06-15",
        startTime: "19:30",
        location: "서울숲",
        weather: "맑음",
        notes: "  5km 조깅  ",
      }),
    );

    expect(parsed).toEqual({
      ok: true,
      value: {
        date: new Date("2026-06-15T12:00:00Z"),
        startTime: "19:30",
        location: "서울숲",
        weather: "맑음",
        notes: "  5km 조깅  ",
      },
    });
  });

  test("선택 필드는 빈 문자열을 null로 바꾼다", () => {
    const parsed = parseSessionForm(
      form({ date: "2026-06-15", location: "보라매공원" }),
    );

    expect(parsed).toEqual({
      ok: true,
      value: {
        date: new Date("2026-06-15T12:00:00Z"),
        startTime: null,
        location: "보라매공원",
        weather: null,
        notes: null,
      },
    });
  });

  test("장소 누락과 잘못된 시간은 사용자 메시지로 반환한다", () => {
    expect(parseSessionForm(form({ date: "2026-06-15", location: "" }))).toEqual({
      ok: false,
      error: "장소를 입력하세요.",
    });

    expect(
      parseSessionForm(
        form({ date: "2026-06-15", location: "서울숲", startTime: "7pm" }),
      ),
    ).toEqual({
      ok: false,
      error: "시간 형식이 올바르지 않습니다 (HH:MM).",
    });
  });

  test("date input 값은 저장된 UTC 정오 날짜에서 YYYY-MM-DD로 만든다", () => {
    expect(dateInputValue(new Date("2026-06-15T12:00:00Z"))).toBe("2026-06-15");
  });
});
