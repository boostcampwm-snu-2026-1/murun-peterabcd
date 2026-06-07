"use client";

import { useRef } from "react";

import {
  ALLOWED_ACCEPT_ATTR,
  checkUploadFile,
} from "@/lib/upload-limits";

type Props = {
  sessionId: number;
  /**
   * useActionState 가 만들어준 formAction. 부모(PhotoSection) 의 alert/pending
   * 상태와 공유하기 위해 props 로 받는다.
   */
  formAction: (formData: FormData) => void;
  /**
   * client preflight 가 막은 에러를 부모 ErrorAlert 로 올린다.
   */
  onClientError: (message: string | null) => void;
};

/**
 * 사진 우측 [교체] 버튼. 파일 선택 즉시 form auto-submit.
 *
 * - 파일 크기/형식은 client preflight 로 미리 잡아서 server action body limit
 *   (Next 기본 1MB) 에 의한 generic 413 을 막는다.
 * - 통과한 경우에만 form.requestSubmit() 으로 server action 호출.
 */
export function PhotoReplaceButton({
  sessionId,
  formAction,
  onClientError,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={formAction} className="inline-flex">
      <input type="hidden" name="sessionId" value={sessionId} />
      <label className="cursor-pointer text-muted-foreground underline underline-offset-4 hover:text-foreground">
        교체
        <input
          type="file"
          name="photo"
          accept={ALLOWED_ACCEPT_ATTR}
          className="hidden"
          onChange={(e) => {
            const f = e.currentTarget.files?.[0] ?? null;
            if (!f) {
              onClientError(null);
              return;
            }
            const err = checkUploadFile(f);
            if (err) {
              onClientError(err);
              e.currentTarget.value = "";
              return;
            }
            onClientError(null);
            formRef.current?.requestSubmit();
          }}
        />
      </label>
    </form>
  );
}
