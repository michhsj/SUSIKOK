-- CreateTable
CREATE TABLE "ConversionRuleTestSet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversionRuleTestSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversionRuleTestScoreRow" (
    "id" TEXT NOT NULL,
    "testSetId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "academicTermLabel" TEXT NOT NULL,
    "schoolYear" INTEGER NOT NULL,
    "semester" INTEGER NOT NULL,
    "subjectGroupSnapshot" TEXT NOT NULL,
    "completionTypeSnapshot" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "credits" DOUBLE PRECISION NOT NULL,
    "rawScore" DOUBLE PRECISION,
    "averageScore" DOUBLE PRECISION,
    "standardDeviation" DOUBLE PRECISION,
    "achievement" TEXT NOT NULL,
    "grade" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversionRuleTestScoreRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversionRuleTestAttendance" (
    "id" TEXT NOT NULL,
    "testSetId" TEXT NOT NULL,
    "absenceDays" DOUBLE PRECISION,
    "lateness" DOUBLE PRECISION,
    "earlyLeave" DOUBLE PRECISION,
    "outing" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversionRuleTestAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConversionRuleTestSet_userId_name_key" ON "ConversionRuleTestSet"("userId", "name");

-- CreateIndex
CREATE INDEX "ConversionRuleTestSet_userId_updatedAt_idx" ON "ConversionRuleTestSet"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "ConversionRuleTestScoreRow_testSetId_sortOrder_idx" ON "ConversionRuleTestScoreRow"("testSetId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ConversionRuleTestAttendance_testSetId_key" ON "ConversionRuleTestAttendance"("testSetId");

-- AddForeignKey
ALTER TABLE "ConversionRuleTestSet"
ADD CONSTRAINT "ConversionRuleTestSet_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversionRuleTestScoreRow"
ADD CONSTRAINT "ConversionRuleTestScoreRow_testSetId_fkey"
FOREIGN KEY ("testSetId") REFERENCES "ConversionRuleTestSet"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversionRuleTestAttendance"
ADD CONSTRAINT "ConversionRuleTestAttendance_testSetId_fkey"
FOREIGN KEY ("testSetId") REFERENCES "ConversionRuleTestSet"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
