-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."EntitlementFeatureCode" AS ENUM ('ANALYSIS_30D');

-- CreateEnum
CREATE TYPE "public"."EntitlementGrantType" AS ENUM ('PAYMENT', 'ADMIN', 'PROMOTION');

-- CreateEnum
CREATE TYPE "public"."EntitlementStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "public"."HakjongFitSubmissionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "public"."PaymentOrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELED', 'REFUNDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."PaymentProvider" AS ENUM ('TOSS', 'PORTONE', 'INICIS', 'MANUAL');

-- CreateEnum
CREATE TYPE "public"."PaymentTransactionStatus" AS ENUM ('READY', 'APPROVED', 'FAILED', 'CANCELED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."ProductCode" AS ENUM ('ANALYSIS_PASS_30D');

-- CreateEnum
CREATE TYPE "public"."StudentRecordInputMethod" AS ENUM ('EXCEL', 'MANUAL');

-- CreateEnum
CREATE TYPE "public"."UploadStatus" AS ENUM ('DRAFT', 'FINALIZED');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('STUDENT', 'PARENT', 'COUNSELOR', 'ADMIN', 'SUPER_ADMIN');

-- CreateTable
CREATE TABLE "public"."CompletionTypeOption" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompletionTypeOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HakjongFitAnswer" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "selectedChoice" INTEGER NOT NULL,
    "earnedScore" INTEGER NOT NULL,
    "questionNumberSnapshot" INTEGER NOT NULL,
    "domainSnapshot" TEXT NOT NULL,
    "versionSnapshot" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HakjongFitAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HakjongFitQuestion" (
    "id" TEXT NOT NULL,
    "questionNumber" INTEGER NOT NULL,
    "domain" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "choice1Label" TEXT NOT NULL,
    "choice2Label" TEXT NOT NULL,
    "choice3Label" TEXT NOT NULL,
    "choice4Label" TEXT NOT NULL,
    "choice5Label" TEXT NOT NULL,
    "choice1Score" INTEGER NOT NULL,
    "choice2Score" INTEGER NOT NULL,
    "choice3Score" INTEGER NOT NULL,
    "choice4Score" INTEGER NOT NULL,
    "choice5Score" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" TEXT NOT NULL DEFAULT 'v1',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HakjongFitQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HakjongFitSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v1',
    "status" "public"."HakjongFitSubmissionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "totalQuestionCount" INTEGER NOT NULL DEFAULT 100,
    "currentQuestionOrder" INTEGER NOT NULL DEFAULT 1,
    "completedQuestionCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HakjongFitSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HakjongFitSubmissionQuestion" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HakjongFitSubmissionQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productCode" "public"."ProductCode" NOT NULL,
    "productName" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KRW',
    "provider" "public"."PaymentProvider" NOT NULL,
    "status" "public"."PaymentOrderStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentTransaction" (
    "id" TEXT NOT NULL,
    "paymentOrderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "public"."PaymentProvider" NOT NULL,
    "providerPaymentKey" TEXT,
    "providerTransactionId" TEXT,
    "status" "public"."PaymentTransactionStatus" NOT NULL DEFAULT 'READY',
    "amount" INTEGER NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "rawResponseJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PhoneVerificationCode" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhoneVerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."School" (
    "id" TEXT NOT NULL,
    "sido" TEXT NOT NULL,
    "sigungu" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "schoolCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StudentMockExamRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "examYear" INTEGER NOT NULL,
    "examMonth" INTEGER NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "koreanSubject" TEXT,
    "koreanStandardScore" DOUBLE PRECISION,
    "koreanPercentile" DOUBLE PRECISION,
    "koreanGrade" DOUBLE PRECISION,
    "mathSubject" TEXT,
    "mathStandardScore" DOUBLE PRECISION,
    "mathPercentile" DOUBLE PRECISION,
    "mathGrade" DOUBLE PRECISION,
    "englishGrade" DOUBLE PRECISION,
    "koreanHistoryGrade" DOUBLE PRECISION,
    "inquiry1Subject" TEXT,
    "inquiry1StandardScore" DOUBLE PRECISION,
    "inquiry1Percentile" DOUBLE PRECISION,
    "inquiry1Grade" DOUBLE PRECISION,
    "inquiry2Subject" TEXT,
    "inquiry2StandardScore" DOUBLE PRECISION,
    "inquiry2Percentile" DOUBLE PRECISION,
    "inquiry2Grade" DOUBLE PRECISION,
    "secondLanguageSubject" TEXT,
    "secondLanguageGrade" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentMockExamRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StudentMockExamSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "public"."UploadStatus" NOT NULL DEFAULT 'DRAFT',
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentMockExamSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StudentRecordGrade" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "academicTermLabel" TEXT NOT NULL,
    "schoolYear" INTEGER NOT NULL,
    "semester" INTEGER NOT NULL,
    "subjectGroupOptionId" TEXT,
    "subjectGroupSnapshot" TEXT NOT NULL,
    "completionTypeOptionId" TEXT,
    "completionTypeSnapshot" TEXT,
    "subjectName" TEXT NOT NULL,
    "credits" DOUBLE PRECISION,
    "rawScore" DOUBLE PRECISION,
    "averageScore" DOUBLE PRECISION,
    "standardDeviation" DOUBLE PRECISION,
    "achievement" TEXT,
    "grade" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentRecordGrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StudentRecordSubjectCatalog" (
    "id" TEXT NOT NULL,
    "subjectGroup" TEXT NOT NULL,
    "completionType" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentRecordSubjectCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StudentRecordSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inputMethod" "public"."StudentRecordInputMethod" NOT NULL,
    "fileName" TEXT,
    "status" "public"."UploadStatus" NOT NULL DEFAULT 'DRAFT',
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentRecordSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SubjectGroupOption" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubjectGroupOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'STUDENT',
    "schoolId" TEXT,
    "gradeLevel" INTEGER,
    "termsConsent" BOOLEAN NOT NULL DEFAULT false,
    "privacyConsent" BOOLEAN NOT NULL DEFAULT false,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserEntitlement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentOrderId" TEXT,
    "featureCode" "public"."EntitlementFeatureCode" NOT NULL,
    "grantType" "public"."EntitlementGrantType" NOT NULL,
    "status" "public"."EntitlementStatus" NOT NULL DEFAULT 'ACTIVE',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "allowedSubmissionCount" INTEGER NOT NULL DEFAULT 1,
    "usedSubmissionCount" INTEGER NOT NULL DEFAULT 0,
    "analysisUnlimited" BOOLEAN NOT NULL DEFAULT true,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserEntitlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompletionTypeOption_code_key" ON "public"."CompletionTypeOption"("code" ASC);

-- CreateIndex
CREATE INDEX "CompletionTypeOption_isActive_displayOrder_idx" ON "public"."CompletionTypeOption"("isActive" ASC, "displayOrder" ASC);

-- CreateIndex
CREATE INDEX "CompletionTypeOption_name_idx" ON "public"."CompletionTypeOption"("name" ASC);

-- CreateIndex
CREATE INDEX "HakjongFitAnswer_domainSnapshot_idx" ON "public"."HakjongFitAnswer"("domainSnapshot" ASC);

-- CreateIndex
CREATE INDEX "HakjongFitAnswer_submissionId_displayOrder_idx" ON "public"."HakjongFitAnswer"("submissionId" ASC, "displayOrder" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "HakjongFitAnswer_submissionId_questionId_key" ON "public"."HakjongFitAnswer"("submissionId" ASC, "questionId" ASC);

-- CreateIndex
CREATE INDEX "HakjongFitQuestion_domain_idx" ON "public"."HakjongFitQuestion"("domain" ASC);

-- CreateIndex
CREATE INDEX "HakjongFitQuestion_version_isActive_idx" ON "public"."HakjongFitQuestion"("version" ASC, "isActive" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "HakjongFitQuestion_version_questionNumber_key" ON "public"."HakjongFitQuestion"("version" ASC, "questionNumber" ASC);

-- CreateIndex
CREATE INDEX "HakjongFitSubmission_userId_createdAt_idx" ON "public"."HakjongFitSubmission"("userId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "HakjongFitSubmission_userId_status_idx" ON "public"."HakjongFitSubmission"("userId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "HakjongFitSubmission_version_idx" ON "public"."HakjongFitSubmission"("version" ASC);

-- CreateIndex
CREATE INDEX "HakjongFitSubmissionQuestion_questionId_idx" ON "public"."HakjongFitSubmissionQuestion"("questionId" ASC);

-- CreateIndex
CREATE INDEX "HakjongFitSubmissionQuestion_submissionId_displayOrder_idx" ON "public"."HakjongFitSubmissionQuestion"("submissionId" ASC, "displayOrder" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "HakjongFitSubmissionQuestion_submissionId_displayOrder_key" ON "public"."HakjongFitSubmissionQuestion"("submissionId" ASC, "displayOrder" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "HakjongFitSubmissionQuestion_submissionId_questionId_key" ON "public"."HakjongFitSubmissionQuestion"("submissionId" ASC, "questionId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentOrder_orderId_key" ON "public"."PaymentOrder"("orderId" ASC);

-- CreateIndex
CREATE INDEX "PaymentOrder_productCode_status_idx" ON "public"."PaymentOrder"("productCode" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "PaymentOrder_provider_status_idx" ON "public"."PaymentOrder"("provider" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "PaymentOrder_requestedAt_idx" ON "public"."PaymentOrder"("requestedAt" ASC);

-- CreateIndex
CREATE INDEX "PaymentOrder_userId_idx" ON "public"."PaymentOrder"("userId" ASC);

-- CreateIndex
CREATE INDEX "PaymentOrder_userId_status_idx" ON "public"."PaymentOrder"("userId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "PaymentTransaction_paymentOrderId_idx" ON "public"."PaymentTransaction"("paymentOrderId" ASC);

-- CreateIndex
CREATE INDEX "PaymentTransaction_providerPaymentKey_idx" ON "public"."PaymentTransaction"("providerPaymentKey" ASC);

-- CreateIndex
CREATE INDEX "PaymentTransaction_providerTransactionId_idx" ON "public"."PaymentTransaction"("providerTransactionId" ASC);

-- CreateIndex
CREATE INDEX "PaymentTransaction_provider_idx" ON "public"."PaymentTransaction"("provider" ASC);

-- CreateIndex
CREATE INDEX "PaymentTransaction_userId_idx" ON "public"."PaymentTransaction"("userId" ASC);

-- CreateIndex
CREATE INDEX "PaymentTransaction_userId_status_idx" ON "public"."PaymentTransaction"("userId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "PhoneVerificationCode_phone_purpose_createdAt_idx" ON "public"."PhoneVerificationCode"("phone" ASC, "purpose" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "PhoneVerificationCode_phone_purpose_verified_idx" ON "public"."PhoneVerificationCode"("phone" ASC, "purpose" ASC, "verified" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "School_schoolCode_key" ON "public"."School"("schoolCode" ASC);

-- CreateIndex
CREATE INDEX "School_sido_idx" ON "public"."School"("sido" ASC);

-- CreateIndex
CREATE INDEX "School_sido_sigungu_idx" ON "public"."School"("sido" ASC, "sigungu" ASC);

-- CreateIndex
CREATE INDEX "School_sido_sigungu_schoolName_idx" ON "public"."School"("sido" ASC, "sigungu" ASC, "schoolName" ASC);

-- CreateIndex
CREATE INDEX "StudentMockExamRecord_submissionId_idx" ON "public"."StudentMockExamRecord"("submissionId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "StudentMockExamRecord_userId_examYear_examMonth_gradeLevel_key" ON "public"."StudentMockExamRecord"("userId" ASC, "examYear" ASC, "examMonth" ASC, "gradeLevel" ASC);

-- CreateIndex
CREATE INDEX "StudentMockExamRecord_userId_examYear_examMonth_idx" ON "public"."StudentMockExamRecord"("userId" ASC, "examYear" ASC, "examMonth" ASC);

-- CreateIndex
CREATE INDEX "StudentMockExamRecord_userId_idx" ON "public"."StudentMockExamRecord"("userId" ASC);

-- CreateIndex
CREATE INDEX "StudentMockExamRecord_userId_submissionId_idx" ON "public"."StudentMockExamRecord"("userId" ASC, "submissionId" ASC);

-- CreateIndex
CREATE INDEX "StudentMockExamSubmission_userId_createdAt_idx" ON "public"."StudentMockExamSubmission"("userId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "StudentMockExamSubmission_userId_idx" ON "public"."StudentMockExamSubmission"("userId" ASC);

-- CreateIndex
CREATE INDEX "StudentMockExamSubmission_userId_isLocked_idx" ON "public"."StudentMockExamSubmission"("userId" ASC, "isLocked" ASC);

-- CreateIndex
CREATE INDEX "StudentMockExamSubmission_userId_status_idx" ON "public"."StudentMockExamSubmission"("userId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "StudentRecordGrade_completionTypeOptionId_idx" ON "public"."StudentRecordGrade"("completionTypeOptionId" ASC);

-- CreateIndex
CREATE INDEX "StudentRecordGrade_subjectGroupOptionId_idx" ON "public"."StudentRecordGrade"("subjectGroupOptionId" ASC);

-- CreateIndex
CREATE INDEX "StudentRecordGrade_submissionId_idx" ON "public"."StudentRecordGrade"("submissionId" ASC);

-- CreateIndex
CREATE INDEX "StudentRecordGrade_userId_idx" ON "public"."StudentRecordGrade"("userId" ASC);

-- CreateIndex
CREATE INDEX "StudentRecordGrade_userId_schoolYear_semester_idx" ON "public"."StudentRecordGrade"("userId" ASC, "schoolYear" ASC, "semester" ASC);

-- CreateIndex
CREATE INDEX "StudentRecordGrade_userId_subjectGroupSnapshot_idx" ON "public"."StudentRecordGrade"("userId" ASC, "subjectGroupSnapshot" ASC);

-- CreateIndex
CREATE INDEX "StudentRecordGrade_userId_submissionId_idx" ON "public"."StudentRecordGrade"("userId" ASC, "submissionId" ASC);

-- CreateIndex
CREATE INDEX "StudentRecordSubjectCatalog_isActive_displayOrder_idx" ON "public"."StudentRecordSubjectCatalog"("isActive" ASC, "displayOrder" ASC);

-- CreateIndex
CREATE INDEX "StudentRecordSubjectCatalog_subjectGroup_completionType_idx" ON "public"."StudentRecordSubjectCatalog"("subjectGroup" ASC, "completionType" ASC);

-- CreateIndex
CREATE INDEX "StudentRecordSubjectCatalog_subjectName_idx" ON "public"."StudentRecordSubjectCatalog"("subjectName" ASC);

-- CreateIndex
CREATE INDEX "StudentRecordSubmission_userId_createdAt_idx" ON "public"."StudentRecordSubmission"("userId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "StudentRecordSubmission_userId_idx" ON "public"."StudentRecordSubmission"("userId" ASC);

-- CreateIndex
CREATE INDEX "StudentRecordSubmission_userId_isLocked_idx" ON "public"."StudentRecordSubmission"("userId" ASC, "isLocked" ASC);

-- CreateIndex
CREATE INDEX "StudentRecordSubmission_userId_status_idx" ON "public"."StudentRecordSubmission"("userId" ASC, "status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "SubjectGroupOption_code_key" ON "public"."SubjectGroupOption"("code" ASC);

-- CreateIndex
CREATE INDEX "SubjectGroupOption_isActive_displayOrder_idx" ON "public"."SubjectGroupOption"("isActive" ASC, "displayOrder" ASC);

-- CreateIndex
CREATE INDEX "SubjectGroupOption_name_idx" ON "public"."SubjectGroupOption"("name" ASC);

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "public"."User"("createdAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email" ASC);

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role" ASC);

-- CreateIndex
CREATE INDEX "User_schoolId_idx" ON "public"."User"("schoolId" ASC);

-- CreateIndex
CREATE INDEX "UserEntitlement_featureCode_status_idx" ON "public"."UserEntitlement"("featureCode" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "UserEntitlement_grantType_status_idx" ON "public"."UserEntitlement"("grantType" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "UserEntitlement_userId_idx" ON "public"."UserEntitlement"("userId" ASC);

-- CreateIndex
CREATE INDEX "UserEntitlement_userId_status_expiresAt_idx" ON "public"."UserEntitlement"("userId" ASC, "status" ASC, "expiresAt" ASC);

-- AddForeignKey
ALTER TABLE "public"."HakjongFitAnswer" ADD CONSTRAINT "HakjongFitAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."HakjongFitQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HakjongFitAnswer" ADD CONSTRAINT "HakjongFitAnswer_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "public"."HakjongFitSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HakjongFitSubmission" ADD CONSTRAINT "HakjongFitSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HakjongFitSubmissionQuestion" ADD CONSTRAINT "HakjongFitSubmissionQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."HakjongFitQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HakjongFitSubmissionQuestion" ADD CONSTRAINT "HakjongFitSubmissionQuestion_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "public"."HakjongFitSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentOrder" ADD CONSTRAINT "PaymentOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_paymentOrderId_fkey" FOREIGN KEY ("paymentOrderId") REFERENCES "public"."PaymentOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentMockExamRecord" ADD CONSTRAINT "StudentMockExamRecord_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "public"."StudentMockExamSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentMockExamRecord" ADD CONSTRAINT "StudentMockExamRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentMockExamSubmission" ADD CONSTRAINT "StudentMockExamSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentRecordGrade" ADD CONSTRAINT "StudentRecordGrade_completionTypeOptionId_fkey" FOREIGN KEY ("completionTypeOptionId") REFERENCES "public"."CompletionTypeOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentRecordGrade" ADD CONSTRAINT "StudentRecordGrade_subjectGroupOptionId_fkey" FOREIGN KEY ("subjectGroupOptionId") REFERENCES "public"."SubjectGroupOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentRecordGrade" ADD CONSTRAINT "StudentRecordGrade_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "public"."StudentRecordSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentRecordGrade" ADD CONSTRAINT "StudentRecordGrade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentRecordSubmission" ADD CONSTRAINT "StudentRecordSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "public"."School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserEntitlement" ADD CONSTRAINT "UserEntitlement_paymentOrderId_fkey" FOREIGN KEY ("paymentOrderId") REFERENCES "public"."PaymentOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserEntitlement" ADD CONSTRAINT "UserEntitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
