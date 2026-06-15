import { z } from "zod";

export type ParsedSessionForm =
  | {
      ok: true;
      value: {
        date: Date;
        startTime: string | null;
        location: string;
        weather: string | null;
        notes: string | null;
      };
    }
  | { ok: false; error: string };

const sessionFormSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)."),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "시간 형식이 올바르지 않습니다 (HH:MM).")
    .optional()
    .or(z.literal("")),
  location: z
    .string()
    .min(1, "장소를 입력하세요.")
    .max(120, "장소는 120자 이내로 입력하세요."),
  weather: z
    .string()
    .max(120, "날씨는 120자 이내로 입력하세요.")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(2000, "메모는 2000자 이내로 입력하세요.")
    .optional()
    .or(z.literal("")),
});

export function parseSessionForm(formData: Pick<FormData, "get">): ParsedSessionForm {
  const parsed = sessionFormSchema.safeParse({
    date: formData.get("date"),
    startTime: formData.get("startTime") ?? "",
    location: formData.get("location"),
    weather: formData.get("weather") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      error: first?.message ?? "입력값이 올바르지 않습니다.",
    };
  }

  const { date, startTime, location, weather, notes } = parsed.data;
  return {
    ok: true,
    value: {
      date: new Date(`${date}T12:00:00Z`),
      startTime: startTime ? startTime : null,
      location,
      weather: weather ? weather : null,
      notes: notes ? notes : null,
    },
  };
}

export function dateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}
