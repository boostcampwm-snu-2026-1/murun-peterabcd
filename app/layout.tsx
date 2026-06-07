import type { Metadata, Viewport } from "next";
import "./globals.css";

// NEXT_PUBLIC_APP_URL 이 비어 있으면 Next 기본(요청 host)을 쓴다.
// staging/prod 의 .env 에 외부 URL 을 넣어두면 OG 이미지/링크가 그 URL 기준이 됨.
const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

export const metadata: Metadata = {
  metadataBase: appUrl ? new URL(appUrl) : undefined,
  title: "뮤런",
  description: "애니뮤 러닝 소모임의 정기 운동 아카이브",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
