-- CreateTable
CREATE TABLE "UniversityComprehensiveRatio" (
    "id" TEXT NOT NULL,
    "admissionYear" INTEGER NOT NULL DEFAULT 2027,
    "sourceSheetName" TEXT NOT NULL DEFAULT '대학별 종합전형 비율',
    "region" TEXT NOT NULL,
    "universityName" TEXT NOT NULL,
    "admissionType" TEXT NOT NULL,
    "admissionName" TEXT NOT NULL,
    "track" TEXT NOT NULL DEFAULT '',
    "collegeName" TEXT NOT NULL DEFAULT '',
    "recruitmentUnit" TEXT NOT NULL DEFAULT '',
    "academicCompetencyRatio" DOUBLE PRECISION NOT NULL,
    "academicCompetencyDescription" TEXT,
    "careerCompetencyRatio" DOUBLE PRECISION NOT NULL,
    "careerCompetencyDescription" TEXT,
    "communityCompetencyRatio" DOUBLE PRECISION NOT NULL,
    "communityCompetencyDescription" TEXT,
    "rawRow" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniversityComprehensiveRatio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UniversityComprehensiveRatio_admissionYear_idx" ON "UniversityComprehensiveRatio"("admissionYear");

-- CreateIndex
CREATE INDEX "UniversityComprehensiveRatio_region_idx" ON "UniversityComprehensiveRatio"("region");

-- CreateIndex
CREATE INDEX "UniversityComprehensiveRatio_universityName_idx" ON "UniversityComprehensiveRatio"("universityName");

-- CreateIndex
CREATE INDEX "UniversityComprehensiveRatio_admissionType_idx" ON "UniversityComprehensiveRatio"("admissionType");

-- CreateIndex
CREATE INDEX "UniversityComprehensiveRatio_admissionName_idx" ON "UniversityComprehensiveRatio"("admissionName");

-- CreateIndex
CREATE INDEX "UniversityComprehensiveRatio_track_idx" ON "UniversityComprehensiveRatio"("track");

-- CreateIndex
CREATE INDEX "UniversityComprehensiveRatio_collegeName_idx" ON "UniversityComprehensiveRatio"("collegeName");

-- CreateIndex
CREATE INDEX "UniversityComprehensiveRatio_recruitmentUnit_idx" ON "UniversityComprehensiveRatio"("recruitmentUnit");

-- CreateIndex
CREATE INDEX "UniversityComprehensiveRatio_isActive_idx" ON "UniversityComprehensiveRatio"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "UniversityComprehensiveRatio_admissionYear_region_universit_key" ON "UniversityComprehensiveRatio"("admissionYear", "region", "universityName", "admissionType", "admissionName", "track", "collegeName", "recruitmentUnit");
