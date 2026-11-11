-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "encQuestions" TEXT;

-- AlterTable
ALTER TABLE "Clinician" ADD COLUMN     "clinicId" TEXT,
ADD COLUMN     "experienceYears" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "inPerson" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "nextSlotDays" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "service" TEXT NOT NULL DEFAULT 'genetic_counselling',
ADD COLUMN     "video" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "LabResult" ADD COLUMN     "releasedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "familyDoctorId" TEXT;

-- CreateTable
CREATE TABLE "Clinic" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "insurance" TEXT[],

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReclassificationEvent" (
    "id" TEXT NOT NULL,
    "clinvarId" TEXT NOT NULL,
    "gene" TEXT NOT NULL,
    "hgvs" TEXT NOT NULL,
    "oldClass" TEXT NOT NULL,
    "newClass" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReclassificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounsellorTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "CounsellorTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedigreeNode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "side" TEXT NOT NULL DEFAULT 'unknown',
    "planning" BOOLEAN NOT NULL DEFAULT false,
    "tested" TEXT NOT NULL DEFAULT 'unknown',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PedigreeNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelativeInvite" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedAt" TIMESTAMP(3),

    CONSTRAINT "RelativeInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounsellorNote" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "encNotes" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CounsellorNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientSummary" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "encText" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "signedById" TEXT,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReclassificationEvent_clinvarId_newClass_key" ON "ReclassificationEvent"("clinvarId", "newClass");

-- CreateIndex
CREATE UNIQUE INDEX "CounsellorTask_userId_eventId_key" ON "CounsellorTask"("userId", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "RelativeInvite_token_key" ON "RelativeInvite"("token");

-- CreateIndex
CREATE UNIQUE INDEX "CounsellorNote_appointmentId_key" ON "CounsellorNote"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientSummary_appointmentId_key" ON "PatientSummary"("appointmentId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_familyDoctorId_fkey" FOREIGN KEY ("familyDoctorId") REFERENCES "Clinician"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clinician" ADD CONSTRAINT "Clinician_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellorTask" ADD CONSTRAINT "CounsellorTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellorTask" ADD CONSTRAINT "CounsellorTask_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ReclassificationEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedigreeNode" ADD CONSTRAINT "PedigreeNode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelativeInvite" ADD CONSTRAINT "RelativeInvite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellorNote" ADD CONSTRAINT "CounsellorNote_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientSummary" ADD CONSTRAINT "PatientSummary_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientSummary" ADD CONSTRAINT "PatientSummary_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientSummary" ADD CONSTRAINT "PatientSummary_signedById_fkey" FOREIGN KEY ("signedById") REFERENCES "Clinician"("id") ON DELETE SET NULL ON UPDATE CASCADE;
