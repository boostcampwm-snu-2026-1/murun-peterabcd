"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireApproved } from "@/lib/guard";
import { parseParticipationForm } from "@/lib/participation-form";

export type ParticipationResult =
  | { ok: true }
  | { ok: false; error: string };

const sessionIdSchema = z.coerce.number().int().positive();

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

  const parsedParticipation = parseParticipationForm(formData);
  if (!parsedParticipation.ok) return parsedParticipation;
  const { distanceKm, durationSec, note } = parsedParticipation.value;

  await db.participation.upsert({
    where: {
      sessionId_userId: { sessionId, userId: user.id },
    },
    create: {
      sessionId,
      userId: user.id,
      distanceKm,
      durationSec,
      note,
    },
    update: {
      distanceKm,
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
