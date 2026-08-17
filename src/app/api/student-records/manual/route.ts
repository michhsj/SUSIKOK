//src\app\api\student-records\manual\route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { StudentRecordInputMethod, UploadStatus } from "@prisma/client";
import { db } from "@/lib/db";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/auth/session";

type ManualGradeRowInput = {
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

type NormalizedManualGradeRow = {
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

type ParsedManualGradeRow = {
  academicTermLabel: string;
  schoolYear: number;
  semester: number;
  subjectGroupSnapshot: string;
  completionTypeSnapshot: string;
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
  return String(value ?? "").trim();
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
  return Number.isFinite(parsed) ? parsed : null;
}

function jsonError(message: string, status: number) {
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

function mapGradeToResponse(grade: {
  id: string;
  academicTermLabel: string;
  subjectGroupSnapshot: string;
  completionTypeSnapshot: string | null;
  subjectName: string;
  credits: number | null;
  rawScore: number | null;
  averageScore: number | null;
  standardDeviation: number | null;
  achievement: string | null;
  grade: number | null;
  enrolledStudentCount: number | null;
  achievementARatio: number | null;
  achievementBRatio: number | null;
  achievementCRatio: number | null;
}) {
  return {
    id: grade.id,
    academicTerm: grade.academicTermLabel,
    subjectGroup: grade.subjectGroupSnapshot,
    completionType: grade.completionTypeSnapshot ?? "",
    subjectName: grade.subjectName,
    credits:
      grade.credits !== null && grade.credits !== undefined
        ? String(grade.credits)
        : "",
    rawScore:
      grade.rawScore !== null && grade.rawScore !== undefined
        ? String(grade.rawScore)
        : "",
    averageScore:
      grade.averageScore !== null && grade.averageScore !== undefined
        ? String(grade.averageScore)
        : "",
    standardDeviation:
      grade.standardDeviation !== null &&
      grade.standardDeviation !== undefined
        ? String(grade.standardDeviation)
        : "",
    achievement: grade.achievement ?? "",
    grade:
      grade.grade !== null && grade.grade !== undefined
        ? String(grade.grade)
        : "",
    enrolledStudentCount:
      grade.enrolledStudentCount !== null &&
      grade.enrolledStudentCount !== undefined
        ? String(grade.enrolledStudentCount)
        : "",
    achievementARatio:
      grade.achievementARatio !== null &&
      grade.achievementARatio !== undefined
        ? String(grade.achievementARatio)
        : "",
    achievementBRatio:
      grade.achievementBRatio !== null &&
      grade.achievementBRatio !== undefined
        ? String(grade.achievementBRatio)
        : "",
    achievementCRatio:
      grade.achievementCRatio !== null &&
      grade.achievementCRatio !== undefined
        ? String(grade.achievementCRatio)
        : "",
  };
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return jsonError("로그인이 필요합니다.", 401);
    }

    const lockedSubmission = await db.studentRecordSubmission.findFirst({
      where: {
        userId: user.id,
        isLocked: true,
      },
      orderBy: [{ finalizedAt: "desc" }, { createdAt: "desc" }],
      include: {
        grades: {
          orderBy: [
            { schoolYear: "asc" },
            { semester: "asc" },
            { subjectName: "asc" },
          ],
        },
      },
    });

    if (!lockedSubmission) {
      return NextResponse.json({
        success: true,
        exists: false,
        isConfirmed: false,
        inputMethod: null,
        rows: [],
      });
    }

    const isManualSubmission =
      lockedSubmission.inputMethod === StudentRecordInputMethod.MANUAL;

    return NextResponse.json({
      success: true,
      exists: true,
      submissionId: lockedSubmission.id,
      isConfirmed: lockedSubmission.isLocked,
      inputMethod: lockedSubmission.inputMethod,
      rows: isManualSubmission
        ? lockedSubmission.grades.map(mapGradeToResponse)
        : [],
    });
  } catch (error) {
    console.error("[GET] /api/student-records/manual", error);

    return NextResponse.json(
      {
        success: false,
        message: "직접 입력 성적 조회 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return jsonError("로그인이 필요합니다.", 401);
    }

    const body = await request.json().catch(() => null);
    const inputRows = Array.isArray(body?.rows)
      ? (body.rows as ManualGradeRowInput[])
      : null;

    if (!inputRows || inputRows.length === 0) {
      return jsonError("저장할 성적 데이터가 없습니다.", 400);
    }

    const normalizedRows: NormalizedManualGradeRow[] = inputRows
      .map(
        (row: ManualGradeRowInput): NormalizedManualGradeRow => ({
          academicTerm: toTrimmedString(row.academicTerm),
          subjectGroup: toTrimmedString(row.subjectGroup),
          completionType: toTrimmedString(row.completionType),
          subjectName: toTrimmedString(row.subjectName),
          credits: toTrimmedString(row.credits),
          rawScore: toTrimmedString(row.rawScore),
          averageScore: toTrimmedString(row.averageScore),
          standardDeviation: toTrimmedString(row.standardDeviation),
          achievement: toTrimmedString(row.achievement),
          grade: toTrimmedString(row.grade),
          enrolledStudentCount: toTrimmedString(row.enrolledStudentCount),
          achievementARatio: toTrimmedString(row.achievementARatio),
          achievementBRatio: toTrimmedString(row.achievementBRatio),
          achievementCRatio: toTrimmedString(row.achievementCRatio),
        })
      )
      .filter(
        (row: NormalizedManualGradeRow) =>
          row.academicTerm ||
          row.subjectGroup ||
          row.completionType ||
          row.subjectName ||
          row.credits ||
          row.rawScore ||
          row.averageScore ||
          row.standardDeviation ||
          row.achievement ||
          row.grade ||
          row.enrolledStudentCount ||
          row.achievementARatio ||
          row.achievementBRatio ||
          row.achievementCRatio
      );

    if (normalizedRows.length === 0) {
      return jsonError("저장할 성적 데이터가 없습니다.", 400);
    }

    for (let index = 0; index < normalizedRows.length; index += 1) {
      const row = normalizedRows[index];

      if (!row.academicTerm) {
        return jsonError(`${index + 1}번째 행의 학년학기를 입력해 주세요.`, 400);
      }
      if (!row.subjectGroup) {
        return jsonError(`${index + 1}번째 행의 교과를 입력해 주세요.`, 400);
      }
      if (!row.completionType) {
        return jsonError(`${index + 1}번째 행의 이수구분을 입력해 주세요.`, 400);
      }
      if (!row.subjectName) {
        return jsonError(`${index + 1}번째 행의 과목명을 입력해 주세요.`, 400);
      }
      if (!row.credits) {
        return jsonError(`${index + 1}번째 행의 학점을 입력해 주세요.`, 400);
      }
      if (!row.achievement) {
        return jsonError(`${index + 1}번째 행의 성취도를 입력해 주세요.`, 400);
      }
    }

    let parsedRows: ParsedManualGradeRow[];

    try {
      parsedRows = normalizedRows.map(
        (
          row: NormalizedManualGradeRow,
          index: number
        ): ParsedManualGradeRow => {
          const academicTerm = parseAcademicTermLabel(row.academicTerm);

          if (!academicTerm) {
            throw new Error(
              `${index + 1}번째 행의 학년학기 형식이 올바르지 않습니다.`
            );
          }

          const credits = parseNumberValue(row.credits);
          const rawScore = row.rawScore ? parseNumberValue(row.rawScore) : null;
          const averageScore = row.averageScore
            ? parseNumberValue(row.averageScore)
            : null;
          const standardDeviation = row.standardDeviation
            ? parseNumberValue(row.standardDeviation)
            : null;
          const grade = row.grade ? parseNumberValue(row.grade) : null;
          const enrolledStudentCount = row.enrolledStudentCount
            ? parseNumberValue(row.enrolledStudentCount)
            : null;
          const achievementARatio = row.achievementARatio
            ? parseNumberValue(row.achievementARatio)
            : null;
          const achievementBRatio = row.achievementBRatio
            ? parseNumberValue(row.achievementBRatio)
            : null;
          const achievementCRatio = row.achievementCRatio
            ? parseNumberValue(row.achievementCRatio)
            : null;

          if (credits === null || credits <= 0) {
            throw new Error(`${index + 1}번째 행의 학점 값이 올바르지 않습니다.`);
          }

          if (
            row.rawScore &&
            (rawScore === null || rawScore < 0 || rawScore > 100)
          ) {
            throw new Error(`${index + 1}번째 행의 원점수 값이 올바르지 않습니다.`);
          }

          if (row.averageScore && averageScore === null) {
            throw new Error(`${index + 1}번째 행의 평균 값이 올바르지 않습니다.`);
          }

          if (row.standardDeviation && standardDeviation === null) {
            throw new Error(
              `${index + 1}번째 행의 표준편차 값이 올바르지 않습니다.`
            );
          }

          if (row.grade && (grade === null || grade < 1 || grade > 9)) {
            throw new Error(`${index + 1}번째 행의 등급 값이 올바르지 않습니다.`);
          }

          if (
            row.enrolledStudentCount &&
            (enrolledStudentCount === null || enrolledStudentCount < 0)
          ) {
            throw new Error(`${index + 1}번째 행의 재적수 값이 올바르지 않습니다.`);
          }

          if (
            row.achievementARatio &&
            (achievementARatio === null ||
              achievementARatio < 0 ||
              achievementARatio > 100)
          ) {
            throw new Error(`${index + 1}번째 행의 A비율 값이 올바르지 않습니다.`);
          }

          if (
            row.achievementBRatio &&
            (achievementBRatio === null ||
              achievementBRatio < 0 ||
              achievementBRatio > 100)
          ) {
            throw new Error(`${index + 1}번째 행의 B비율 값이 올바르지 않습니다.`);
          }

          if (
            row.achievementCRatio &&
            (achievementCRatio === null ||
              achievementCRatio < 0 ||
              achievementCRatio > 100)
          ) {
            throw new Error(`${index + 1}번째 행의 C비율 값이 올바르지 않습니다.`);
          }

          return {
            academicTermLabel: row.academicTerm,
            schoolYear: academicTerm.schoolYear,
            semester: academicTerm.semester,
            subjectGroupSnapshot: row.subjectGroup,
            completionTypeSnapshot: row.completionType,
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
    } catch (caughtError) {
      return jsonError(
        caughtError instanceof Error
          ? caughtError.message
          : "직접 입력 성적 검증 중 오류가 발생했습니다.",
        400
      );
    }

    const existingLockedSubmission = await db.studentRecordSubmission.findFirst({
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
      return jsonError(
        existingLockedSubmission.inputMethod === StudentRecordInputMethod.EXCEL
          ? "이미 최종 확정된 엑셀 업로드 성적이 있어 직접 입력을 진행할 수 없습니다."
          : "이미 최종 확정된 직접 입력 성적이 있습니다.",
        409
      );
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
            inputMethod: StudentRecordInputMethod.MANUAL,
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
          inputMethod: StudentRecordInputMethod.MANUAL,
          status: UploadStatus.FINALIZED,
          isLocked: true,
          finalizedAt: new Date(),
        },
        select: {
          id: true,
        },
      });

      await tx.studentRecordGrade.createMany({
        data: parsedRows.map((row: ParsedManualGradeRow) => ({
          userId: user.id,
          submissionId: submission.id,
          academicTermLabel: row.academicTermLabel,
          schoolYear: row.schoolYear,
          semester: row.semester,
          subjectGroupOptionId:
            subjectGroupIdMap.get(row.subjectGroupSnapshot) ?? null,
          subjectGroupSnapshot: row.subjectGroupSnapshot,
          completionTypeOptionId:
            completionTypeIdMap.get(row.completionTypeSnapshot) ?? null,
          completionTypeSnapshot: row.completionTypeSnapshot,
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
      message: "직접 입력 성적이 저장되었습니다.",
      submissionId: result.id,
      savedCount: parsedRows.length,
    });
  } catch (error) {
    console.error("[POST] /api/student-records/manual", error);

    const message =
      error instanceof Error
        ? error.message
        : "직접 입력 성적 저장 중 오류가 발생했습니다.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}
