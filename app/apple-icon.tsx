import { ImageResponse } from "next/og";

// iOS 홈 화면 추가용 아이콘 (180x180).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 130,
          background: "#0f172a",
          color: "#ffffff",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          letterSpacing: -4,
        }}
      >
        M
      </div>
    ),
    { ...size },
  );
}
