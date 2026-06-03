"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";

const userIdSchema = z.object({ userId: z.string().min(1) });

function parseUserId(formData: FormData): string {
  const parsed = userIdSchema.safeParse({ userId: formData.get("userId") });
  if (!parsed.success) {
    throw new Error("Invalid userId");
  }
  return parsed.data.userId;
}

export async function approveUser(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = parseUserId(formData);
  if (userId === admin.id) {
    throw new Error("관리자는 자기 자신을 승인할 수 없습니다.");
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
}

export async function rejectUser(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = parseUserId(formData);
  if (userId === admin.id) {
    throw new Error("관리자는 자기 자신을 거절할 수 없습니다.");
  }
  // hard delete. Account 는 cascade 로 자동 정리.
  // (만약 거절 대상이 이미 Session host 라면 FK 위반으로 실패 — Week 2 에선 정상 동작.
  //  거절은 가입 직후에만 일어나는 흐름이라 host 권한이 있을 일이 없다.)
  await db.user.delete({ where: { id: userId } });
  revalidatePath("/admin/members");
}
