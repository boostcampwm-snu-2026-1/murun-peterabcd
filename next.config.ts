import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// standalone 출력은 Docker 빌드 안에서만 활성. 로컬(특히 Windows)에선 symlink
// 권한 문제로 실패할 수 있어 명시 opt-in 으로 둔다. Dockerfile 이 ENV로 켠다.
const standalone = process.env.NEXT_OUTPUT_STANDALONE === "true";

const nextConfig: NextConfig = {
  ...(standalone ? { output: "standalone" as const } : {}),
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
