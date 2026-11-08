-- CreateTable
CREATE TABLE "LabInbox" (
    "accession" TEXT NOT NULL,
    "encPayload" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabInbox_pkey" PRIMARY KEY ("accession")
);
