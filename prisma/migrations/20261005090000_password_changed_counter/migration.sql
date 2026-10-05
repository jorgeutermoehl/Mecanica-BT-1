-- AlterTable
ALTER TABLE "User" ADD COLUMN "passwordChangedAt" DATETIME;

-- CreateTable
CREATE TABLE "Counter" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" INTEGER NOT NULL DEFAULT 0
);

