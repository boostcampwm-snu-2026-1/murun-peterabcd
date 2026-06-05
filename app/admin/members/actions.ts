"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";

export type AdminMemberResult = { ok: true } | { ok: false; error: string };

const userIdSchema = z.object({ userId: z.string().min(1).max(40) });

function parseUserId(formData: FormData): string | null {
  const parsed = userIdSchema.safeParse({ userId: formData.get("userId") });
  return parsed.success ? parsed.data.userId : null;
}

export async function approveUser(
  _prev: AdminMemberResult | null,
  formData: FormData,
): Promise<AdminMemberResult> {
  const admin = await requireAdmin();
  const userId = parseUserId(formData);
  if (!userId) {
    return { ok: false, error: "사용자 ID 가 올바르지 않습니다." };
  }
  if (userId === admin.id) {
    return { ok: false, error: "본인은 본인을 승인할 수 없습니다." };
  }
  await db.user.update({
    where: { id: userId },
    data: {
      approved: true,
      approvedById: admin.id,
      approvedAt: new Date(),
    },
  });
  revalidatePath("/admin/members");
  return { ok: true };
}

export async function rejectUser(
  _prev: AdminMemberResult | null,
  formData: FormData,
): Promise<AdminMemberResult> {
  const admin = await requireAdmin();
  const userId = parseUserId(formData);
  if (!userId) {
    return { ok: false, error: "사용자 ID 가 올바르지 않습니다." };
  }
  if (userId === admin.id) {
    return { ok: false, error: "본인은 본인을 거절할 수 없습니다." };
  }
  // hard delete. Account 는 cascade 로 자동 정리.
  // 거절은 가입 직후에만 일어나는 흐름이라 host/participation FK 가 걸리지 않음.
  await db.user.delete({ where: { id: userId } });
  revalidatePath("/admin/members");
  return { ok: true };
}
