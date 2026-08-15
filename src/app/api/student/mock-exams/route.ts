import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/auth/session";

function error(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status }
  );
}

function toTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNullableString(value: unknown) {
  const text = toTrimmedString(value);
  return text ? text : null;
}

function parseRequiredInt(value: unknown, label: string) {
  const parsedValue = Number(toTrimmedString(value));

  if (!Number.isInteger(parsedValue)) {
    throw new Error(`${label}을(를) 올바르게 입력해 주세요.`);
  }

  return parsedValue;
}

function parseRequiredGradeLevel(value: unknown) {
  const gradeLevel = toTrimmedString(value);

  if (!gradeLevel) {
    throw new Error("학년을 선택해 주세요.");
  }

  if (!["1", "2", "3", "N"].includes(gradeLevel)) {
    throw new Error("학년 값이 올바르지 않습니다.");
  }

  return gradeLevel;
}

function parseOptionalFloat(value: unknown, label: string) {
  const text = toTrimmedString(value);

  if (!text) {
    return null;
  }

  const parsedValue = Number(text);

  if (!Number.isFinite(parsedValue)) {
    throw new Error(`${label} 형식이 올바르지 않습니다.`);
  }

  return parsedValue;
}

function hasMeaningfulExamData(payload: Record<string, unknown>) {
  const fieldsToCheck = [
    "koreanSubject",
    "koreanStandardScore",
    "koreanPercentile",
    "koreanGrade",
    "mathSubject",
    "mathStandardScore",
    "mathPercentile",
    "mathGrade",
    "englishGrade",
    "koreanHistoryGrade",
    "inquiry1Subject",
    "inquiry1StandardScore",
    "inquiry1Percentile",
    "inquiry1Grade",
    "inquiry2Subject",
    "inquiry2StandardScore",
    "inquiry2Percentile",
    "inquiry2Grade",
    "secondLanguageSubject",
    "secondLanguageGrade",
  ];

  return fieldsToCheck.some((field) => {
    const value = payload[field];

    if (typeof value === "string") {
      return value.trim().length > 0;
    }

    return value !== null && value !== undefined && String(value).trim().length > 0;
  });
}

async function getAuthorizedUser() {
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

const mockExamRecordSelect = Prisma.validator<Prisma.StudentMockExamRecordSelect>()({
  id: true,
  submissionId: true,
  examYear: true,
  examMonth: true,
  gradeLevel: true,
  koreanSubject: true,
  koreanStandardScore: true,
  koreanPercentile: true,
  koreanGrade: true,
  mathSubject: true,
  mathStandardScore: true,
  mathPercentile: true,
  mathGrade: true,
  englishGrade: true,
  koreanHistoryGrade: true,
  inquiry1Subject: true,
  inquiry1StandardScore: true,
  inquiry1Percentile: true,
  inquiry1Grade: true,
  inquiry2Subject: true,
  inquiry2StandardScore: true,
  inquiry2Percentile: true,
  inquiry2Grade: true,
  secondLanguageSubject: true,
  secondLanguageGrade: true,
});

type MockExamRecordRow = Prisma.StudentMockExamRecordGetPayload<{
  select: typeof mockExamRecordSelect;
}>;

function serializeRecord(record: MockExamRecordRow) {
  return {
    id: record.id,
    submissionId: record.submissionId,
    examYear: record.examYear,
    examMonth: record.examMonth,
    gradeLevel: record.gradeLevel,
    koreanSubject: record.koreanSubject,
    koreanStandardScore: record.koreanStandardScore,
    koreanPercentile: record.koreanPercentile,
    koreanGrade: record.koreanGrade,
    mathSubject: record.mathSubject,
    mathStandardScore: record.mathStandardScore,
    mathPercentile: record.mathPercentile,
    mathGrade: record.mathGrade,
    englishGrade: record.englishGrade,
    koreanHistoryGrade: record.koreanHistoryGrade,
    inquiry1Subject: record.inquiry1Subject,
    inquiry1StandardScore: record.inquiry1StandardScore,
    inquiry1Percentile: record.inquiry1Percentile,
    inquiry1Grade: record.inquiry1Grade,
    inquiry2Subject: record.inquiry2Subject,
    inquiry2StandardScore: record.inquiry2StandardScore,
    inquiry2Percentile: record.inquiry2Percentile,
    inquiry2Grade: record.inquiry2Grade,
    secondLanguageSubject: record.secondLanguageSubject,
    secondLanguageGrade: record.secondLanguageGrade,
  };
}

function buildRecordPayload(body: Record<string, unknown>) {
  const examYear = parseRequiredInt(body.examYear, "연도");
  const examMonth = parseRequiredInt(body.examMonth, "월");
  const gradeLevel = parseRequiredGradeLevel(body.gradeLevel);

  return {
    examYear,
    examMonth,
    gradeLevel,
    koreanSubject: toNullableString(body.koreanSubject),
    koreanStandardScore: parseOptionalFloat(
      body.koreanStandardScore,
      "국어 표준점수"
    ),
    koreanPercentile: parseOptionalFloat(
      body.koreanPercentile,
      "국어 백분위"
    ),
    koreanGrade: parseOptionalFloat(body.koreanGrade, "국어 등급"),
    mathSubject: toNullableString(body.mathSubject),
    mathStandardScore: parseOptionalFloat(
      body.mathStandardScore,
      "수학 표준점수"
    ),
    mathPercentile: parseOptionalFloat(body.mathPercentile, "수학 백분위"),
    mathGrade: parseOptionalFloat(body.mathGrade, "수학 등급"),
    englishGrade: parseOptionalFloat(body.englishGrade, "영어 등급"),
    koreanHistoryGrade: parseOptionalFloat(
      body.koreanHistoryGrade,
      "한국사 등급"
    ),
    inquiry1Subject: toNullableString(body.inquiry1Subject),
    inquiry1StandardScore: parseOptionalFloat(
      body.inquiry1StandardScore,
      "탐구1 표준점수"
    ),
    inquiry1Percentile: parseOptionalFloat(
      body.inquiry1Percentile,
      "탐구1 백분위"
    ),
    inquiry1Grade: parseOptionalFloat(body.inquiry1Grade, "탐구1 등급"),
    inquiry2Subject: toNullableString(body.inquiry2Subject),
    inquiry2StandardScore: parseOptionalFloat(
      body.inquiry2StandardScore,
      "탐구2 표준점수"
    ),
    inquiry2Percentile: parseOptionalFloat(
      body.inquiry2Percentile,
      "탐구2 백분위"
    ),
    inquiry2Grade: parseOptionalFloat(body.inquiry2Grade, "탐구2 등급"),
    secondLanguageSubject: toNullableString(body.secondLanguageSubject),
    secondLanguageGrade: parseOptionalFloat(
      body.secondLanguageGrade,
      "제2외국어/한문 등급"
    ),
  };
}

export async function GET() {
  try {
    const user = await getAuthorizedUser();

    if (!user) {
      return error("로그인이 필요합니다.", 401);
    }

    const records = await db.studentMockExamRecord.findMany({
      where: {
        userId: user.id,
      },
      orderBy: [
        { examYear: "desc" },
        { examMonth: "desc" },
        { createdAt: "desc" },
      ],
      select: mockExamRecordSelect,
    });

    return NextResponse.json({
      success: true,
      records: records.map(serializeRecord),
    });
  } catch (caughtError) {
    console.error("[GET] /api/student/mock-exams", caughtError);
    return error("모의고사 성적 조회 중 오류가 발생했습니다.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthorizedUser();

    if (!user) {
      return error("로그인이 필요합니다.", 401);
    }

    const body = (await request.json()) as Record<string, unknown>;

    if (!hasMeaningfulExamData(body)) {
      return error("저장할 모의고사 성적이 없습니다.", 400);
    }

    const recordId = toTrimmedString(body.recordId) || null;
    const payload = buildRecordPayload(body);

    const existingRecord = recordId
      ? await db.studentMockExamRecord.findFirst({
          where: {
            id: recordId,
            userId: user.id,
          },
          select: {
            id: true,
            submissionId: true,
          },
        })
      : await db.studentMockExamRecord.findFirst({
          where: {
            userId: user.id,
            examYear: payload.examYear,
            examMonth: payload.examMonth,
            gradeLevel: payload.gradeLevel,
          },
          select: {
            id: true,
            submissionId: true,
          },
        });

    const savedRecord = existingRecord
      ? await db.$transaction(async (tx) => {
          await tx.studentMockExamSubmission.update({
            where: {
              id: existingRecord.submissionId,
            },
            data: {
              status: "FINALIZED",
              isLocked: true,
              finalizedAt: new Date(),
            },
          });

          return await tx.studentMockExamRecord.update({
            where: {
              id: existingRecord.id,
            },
            data: payload,
            select: mockExamRecordSelect,
          });
        })
      : await db.$transaction(async (tx) => {
          const submission = await tx.studentMockExamSubmission.create({
            data: {
              userId: user.id,
              status: "FINALIZED",
              isLocked: true,
              finalizedAt: new Date(),
            },
            select: {
              id: true,
            },
          });

          return await tx.studentMockExamRecord.create({
            data: {
              userId: user.id,
              submissionId: submission.id,
              ...payload,
            },
            select: mockExamRecordSelect,
          });
        });

    return NextResponse.json({
      success: true,
      message: "모의고사 성적이 저장되었습니다.",
      record: serializeRecord(savedRecord),
    });
  } catch (caughtError) {
    console.error("[POST] /api/student/mock-exams", caughtError);

    if (caughtError instanceof Error) {
      const validationMessages = [
        "연도을(를) 올바르게 입력해 주세요.",
        "월을(를) 올바르게 입력해 주세요.",
        "학년을 선택해 주세요.",
        "학년 값이 올바르지 않습니다.",
        "국어 표준점수 형식이 올바르지 않습니다.",
        "국어 백분위 형식이 올바르지 않습니다.",
        "국어 등급 형식이 올바르지 않습니다.",
        "수학 표준점수 형식이 올바르지 않습니다.",
        "수학 백분위 형식이 올바르지 않습니다.",
        "수학 등급 형식이 올바르지 않습니다.",
        "영어 등급 형식이 올바르지 않습니다.",
        "한국사 등급 형식이 올바르지 않습니다.",
        "탐구1 표준점수 형식이 올바르지 않습니다.",
        "탐구1 백분위 형식이 올바르지 않습니다.",
        "탐구1 등급 형식이 올바르지 않습니다.",
        "탐구2 표준점수 형식이 올바르지 않습니다.",
        "탐구2 백분위 형식이 올바르지 않습니다.",
        "탐구2 등급 형식이 올바르지 않습니다.",
        "제2외국어/한문 등급 형식이 올바르지 않습니다.",
      ];

      if (validationMessages.includes(caughtError.message)) {
        return error(caughtError.message, 400);
      }

      return error(caughtError.message, 500);
    }

    return error("모의고사 성적 저장 중 오류가 발생했습니다.", 500);
  }
}
