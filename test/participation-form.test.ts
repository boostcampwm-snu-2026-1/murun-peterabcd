import { describe, expect, test } from "vitest";

import { parseParticipationForm } from "@/lib/participation-form";

function form(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) fd.set(key, value);
  return fd;
}

describe("parseParticipationForm", () => {
  test("거리와 기록과 메모를 저장 가능한 값으로 정규화한다", () => {
    const parsed = parseParticipationForm(
      form({
        distanceKm: "5.5",
        durationMin: "32",
        durationSec: "15",
        note: "  가볍게 조깅  ",
      }),
    );

    expect(parsed).toEqual({
      ok: true,
      value: {
        distanceKm: 5.5,
        durationSec: 1935,
        note: "가볍게 조깅",
      },
    });
  });

  test("거리·기록·메모가 모두 비어 있으면 사용자가 이해할 수 있는 에러를 반환한다", () => {
    const parsed = parseParticipationForm(form({}));

    expect(parsed).toEqual({
      ok: false,
      error: "거리 / 기록 / 메모 중 최소 한 가지를 입력하세요.",
    });
  });

  test("초가 60 이상이면 서버 액션 예외가 아니라 폼 에러로 반환한다", () => {
    const parsed = parseParticipationForm(
      form({ distanceKm: "5", durationSec: "60" }),
    );

    expect(parsed).toEqual({ ok: false, error: "초는 59 이하여야 합니다." });
  });

  test("음수 거리와 소수 분은 각각 검증 에러를 반환한다", () => {
    expect(parseParticipationForm(form({ distanceKm: "-1" }))).toEqual({
      ok: false,
      error: "거리(km)는 0.01 이상이어야 합니다.",
    });

    expect(parseParticipationForm(form({ durationMin: "1.5" }))).toEqual({
      ok: false,
      error: "분는 정수만 입력하세요.",
    });
  });
});
