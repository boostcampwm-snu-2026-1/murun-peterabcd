"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireApproved } from "@/lib/guard";
import { parseOptionalNumber } from "@/lib/pace";

export type ParticipationResult =
  | { ok: true }
  | { ok: false; error: string };

const sessionIdSchema = z.coerce.number().int().positive();
const noteSchema = z
  .string()
  .max(500, "메모는 500자 이내로 입력하세요.")
  .optional()
  .or(z.literal(""));

function parseSessionIdField(formData: FormData): ParticipationResult & {
  value?: number;
} {
  const parsed = sessionIdSchema.safeParse(formData.get("sessionId"));
  if (!parsed.success) {
    return { ok: false, error: "세션 ID 가 올바르지 않습니다." };
  }
  return { ok: true, value: parsed.data };
}

/**
 * 본인 (sessionId, userId) Participation 행을 upsert.
 * 외부 (다른 사람 행) 수정은 이 액션으로 못 한다 — userId 는 항상 server-side 의 현재 사용자.
 * useActionState 시그니처.
 */
export async function upsertParticipation(
  _prev: ParticipationResult | null,
  formData: FormData,
): Promise<ParticipationResult> {
  const user = await requireApproved();

  const sid = parseSessionIdField(formData);
  if (!sid.ok) return sid;
  const sessionId = sid.value!;

  const sessionExists = await db.session.findUnique({
    where: { id: sessionId },
    select: { id: true },
  });
  if (!sessionExists) {
    return { ok: false, error: "세션을 찾을 수 없습니다." };
  }

  // 거리: 0 보다 커야 함, 1000 이하
  const distance = parseOptionalNumber(formData.get("distanceKm"), {
    min: 0.01,
    max: 1000,
    field: "거리(km)",
  });
  if (distance.error) return { ok: false, error: distance.error };

  // 분: 0 ~ 1440
  const minutes = parseOptionalNumber(formData.get("durationMin"), {
    min: 0,
    max: 1440,
    field: "분",
    integer: true,
  });
  if (minutes.error) return { ok: false, error: minutes.error };

  // 초: 0 ~ 59 (60 이상은 분으로 표현하라는 의미)
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
      error:
        noteParsed.error.issues[0]?.message ?? "메모가 올바르지 않습니다.",
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

  await db.participation.upsert({
    where: {
      sessionId_userId: { sessionId, userId: user.id },
    },
    create: {
      sessionId,
      userId: user.id,
      distanceKm: distance.value,
      durationSec,
      note,
    },
    update: {
      distanceKm: distance.value,
      durationSec,
      note,
    },
  });

  revalidatePath(`/sessions/${sessionId}`);
  return { ok: true };
}

/**
 * 본인 행만 삭제. useActionState 시그니처.
 */
export async function deleteParticipation(
  _prev: ParticipationResult | null,
  formData: FormData,
): Promise<ParticipationResult> {
  const user = await requireApproved();

  const sid = parseSessionIdField(formData);
  if (!sid.ok) return sid;
  const sessionId = sid.value!;

  await db.participation.deleteMany({
    where: { sessionId, userId: user.id },
  });

  revalidatePath(`/sessions/${sessionId}`);
  return { ok: true };
}
