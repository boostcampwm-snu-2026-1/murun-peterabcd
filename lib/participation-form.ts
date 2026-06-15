import { z } from "zod";

import { parseOptionalNumber } from "@/lib/pace";

export type ParsedParticipationForm =
  | {
      ok: true;
      value: {
        distanceKm: number | null;
        durationSec: number | null;
        note: string | null;
      };
    }
  | { ok: false; error: string };

const noteSchema = z
  .string()
  .max(500, "메모는 500자 이내로 입력하세요.")
  .optional()
  .or(z.literal(""));

export function parseParticipationForm(
  formData: Pick<FormData, "get">,
): ParsedParticipationForm {
  const distance = parseOptionalNumber(formData.get("distanceKm"), {
    min: 0.01,
    max: 1000,
    field: "거리(km)",
  });
  if (distance.error) return { ok: false, error: distance.error };

  const minutes = parseOptionalNumber(formData.get("durationMin"), {
    min: 0,
    max: 1440,
    field: "분",
    integer: true,
  });
  if (minutes.error) return { ok: false, error: minutes.error };

  const seconds = parseOptionalNumber(formData.get("durationSec"), {
    min: 0,
    max: 59,
    field: "초",
    integer: true,
  });
  if (seconds.error) return { ok: false, error: seconds.error };

  let durationSec: number | null;
  if (minutes.value == null && seconds.value == null) {
    durationSec = null;
  } else {
    durationSec = (minutes.value ?? 0) * 60 + (seconds.value ?? 0);
    if (durationSec <= 0) durationSec = null;
  }

  const noteParsed = noteSchema.safeParse(formData.get("note") ?? "");
  if (!noteParsed.success) {
    return {
      ok: false,
      error: noteParsed.error.issues[0]?.message ?? "메모가 올바르지 않습니다.",
    };
  }
  const noteValue = (noteParsed.data ?? "").trim();
  const note = noteValue ? noteValue : null;

  if (distance.value == null && durationSec == null && !note) {
    return {
      ok: false,
      error: "거리 / 기록 / 메모 중 최소 한 가지를 입력하세요.",
    };
  }

  return {
    ok: true,
    value: {
      distanceKm: distance.value,
      durationSec,
      note,
    },
  };
}
