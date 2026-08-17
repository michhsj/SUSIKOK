//src\app\api\student-records\excel\route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  StudentRecordInputMethod,
  UploadStatus,
} from "@prisma/client";

import { db } from "@/lib/db";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/auth/session";

type ExcelGradeRowInput = {
  academicTerm?: unknown;
  subjectGroup?: unknown;
  completionType?: unknown;
  subjectName?: unknown;
  credits?: unknown;
  rawScore?: unknown;
  averageScore?: unknown;
  standardDeviation?: unknown;
  achievement?: unknown;
  grade?: unknown;
  enrolledStudentCount?: unknown;
  achievementARatio?: unknown;
  achievementBRatio?: unknown;
  achievementCRatio?: unknown;
};

type NormalizedExcelGradeRow = {
  academicTerm: string;
  subjectGroup: string;
  completionType: string;
  subjectName: string;
  credits: string;
  rawScore: string;
  averageScore: string;
  standardDeviation: string;
  achievement: string;
  grade: string;
  enrolledStudentCount: string;
  achievementARatio: string;
  achievementBRatio: string;
  achievementCRatio: string;
};

type ParsedExcelGradeRow = {
  academicTermLabel: string;
  schoolYear: number;
  semester: number;
  subjectGroup: string;
  completionType: string;
  subjectName: string;
  credits: number;
  rawScore: number | null;
  averageScore: number | null;
  standardDeviation: number | null;
  achievement: string;
  grade: number | null;
  enrolledStudentCount: number | null;
  achievementARatio: number | null;
  achievementBRatio: number | null;
  achievementCRatio: number | null;
};

function toTrimmedString(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value).trim();
  }

  return "";
}

function parseAcademicTermLabel(label: string) {
  const match = label.match(/^([1-3])학년\s*([1-2])학기$/);

  if (!match) {
    return null;
  }

  return {
    schoolYear: Number(match[1]),
    semester: Number(match[2]),
  };
}

function parseNumberValue(value: string) {
  if (!value) {
    return null;
  }

  const cleaned = value.replace(/,/g, "").trim();

  if (!cleaned) {
    return null;
  }

  const parsed = Number(cleaned);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function error(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status }
  );
}

async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(sessionToken);

  if (!session) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return user;
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return error("로그인이 필요합니다.", 401);
    }

    const submission = await db.studentRecordSubmission.findFirst({
      where: {
        userId: user.id,
        isLocked: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        grades: {
          orderBy: [
            { schoolYear: "asc" },
            { semester: "asc" },
            { createdAt: "asc" },
          ],
        },
      },
    });

    if (!submission) {
      return NextResponse.json({
        success: true,
        exists: false,
        isConfirmed: false,
        inputMethod: null,
        rows: [],
      });
    }

    return NextResponse.json({
      success: true,
      exists: true,
      submissionId: submission.id,
      isConfirmed: submission.isLocked,
      inputMethod: submission.inputMethod,
      fileName: submission.fileName ?? "",
      rows: submission.grades.map((grade) => ({
        id: grade.id,
        academicTerm: grade.academicTermLabel,
        subjectGroup: grade.subjectGroupSnapshot,
        completionType: grade.completionTypeSnapshot,
        subjectName: grade.subjectName,
        credits:
          grade.credits === null || grade.credits === undefined
            ? ""
            : String(grade.credits),
        rawScore:
          grade.rawScore === null || grade.rawScore === undefined
            ? ""
            : String(grade.rawScore),
        averageScore:
          grade.averageScore === null || grade.averageScore === undefined
            ? ""
            : String(grade.averageScore),
        standardDeviation:
          grade.standardDeviation === null ||
          grade.standardDeviation === undefined
            ? ""
            : String(grade.standardDeviation),
        achievement: grade.achievement ?? "",
        grade:
          grade.grade === null || grade.grade === undefined
            ? ""
            : String(grade.grade),
        enrolledStudentCount:
          grade.enrolledStudentCount === null ||
          grade.enrolledStudentCount === undefined
            ? ""
            : String(grade.enrolledStudentCount),
        achievementARatio:
          grade.achievementARatio === null ||
          grade.achievementARatio === undefined
            ? ""
            : String(grade.achievementARatio),
        achievementBRatio:
          grade.achievementBRatio === null ||
          grade.achievementBRatio === undefined
            ? ""
            : String(grade.achievementBRatio),
        achievementCRatio:
          grade.achievementCRatio === null ||
          grade.achievementCRatio === undefined
            ? ""
            : String(grade.achievementCRatio),
      })),
    });
  } catch (err) {
    console.error("[GET] /api/student-records/excel", err);

    return NextResponse.json(
      {
        success: false,
        message: "엑셀 업로드 성적 조회 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return error("로그인이 필요합니다.", 401);
    }

    const body = await request.json().catch(() => null);
    const rawRows: ExcelGradeRowInput[] = Array.isArray(body?.rows)
      ? (body.rows as ExcelGradeRowInput[])
      : [];
    const fileName = toTrimmedString(body?.fileName);

    if (rawRows.length === 0) {
      return error("업로드할 성적 데이터가 없습니다.", 400);
    }

    const normalizedRows: NormalizedExcelGradeRow[] = rawRows
      .map(
        (row: ExcelGradeRowInput): NormalizedExcelGradeRow => ({
          academicTerm: toTrimmedString(row?.academicTerm),
          subjectGroup: toTrimmedString(row?.subjectGroup),
          completionType: toTrimmedString(row?.completionType),
          subjectName: toTrimmedString(row?.subjectName),
          credits: toTrimmedString(row?.credits),
          rawScore: toTrimmedString(row?.rawScore),
          averageScore: toTrimmedString(row?.averageScore),
          standardDeviation: toTrimmedString(row?.standardDeviation),
          achievement: toTrimmedString(row?.achievement),
          grade: toTrimmedString(row?.grade),
          enrolledStudentCount: toTrimmedString(row?.enrolledStudentCount),
          achievementARatio: toTrimmedString(row?.achievementARatio),
          achievementBRatio: toTrimmedString(row?.achievementBRatio),
          achievementCRatio: toTrimmedString(row?.achievementCRatio),
        })
      )
      .filter((row: NormalizedExcelGradeRow) =>
        Object.values(row).some((value) => value !== "")
      );

    if (normalizedRows.length === 0) {
      return error("업로드할 성적 데이터가 없습니다.", 400);
    }

    for (const [index, row] of normalizedRows.entries()) {
      const rowNumber = index + 1;

      if (!row.academicTerm) {
        return error(`${rowNumber}번째 행의 학년학기를 입력해 주세요.`, 400);
      }

      if (!row.subjectGroup) {
        return error(`${rowNumber}번째 행의 교과를 입력해 주세요.`, 400);
      }

      if (!row.completionType) {
        return error(`${rowNumber}번째 행의 이수구분을 입력해 주세요.`, 400);
      }

      if (!row.subjectName) {
        return error(`${rowNumber}번째 행의 과목명을 입력해 주세요.`, 400);
      }

      if (!row.credits) {
        return error(`${rowNumber}번째 행의 학점을 입력해 주세요.`, 400);
      }

      if (!row.achievement) {
        return error(`${rowNumber}번째 행의 성취도를 입력해 주세요.`, 400);
      }
    }

    const parsedRows: ParsedExcelGradeRow[] = normalizedRows.map(
      (
        row: NormalizedExcelGradeRow,
        index: number
      ): ParsedExcelGradeRow => {
        const rowNumber = index + 1;

        const academicTerm = parseAcademicTermLabel(row.academicTerm);

        if (!academicTerm) {
          throw new Error(
            `${rowNumber}번째 행의 학년학기 형식이 올바르지 않습니다. 예: 1학년 1학기`
          );
        }

        const credits = parseNumberValue(row.credits);
        if (credits === null || credits <= 0) {
          throw new Error(
            `${rowNumber}번째 행의 학점은 0보다 큰 숫자여야 합니다.`
          );
        }

        const rawScore = row.rawScore ? parseNumberValue(row.rawScore) : null;
        if (
          row.rawScore &&
          (rawScore === null || rawScore < 0 || rawScore > 100)
        ) {
          throw new Error(
            `${rowNumber}번째 행의 원점수는 0~100 사이 숫자여야 합니다.`
          );
        }

        const averageScore = row.averageScore
          ? parseNumberValue(row.averageScore)
          : null;
        if (row.averageScore && averageScore === null) {
          throw new Error(
            `${rowNumber}번째 행의 평균은 숫자로 입력해 주세요.`
          );
        }

        const standardDeviation = row.standardDeviation
          ? parseNumberValue(row.standardDeviation)
          : null;
        if (row.standardDeviation && standardDeviation === null) {
          throw new Error(
            `${rowNumber}번째 행의 표준편차는 숫자로 입력해 주세요.`
          );
        }

        const grade = row.grade ? parseNumberValue(row.grade) : null;
        if (row.grade && (grade === null || grade < 1 || grade > 9)) {
          throw new Error(
            `${rowNumber}번째 행의 등급은 1~9 사이 숫자여야 합니다.`
          );
        }

        const enrolledStudentCount = row.enrolledStudentCount
          ? parseNumberValue(row.enrolledStudentCount)
          : null;
        if (
          row.enrolledStudentCount &&
          (enrolledStudentCount === null || enrolledStudentCount < 0)
        ) {
          throw new Error(
            `${rowNumber}번째 행의 재적수는 0 이상 숫자여야 합니다.`
          );
        }

        const achievementARatio = row.achievementARatio
          ? parseNumberValue(row.achievementARatio)
          : null;
        if (
          row.achievementARatio &&
          (achievementARatio === null ||
            achievementARatio < 0 ||
            achievementARatio > 100)
        ) {
          throw new Error(
            `${rowNumber}번째 행의 A비율은 0~100 사이 숫자여야 합니다.`
          );
        }

        const achievementBRatio = row.achievementBRatio
          ? parseNumberValue(row.achievementBRatio)
          : null;
        if (
          row.achievementBRatio &&
          (achievementBRatio === null ||
            achievementBRatio < 0 ||
            achievementBRatio > 100)
        ) {
          throw new Error(
            `${rowNumber}번째 행의 B비율은 0~100 사이 숫자여야 합니다.`
          );
        }

        const achievementCRatio = row.achievementCRatio
          ? parseNumberValue(row.achievementCRatio)
          : null;
        if (
          row.achievementCRatio &&
          (achievementCRatio === null ||
            achievementCRatio < 0 ||
            achievementCRatio > 100)
        ) {
          throw new Error(
            `${rowNumber}번째 행의 C비율은 0~100 사이 숫자여야 합니다.`
          );
        }

        return {
          academicTermLabel: row.academicTerm,
          ...academicTerm,
          subjectGroup: row.subjectGroup,
          completionType: row.completionType,
          subjectName: row.subjectName,
          credits,
          rawScore,
          averageScore,
          standardDeviation,
          achievement: row.achievement,
          grade,
          enrolledStudentCount:
            enrolledStudentCount === null
              ? null
              : Math.floor(enrolledStudentCount),
          achievementARatio,
          achievementBRatio,
          achievementCRatio,
        };
      }
    );

    const existingLockedSubmission =
      await db.studentRecordSubmission.findFirst({
        where: {
          userId: user.id,
          isLocked: true,
        },
        select: {
          id: true,
          inputMethod: true,
        },
      });

    if (existingLockedSubmission) {
      if (
        existingLockedSubmission.inputMethod ===
        StudentRecordInputMethod.MANUAL
      ) {
        return error(
          "이미 최종 확정된 직접 입력 성적이 있어 엑셀 업로드를 진행할 수 없습니다.",
          409
        );
      }

      return error("이미 최종 확정된 엑셀 업로드 성적이 있습니다.", 409);
    }

    const [subjectGroupOptions, completionTypeOptions, draftSubmissions] =
      await Promise.all([
        db.subjectGroupOption.findMany({
          where: { isActive: true },
          select: { id: true, name: true },
        }),
        db.completionTypeOption.findMany({
          where: { isActive: true },
          select: { id: true, name: true },
        }),
        db.studentRecordSubmission.findMany({
          where: {
            userId: user.id,
            inputMethod: StudentRecordInputMethod.EXCEL,
            isLocked: false,
          },
          select: { id: true },
        }),
      ]);

    const subjectGroupIdMap = new Map<string, string>(
      subjectGroupOptions.map((option) => [option.name, option.id])
    );

    const completionTypeIdMap = new Map<string, string>(
      completionTypeOptions.map((option) => [option.name, option.id])
    );

    const draftSubmissionIds = draftSubmissions.map(
      (submission) => submission.id
    );

    const result = await db.$transaction(async (tx) => {
      if (draftSubmissionIds.length > 0) {
        await tx.studentRecordGrade.deleteMany({
          where: {
            submissionId: {
              in: draftSubmissionIds,
            },
          },
        });

        await tx.studentRecordSubmission.deleteMany({
          where: {
            id: {
              in: draftSubmissionIds,
            },
          },
        });
      }

      const submission = await tx.studentRecordSubmission.create({
        data: {
          userId: user.id,
          inputMethod: StudentRecordInputMethod.EXCEL,
          status: UploadStatus.FINALIZED,
          isLocked: true,
          finalizedAt: new Date(),
          fileName: fileName || null,
        },
      });

      await tx.studentRecordGrade.createMany({
        data: parsedRows.map((row: ParsedExcelGradeRow) => ({
          submissionId: submission.id,
          userId: user.id,
          academicTermLabel: row.academicTermLabel,
          schoolYear: row.schoolYear,
          semester: row.semester,
          subjectGroupOptionId:
            subjectGroupIdMap.get(row.subjectGroup) ?? null,
          completionTypeOptionId:
            completionTypeIdMap.get(row.completionType) ?? null,
          subjectGroupSnapshot: row.subjectGroup,
          completionTypeSnapshot: row.completionType,
          subjectName: row.subjectName,
          credits: row.credits,
          rawScore: row.rawScore,
          averageScore: row.averageScore,
          standardDeviation: row.standardDeviation,
          achievement: row.achievement,
          grade: row.grade,
          enrolledStudentCount: row.enrolledStudentCount,
          achievementARatio: row.achievementARatio,
          achievementBRatio: row.achievementBRatio,
          achievementCRatio: row.achievementCRatio,
        })),
      });

      return submission;
    });

    return NextResponse.json({
      success: true,
      message: "성적이 저장되었습니다.",
      submissionId: result.id,
      savedCount: parsedRows.length,
    });
  } catch (err) {
    console.error("[POST] /api/student-records/excel", err);

    return NextResponse.json(
      {
        success: false,
        message:
          err instanceof Error
            ? err.message
            : "엑셀 성적 저장 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
