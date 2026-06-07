import { ImageResponse } from "next/og";

// Favicon (32x32). Latin "M" — 한국어 폰트 fetch 없이도 안정적으로 렌더.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 22,
          background: "#0f172a",
          color: "#ffffff",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          letterSpacing: -1,
          borderRadius: 6,
        }}
      >
        M
      </div>
    ),
    { ...size },
  );
}
