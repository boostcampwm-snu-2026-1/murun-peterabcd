// next/og 의 ImageResponse 는 기본 폰트로 한국어를 못 그린다 (□ 박스).
// 첫 OG 요청 시 Google Fonts 에서 Noto Sans KR Regular/Bold 두 weight 를 받아
// 모듈 캐시에 보관 → 같은 서버 인스턴스 내 후속 요청은 fetch 없이 재사용.
//
// server-only. ImageResponse 안에서만 사용.

import "server-only";

type FontEntry = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: "normal";
};

let cache: FontEntry[] | null = null;
let inflight: Promise<FontEntry[]> | null = null;

const CSS_URL =
  "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap";

// Google Fonts 는 User-Agent 에 따라 woff2 vs ttf 를 다르게 준다.
// woff2 는 Satori 가 못 읽으니, 일반 데스크톱 UA 가 아닌 옛 UA 로 ttf 를 받는다.
const TTF_UA =
  "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_5_0; en-US) AppleWebKit/525.13 (KHTML, like Gecko) Version/3.1 Safari/525.13";

async function fetchFonts(): Promise<FontEntry[]> {
  const cssResp = await fetch(CSS_URL, { headers: { "User-Agent": TTF_UA } });
  if (!cssResp.ok) {
    throw new Error(`OG font CSS fetch failed: ${cssResp.status}`);
  }
  const css = await cssResp.text();

  // CSS 안의 `@font-face` 블록에서 weight 와 src url 을 묶어서 추출.
  const blocks = css.split("@font-face").slice(1);
  const entries: FontEntry[] = [];
  for (const block of blocks) {
    const weightMatch = block.match(/font-weight:\s*(\d+)/);
    const urlMatch = block.match(/url\((https:\/\/[^)]+\.ttf)\)/);
    if (!weightMatch || !urlMatch) continue;
    const weight = Number.parseInt(weightMatch[1], 10);
    if (weight !== 400 && weight !== 700) continue;
    const ttfResp = await fetch(urlMatch[1]);
    if (!ttfResp.ok) continue;
    entries.push({
      name: "Noto Sans KR",
      data: await ttfResp.arrayBuffer(),
      weight: weight as 400 | 700,
      style: "normal",
    });
  }
  if (entries.length === 0) {
    throw new Error("OG font TTF urls not found in Google Fonts CSS");
  }
  return entries;
}

export async function getOgFonts(): Promise<FontEntry[]> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = fetchFonts()
    .then((entries) => {
      cache = entries;
      return entries;
    })
    .catch((err) => {
      // 실패하면 캐시 비우고 다음 호출에서 재시도. 호출자는 fallback (영문) 로 떨어지기 가능.
      inflight = null;
      throw err;
    });
  return inflight;
}
