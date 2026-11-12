-- CreateTable
CREATE TABLE "AggregateEvent" (
    "id" TEXT NOT NULL,
    "journey" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "readingLevel" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "synthetic" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AggregateEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignalRelease" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period" TEXT NOT NULL,
    "epsilon" DOUBLE PRECISION NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "SignalRelease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivacyBudgetLedger" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "signal" TEXT NOT NULL,
    "mechanism" TEXT NOT NULL,
    "sensitivity" DOUBLE PRECISION NOT NULL,
    "epsilon" DOUBLE PRECISION NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivacyBudgetLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AggregateEvent_kind_at_idx" ON "AggregateEvent"("kind", "at");

-- CreateIndex
CREATE INDEX "AggregateEvent_journey_idx" ON "AggregateEvent"("journey");

-- CreateIndex
CREATE INDEX "PrivacyBudgetLedger_period_idx" ON "PrivacyBudgetLedger"("period");

-- AddForeignKey
ALTER TABLE "PrivacyBudgetLedger" ADD CONSTRAINT "PrivacyBudgetLedger_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "SignalRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;
