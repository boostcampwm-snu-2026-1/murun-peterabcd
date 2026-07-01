import type { Metadata, Viewport } from "next";
import "./globals.css";
import { GlobalNav } from "@/components/layout/AppChrome";
import { auth } from "@/lib/auth";

// NEXT_PUBLIC_APP_URL 이 비어 있으면 Next 기본(요청 host)을 쓴다.
// local/prod 의 .env 에 외부 URL 을 넣어두면 OG 이미지/링크가 그 URL 기준이 됨.
const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

export const metadata: Metadata = {
  metadataBase: appUrl ? new URL(appUrl) : undefined,
  title: {
    default: "뮤런",
    template: "%s · 뮤런",
  },
  description: "애니뮤 러닝 소모임의 정기 운동 아카이브",
  applicationName: "뮤런",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "뮤런",
    title: "뮤런",
    description: "애니뮤 러닝 소모임의 정기 운동 아카이브",
  },
  twitter: {
    card: "summary_large_image",
    title: "뮤런",
    description: "애니뮤 러닝 소모임의 정기 운동 아카이브",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0066cc",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="ko">
      <body>
        <GlobalNav
          approved={Boolean(session?.user.approved)}
          isAdmin={session?.user.role === "ADMIN"}
        />
        {children}
      </body>
    </html>
  );
}
