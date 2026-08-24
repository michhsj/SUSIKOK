/*
  Warnings:

  - You are about to drop the column `academicCompetencyRatio` on the `StudentAdmissionAnalysisResult` table. All the data in the column will be lost.
  - You are about to drop the column `academicCompetencyScore` on the `StudentAdmissionAnalysisResult` table. All the data in the column will be lost.
  - You are about to drop the column `academicWeightedScore` on the `StudentAdmissionAnalysisResult` table. All the data in the column will be lost.
  - You are about to drop the column `careerCompetencyRatio` on the `StudentAdmissionAnalysisResult` table. All the data in the column will be lost.
  - You are about to drop the column `careerCompetencyScore` on the `StudentAdmissionAnalysisResult` table. All the data in the column will be lost.
  - You are about to drop the column `careerWeightedScore` on the `StudentAdmissionAnalysisResult` table. All the data in the column will be lost.
  - You are about to drop the column `communityCompetencyRatio` on the `StudentAdmissionAnalysisResult` table. All the data in the column will be lost.
  - You are about to drop the column `communityCompetencyScore` on the `StudentAdmissionAnalysisResult` table. All the data in the column will be lost.
  - You are about to drop the column `communityWeightedScore` on the `StudentAdmissionAnalysisResult` table. All the data in the column will be lost.
  - You are about to drop the column `comprehensiveRatioId` on the `StudentAdmissionAnalysisResult` table. All the data in the column will be lost.
  - You are about to drop the column `comprehensiveTotalScore` on the `StudentAdmissionAnalysisResult` table. All the data in the column will be lost.
  - You are about to drop the column `hakjongSubmissionId` on the `StudentAdmissionAnalysisResult` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "StudentAdmissionAnalysisResult" DROP CONSTRAINT "StudentAdmissionAnalysisResult_comprehensiveRatioId_fkey";

-- DropForeignKey
ALTER TABLE "StudentAdmissionAnalysisResult" DROP CONSTRAINT "StudentAdmissionAnalysisResult_hakjongSubmissionId_fkey";

-- DropIndex
DROP INDEX "StudentAdmissionAnalysisResult_comprehensiveRatioId_idx";

-- DropIndex
DROP INDEX "StudentAdmissionAnalysisResult_hakjongSubmissionId_idx";

-- DropIndex
DROP INDEX "StudentAdmissionAnalysisResult_userId_calculatedAt_idx";

-- AlterTable
ALTER TABLE "StudentAdmissionAnalysisResult" DROP COLUMN "academicCompetencyRatio",
DROP COLUMN "academicCompetencyScore",
DROP COLUMN "academicWeightedScore",
DROP COLUMN "careerCompetencyRatio",
DROP COLUMN "careerCompetencyScore",
DROP COLUMN "careerWeightedScore",
DROP COLUMN "communityCompetencyRatio",
DROP COLUMN "communityCompetencyScore",
DROP COLUMN "communityWeightedScore",
DROP COLUMN "comprehensiveRatioId",
DROP COLUMN "comprehensiveTotalScore",
DROP COLUMN "hakjongSubmissionId";

-- CreateTable
CREATE TABLE "StudentRecordAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "calculationVersion" TEXT NOT NULL DEFAULT 'v1',
    "sourceUpdatedAt" TIMESTAMP(3) NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "koreanMathEnglishSocialGrade" DOUBLE PRECISION,
    "koreanMathEnglishScienceGrade" DOUBLE PRECISION,
    "koreanMathEnglishSocialScienceGrade" DOUBLE PRECISION,
    "allSubjectsGrade" DOUBLE PRECISION,
    "totalGradeRowCount" INTEGER NOT NULL DEFAULT 0,
    "usableGradeRowCount" INTEGER NOT NULL DEFAULT 0,
    "commonGeneralRowCount" INTEGER NOT NULL DEFAULT 0,
    "semesterCount" INTEGER NOT NULL DEFAULT 0,
    "calculationMemo" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentRecordAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentRecordAnalysisSemester" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "schoolYear" INTEGER NOT NULL,
    "semester" INTEGER NOT NULL,
    "academicTermLabel" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "averageGrade" DOUBLE PRECISION,
    "totalCredits" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subjectCount" INTEGER NOT NULL DEFAULT 0,
    "usableSubjectCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentRecordAnalysisSemester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentRecordAnalysisSubject" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectGroup" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "averageGrade" DOUBLE PRECISION,
    "totalCredits" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subjectCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentRecordAnalysisSubject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentRecordAnalysis_userId_idx" ON "StudentRecordAnalysis"("userId");

-- CreateIndex
CREATE INDEX "StudentRecordAnalysis_submissionId_idx" ON "StudentRecordAnalysis"("submissionId");

-- CreateIndex
CREATE INDEX "StudentRecordAnalysis_userId_isLatest_idx" ON "StudentRecordAnalysis"("userId", "isLatest");

-- CreateIndex
CREATE INDEX "StudentRecordAnalysis_userId_calculatedAt_idx" ON "StudentRecordAnalysis"("userId", "calculatedAt");

-- CreateIndex
CREATE INDEX "StudentRecordAnalysis_submissionId_calculatedAt_idx" ON "StudentRecordAnalysis"("submissionId", "calculatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StudentRecordAnalysis_submissionId_calculationVersion_key" ON "StudentRecordAnalysis"("submissionId", "calculationVersion");

-- CreateIndex
CREATE INDEX "StudentRecordAnalysisSemester_analysisId_idx" ON "StudentRecordAnalysisSemester"("analysisId");

-- CreateIndex
CREATE INDEX "StudentRecordAnalysisSemester_userId_idx" ON "StudentRecordAnalysisSemester"("userId");

-- CreateIndex
CREATE INDEX "StudentRecordAnalysisSemester_userId_displayOrder_idx" ON "StudentRecordAnalysisSemester"("userId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "StudentRecordAnalysisSemester_analysisId_schoolYear_semeste_key" ON "StudentRecordAnalysisSemester"("analysisId", "schoolYear", "semester");

-- CreateIndex
CREATE INDEX "StudentRecordAnalysisSubject_analysisId_idx" ON "StudentRecordAnalysisSubject"("analysisId");

-- CreateIndex
CREATE INDEX "StudentRecordAnalysisSubject_userId_idx" ON "StudentRecordAnalysisSubject"("userId");

-- CreateIndex
CREATE INDEX "StudentRecordAnalysisSubject_userId_displayOrder_idx" ON "StudentRecordAnalysisSubject"("userId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "StudentRecordAnalysisSubject_analysisId_subjectGroup_key" ON "StudentRecordAnalysisSubject"("analysisId", "subjectGroup");

-- AddForeignKey
ALTER TABLE "StudentRecordAnalysis" ADD CONSTRAINT "StudentRecordAnalysis_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "StudentRecordSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentRecordAnalysis" ADD CONSTRAINT "StudentRecordAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentRecordAnalysisSemester" ADD CONSTRAINT "StudentRecordAnalysisSemester_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "StudentRecordAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentRecordAnalysisSemester" ADD CONSTRAINT "StudentRecordAnalysisSemester_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentRecordAnalysisSubject" ADD CONSTRAINT "StudentRecordAnalysisSubject_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "StudentRecordAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentRecordAnalysisSubject" ADD CONSTRAINT "StudentRecordAnalysisSubject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
