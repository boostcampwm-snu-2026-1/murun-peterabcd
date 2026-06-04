"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireHostOrAdmin } from "@/lib/guard";
import { deleteUploadedFile, saveUploadedFile } from "@/lib/uploads";

const sessionIdSchema = z.string().min(1).max(40);

/**
 * 단체사진 업로드. 호스트/ADMIN 만. 기존 사진이 있으면 새 업로드 성공 후 best-effort 로 삭제.
 *
 * 순서: 호스트 가드 → File 검증/저장 → DB update (성공 시 commit) → 기존 파일 정리.
 * 디스크 쓰기 실패 시 DB 변경 X. DB 실패 시 새 파일은 남는데, cuid 라 충돌 없고
 * 다음 업로드 시 별도 정리됨 — 백업 cron 의 일부로 orphan 청소는 Week 3.
 */
export async function uploadSessionPhoto(formData: FormData): Promise<void> {
  const sessionId = sessionIdSchema.parse(formData.get("sessionId"));
  await requireHostOrAdmin(sessionId);

  const file = formData.get("photo");
  if (!(file instanceof File)) {
    throw new Error("사진 파일이 누락되었습니다.");
  }

  const existing = await db.session.findUnique({
    where: { id: sessionId },
    select: { groupPhotoPath: true },
  });

  const { relPath } = await saveUploadedFile(file, "sessions");

  await db.session.update({
    where: { id: sessionId },
    data: { groupPhotoPath: relPath },
  });

  if (existing?.groupPhotoPath) {
    await deleteUploadedFile(existing.groupPhotoPath);
  }

  revalidatePath(`/sessions/${sessionId}`);
}

/**
 * 단체사진 제거. 호스트/ADMIN 만. DB 먼저 비우고 디스크는 best-effort.
 */
export async function removeSessionPhoto(formData: FormData): Promise<void> {
  const sessionId = sessionIdSchema.parse(formData.get("sessionId"));
  await requireHostOrAdmin(sessionId);

  const existing = await db.session.findUnique({
    where: { id: sessionId },
    select: { groupPhotoPath: true },
  });

  if (!existing?.groupPhotoPath) {
    return; // 이미 없음
  }

  await db.session.update({
    where: { id: sessionId },
    data: { groupPhotoPath: null },
  });
  await deleteUploadedFile(existing.groupPhotoPath);

  revalidatePath(`/sessions/${sessionId}`);
}
