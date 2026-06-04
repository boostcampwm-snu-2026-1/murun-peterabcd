"use client";

import { useActionState } from "react";

import { ErrorAlert } from "@/components/form/ErrorAlert";
import { SubmitButton } from "@/components/form/SubmitButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { upsertParticipation, deleteParticipation } from "../actions";
import { splitDurationSec } from "@/lib/pace";

type Props = {
  sessionId: number;
  existing: {
    distanceKm: number | null;
    durationSec: number | null;
    note: string | null;
  } | null;
};

/**
 * 본인 행 추가/수정 폼. existing 이 null 이면 빈 폼 + [추가], 있으면 prefill + [수정] / [삭제].
 * Client component — useActionState 로 검증 에러 표시, useFormStatus 로 더블 클릭 차단.
 */
export function MyParticipationForm({ sessionId, existing }: Props) {
  const has = existing != null;
  const distanceDefault = existing?.distanceKm ?? "";
  const { minutes, seconds } = splitDurationSec(existing?.durationSec ?? null);
  const noteDefault = existing?.note ?? "";

  const [upsertState, upsertAction] = useActionState(
    upsertParticipation,
    null,
  );
  const [, deleteAction] = useActionState(deleteParticipation, null);
  const upsertError =
    upsertState && !upsertState.ok ? upsertState.error : null;

  return (
    <section className="flex flex-col gap-4 rounded-md border p-4">
      <header className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">내 기록</h3>
        {has && (
          <span className="text-xs text-muted-foreground">현재 입력됨</span>
        )}
      </header>

      <form action={upsertAction} className="flex flex-col gap-4">
        <input type="hidden" name="sessionId" value={sessionId} />

        <ErrorAlert message={upsertError} />

        <div className="flex flex-col gap-2">
          <Label htmlFor="distanceKm">거리 (km)</Label>
          <Input
            id="distanceKm"
            name="distanceKm"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            max="1000"
            placeholder="예: 5.0"
            defaultValue={distanceDefault}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>기록</Label>
          <div className="flex items-center gap-2">
            <Input
              name="durationMin"
              type="number"
              inputMode="numeric"
              min="0"
              max="1440"
              placeholder="분"
              defaultValue={minutes}
              className="w-24"
              aria-label="기록 (분)"
            />
            <span className="text-muted-foreground">분</span>
            <Input
              name="durationSec"
              type="number"
              inputMode="numeric"
              min="0"
              max="59"
              placeholder="초"
              defaultValue={seconds}
              className="w-24"
              aria-label="기록 (초)"
            />
            <span className="text-muted-foreground">초</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="note">메모 (선택)</Label>
          <Textarea
            id="note"
            name="note"
            placeholder="컨디션 / 신발 / 코스 후기 등"
            rows={2}
            maxLength={500}
            defaultValue={noteDefault}
          />
        </div>

        <SubmitButton
          idleLabel={has ? "수정" : "추가"}
          pendingLabel="저장 중..."
        />
      </form>

      {has && (
        <form action={deleteAction}>
          <input type="hidden" name="sessionId" value={sessionId} />
          <SubmitButton
            variant="outline"
            size="sm"
            className="w-full"
            idleLabel="내 기록 삭제"
            pendingLabel="삭제 중..."
          />
        </form>
      )}
    </section>
  );
}
