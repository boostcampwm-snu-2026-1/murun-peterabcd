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
      <section className="mb-6">
        <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
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
          <div className="mt-2 flex flex-col gap-2">
            <ErrorAlert message={error} />
            <div className="flex gap-3 text-xs">
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
                  className="h-auto p-0 text-xs text-muted-foreground underline underline-offset-4 hover:text-destructive"
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
      <section className="mb-6 flex flex-col gap-3 rounded-md border border-dashed p-4">
        <p className="text-xs text-muted-foreground">단체사진 (선택)</p>
        <ErrorAlert message={error} />
        <form
          action={uploadAction}
          onSubmit={handleUploadSubmit}
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <input type="hidden" name="sessionId" value={sessionId} />
          <input
            type="file"
            name="photo"
            accept={ALLOWED_ACCEPT_ATTR}
            required
            onChange={handleFileChange}
            className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-accent"
          />
          <SubmitButton
            size="sm"
            idleLabel="올리기"
            pendingLabel="올리는 중..."
          />
        </form>
        <p className="text-xs text-muted-foreground">
          jpg / png / webp / heic, 최대 {MAX_UPLOAD_MB}MB.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-6 aspect-video w-full rounded-md border border-dashed bg-muted/40 flex items-center justify-center">
      <span className="text-xs text-muted-foreground">사진 없음</span>
    </section>
  );
}

