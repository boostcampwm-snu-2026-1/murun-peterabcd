import { ImageResponse } from "next/og";

// PWA manifest 가 참조하는 동적 아이콘 라우트. `/icons/192`, `/icons/512` 만 허용.
// Korean 폰트 없이 안정적으로 렌더되도록 Latin "M" 사용.

export const runtime = "nodejs";

const ALLOWED_SIZES = new Set([192, 512]);

type Params = { size: string };

export async function GET(
  _req: Request,
  context: { params: Promise<Params> },
) {
  const { size: raw } = await context.params;
  const n = Number.parseInt(raw, 10);
  if (!ALLOWED_SIZES.has(n)) {
    return new Response("Not Found", { status: 404 });
  }
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: Math.round(n * 0.72),
          background: "#0f172a",
          color: "#ffffff",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          letterSpacing: -Math.round(n * 0.02),
        }}
      >
        M
      </div>
    ),
    { width: n, height: n },
  );
}
