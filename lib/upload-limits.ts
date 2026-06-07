// 업로드 제한 / 검증 — pure (no node deps). client/server 양쪽에서 import 가능.
//
// 같은 사실(15MB, 허용 MIME)을:
//   - server: photo-actions / lib/uploads 에서 최종 검증
//   - client: PhotoSection / PhotoReplaceButton 에서 사전 검증
// 양쪽이 같은 값을 보게 하려고 여기 한 곳에 둔다.

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB
export const MAX_UPLOAD_MB = MAX_UPLOAD_BYTES / 1024 / 1024;

export const ALLOWED_MIME_TYPES = new Set<string>([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export const ALLOWED_ACCEPT_ATTR =
  "image/jpeg,image/png,image/webp,image/heic,image/heif";

/**
 * 업로드 전 사전 검증. 통과면 null, 실패면 사용자에게 보여줄 한국어 에러.
 *
 * 주의:
 *   - 이 함수는 client/server 둘 다에서 호출된다.
 *   - server action 본문 안에서 한 번 더 호출해 "client preflight 우회" 를 막는다.
 */
export function checkUploadFile(file: File | null | undefined): string | null {
  if (!file) return "사진 파일을 선택하세요.";
  if (file.size <= 0) return "빈 파일입니다.";
  if (file.size > MAX_UPLOAD_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return `파일이 너무 큽니다 (${mb} MB > ${MAX_UPLOAD_MB} MB).`;
  }
  const mime = (file.type ?? "").toLowerCase();
  if (mime && !ALLOWED_MIME_TYPES.has(mime)) {
    return "지원하지 않는 파일 형식입니다. (jpg / png / webp / heic)";
  }
  return null;
}
