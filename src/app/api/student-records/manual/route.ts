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
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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

    return NextResponse.json({
      success: true,
      exists: true,
      submissionId: lockedSubmission.id,
      isConfirmed: lockedSubmission.isLocked,
      inputMethod: lockedSubmission.inputMethod,
      rows: lockedSubmission.grades.map((grade) => ({
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
      })),
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
      return error("로그인이 필요합니다.", 401);
    }

    const body = await request.json().catch(() => null);
    const inputRows = Array.isArray(body?.rows)
      ? (body.rows as ManualGradeRowInput[])
      : null;

    if (!inputRows || inputRows.length === 0) {
      return error("저장할 성적 데이터가 없습니다.", 400);
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
          row.grade
      );

    if (normalizedRows.length === 0) {
      return error("저장할 성적 데이터가 없습니다.", 400);
    }

    for (let index = 0; index < normalizedRows.length; index += 1) {
      const row = normalizedRows[index];

      if (!row.academicTerm) {
        return error(`${index + 1}번째 행의 학년학기를 입력해 주세요.`, 400);
      }
      if (!row.subjectGroup) {
        return error(`${index + 1}번째 행의 교과를 입력해 주세요.`, 400);
      }
      if (!row.completionType) {
        return error(`${index + 1}번째 행의 이수구분을 입력해 주세요.`, 400);
      }
      if (!row.subjectName) {
        return error(`${index + 1}번째 행의 과목명을 입력해 주세요.`, 400);
      }
      if (!row.credits) {
        return error(`${index + 1}번째 행의 학점을 입력해 주세요.`, 400);
      }
      if (!row.achievement) {
        return error(`${index + 1}번째 행의 성취도를 입력해 주세요.`, 400);
      }
    }

    const parsedRows: ParsedManualGradeRow[] = normalizedRows.map(
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
        };
      }
    );

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
      return error(
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
