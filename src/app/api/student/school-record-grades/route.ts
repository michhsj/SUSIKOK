import { NextResponse } from "next/server";
import { StudentRecordInputMethod, UploadStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

type SchoolRecordGradeResponseRow = {
  id: string;
  userId: string;
  submissionId: string;
  academicTermLabel: string;
  schoolYear: number;
  semester: number;
  subjectGroupOptionId: string | null;
  subjectGroupSnapshot: string;
  completionTypeOptionId: string | null;
  completionTypeSnapshot: string | null;
  subjectName: string;
  credits: number | null;
  rawScore: number | null;
  averageScore: number | null;
  standardDeviation: number | null;
  achievement: string | null;
  enrolledStudentCount: number | null;
  achievementARatio: number | null;
  achievementBRatio: number | null;
  achievementCRatio: number | null;
  grade: number | null;
  createdAt: string;
  updatedAt: string;
};

type SchoolRecordSubmissionSummary = {
  id: string;
  userId: string;
  inputMethod: StudentRecordInputMethod;
  fileName: string | null;
  status: UploadStatus;
  isLocked: boolean;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function toIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "로그인이 필요합니다.",
        },
        { status: 401 },
      );
    }

    const lockedSubmission = await db.studentRecordSubmission.findFirst({
      where: {
        userId: currentUser.id,
        isLocked: true,
      },
      orderBy: [
        { finalizedAt: "desc" },
        { updatedAt: "desc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        userId: true,
        inputMethod: true,
        fileName: true,
        status: true,
        isLocked: true,
        finalizedAt: true,
        createdAt: true,
        updatedAt: true,
        grades: {
          orderBy: [
            { schoolYear: "asc" },
            { semester: "asc" },
            { subjectName: "asc" },
          ],
          select: {
            id: true,
            userId: true,
            submissionId: true,
            academicTermLabel: true,
            schoolYear: true,
            semester: true,
            subjectGroupOptionId: true,
            subjectGroupSnapshot: true,
            completionTypeOptionId: true,
            completionTypeSnapshot: true,
            subjectName: true,
            credits: true,
            rawScore: true,
            averageScore: true,
            standardDeviation: true,
            achievement: true,
            enrolledStudentCount: true,
            achievementARatio: true,
            achievementBRatio: true,
            achievementCRatio: true,
            grade: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!lockedSubmission) {
      return NextResponse.json({
        success: true,
        exists: false,
        hasSubmission: false,
        submission: null,
        count: 0,
        rows: [],
      });
    }

    const submission: SchoolRecordSubmissionSummary = {
      id: lockedSubmission.id,
      userId: lockedSubmission.userId,
      inputMethod: lockedSubmission.inputMethod,
      fileName: lockedSubmission.fileName,
      status: lockedSubmission.status,
      isLocked: lockedSubmission.isLocked,
      finalizedAt: toIsoString(lockedSubmission.finalizedAt),
      createdAt: lockedSubmission.createdAt.toISOString(),
      updatedAt: lockedSubmission.updatedAt.toISOString(),
    };

    const rows: SchoolRecordGradeResponseRow[] = lockedSubmission.grades.map((grade) => ({
      id: grade.id,
      userId: grade.userId,
      submissionId: grade.submissionId,
      academicTermLabel: grade.academicTermLabel,
      schoolYear: grade.schoolYear,
      semester: grade.semester,
      subjectGroupOptionId: grade.subjectGroupOptionId,
      subjectGroupSnapshot: grade.subjectGroupSnapshot,
      completionTypeOptionId: grade.completionTypeOptionId,
      completionTypeSnapshot: grade.completionTypeSnapshot,
      subjectName: grade.subjectName,
      credits: grade.credits,
      rawScore: grade.rawScore,
      averageScore: grade.averageScore,
      standardDeviation: grade.standardDeviation,
      achievement: grade.achievement,
      enrolledStudentCount: grade.enrolledStudentCount,
      achievementARatio: grade.achievementARatio,
      achievementBRatio: grade.achievementBRatio,
      achievementCRatio: grade.achievementCRatio,
      grade: grade.grade,
      createdAt: grade.createdAt.toISOString(),
      updatedAt: grade.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      exists: true,
      hasSubmission: true,
      submission,
      count: rows.length,
      rows,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "내신 성적 데이터를 불러오지 못했습니다.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 },
    );
  }
}
