// Prisma client singleton.
//
// Next dev HMR이 매 hot-reload 마다 새 PrismaClient 인스턴스를 만들면
// DB connection 누수가 발생한다. globalThis 에 한 번 캐싱해서 재사용한다.
// 운영 환경(node --production)에선 cache 자체가 의미 없으므로 매번 새로 만든다.

import "server-only";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
