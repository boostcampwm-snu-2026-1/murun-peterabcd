import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import sharp from "sharp";

import { db } from "@/lib/db";
import { getOgFonts } from "@/lib/og-font";
import { resolveUploadPath } from "@/lib/uploads";

// /sessions/[id] 의 OG 이미지 (1200x630).
//
// 카톡/슬랙 등 외부 크롤러는 인증을 안 하므로 이 라우트는 의도적으로 public.
// `middleware.ts` 가 `opengraph-image` 로 끝나는 path 를 auth 우회 처리한다.
// 단체사진은 1200x630 으로 리사이즈 + JPEG 70% 품질로 압축해 data URL 로 embed.
// 사진이 없으면 그라데이션 + 텍스트만.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const alt = "뮤런 세션";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SessionOgImage({ params }: Props) {
  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);

  const sessionRow =
    Number.isFinite(id) && id > 0
      ? await db.session.findUnique({
          where: { id },
          select: {
            date: true,
            location: true,
            groupPhotoPath: true,
            host: { select: { name: true } },
          },
        })
      : null;

  let photoDataUrl: string | null = null;
  if (sessionRow?.groupPhotoPath) {
    try {
      const abs = resolveUploadPath(sessionRow.groupPhotoPath);
      if (abs) {
        // 디스크에서 원본을 읽고 OG 크기로 리사이즈 + JPEG 압축.
        const buf = await readFile(abs);
        const resized = await sharp(buf)
          .resize(size.width, size.height, { fit: "cover" })
          .jpeg({ quality: 72, mozjpeg: true })
          .toBuffer();
        photoDataUrl = `data:image/jpeg;base64,${resized.toString("base64")}`;
      }
    } catch {
      photoDataUrl = null;
    }
  }

  let fonts: Awaited<ReturnType<typeof getOgFonts>> | undefined;
  try {
    fonts = await getOgFonts();
  } catch {
    fonts = undefined;
  }

  const dateText = sessionRow
    ? new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      }).format(sessionRow.date)
    : "뮤런";

  const locationText = sessionRow?.location ?? "애니뮤 러닝";
  const hostText = sessionRow ? `호스트 · ${sessionRow.host.name}` : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          background: "#0f172a",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          fontFamily: fonts ? "Noto Sans KR" : "sans-serif",
        }}
      >
        {photoDataUrl && (
          // 단체사진 배경. ImageResponse(Satori) 는 <Image> 미지원, 일반 <img> 필수.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoDataUrl}
            alt=""
            width={size.width}
            height={size.height}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.55,
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(15,23,42,0.35) 0%, rgba(15,23,42,0.85) 80%)",
          }}
        />
        <div
          style={{
            position: "relative",
            padding: 80,
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
          }}
        >
          <div
            style={{
              fontSize: 28,
              opacity: 0.7,
              letterSpacing: 4,
            }}
          >
            MURUN
          </div>
          <div
            style={{
              marginTop: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 36, opacity: 0.85, fontWeight: 400 }}>
              {dateText}
            </div>
            <div style={{ fontSize: 78, fontWeight: 700, lineHeight: 1.1 }}>
              {locationText}
            </div>
            {hostText && (
              <div
                style={{
                  fontSize: 28,
                  opacity: 0.8,
                  marginTop: 8,
                  fontWeight: 400,
                }}
              >
                {hostText}
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
