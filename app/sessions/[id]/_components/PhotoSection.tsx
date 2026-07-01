"use client";

import Image from "next/image";
import { useActionState, useState } from "react";

import { ErrorAlert } from "@/components/form/ErrorAlert";
import { SubmitButton } from "@/components/form/SubmitButton";
import {
  ALLOWED_ACCEPT_ATTR,
  MAX_UPLOAD_MB,
  checkUploadFile,
} from "@/lib/upload-limits";
import { encodeUploadPath } from "@/lib/upload-url";

import { uploadSessionPhoto, removeSessionPhoto } from "../photo-actions";
import { PhotoReplaceButton } from "./PhotoReplaceButton";

type Props = {
  sessionId: number;
  groupPhotoPath: string | null;
  canEdit: boolean;
  altText: string;
};

/**
 * 세션 단체사진 영역.
 *   - 사진 있음: next/image 16:9. canEdit 면 [교체]/[삭제] + 에러 alert.
 *   - 사진 없음 + canEdit: 업로드 폼 + 에러 alert.
 *   - 사진 없음 + 비편집자: '사진 없음' placeholder.
 *
 * 큰 파일은 client preflight 에서 즉시 잡아준다. server action 의 body limit
 * 까지 도달했다가 generic 413 으로 죽는 케이스 방지. server-side 도 동일한
 * `checkUploadFile` 을 한 번 더 호출 (defense in depth).
 */
export function PhotoSection({
  sessionId,
  groupPhotoPath,
  canEdit,
  altText,
}: Props) {
  const [uploadState, uploadAction] = useActionState(uploadSessionPhoto, null);
  const [removeState, removeAction] = useActionState(removeSessionPhoto, null);
  const [clientError, setClientError] = useState<string | null>(null);

  const uploadError =
    uploadState && !uploadState.ok ? uploadState.error : null;
  const removeError =
    removeState && !removeState.ok ? removeState.error : null;
  const error = clientError ?? uploadError ?? removeError;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.currentTarget.files?.[0] ?? null;
    if (!f) {
      setClientError(null);
      return;
    }
    const err = checkUploadFile(f);
    if (err) {
      setClientError(err);
      e.currentTarget.value = "";
    } else {
      setClientError(null);
    }
  }

  function handleUploadSubmit(e: React.FormEvent<HTMLFormElement>) {
    const input = e.currentTarget.elements.namedItem(
      "photo",
    ) as HTMLInputElement | null;
    const f = input?.files?.[0] ?? null;
    const err = checkUploadFile(f);
    if (err) {
      e.preventDefault();
      setClientError(err);
    } else {
      setClientError(null);
    }
  }

  if (groupPhotoPath) {
    const src = `/api/uploads/${encodeUploadPath(groupPhotoPath)}`;
    return (
      <section className="mb-10">
        <div className="relative aspect-video w-full overflow-hidden rounded-[18px] border border-apple-hairline bg-apple-parchment">
          <Image
            src={src}
            alt={altText}
            fill
            unoptimized
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 720px"
          />
        </div>
        {canEdit && (
          <div className="mt-3 flex flex-col gap-3">
            <ErrorAlert message={error} />
            <div className="flex gap-4 font-text text-sm leading-[1.29] tracking-[-0.224px]">
              <PhotoReplaceButton
                sessionId={sessionId}
                formAction={uploadAction}
                onClientError={setClientError}
              />
              <form action={removeAction}>
                <input type="hidden" name="sessionId" value={sessionId} />
                <SubmitButton
                  variant="ghost"
                  size="sm"
                  className="h-auto rounded-none p-0 text-sm text-apple-primary underline underline-offset-4 hover:text-destructive"
                  idleLabel="삭제"
                  pendingLabel="삭제 중..."
                />
              </form>
            </div>
          </div>
        )}
      </section>
    );
  }

  if (canEdit) {
    return (
      <section className="mb-10 flex flex-col gap-4 rounded-[18px] border border-dashed border-apple-hairline bg-apple-canvas p-6">
        <p className="font-text text-sm font-semibold leading-[1.29] tracking-[-0.224px] text-apple-ink">단체사진 (선택)</p>
        <ErrorAlert message={error} />
        <form
          action={uploadAction}
          onSubmit={handleUploadSubmit}
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <input type="hidden" name="sessionId" value={sessionId} />
          <input
            type="file"
            name="photo"
            accept={ALLOWED_ACCEPT_ATTR}
            required
            onChange={handleFileChange}
            className="block w-full font-text text-sm leading-[1.43] tracking-[-0.224px] text-apple-muted-48 file:mr-3 file:rounded-full file:border file:border-apple-primary file:bg-apple-canvas file:px-4 file:py-2 file:text-sm file:font-normal file:text-apple-primary"
          />
          <SubmitButton
            size="sm"
            idleLabel="올리기"
            pendingLabel="올리는 중..."
          />
        </form>
        <p className="font-text text-xs leading-none tracking-[-0.12px] text-apple-muted-48">
          jpg / png / webp / heic, 최대 {MAX_UPLOAD_MB}MB.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-10 flex aspect-video w-full items-center justify-center rounded-[18px] border border-dashed border-apple-hairline bg-apple-canvas">
      <span className="font-text text-xs leading-none tracking-[-0.12px] text-apple-muted-48">사진 없음</span>
    </section>
  );
}

