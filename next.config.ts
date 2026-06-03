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
  // Prisma 의 generated client (.prisma/client) 와 쿼리 engine binary 를
  // standalone 산출물에 포함시킨다. Next 의 자동 tracing 은 dynamic require 를
  // 다 잡지 못한다.
  outputFileTracingIncludes: {
    "/**": [
      "./node_modules/.prisma/client/**",
      "./node_modules/@prisma/client/**",
    ],
  },
  // PrismaClient 가 Next 의 bundler 에 의해 traced 되지 않도록 external 처리.
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
};

export default nextConfig;
