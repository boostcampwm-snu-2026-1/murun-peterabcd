// 업로드 URL encoding 만 담은 pure helper. client/server 양쪽에서 import 가능.
//
// lib/uploads.ts 는 node:fs / node:crypto 등 Node-only API 를 쓰므로
// "use client" 컴포넌트가 (transitively) import 하면 webpack 빌드가 깨진다.
// URL encoding 처럼 양쪽에서 필요한 순수 함수는 분리해서 보관한다.

/**
 * 저장된 상대 path (DB groupPhotoPath) 를 `/api/uploads/...` URL 의 path 부분으로
 * 안전하게 인코딩한다. 각 세그먼트만 percent-encode 해서 `/` 구분자는 그대로 둔다.
 */
export function encodeUploadPath(relPath: string): string {
  return relPath
    .split("/")
    .map((s) => encodeURIComponent(s))
    .join("/");
}
