"use client";

import { useActionState } from "react";

import { ErrorAlert } from "@/components/form/ErrorAlert";
import { SubmitButton } from "@/components/form/SubmitButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { createSession } from "../actions";

export function NewSessionForm({ today }: { today: string }) {
  const [state, formAction] = useActionState(createSession, null);
  const errorMessage = state && !state.ok ? state.error : null;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <ErrorAlert message={errorMessage} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="date">날짜</Label>
        <Input id="date" name="date" type="date" defaultValue={today} required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="startTime">시작 시간 (선택)</Label>
        <Input
          id="startTime"
          name="startTime"
          type="time"
          placeholder="예: 19:30"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="location">장소</Label>
        <Input
          id="location"
          name="location"
          type="text"
          required
          maxLength={120}
          placeholder="예: 서울숲 입구"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="weather">날씨 (선택)</Label>
        <Input
          id="weather"
          name="weather"
          type="text"
          maxLength={120}
          placeholder="예: 맑음 / 22°C"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">코스 메모 (선택)</Label>
        <Textarea
          id="notes"
          name="notes"
          maxLength={2000}
          placeholder="코스, 페이스 권장, 모임 후 식당 등"
          rows={4}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        단체사진은 세션 생성 후 상세 페이지에서 올릴 수 있습니다.
      </p>

      <SubmitButton
        size="lg"
        idleLabel="세션 만들기"
        pendingLabel="만드는 중..."
      />
    </form>
  );
}
