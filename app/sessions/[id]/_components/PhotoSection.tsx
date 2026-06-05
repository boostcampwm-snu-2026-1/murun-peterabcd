"use client";

import Image from "next/image";
import { useActionState } from "react";

import { ErrorAlert } from "@/components/form/ErrorAlert";
import { SubmitButton } from "@/components/form/SubmitButton";

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
 */
export function PhotoSection({
  sessionId,
  groupPhotoPath,
  canEdit,
  altText,
}: Props) {
  const [uploadState, uploadAction] = useActionState(uploadSessionPhoto, null);
  const [removeState, removeAction] = useActionState(removeSessionPhoto, null);
  const uploadError =
    uploadState && !uploadState.ok ? uploadState.error : null;
  const removeError =
    removeState && !removeState.ok ? removeState.error : null;
  const error = uploadError ?? removeError;

  if (groupPhotoPath) {
    const src = `/api/uploads/${encodePath(groupPhotoPath)}`;
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
              <PhotoReplaceButton sessionId={sessionId} formAction={uploadAction} />
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
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <input type="hidden" name="sessionId" value={sessionId} />
          <input
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            required
            className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-accent"
          />
          <SubmitButton
            size="sm"
            idleLabel="올리기"
            pendingLabel="올리는 중..."
          />
        </form>
        <p className="text-xs text-muted-foreground">
          jpg / png / webp / heic, 최대 15MB.
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

function encodePath(relPath: string): string {
  return relPath
    .split("/")
    .map((s) => encodeURIComponent(s))
    .join("/");
}
