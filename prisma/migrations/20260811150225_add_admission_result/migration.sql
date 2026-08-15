-- CreateTable
CREATE TABLE "AdmissionResult" (
    "id" TEXT NOT NULL,
    "admissionYear" INTEGER NOT NULL DEFAULT 2027,
    "sourceSheetName" TEXT NOT NULL DEFAULT '수시통합',
    "sourceRowNumber" INTEGER,
    "sourceFileName" TEXT,
    "region" TEXT NOT NULL,
    "universityName" TEXT NOT NULL,
    "admissionType" TEXT NOT NULL,
    "admissionName" TEXT NOT NULL,
    "track" TEXT NOT NULL DEFAULT '',
    "collegeName" TEXT NOT NULL DEFAULT '',
    "recruitmentUnit" TEXT NOT NULL,
    "admissionMethod" TEXT,
    "studentRecordReflection" TEXT,
    "admissionSpecialNotes" TEXT,
    "minimumAcademicRequirement" TEXT,
    "applicationPeriod" TEXT,
    "firstRoundAnnouncement" TEXT,
    "interviewOrEssayDate" TEXT,
    "finalAnnouncement" TEXT,
    "currentHeadcountRaw" TEXT,
    "year26RecruitmentCountRaw" TEXT,
    "year26ApplicantCountRaw" TEXT,
    "year26CompetitionRateRaw" TEXT,
    "year26AdditionalPassCountRaw" TEXT,
    "year26MinSatisfiedRateRaw" TEXT,
    "year26MinSatisfiedCountRaw" TEXT,
    "year26ActualCompetitionRateRaw" TEXT,
    "year26Score50Raw" TEXT,
    "year26Score70Raw" TEXT,
    "year26Converted50Raw" TEXT,
    "year26Converted70Raw" TEXT,
    "year25RecruitmentCountRaw" TEXT,
    "year25ApplicantCountRaw" TEXT,
    "year25CompetitionRateRaw" TEXT,
    "year25AdditionalPassCountRaw" TEXT,
    "year25MinSatisfiedRateRaw" TEXT,
    "year25MinSatisfiedCountRaw" TEXT,
    "year25ActualCompetitionRateRaw" TEXT,
    "year25Score50Raw" TEXT,
    "year25Score70Raw" TEXT,
    "year25Converted50Raw" TEXT,
    "year25Converted70Raw" TEXT,
    "year24RecruitmentCountRaw" TEXT,
    "year24ApplicantCountRaw" TEXT,
    "year24CompetitionRateRaw" TEXT,
    "year24AdditionalPassCountRaw" TEXT,
    "year24MinSatisfiedRateRaw" TEXT,
    "year24MinSatisfiedCountRaw" TEXT,
    "year24ActualCompetitionRateRaw" TEXT,
    "year24Score50Raw" TEXT,
    "year24Score70Raw" TEXT,
    "year24Converted50Raw" TEXT,
    "year24Converted70Raw" TEXT,
    "rawRow" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdmissionResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdmissionResult_admissionYear_idx" ON "AdmissionResult"("admissionYear");

-- CreateIndex
CREATE INDEX "AdmissionResult_region_idx" ON "AdmissionResult"("region");

-- CreateIndex
CREATE INDEX "AdmissionResult_universityName_idx" ON "AdmissionResult"("universityName");

-- CreateIndex
CREATE INDEX "AdmissionResult_admissionType_idx" ON "AdmissionResult"("admissionType");

-- CreateIndex
CREATE INDEX "AdmissionResult_admissionName_idx" ON "AdmissionResult"("admissionName");

-- CreateIndex
CREATE INDEX "AdmissionResult_collegeName_idx" ON "AdmissionResult"("collegeName");

-- CreateIndex
CREATE INDEX "AdmissionResult_recruitmentUnit_idx" ON "AdmissionResult"("recruitmentUnit");

-- CreateIndex
CREATE INDEX "AdmissionResult_region_universityName_idx" ON "AdmissionResult"("region", "universityName");

-- CreateIndex
CREATE INDEX "AdmissionResult_region_universityName_admissionType_admissi_idx" ON "AdmissionResult"("region", "universityName", "admissionType", "admissionName");

-- CreateIndex
CREATE INDEX "AdmissionResult_universityName_admissionType_admissionName_idx" ON "AdmissionResult"("universityName", "admissionType", "admissionName");

-- CreateIndex
CREATE INDEX "AdmissionResult_track_collegeName_idx" ON "AdmissionResult"("track", "collegeName");

-- CreateIndex
CREATE INDEX "AdmissionResult_isActive_idx" ON "AdmissionResult"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "uq_admission_result_natural_key" ON "AdmissionResult"("admissionYear", "region", "universityName", "admissionType", "admissionName", "track", "collegeName", "recruitmentUnit");
