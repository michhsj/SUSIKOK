-- AlterTable
ALTER TABLE "StudentAdmissionAnalysisResult" ADD COLUMN     "academicCompetencyRatio" DOUBLE PRECISION,
ADD COLUMN     "academicCompetencyScore" DOUBLE PRECISION,
ADD COLUMN     "academicWeightedScore" DOUBLE PRECISION,
ADD COLUMN     "careerCompetencyRatio" DOUBLE PRECISION,
ADD COLUMN     "careerCompetencyScore" DOUBLE PRECISION,
ADD COLUMN     "careerWeightedScore" DOUBLE PRECISION,
ADD COLUMN     "communityCompetencyRatio" DOUBLE PRECISION,
ADD COLUMN     "communityCompetencyScore" DOUBLE PRECISION,
ADD COLUMN     "communityWeightedScore" DOUBLE PRECISION,
ADD COLUMN     "comprehensiveRatioId" TEXT,
ADD COLUMN     "comprehensiveTotalScore" DOUBLE PRECISION,
ADD COLUMN     "hakjongSubmissionId" TEXT;

-- CreateIndex
CREATE INDEX "StudentAdmissionAnalysisResult_hakjongSubmissionId_idx" ON "StudentAdmissionAnalysisResult"("hakjongSubmissionId");

-- CreateIndex
CREATE INDEX "StudentAdmissionAnalysisResult_comprehensiveRatioId_idx" ON "StudentAdmissionAnalysisResult"("comprehensiveRatioId");

-- CreateIndex
CREATE INDEX "StudentAdmissionAnalysisResult_userId_calculatedAt_idx" ON "StudentAdmissionAnalysisResult"("userId", "calculatedAt");

-- AddForeignKey
ALTER TABLE "StudentAdmissionAnalysisResult" ADD CONSTRAINT "StudentAdmissionAnalysisResult_hakjongSubmissionId_fkey" FOREIGN KEY ("hakjongSubmissionId") REFERENCES "HakjongFitSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAdmissionAnalysisResult" ADD CONSTRAINT "StudentAdmissionAnalysisResult_comprehensiveRatioId_fkey" FOREIGN KEY ("comprehensiveRatioId") REFERENCES "UniversityComprehensiveRatio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
