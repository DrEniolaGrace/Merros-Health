-- CreateTable
CREATE TABLE "PsiSession" (
    "id" TEXT NOT NULL,
    "coupleLinkId" TEXT NOT NULL,
    "aRound1" JSONB,
    "bRound1" JSONB,
    "aRound2" JSONB,
    "bRound2" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PsiSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardEvent" (
    "id" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "rule" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuardEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PsiSession_coupleLinkId_key" ON "PsiSession"("coupleLinkId");

-- AddForeignKey
ALTER TABLE "PsiSession" ADD CONSTRAINT "PsiSession_coupleLinkId_fkey" FOREIGN KEY ("coupleLinkId") REFERENCES "CoupleLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
