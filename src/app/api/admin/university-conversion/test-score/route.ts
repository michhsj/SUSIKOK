//src\app\api\admin\university-conversion\test-score\route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/auth/session";

type TestScoreRowInput = {
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

type AttendanceInput = {
  absenceDays?: unknown;
  lateness?: unknown;
  earlyLeave?: unknown;
  outing?: unknown;
};

type PostBody = {
  testSetId?: unknown;
  testSetName?: unknown;
  rows?: unknown;
  attendance?: unknown;
};

type NormalizedTestScoreRow = {
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

type ParsedTestScoreRow = {
  sortOrder: number;
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

type ParsedAttendance = {
  absenceDays: number | null;
  lateness: number | null;
  earlyLeave: number | null;
  outing: number | null;
} | null;

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function toTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseAcademicTermLabel(label: string): {
  academicTermLabel: string;
  schoolYear: number;
  semester: number;
} {
  const normalized = label.replace(/\s+/g, " ").trim();
  const match = normalized.match(/^([1-3])학년\s*([1-2])학기$/);

  if (!match) {
    throw new ApiError(
      400,
      `학년학기 형식이 올바르지 않습니다: "${label}"`
    );
  }

  return {
    academicTermLabel: `${match[1]}학년 ${match[2]}학기`,
    schoolYear: Number(match[1]),
    semester: Number(match[2]),
  };
}

function parseNumberValue(
  value: string,
  label: string,
  options?: {
    required?: boolean;
    min?: number;
    max?: number;
    integer?: boolean;
  }
): number | null {
  const {
    required = false,
    min,
    max,
    integer = false,
  } = options ?? {};

  if (!value) {
    if (required) {
      throw new ApiError(400, `${label}을(를) 입력해주세요.`);
    }
    return null;
  }

  const normalized = value.replace(/,/g, "").trim();
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    throw new ApiError(400, `${label}은(는) 숫자만 입력할 수 있습니다.`);
  }

  if (integer && !Number.isInteger(parsed)) {
    throw new ApiError(400, `${label}은(는) 정수만 입력할 수 있습니다.`);
  }

  if (typeof min === "number" && parsed < min) {
    throw new ApiError(400, `${label}은(는) ${min} 이상이어야 합니다.`);
  }

  if (typeof max === "number" && parsed > max) {
    throw new ApiError(400, `${label}은(는) ${max} 이하여야 합니다.`);
  }

  return parsed;
}

function toErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: error.status }
    );
  }

  console.error("[/api/admin/university-conversion/test-score]", error);

  return NextResponse.json(
    {
      success: false,
      message: "테스트 성적 처리 중 오류가 발생했습니다.",
    },
    { status: 500 }
  );
}

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    throw new ApiError(401, "로그인이 필요합니다.");
  }

  const session = await verifySessionToken(token);

  if (!session?.userId) {
    throw new ApiError(401, "유효하지 않은 세션입니다.");
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      isActive: true,
    },
  });

  if (!user) {
    throw new ApiError(401, "사용자 정보를 찾을 수 없습니다.");
  }

  if (!user.isActive) {
    throw new ApiError(403, "비활성화된 계정입니다.");
  }

  return user;
}

function isCompletelyEmptyRow(row: TestScoreRowInput): boolean {
  return [
    row.academicTerm,
    row.subjectGroup,
    row.completionType,
    row.subjectName,
    row.credits,
    row.rawScore,
    row.averageScore,
    row.standardDeviation,
    row.achievement,
    row.grade,
    row.enrolledStudentCount,
    row.achievementARatio,
    row.achievementBRatio,
    row.achievementCRatio,
  ].every((value) => toTrimmedString(value) === "");
}

function normalizeRows(rawRows: TestScoreRowInput[]): NormalizedTestScoreRow[] {
  return rawRows
    .filter((row) => !isCompletelyEmptyRow(row))
    .map((row) => ({
      academicTerm: toTrimmedString(row.academicTerm),
      subjectGroup: toTrimmedString(row.subjectGroup),
      completionType: toTrimmedString(row.completionType),
      subjectName: toTrimmedString(row.subjectName),
      credits: toTrimmedString(row.credits),
      rawScore: toTrimmedString(row.rawScore),
      averageScore: toTrimmedString(row.averageScore),
      standardDeviation: toTrimmedString(row.standardDeviation),
      achievement: toTrimmedString(row.achievement).toUpperCase(),
      grade: toTrimmedString(row.grade),
      enrolledStudentCount: toTrimmedString(row.enrolledStudentCount),
      achievementARatio: toTrimmedString(row.achievementARatio),
      achievementBRatio: toTrimmedString(row.achievementBRatio),
      achievementCRatio: toTrimmedString(row.achievementCRatio),
    }));
}

function validateNormalizedRows(rows: NormalizedTestScoreRow[]) {
  if (rows.length === 0) {
    throw new ApiError(400, "저장할 테스트 성적이 없습니다.");
  }

  rows.forEach((row, index) => {
    const rowNumber = index + 1;

    if (!row.academicTerm) {
      throw new ApiError(400, `${rowNumber}행: 학년학기를 선택해주세요.`);
    }

    if (!row.subjectGroup) {
      throw new ApiError(400, `${rowNumber}행: 교과를 선택해주세요.`);
    }

    if (!row.completionType) {
      throw new ApiError(400, `${rowNumber}행: 이수구분을 선택해주세요.`);
    }

    if (!row.subjectName) {
      throw new ApiError(400, `${rowNumber}행: 과목명을 선택해주세요.`);
    }

    if (!row.credits) {
      throw new ApiError(400, `${rowNumber}행: 학점을 입력해주세요.`);
    }

    if (!row.achievement) {
      throw new ApiError(400, `${rowNumber}행: 성취도를 선택해주세요.`);
    }
  });
}

function parseRows(rows: NormalizedTestScoreRow[]): ParsedTestScoreRow[] {
  const allowedAchievements = new Set(["A", "B", "C", "D", "E", "F", "P"]);

  return rows.map((row, index) => {
    const rowNumber = index + 1;
    const { academicTermLabel, schoolYear, semester } =
      parseAcademicTermLabel(row.academicTerm);

    const credits = parseNumberValue(row.credits, `${rowNumber}행 학점`, {
      required: true,
      min: 0.01,
    });

    const rawScore = parseNumberValue(row.rawScore, `${rowNumber}행 원점수`, {
      min: 0,
      max: 100,
    });

    const averageScore = parseNumberValue(
      row.averageScore,
      `${rowNumber}행 평균`,
      {
        min: 0,
        max: 100,
      }
    );

    const standardDeviation = parseNumberValue(
      row.standardDeviation,
      `${rowNumber}행 표준편차`,
      {
        min: 0,
      }
    );

    const grade = parseNumberValue(row.grade, `${rowNumber}행 등급`, {
      min: 1,
      max: 9,
    });

    const enrolledStudentCount = parseNumberValue(
      row.enrolledStudentCount,
      `${rowNumber}행 재적수`,
      {
        min: 0,
        integer: true,
      }
    );

    const achievementARatio = parseNumberValue(
      row.achievementARatio,
      `${rowNumber}행 A비율`,
      {
        min: 0,
        max: 100,
      }
    );

    const achievementBRatio = parseNumberValue(
      row.achievementBRatio,
      `${rowNumber}행 B비율`,
      {
        min: 0,
        max: 100,
      }
    );

    const achievementCRatio = parseNumberValue(
      row.achievementCRatio,
      `${rowNumber}행 C비율`,
      {
        min: 0,
        max: 100,
      }
    );

    if (!allowedAchievements.has(row.achievement)) {
      throw new ApiError(
        400,
        `${rowNumber}행: 성취도는 A, B, C, D, E, F, P 중 하나여야 합니다.`
      );
    }

    return {
      sortOrder: rowNumber,
      academicTermLabel,
      schoolYear,
      semester,
      subjectGroupSnapshot: row.subjectGroup,
      completionTypeSnapshot: row.completionType,
      subjectName: row.subjectName,
      credits: credits as number,
      rawScore,
      averageScore,
      standardDeviation,
      achievement: row.achievement,
      grade,
      enrolledStudentCount,
      achievementARatio,
      achievementBRatio,
      achievementCRatio,
    };
  });
}

function parseAttendance(
  input: AttendanceInput | null | undefined
): ParsedAttendance {
  if (!input || !isObject(input)) {
    return null;
  }

  const parsed = {
    absenceDays: parseNumberValue(
      toTrimmedString(input.absenceDays),
      "결석일수",
      { min: 0 }
    ),
    lateness: parseNumberValue(
      toTrimmedString(input.lateness),
      "지각",
      { min: 0 }
    ),
    earlyLeave: parseNumberValue(
      toTrimmedString(input.earlyLeave),
      "조퇴",
      { min: 0 }
    ),
    outing: parseNumberValue(
      toTrimmedString(input.outing),
      "결과",
      { min: 0 }
    ),
  };

  const hasAnyValue = Object.values(parsed).some((value) => value !== null);

  return hasAnyValue ? parsed : null;
}

async function validateCatalogRelations(rows: ParsedTestScoreRow[]) {
  const catalog = await db.studentRecordSubjectCatalog.findMany({
    where: {
      isActive: true,
    },
    select: {
      subjectGroup: true,
      completionType: true,
      subjectName: true,
    },
  });

  if (catalog.length === 0) {
    throw new ApiError(
      503,
      "과목 기준 데이터가 없습니다. subject catalog를 먼저 적재해주세요."
    );
  }

  const catalogMap = new Map<string, Set<string>>();

  for (const item of catalog) {
    const subjectGroup = toTrimmedString(item.subjectGroup);
    const completionType = toTrimmedString(item.completionType);
    const subjectName = toTrimmedString(item.subjectName);

    if (!subjectGroup || !completionType || !subjectName) {
      continue;
    }

    const key = `${subjectGroup}__${completionType}`;

    if (!catalogMap.has(key)) {
      catalogMap.set(key, new Set<string>());
    }

    catalogMap.get(key)?.add(subjectName);
  }

  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    const key = `${row.subjectGroupSnapshot}__${row.completionTypeSnapshot}`;
    const subjectNames = catalogMap.get(key);

    if (!subjectNames) {
      throw new ApiError(
        400,
        `${rowNumber}행: "${row.subjectGroupSnapshot} > ${row.completionTypeSnapshot}" 조합은 존재하지 않습니다.`
      );
    }

    if (!subjectNames.has(row.subjectName)) {
      throw new ApiError(
        400,
        `${rowNumber}행: "${row.subjectGroupSnapshot} > ${row.completionTypeSnapshot}"에 "${row.subjectName}" 과목이 존재하지 않습니다.`
      );
    }
  });
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    const latestTestSet = await db.conversionRuleTestSet.findFirst({
      where: {
        userId: user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        scoreRows: {
          orderBy: {
            sortOrder: "asc",
          },
        },
        attendance: true,
      },
    });

    if (!latestTestSet) {
      return NextResponse.json({
        success: true,
        testSetId: null,
        testSetName: "",
        rows: [],
        attendance: null,
      });
    }

    return NextResponse.json({
      success: true,
      testSetId: latestTestSet.id,
      testSetName: latestTestSet.name,
      rows: latestTestSet.scoreRows.map((row) => ({
        academicTerm: row.academicTermLabel,
        subjectGroup: row.subjectGroupSnapshot,
        completionType: row.completionTypeSnapshot,
        subjectName: row.subjectName,
        credits: String(row.credits),
        rawScore: row.rawScore == null ? "" : String(row.rawScore),
        averageScore: row.averageScore == null ? "" : String(row.averageScore),
        standardDeviation:
          row.standardDeviation == null
            ? ""
            : String(row.standardDeviation),
        achievement: row.achievement,
        grade: row.grade == null ? "" : String(row.grade),
        enrolledStudentCount:
          row.enrolledStudentCount == null
            ? ""
            : String(row.enrolledStudentCount),
        achievementARatio:
          row.achievementARatio == null ? "" : String(row.achievementARatio),
        achievementBRatio:
          row.achievementBRatio == null ? "" : String(row.achievementBRatio),
        achievementCRatio:
          row.achievementCRatio == null ? "" : String(row.achievementCRatio),
      })),
      attendance: latestTestSet.attendance
        ? {
            absenceDays:
              latestTestSet.attendance.absenceDays == null
                ? ""
                : String(latestTestSet.attendance.absenceDays),
            lateness:
              latestTestSet.attendance.lateness == null
                ? ""
                : String(latestTestSet.attendance.lateness),
            earlyLeave:
              latestTestSet.attendance.earlyLeave == null
                ? ""
                : String(latestTestSet.attendance.earlyLeave),
            outing:
              latestTestSet.attendance.outing == null
                ? ""
                : String(latestTestSet.attendance.outing),
          }
        : null,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = (await request.json()) as PostBody;

    const testSetId = toTrimmedString(body.testSetId);
    const testSetName = toTrimmedString(body.testSetName) || "기본 테스트셋";

    if (!Array.isArray(body.rows)) {
      throw new ApiError(400, "성적 데이터 형식이 올바르지 않습니다.");
    }

    const normalizedRows = normalizeRows(body.rows as TestScoreRowInput[]);
    validateNormalizedRows(normalizedRows);

    const parsedRows = parseRows(normalizedRows);
    await validateCatalogRelations(parsedRows);

    const attendance = parseAttendance(
      (body.attendance as AttendanceInput | null | undefined) ?? null
    );

    const savedTestSetId = await db.$transaction(async (tx) => {
      let existingTestSet = testSetId
        ? await tx.conversionRuleTestSet.findFirst({
            where: {
              id: testSetId,
              userId: user.id,
            },
          })
        : null;

      if (testSetId && !existingTestSet) {
        throw new ApiError(404, "수정할 테스트셋을 찾을 수 없습니다.");
      }

      if (!existingTestSet) {
        existingTestSet = await tx.conversionRuleTestSet.findFirst({
          where: {
            userId: user.id,
            name: testSetName,
          },
        });
      }

      let targetTestSetId: string;

      if (existingTestSet) {
        const duplicatedName = await tx.conversionRuleTestSet.findFirst({
          where: {
            userId: user.id,
            name: testSetName,
            NOT: {
              id: existingTestSet.id,
            },
          },
          select: {
            id: true,
          },
        });

        if (duplicatedName) {
          throw new ApiError(409, "같은 이름의 테스트셋이 이미 존재합니다.");
        }

        const updated = await tx.conversionRuleTestSet.update({
          where: {
            id: existingTestSet.id,
          },
          data: {
            name: testSetName,
          },
          select: {
            id: true,
          },
        });

        targetTestSetId = updated.id;

        await tx.conversionRuleTestScoreRow.deleteMany({
          where: {
            testSetId: targetTestSetId,
          },
        });

        await tx.conversionRuleTestAttendance.deleteMany({
          where: {
            testSetId: targetTestSetId,
          },
        });
      } else {
        const created = await tx.conversionRuleTestSet.create({
          data: {
            userId: user.id,
            name: testSetName,
          },
          select: {
            id: true,
          },
        });

        targetTestSetId = created.id;
      }

      await tx.conversionRuleTestScoreRow.createMany({
        data: parsedRows.map((row) => ({
          testSetId: targetTestSetId,
          sortOrder: row.sortOrder,
          academicTermLabel: row.academicTermLabel,
          schoolYear: row.schoolYear,
          semester: row.semester,
          subjectGroupSnapshot: row.subjectGroupSnapshot,
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

      if (attendance) {
        await tx.conversionRuleTestAttendance.create({
          data: {
            testSetId: targetTestSetId,
            absenceDays: attendance.absenceDays,
            lateness: attendance.lateness,
            earlyLeave: attendance.earlyLeave,
            outing: attendance.outing,
          },
        });
      }

      return targetTestSetId;
    });

    return NextResponse.json({
      success: true,
      message: "테스트 성적이 저장되었습니다.",
      testSetId: savedTestSetId,
      testSetName,
      savedCount: parsedRows.length,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
