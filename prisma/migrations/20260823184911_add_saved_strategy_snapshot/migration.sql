-- AlterTable
ALTER TABLE "StudentSavedRecruitmentUnit" ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "snapshotAdmissionName" TEXT,
ADD COLUMN     "snapshotAdmissionType" TEXT,
ADD COLUMN     "snapshotAdmissionYear" INTEGER,
ADD COLUMN     "snapshotCharts" JSONB,
ADD COLUMN     "snapshotCollegeName" TEXT,
ADD COLUMN     "snapshotIdentity" JSONB,
ADD COLUMN     "snapshotPremium" JSONB,
ADD COLUMN     "snapshotRecruitmentCount" JSONB,
ADD COLUMN     "snapshotRecruitmentUnit" TEXT,
ADD COLUMN     "snapshotRegion" TEXT,
ADD COLUMN     "snapshotSavedFromDetail" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "snapshotSourceUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "snapshotSummaryFields" JSONB,
ADD COLUMN     "snapshotTrack" TEXT,
ADD COLUMN     "snapshotUniversityName" TEXT,
ADD COLUMN     "snapshotVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "snapshotYearTable" JSONB;

-- CreateIndex
CREATE INDEX "StudentSavedRecruitmentUnit_userId_priority_idx" ON "StudentSavedRecruitmentUnit"("userId", "priority");

-- CreateIndex
CREATE INDEX "StudentSavedRecruitmentUnit_userId_createdAt_idx" ON "StudentSavedRecruitmentUnit"("userId", "createdAt");
