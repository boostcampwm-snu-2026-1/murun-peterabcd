"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireApproved } from "@/lib/guard";

export type CreateSessionResult =
  | { ok: true }
  | { ok: false; error: string };

// 폼 입력 스키마. 메시지가 사용자에게 그대로 노출되므로 한국어.
const createSessionSchema = z.object({
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

/**
 * 호스트가 새 세션을 만든다.
 * useActionState 시그니처 — first arg 는 이전 state, 무시.
 * 성공 시 redirect 가 throw 하므로 ok return 은 type-level 만 도달 가능.
 */
export async function createSession(
  _prev: CreateSessionResult | null,
  formData: FormData,
): Promise<CreateSessionResult> {
  const host = await requireApproved();

  const parsed = createSessionSchema.safeParse({
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
  const dateValue = new Date(`${date}T12:00:00Z`);

  const created = await db.session.create({
    data: {
      date: dateValue,
      startTime: startTime ? startTime : null,
      location,
      weather: weather ? weather : null,
      notes: notes ? notes : null,
      hostId: host.id,
    },
    select: { id: true },
  });

  redirect(`/sessions/${created.id}`);
}
