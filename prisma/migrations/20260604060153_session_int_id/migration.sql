/*
  Warnings:

  - You are about to alter the column `sessionId` on the `Participation` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `Session` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Session` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Participation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "distanceKm" REAL,
    "durationSec" INTEGER,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Participation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Participation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Participation" ("createdAt", "distanceKm", "durationSec", "id", "note", "sessionId", "updatedAt", "userId") SELECT "createdAt", "distanceKm", "durationSec", "id", "note", "sessionId", "updatedAt", "userId" FROM "Participation";
DROP TABLE "Participation";
ALTER TABLE "new_Participation" RENAME TO "Participation";
CREATE INDEX "Participation_userId_idx" ON "Participation"("userId");
CREATE UNIQUE INDEX "Participation_sessionId_userId_key" ON "Participation"("sessionId", "userId");
CREATE TABLE "new_Session" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "startTime" TEXT,
    "location" TEXT NOT NULL,
    "weather" TEXT,
    "groupPhotoPath" TEXT,
    "notes" TEXT,
    "hostId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Session_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Session" ("createdAt", "date", "groupPhotoPath", "hostId", "id", "location", "notes", "startTime", "updatedAt", "weather") SELECT "createdAt", "date", "groupPhotoPath", "hostId", "id", "location", "notes", "startTime", "updatedAt", "weather" FROM "Session";
DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";
CREATE INDEX "Session_date_idx" ON "Session"("date");
CREATE INDEX "Session_hostId_idx" ON "Session"("hostId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
