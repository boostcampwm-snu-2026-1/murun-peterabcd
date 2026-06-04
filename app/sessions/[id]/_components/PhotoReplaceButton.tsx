"use client";

import { useRef } from "react";



type Props = {
  sessionId: number;
  /**
   * useActionState 가 만들어준 formAction. 부모(PhotoSection) 의 alert/pending 상태와
   * 공유하기 위해 props 로 받음.
   */
  formAction: (formData: FormData) => void;
};

/**
 * 사진 우측 [교체] 버튼. 파일 선택 즉시 form auto-submit.
 * upload action 은 PhotoSection 의 useActionState 가 관리 — 결과/pending 이 한 곳에.
 */
export function PhotoReplaceButton({ sessionId, formAction }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={formAction} className="inline-flex">
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

