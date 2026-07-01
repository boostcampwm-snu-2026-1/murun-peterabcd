"use client";

import { useActionState } from "react";

import { ErrorAlert } from "@/components/form/ErrorAlert";
import { SubmitButton } from "@/components/form/SubmitButton";
import { UtilityCard } from "@/components/layout/AppChrome";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { deleteSession, updateSession } from "../actions";

type Props = {
  session: {
    id: number;
    date: string;
    startTime: string;
    location: string;
    weather: string;
    notes: string;
  };
};

export function EditSessionForm({ session }: Props) {
  const [updateState, updateAction] = useActionState(updateSession, null);
  const [deleteState, deleteAction] = useActionState(deleteSession, null);
  const updateError = updateState && !updateState.ok ? updateState.error : null;
  const deleteError = deleteState && !deleteState.ok ? deleteState.error : null;

  return (
    <div className="flex flex-col gap-8">
      <UtilityCard>
        <form action={updateAction} className="flex flex-col gap-5">
          <input type="hidden" name="sessionId" value={session.id} />
          <ErrorAlert message={updateError} />

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="date">날짜</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={session.date}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="startTime">시작 시간 (선택)</Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                defaultValue={session.startTime}
                placeholder="예: 19:30"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="location">장소</Label>
            <Input
              id="location"
              name="location"
              type="text"
              required
              maxLength={120}
              defaultValue={session.location}
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
              defaultValue={session.weather}
              placeholder="예: 맑음 / 22°C"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">코스 메모 (선택)</Label>
            <Textarea
              id="notes"
              name="notes"
              maxLength={2000}
              defaultValue={session.notes}
              placeholder="코스, 페이스 권장, 모임 후 식당 등"
              rows={5}
            />
          </div>

          <SubmitButton idleLabel="세션 수정" pendingLabel="저장 중..." />
        </form>
      </UtilityCard>

      <UtilityCard className="border-destructive/40 bg-white">
        <form action={deleteAction} className="flex flex-col gap-4">
          <input type="hidden" name="sessionId" value={session.id} />
          <div className="flex flex-col gap-2">
            <h2 className="font-text text-[17px] font-semibold leading-[1.24] tracking-[-0.374px] text-destructive">
              세션 삭제
            </h2>
            <p className="font-text text-sm leading-[1.43] tracking-[-0.224px] text-apple-muted-48">
              세션, 참여 기록, 단체사진 파일을 삭제합니다. 삭제 후에는 되돌릴 수 없습니다.
            </p>
          </div>
          <ErrorAlert message={deleteError} />
          <label className="flex items-center gap-3 font-text text-sm leading-[1.43] tracking-[-0.224px] text-apple-ink">
            <input
              type="checkbox"
              name="confirmDelete"
              value="yes"
              className="size-4 accent-apple-primary"
            />
            이 세션을 삭제한다는 것을 확인했습니다.
          </label>
          <SubmitButton
            variant="destructive"
            idleLabel="세션 삭제"
            pendingLabel="삭제 중..."
          />
        </form>
      </UtilityCard>
    </div>
  );
}
