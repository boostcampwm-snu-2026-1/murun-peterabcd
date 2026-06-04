"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireApproved } from "@/lib/guard";
import {
  parseDistanceInput,
  parseDurationInput,
} from "@/lib/pace";

const idSchema = z.string().min(1).max(40);
const noteSchema = z.string().max(500).optional().or(z.literal(""));

/**
 * 본인 (sessionId, userId) Participation 행을 upsert.
 * 외부 (다른 사람 행) 수정은 이 액션으로 못 한다 — userId 는 항상 server-side 의 현재 사용자.
 */
export async function upsertParticipation(formData: FormData): Promise<void> {
  const user = await requireApproved();

  const parsedSessionId = idSchema.safeParse(formData.get("sessionId"));
  if (!parsedSessionId.success) {
    throw new Error("Invalid sessionId");
  }
  const sessionId = parsedSessionId.data;

  const sessionExists = await db.session.findUnique({
    where: { id: sessionId },
    select: { id: true },
  });
  if (!sessionExists) {
    throw new Error("Session not found");
  }

  const distanceKm = parseDistanceInput(formData.get("distanceKm"));
  const durationSec = parseDurationInput(
    formData.get("durationMin"),
    formData.get("durationSec"),
  );

  const noteParsed = noteSchema.safeParse(formData.get("note") ?? "");
  if (!noteParsed.success) {
    throw new Error("메모는 500자 이내");
  }
  const note = noteParsed.data ? noteParsed.data : null;

  // 모든 값이 null 이면 의미 없는 행 — 거부.
  if (distanceKm == null && durationSec == null && !note) {
    throw new Error("거리 / 기록 / 메모 중 최소 한 가지를 입력하세요");
  }

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
}

/**
 * 본인 행만 삭제. sessionId + userId 로 한정.
 */
export async function deleteParticipation(formData: FormData): Promise<void> {
  const user = await requireApproved();

  const parsedSessionId = idSchema.safeParse(formData.get("sessionId"));
  if (!parsedSessionId.success) {
    throw new Error("Invalid sessionId");
  }
  const sessionId = parsedSessionId.data;

  await db.participation.deleteMany({
    where: { sessionId, userId: user.id },
  });

  revalidatePath(`/sessions/${sessionId}`);
}
