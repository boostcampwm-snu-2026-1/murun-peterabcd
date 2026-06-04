"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireApproved } from "@/lib/guard";

// 폼 입력 스키마. date는 yyyy-MM-dd 문자열로 받고 서버에서 Date 로 변환.
// startTime 은 "HH:mm" 자유 입력 (검증 느슨하게).
const createSessionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식: YYYY-MM-DD"),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "시간 형식: HH:MM")
    .optional()
    .or(z.literal("")),
  location: z.string().min(1, "장소를 입력하세요").max(120),
  weather: z.string().max(120).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export async function createSession(formData: FormData): Promise<void> {
  const host = await requireApproved();

  const parsed = createSessionSchema.safeParse({
    date: formData.get("date"),
    startTime: formData.get("startTime") ?? "",
    location: formData.get("location"),
    weather: formData.get("weather") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    // 첫 에러 메시지를 throw — Next 의 error boundary 가 받음.
    // 폼 측 inline 에러 표시는 다음 PR (react-hook-form 도입 시) 로 미룸.
    const first = parsed.error.issues[0];
    throw new Error(first?.message ?? "입력값이 올바르지 않습니다");
  }

  const { date, startTime, location, weather, notes } = parsed.data;

  // SQLite 의 DateTime 은 UTC 로 저장. date-only 의미라 시각은 정오로 박아 timezone 어긋남 방지.
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
