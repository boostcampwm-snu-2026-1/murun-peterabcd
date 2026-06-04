// 단체사진 업로드 helper. 로컬 볼륨(`UPLOADS_DIR`) 에 파일 저장.
//
// 보안 메모:
//   - 외부 입력 (사용자 업로드 파일명) 은 절대 path 에 직접 박지 않는다.
//   - 새 파일은 항상 server-generated id + MIME 기반 확장자.
//   - 조회 시 path traversal (`../`) 차단을 위해 resolveUploadPath() 의
//     prefix 검증을 거친다.

import { createHash, randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

/**
 * UPLOADS_DIR 절대 경로. 없으면 `./uploads`.
 */
export function getUploadsDir(): string {
  const raw = process.env.UPLOADS_DIR?.trim() || "./uploads";
  return path.resolve(raw);
}

/**
 * 저장된 상대 path (DB 의 `groupPhotoPath`) → 호스트 절대 경로.
 * UPLOADS_DIR 밖으로 escape 시도하면 null.
 */
export function resolveUploadPath(relPath: string): string | null {
  if (!relPath) return null;
  const base = getUploadsDir();
  const abs = path.resolve(base, relPath);
  const rel = path.relative(base, abs);
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return abs;
}

/**
 * MIME 타입에서 확장자 추출.
 */
function extFromMime(mime: string): string | null {
  return MIME_TO_EXT[mime.toLowerCase()] ?? null;
}

/**
 * 파일 확장자에서 Content-Type 추출 (서빙용).
 */
export function contentTypeFromExt(filePath: string): string {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  return CONTENT_TYPE_BY_EXT[ext] ?? "application/octet-stream";
}

/**
 * 사용자 업로드 File 을 디스크에 저장. 상대 path (DB 저장용) 를 반환.
 *
 * subDir 예: "sessions" → "sessions/yyyy/mm/<id>.<ext>"
 *
 * 검증 실패 (size/mime) 시 throw — 호출자가 잡아서 사용자에게 명확한 에러.
 */
export async function saveUploadedFile(
  file: File,
  subDir: string,
): Promise<{ relPath: string; absPath: string }> {
  if (file.size <= 0) {
    throw new Error("빈 파일입니다.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `파일이 너무 큽니다 (${(file.size / 1024 / 1024).toFixed(1)} MB > 15 MB).`,
    );
  }
  const mime = (file.type || "").toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    throw new Error(
      "지원하지 않는 파일 형식입니다. (jpg/png/webp/heic 만 허용)",
    );
  }
  const ext = extFromMime(mime);
  if (!ext) {
    throw new Error("파일 확장자를 결정할 수 없습니다.");
  }

  // yyyy/mm/ 디렉터리 분할 — 너무 많은 파일이 한 디렉터리에 쌓이는 거 방지
  const now = new Date();
  const yyyy = now.getUTCFullYear().toString();
  const mm = (now.getUTCMonth() + 1).toString().padStart(2, "0");

  // id 는 32 hex (= 16 bytes) — 충돌 방지에 충분, 짧고 URL-safe
  const id = randomBytes(16).toString("hex");

  const relPath = path.posix.join(subDir, yyyy, mm, `${id}.${ext}`);
  const base = getUploadsDir();
  const absPath = path.resolve(base, relPath);
  await mkdir(path.dirname(absPath), { recursive: true });

  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(absPath, buf);

  return { relPath, absPath };
}

/**
 * 저장된 파일을 best-effort 로 삭제. 파일이 없거나 권한 문제로 실패해도 throw 안 함.
 */
export async function deleteUploadedFile(relPath: string): Promise<void> {
  const abs = resolveUploadPath(relPath);
  if (!abs) return;
  if (!existsSync(abs)) return;
  try {
    await unlink(abs);
  } catch {
    // 무시 — DB 가 진실의 원천, 디스크는 후행적으로 정리되면 됨
  }
}

/**
 * Cache-Control 용 ETag — path 자체가 cuid 라 같은 path 면 같은 파일.
 * 다만 안전을 위해 path hash 도 같이.
 */
export function pathToEtag(relPath: string): string {
  return `"${createHash("sha1").update(relPath).digest("hex").slice(0, 16)}"`;
}
