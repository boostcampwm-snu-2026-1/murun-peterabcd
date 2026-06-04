import Image from "next/image";

import { Button } from "@/components/ui/button";

import { uploadSessionPhoto, removeSessionPhoto } from "../photo-actions";
import { PhotoReplaceButton } from "./PhotoReplaceButton";

type Props = {
  sessionId: string;
  groupPhotoPath: string | null;
  canEdit: boolean;
  altText: string;
};

/**
 * 세션 단체사진 영역.
 *   - 사진 있음: next/image 로 16:9 표시. canEdit 면 [교체]/[삭제].
 *   - 사진 없음 + canEdit: 업로드 폼.
 *   - 사진 없음 + 비편집자: "사진 없음" placeholder.
 */
export function PhotoSection({
  sessionId,
  groupPhotoPath,
  canEdit,
  altText,
}: Props) {
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
          <div className="mt-2 flex gap-3 text-xs">
            <PhotoReplaceButton sessionId={sessionId} />
            <RemoveForm sessionId={sessionId} />
          </div>
        )}
      </section>
    );
  }

  if (canEdit) {
    return (
      <section className="mb-6 rounded-md border border-dashed p-4">
        <p className="mb-2 text-xs text-muted-foreground">단체사진 (선택)</p>
        <UploadForm sessionId={sessionId} />
        <p className="mt-2 text-xs text-muted-foreground">
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

function UploadForm({ sessionId }: { sessionId: string }) {
  return (
    <form
      action={uploadSessionPhoto}
      encType="multipart/form-data"
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
      <Button type="submit" size="sm">
        올리기
      </Button>
    </form>
  );
}

function RemoveForm({ sessionId }: { sessionId: string }) {
  return (
    <form action={removeSessionPhoto}>
      <input type="hidden" name="sessionId" value={sessionId} />
      <button
        type="submit"
        className="text-muted-foreground underline underline-offset-4 hover:text-destructive"
      >
        삭제
      </button>
    </form>
  );
}

/**
 * path 의 각 segment 를 안전하게 URL 인코딩.
 */
function encodePath(relPath: string): string {
  return relPath
    .split("/")
    .map((s) => encodeURIComponent(s))
    .join("/");
}
