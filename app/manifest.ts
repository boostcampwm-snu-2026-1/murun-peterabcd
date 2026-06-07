import type { MetadataRoute } from "next";

// PWA 매니페스트. iOS / Android 모두 홈 화면 추가 가능.
// 아이콘은 동적 라우트(`app/icons/[size]/route.tsx`)가 생성.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "뮤런",
    short_name: "뮤런",
    description: "애니뮤 러닝 소모임의 정기 운동 아카이브",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    icons: [
      {
        src: "/icons/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
