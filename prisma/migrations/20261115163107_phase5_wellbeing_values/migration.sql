/*
  Warnings:

  - You are about to drop the column `ratings` on the `ValuesAssessment` table. All the data in the column will be lost.
  - Added the required column `encData` to the `ValuesAssessment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ValuesAssessment" DROP COLUMN "ratings",
ADD COLUMN     "encData" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "DistressScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "phase" TEXT NOT NULL,
    "callback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DistressScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DistressScore_userId_createdAt_idx" ON "DistressScore"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ValuesAssessment_userId_createdAt_idx" ON "ValuesAssessment"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "DistressScore" ADD CONSTRAINT "DistressScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
