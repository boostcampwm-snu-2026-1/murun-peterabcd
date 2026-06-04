"use client";

import { useRef } from "react";

import { uploadSessionPhoto } from "../photo-actions";

/**
 * 사진 우측 [교체] 버튼. 파일 선택 즉시 form auto-submit.
 * server action 은 같은 uploadSessionPhoto 를 그대로 호출 — DB 가 알아서 update.
 */
export function PhotoReplaceButton({ sessionId }: { sessionId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={formRef}
      action={uploadSessionPhoto}
      encType="multipart/form-data"
      className="inline-flex"
    >
      <input type="hidden" name="sessionId" value={sessionId} />
      <label className="cursor-pointer text-muted-foreground underline underline-offset-4 hover:text-foreground">
        교체
        <input
          type="file"
          name="photo"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="hidden"
          onChange={(e) => {
            if (e.currentTarget.files?.length) {
              formRef.current?.requestSubmit();
            }
          }}
        />
      </label>
    </form>
  );
}
