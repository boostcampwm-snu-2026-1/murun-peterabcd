// 업로드된 파일 스트리밍 라우트.
//   - GET /api/uploads/sessions/yyyy/mm/<id>.<ext>
//   - 인증: requireApproved (승인된 멤버만 사진 조회). OG 이미지(비로그인 허용)는
//     Week 3 stretch 에서 별도 라우트로 처리.
//   - 보안: path traversal 차단을 위해 resolveUploadPath 로 prefix 검증.

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";

import { NextResponse } from "next/server";

import { requireApproved } from "@/lib/guard";
import {
  contentTypeFromExt,
  pathToEtag,
  resolveUploadPath,
} from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  await requireApproved();

  const { path: segs } = await context.params;
  if (!segs?.length) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // URL 디코드 + 슬래시 결합. 다음 단계에서 resolveUploadPath 가 ../ 차단.
  const relPath = segs.map((s) => decodeURIComponent(s)).join("/");
  const abs = resolveUploadPath(relPath);
  if (!abs) {
    return new NextResponse("Invalid path", { status: 400 });
  }

  let fileStat;
  try {
    fileStat = await stat(abs);
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
  if (!fileStat.isFile()) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const etag = pathToEtag(relPath);
  if (request.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag } });
  }

  const stream = Readable.toWeb(
    createReadStream(abs),
  ) as unknown as ReadableStream<Uint8Array>;

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": contentTypeFromExt(abs),
      "Content-Length": fileStat.size.toString(),
      "Cache-Control": "private, max-age=31536000, immutable",
      ETag: etag,
    },
  });
}
