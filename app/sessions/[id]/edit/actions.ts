"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireHostOrAdmin } from "@/lib/guard";
import { parseSessionForm } from "@/lib/session-form";
import { deleteUploadedFile } from "@/lib/uploads";

export type EditSessionResult =
  | { ok: true }
  | { ok: false; error: string };

const sessionIdSchema = z.coerce.number().int().positive();

function parseSessionId(formData: FormData): EditSessionResult & { value?: number } {
  const parsed = sessionIdSchema.safeParse(formData.get("sessionId"));
  if (!parsed.success) {
    return { ok: false, error: "세션 ID 가 올바르지 않습니다." };
  }
  return { ok: true, value: parsed.data };
}

export async function updateSession(
  _prev: EditSessionResult | null,
  formData: FormData,
): Promise<EditSessionResult> {
  const sid = parseSessionId(formData);
  if (!sid.ok) return sid;
  const sessionId = sid.value!;

  await requireHostOrAdmin(sessionId);

  const parsed = parseSessionForm(formData);
  if (!parsed.ok) return parsed;

  await db.session.update({
    where: { id: sessionId },
    data: parsed.value,
  });

  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath(`/sessions/${sessionId}/edit`);
  revalidatePath("/sessions");
  redirect(`/sessions/${sessionId}`);
}

export async function deleteSession(
  _prev: EditSessionResult | null,
  formData: FormData,
): Promise<EditSessionResult> {
  const sid = parseSessionId(formData);
  if (!sid.ok) return sid;
  const sessionId = sid.value!;

  await requireHostOrAdmin(sessionId);

  if (formData.get("confirmDelete") !== "yes") {
    return { ok: false, error: "삭제 확인 체크박스를 선택하세요." };
  }

  const existing = await db.session.findUnique({
    where: { id: sessionId },
    select: { groupPhotoPath: true },
  });
  if (!existing) {
    return { ok: false, error: "세션을 찾을 수 없습니다." };
  }

  await db.session.delete({ where: { id: sessionId } });

  if (existing.groupPhotoPath) {
    await deleteUploadedFile(existing.groupPhotoPath);
  }

  revalidatePath("/sessions");
  redirect("/sessions");
}
