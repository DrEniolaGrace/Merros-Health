-- CreateTable
CREATE TABLE "RohAnalysis" (
    "id" TEXT NOT NULL,
    "coupleLinkId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_counsellor',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "releasedById" TEXT,

    CONSTRAINT "RohAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RohAnalysis_coupleLinkId_key" ON "RohAnalysis"("coupleLinkId");

-- AddForeignKey
ALTER TABLE "RohAnalysis" ADD CONSTRAINT "RohAnalysis_coupleLinkId_fkey" FOREIGN KEY ("coupleLinkId") REFERENCES "CoupleLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
