-- CreateEnum
CREATE TYPE "SupportLevel" AS ENUM ('CHALLENGE', 'UPWARD', 'STABLE', 'FIT', 'DOWNWARD');

-- CreateTable
CREATE TABLE "StudentSavedRecruitmentUnit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "admissionResultId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentSavedRecruitmentUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAdmissionAnalysisResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "admissionResultId" TEXT NOT NULL,
    "convertedScore" DOUBLE PRECISION,
    "supportLevel" "SupportLevel",
    "calculatedAt" TIMESTAMP(3),
    "calculationMemo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentAdmissionAnalysisResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentSavedRecruitmentUnit_userId_idx" ON "StudentSavedRecruitmentUnit"("userId");

-- CreateIndex
CREATE INDEX "StudentSavedRecruitmentUnit_admissionResultId_idx" ON "StudentSavedRecruitmentUnit"("admissionResultId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSavedRecruitmentUnit_userId_admissionResultId_key" ON "StudentSavedRecruitmentUnit"("userId", "admissionResultId");

-- CreateIndex
CREATE INDEX "StudentAdmissionAnalysisResult_userId_idx" ON "StudentAdmissionAnalysisResult"("userId");

-- CreateIndex
CREATE INDEX "StudentAdmissionAnalysisResult_admissionResultId_idx" ON "StudentAdmissionAnalysisResult"("admissionResultId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAdmissionAnalysisResult_userId_admissionResultId_key" ON "StudentAdmissionAnalysisResult"("userId", "admissionResultId");

-- AddForeignKey
ALTER TABLE "StudentSavedRecruitmentUnit" ADD CONSTRAINT "StudentSavedRecruitmentUnit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSavedRecruitmentUnit" ADD CONSTRAINT "StudentSavedRecruitmentUnit_admissionResultId_fkey" FOREIGN KEY ("admissionResultId") REFERENCES "AdmissionResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAdmissionAnalysisResult" ADD CONSTRAINT "StudentAdmissionAnalysisResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAdmissionAnalysisResult" ADD CONSTRAINT "StudentAdmissionAnalysisResult_admissionResultId_fkey" FOREIGN KEY ("admissionResultId") REFERENCES "AdmissionResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
