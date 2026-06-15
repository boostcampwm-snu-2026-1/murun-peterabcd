"use server";

import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { requireApproved } from "@/lib/guard";
import { parseSessionForm } from "@/lib/session-form";

export type CreateSessionResult =
  | { ok: true }
  | { ok: false; error: string };


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

  const parsed = parseSessionForm(formData);
  if (!parsed.ok) return parsed;

  const { date, startTime, location, weather, notes } = parsed.value;

  const created = await db.session.create({
    data: {
      date,
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
