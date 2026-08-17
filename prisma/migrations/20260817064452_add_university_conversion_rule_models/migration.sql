-- CreateEnum
CREATE TYPE "UniversityConversionRuleMode" AS ENUM ('CREATE', 'EDIT');

-- CreateEnum
CREATE TYPE "UniversityConversionRuleAction" AS ENUM ('DRAFT', 'REVIEW', 'ACTIVATE');

-- CreateEnum
CREATE TYPE "UniversityConversionRuleStatus" AS ENUM ('DRAFT', 'REVIEW_REQUESTED', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "UniversityConversionAttendanceLabelType" AS ENUM ('FIXED', 'RANGE', 'ABOVE');

-- CreateTable
CREATE TABLE "UniversityConversionRule" (
    "id" TEXT NOT NULL,
    "ruleGroupKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "previousRuleId" TEXT,
    "region" TEXT NOT NULL,
    "university" TEXT NOT NULL,
    "admissionType" TEXT NOT NULL,
    "admissionName" TEXT NOT NULL,
    "track" TEXT NOT NULL,
    "collegeName" TEXT NOT NULL DEFAULT '',
    "recruitmentUnit" TEXT NOT NULL DEFAULT '',
    "mode" "UniversityConversionRuleMode" NOT NULL,
    "action" "UniversityConversionRuleAction" NOT NULL,
    "status" "UniversityConversionRuleStatus" NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "applyUnitWeight" BOOLEAN NOT NULL DEFAULT true,
    "applyCommonWeight" BOOLEAN NOT NULL DEFAULT false,
    "applyConvertedScore" BOOLEAN NOT NULL DEFAULT true,
    "includeCareerSubjects" BOOLEAN NOT NULL DEFAULT true,
    "applyCareerBonus" BOOLEAN NOT NULL DEFAULT false,
    "includeAttendance" BOOLEAN NOT NULL DEFAULT false,
    "formulaName" TEXT,
    "formulaBody" TEXT,
    "formulaMemo" TEXT,
    "careerAchievementFormulaName" TEXT,
    "careerAchievementFormulaBody" TEXT,
    "linkedTestSetId" TEXT,
    "linkedTestSetName" TEXT,
    "linkedTestRowCount" INTEGER NOT NULL DEFAULT 0,
    "attendanceIncluded" BOOLEAN NOT NULL DEFAULT false,
    "calculatedCommonScore" DOUBLE PRECISION,
    "calculatedCareerContributionScore" DOUBLE PRECISION,
    "calculatedAttendanceScore" DOUBLE PRECISION,
    "calculatedFinalScore" DOUBLE PRECISION,
    "rawPayload" JSONB,
    "draftSavedAt" TIMESTAMP(3),
    "reviewRequestedAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniversityConversionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniversityConversionRuleCommonSubject" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "subjectLabel" TEXT NOT NULL,
    "reflectionCount" INTEGER NOT NULL DEFAULT 0,
    "weightPercent" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniversityConversionRuleCommonSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniversityConversionRuleGradeScore" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniversityConversionRuleGradeScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniversityConversionRuleCareerReflection" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "subjectLabel" TEXT NOT NULL,
    "reflectionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniversityConversionRuleCareerReflection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniversityConversionRuleCareerAchievementScore" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "achievementLevel" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniversityConversionRuleCareerAchievementScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniversityConversionRuleAttendanceRow" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "labelType" "UniversityConversionAttendanceLabelType" NOT NULL,
    "label" TEXT,
    "upper" INTEGER,
    "lower" INTEGER,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniversityConversionRuleAttendanceRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UniversityConversionRule_ruleGroupKey_idx" ON "UniversityConversionRule"("ruleGroupKey");

-- CreateIndex
CREATE INDEX "UniversityConversionRule_status_isActive_idx" ON "UniversityConversionRule"("status", "isActive");

-- CreateIndex
CREATE INDEX "UniversityConversionRule_region_university_idx" ON "UniversityConversionRule"("region", "university");

-- CreateIndex
CREATE INDEX "UniversityConversionRule_university_admissionType_admission_idx" ON "UniversityConversionRule"("university", "admissionType", "admissionName");

-- CreateIndex
CREATE INDEX "UniversityConversionRule_track_collegeName_recruitmentUnit_idx" ON "UniversityConversionRule"("track", "collegeName", "recruitmentUnit");

-- CreateIndex
CREATE INDEX "UniversityConversionRule_linkedTestSetId_idx" ON "UniversityConversionRule"("linkedTestSetId");

-- CreateIndex
CREATE UNIQUE INDEX "UniversityConversionRule_ruleGroupKey_version_key" ON "UniversityConversionRule"("ruleGroupKey", "version");

-- CreateIndex
CREATE INDEX "UniversityConversionRuleCommonSubject_ruleId_sortOrder_idx" ON "UniversityConversionRuleCommonSubject"("ruleId", "sortOrder");

-- CreateIndex
CREATE INDEX "UniversityConversionRuleCommonSubject_ruleId_subjectLabel_idx" ON "UniversityConversionRuleCommonSubject"("ruleId", "subjectLabel");

-- CreateIndex
CREATE INDEX "UniversityConversionRuleGradeScore_ruleId_idx" ON "UniversityConversionRuleGradeScore"("ruleId");

-- CreateIndex
CREATE UNIQUE INDEX "UniversityConversionRuleGradeScore_ruleId_grade_key" ON "UniversityConversionRuleGradeScore"("ruleId", "grade");

-- CreateIndex
CREATE INDEX "UniversityConversionRuleCareerReflection_ruleId_sortOrder_idx" ON "UniversityConversionRuleCareerReflection"("ruleId", "sortOrder");

-- CreateIndex
CREATE INDEX "UniversityConversionRuleCareerReflection_ruleId_subjectLabe_idx" ON "UniversityConversionRuleCareerReflection"("ruleId", "subjectLabel");

-- CreateIndex
CREATE INDEX "UniversityConversionRuleCareerAchievementScore_ruleId_idx" ON "UniversityConversionRuleCareerAchievementScore"("ruleId");

-- CreateIndex
CREATE UNIQUE INDEX "UniversityConversionRuleCareerAchievementScore_ruleId_achie_key" ON "UniversityConversionRuleCareerAchievementScore"("ruleId", "achievementLevel");

-- CreateIndex
CREATE INDEX "UniversityConversionRuleAttendanceRow_ruleId_sortOrder_idx" ON "UniversityConversionRuleAttendanceRow"("ruleId", "sortOrder");

-- AddForeignKey
ALTER TABLE "UniversityConversionRule" ADD CONSTRAINT "UniversityConversionRule_previousRuleId_fkey" FOREIGN KEY ("previousRuleId") REFERENCES "UniversityConversionRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityConversionRule" ADD CONSTRAINT "UniversityConversionRule_linkedTestSetId_fkey" FOREIGN KEY ("linkedTestSetId") REFERENCES "ConversionRuleTestSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityConversionRuleCommonSubject" ADD CONSTRAINT "UniversityConversionRuleCommonSubject_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "UniversityConversionRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityConversionRuleGradeScore" ADD CONSTRAINT "UniversityConversionRuleGradeScore_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "UniversityConversionRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityConversionRuleCareerReflection" ADD CONSTRAINT "UniversityConversionRuleCareerReflection_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "UniversityConversionRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityConversionRuleCareerAchievementScore" ADD CONSTRAINT "UniversityConversionRuleCareerAchievementScore_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "UniversityConversionRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityConversionRuleAttendanceRow" ADD CONSTRAINT "UniversityConversionRuleAttendanceRow_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "UniversityConversionRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
