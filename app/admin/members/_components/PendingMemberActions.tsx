"use client";

import { useActionState } from "react";

import { ErrorAlert } from "@/components/form/ErrorAlert";
import { SubmitButton } from "@/components/form/SubmitButton";

import { approveUser, rejectUser } from "../actions";

type Props = {
  userId: string;
};

/**
 * 승인 대기 1행에 붙는 [승인] / [거절] 버튼.
 * 두 server action 을 각각 useActionState 로 묶고, 에러는 행 아래 inline alert.
 * 같은 row 에서 두 버튼이 같은 alert 영역을 공유.
 */
export function PendingMemberActions({ userId }: Props) {
  const [approveState, approveAction] = useActionState(approveUser, null);
  const [rejectState, rejectAction] = useActionState(rejectUser, null);

  const error =
    (approveState && !approveState.ok ? approveState.error : null) ??
    (rejectState && !rejectState.ok ? rejectState.error : null);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <form action={approveAction}>
          <input type="hidden" name="userId" value={userId} />
          <SubmitButton size="sm" idleLabel="승인" pendingLabel="승인 중..." />
        </form>
        <form action={rejectAction}>
          <input type="hidden" name="userId" value={userId} />
          <SubmitButton
            variant="outline"
            size="sm"
            idleLabel="거절"
            pendingLabel="거절 중..."
          />
        </form>
      </div>
      <ErrorAlert message={error} />
    </div>
  );
}
