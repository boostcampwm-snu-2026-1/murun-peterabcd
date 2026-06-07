import { ImageResponse } from "next/og";

import { getOgFonts } from "@/lib/og-font";

// 기본 사이트 OG (홈/그 외 페이지에서 더 구체적인 게 없을 때). 1200x630.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const alt = "뮤런 — 애니뮤 러닝 소모임 아카이브";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function DefaultOg() {
  let fonts: Awaited<ReturnType<typeof getOgFonts>> | undefined;
  try {
    fonts = await getOgFonts();
  } catch {
    fonts = undefined;
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          padding: 80,
          fontFamily: fonts ? "Noto Sans KR" : "sans-serif",
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
            gap: 16,
          }}
        >
          <div style={{ fontSize: 96, fontWeight: 700, lineHeight: 1.1 }}>
            뮤런
          </div>
          <div style={{ fontSize: 36, opacity: 0.85, fontWeight: 400 }}>
            애니뮤 러닝 소모임의 정기 운동 아카이브
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
