"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireHostOrAdmin } from "@/lib/guard";
import { checkUploadFile } from "@/lib/upload-limits";
import { deleteUploadedFile, saveUploadedFile } from "@/lib/uploads";

export type PhotoResult = { ok: true } | { ok: false; error: string };

const sessionIdSchema = z.coerce.number().int().positive();

/**
 * 단체사진 업로드. 호스트/ADMIN 만. useActionState 시그니처.
 *
 * 순서: 가드 → 검증 → 저장 → DB update → 기존 파일 best-effort 삭제.
 */
export async function uploadSessionPhoto(
  _prev: PhotoResult | null,
  formData: FormData,
): Promise<PhotoResult> {
  const sidParsed = sessionIdSchema.safeParse(formData.get("sessionId"));
  if (!sidParsed.success) {
    return { ok: false, error: "세션 ID 가 올바르지 않습니다." };
  }
  const sessionId = sidParsed.data;
  await requireHostOrAdmin(sessionId);

  const file = formData.get("photo");
  const preflight = checkUploadFile(file instanceof File ? file : null);
  if (preflight) {
    return { ok: false, error: preflight };
  }
  const photo = file as File;

  const existing = await db.session.findUnique({
    where: { id: sessionId },
    select: { groupPhotoPath: true },
  });

  let relPath: string;
  try {
    const saved = await saveUploadedFile(photo, "sessions");
    relPath = saved.relPath;
  } catch (err) {
    // saveUploadedFile 안의 추가 검증(이미 위에서 잡지만 안전망)
    const message = err instanceof Error ? err.message : "파일 저장 실패";
    return { ok: false, error: message };
  }

  await db.session.update({
    where: { id: sessionId },
    data: { groupPhotoPath: relPath },
  });

  if (existing?.groupPhotoPath) {
    await deleteUploadedFile(existing.groupPhotoPath);
  }

  revalidatePath(`/sessions/${sessionId}`);
  return { ok: true };
}

/**
 * 단체사진 제거. 호스트/ADMIN 만. useActionState 시그니처.
 */
export async function removeSessionPhoto(
  _prev: PhotoResult | null,
  formData: FormData,
): Promise<PhotoResult> {
  const sidParsed = sessionIdSchema.safeParse(formData.get("sessionId"));
  if (!sidParsed.success) {
    return { ok: false, error: "세션 ID 가 올바르지 않습니다." };
  }
  const sessionId = sidParsed.data;
  await requireHostOrAdmin(sessionId);

  const existing = await db.session.findUnique({
    where: { id: sessionId },
    select: { groupPhotoPath: true },
  });

  if (!existing?.groupPhotoPath) {
    return { ok: true }; // 이미 없음 — noop
  }

  await db.session.update({
    where: { id: sessionId },
    data: { groupPhotoPath: null },
  });
  await deleteUploadedFile(existing.groupPhotoPath);

  revalidatePath(`/sessions/${sessionId}`);
  return { ok: true };
}
