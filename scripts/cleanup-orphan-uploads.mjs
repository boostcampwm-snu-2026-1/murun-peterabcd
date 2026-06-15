#!/usr/bin/env node

import { PrismaClient } from "@prisma/client";
import { existsSync } from "node:fs";
import { readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";

const write = process.argv.includes("--write");
const uploadsDir = path.resolve(process.env.UPLOADS_DIR?.trim() || "./uploads");
const sessionsDir = path.join(uploadsDir, "sessions");
const prisma = new PrismaClient();

async function walkFiles(dir) {
  if (!existsSync(dir)) return [];

  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(abs)));
    } else if (entry.isFile()) {
      files.push(abs);
    }
  }
  return files;
}

function toUploadRel(abs) {
  return path.relative(uploadsDir, abs).split(path.sep).join("/");
}

try {
  const rows = await prisma.session.findMany({
    where: { groupPhotoPath: { not: null } },
    select: { groupPhotoPath: true },
  });
  const referenced = new Set(rows.map((row) => row.groupPhotoPath).filter(Boolean));
  const files = await walkFiles(sessionsDir);
  const orphans = [];

  for (const abs of files) {
    const relPath = toUploadRel(abs);
    if (!referenced.has(relPath)) {
      const fileStat = await stat(abs);
      orphans.push({ abs, relPath, bytes: fileStat.size });
    }
  }

  const totalBytes = orphans.reduce((sum, file) => sum + file.bytes, 0);
  console.log(
    JSON.stringify(
      {
        mode: write ? "write" : "dry-run",
        uploadsDir,
        referenced: referenced.size,
        scanned: files.length,
        orphanCount: orphans.length,
        orphanBytes: totalBytes,
        orphans: orphans.map((file) => ({ relPath: file.relPath, bytes: file.bytes })),
      },
      null,
      2,
    ),
  );

  if (write) {
    for (const file of orphans) {
      await unlink(file.abs);
    }
    console.log(`deleted ${orphans.length} orphan upload file(s)`);
  } else if (orphans.length > 0) {
    console.log("dry-run only. pass --write to delete orphan files.");
  }
} finally {
  await prisma.$disconnect();
}
