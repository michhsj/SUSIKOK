import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { prisma } from "@/lib/prisma";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/auth/admin-session";
import { upsertStudentAdmissionAnalysisForUser } from "@/lib/student/upsert-student-admission-analysis";

export const runtime = "nodejs";

const SHEET_NAME = "수시통합";
const ADMISSION_YEAR = 2027;

const EXPECTED_HEADERS = [
  "지역",
  "대학",
  "전형유형",
  "전형명",
  "계열",
  "단과대학",
  "모집단위",
  "전형방법",
  "학생부반영",
  "전형특기사항",
  "최저학력기준",
  "원서접수",
  "1차합격",
  "논술/면접",
  "최종합격",
  "인원",
  "1모집",
  "1지원",
  "1경쟁률",
  "1충원",
  "1최저율",
  "1최저인원",
  "1실경쟁률",
  "1성적1",
  "1성적2",
  "1환산1",
  "1환산2",
  "2모집",
  "2지원",
  "2경쟁률",
  "2충원",
  "2최저율",
  "2최저인원",
  "2실경쟁률",
  "2성적1",
  "2성적2",
  "2환산1",
  "2환산2",
  "3모집",
  "3지원",
  "3경쟁률",
  "3충원",
  "3최저율",
  "3최저인원",
  "3실경쟁률",
  "3성적1",
  "3성적2",
  "3환산1",
  "3환산2",
] as const;

type HeaderName = (typeof EXPECTED_HEADERS)[number];
type ExcelCell = string | number | boolean | Date | null | undefined;
type ExcelRow = ExcelCell[];
type HeaderIndexMap = Record<HeaderName, number>;

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
type JsonObject = {
  [key: string]: JsonValue;
};

type UpdatedRowInfo = {
  rowNumber: number;
  reason: string;
};

type SkippedRowInfo = {
  rowNumber: number;
  reason: string;
};

type FailedRowInfo = {
  rowNumber: number;
  reason: string;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

function getAdminSession(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    return verifyAdminSessionToken(token);
  } catch {
    return null;
  }
}

function normalizeText(value: ExcelCell): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeNullableText(value: ExcelCell): string | null {
  const text = normalizeText(value);
  if (!text) return null;

  const lowered = text.toLowerCase();
  if (lowered === "null" || lowered === "undefined" || text === "-") {
    return null;
  }

  return text;
}

function toJsonValue(value: unknown): JsonValue {
  if (value === undefined || value === null) return null;

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => toJsonValue(item));
  }

  if (typeof value === "object") {
    const result: JsonObject = {};

    for (const [key, nestedValue] of Object.entries(
      value as Record<string, unknown>
    )) {
      result[key] = toJsonValue(nestedValue);
    }

    return result;
  }

  return String(value);
}

function buildRawRowObject(headers: readonly string[], row: ExcelRow): JsonObject {
  const result: JsonObject = {};

  headers.forEach((header, index) => {
    result[header] = toJsonValue(row[index]);
  });

  return result;
}

function getHeaderIndexMap(headers: string[]): HeaderIndexMap {
  const map = {} as HeaderIndexMap;

  for (const header of EXPECTED_HEADERS) {
    const index = headers.findIndex((item) => item.trim() === header);
    if (index === -1) {
      throw new Error(`필수 헤더를 찾을 수 없습니다: ${header}`);
    }
    map[header] = index;
  }

  return map;
}

function getCell(
  row: ExcelRow,
  headerMap: HeaderIndexMap,
  header: HeaderName
): ExcelCell {
  return row[headerMap[header]];
}

function getRequiredText(
  row: ExcelRow,
  headerMap: HeaderIndexMap,
  header: HeaderName
): string {
  const value = normalizeText(getCell(row, headerMap, header));
  if (!value) {
    throw new Error(`필수 값이 비어 있습니다: ${header}`);
  }
  return value;
}

function getOptionalText(
  row: ExcelRow,
  headerMap: HeaderIndexMap,
  header: HeaderName
): string | null {
  return normalizeNullableText(getCell(row, headerMap, header));
}

function buildNaturalKey(params: {
  region: string;
  universityName: string;
  admissionType: string;
  admissionName: string;
  track: string;
  collegeName: string;
  recruitmentUnit: string;
}) {
  const {
    region,
    universityName,
    admissionType,
    admissionName,
    track,
    collegeName,
    recruitmentUnit,
  } = params;

  return [
    String(ADMISSION_YEAR),
    region,
    universityName,
    admissionType,
    admissionName,
    track,
    collegeName,
    recruitmentUnit,
  ].join("||");
}

function buildDuplicateReason(params: {
  firstRowNumber: number;
  region: string;
  universityName: string;
  admissionType: string;
  admissionName: string;
  track: string;
  collegeName: string;
  recruitmentUnit: string;
}) {
  const {
    firstRowNumber,
    region,
    universityName,
    admissionType,
    admissionName,
    track,
    collegeName,
    recruitmentUnit,
  } = params;

  return [
    "엑셀 내부 중복 키",
    `최초 ${firstRowNumber}행과 동일`,
    region,
    universityName,
    admissionType,
    admissionName,
    track || "-",
    collegeName || "-",
    recruitmentUnit,
  ].join(" / ");
}

function buildCreateData(params: {
  sourceSheetName: string;
  sourceRowNumber: number;
  sourceFileName: string;
  rawRow: JsonObject;
  row: ExcelRow;
  headerMap: HeaderIndexMap;
}) {
  const {
    sourceSheetName,
    sourceRowNumber,
    sourceFileName,
    rawRow,
    row,
    headerMap,
  } = params;

  const region = getRequiredText(row, headerMap, "지역");
  const universityName = getRequiredText(row, headerMap, "대학");
  const admissionType = getRequiredText(row, headerMap, "전형유형");
  const admissionName = getRequiredText(row, headerMap, "전형명");
  const recruitmentUnit = getRequiredText(row, headerMap, "모집단위");

  const track = normalizeText(getCell(row, headerMap, "계열"));
  const collegeName = normalizeText(getCell(row, headerMap, "단과대학"));

  return {
    admissionYear: ADMISSION_YEAR,
    sourceSheetName,
    sourceRowNumber,
    sourceFileName,

    region,
    universityName,
    admissionType,
    admissionName,
    track,
    collegeName,
    recruitmentUnit,

    admissionMethod: getOptionalText(row, headerMap, "전형방법"),
    studentRecordReflection: getOptionalText(row, headerMap, "학생부반영"),
    admissionSpecialNotes: getOptionalText(row, headerMap, "전형특기사항"),
    minimumAcademicRequirement: getOptionalText(row, headerMap, "최저학력기준"),
    applicationPeriod: getOptionalText(row, headerMap, "원서접수"),
    firstRoundAnnouncement: getOptionalText(row, headerMap, "1차합격"),
    interviewOrEssayDate: getOptionalText(row, headerMap, "논술/면접"),
    finalAnnouncement: getOptionalText(row, headerMap, "최종합격"),

    currentHeadcountRaw: getOptionalText(row, headerMap, "인원"),

    year26RecruitmentCountRaw: getOptionalText(row, headerMap, "1모집"),
    year26ApplicantCountRaw: getOptionalText(row, headerMap, "1지원"),
    year26CompetitionRateRaw: getOptionalText(row, headerMap, "1경쟁률"),
    year26AdditionalPassCountRaw: getOptionalText(row, headerMap, "1충원"),
    year26MinSatisfiedRateRaw: getOptionalText(row, headerMap, "1최저율"),
    year26MinSatisfiedCountRaw: getOptionalText(row, headerMap, "1최저인원"),
    year26ActualCompetitionRateRaw: getOptionalText(row, headerMap, "1실경쟁률"),
    year26Score50Raw: getOptionalText(row, headerMap, "1성적1"),
    year26Score70Raw: getOptionalText(row, headerMap, "1성적2"),
    year26Converted50Raw: getOptionalText(row, headerMap, "1환산1"),
    year26Converted70Raw: getOptionalText(row, headerMap, "1환산2"),

    year25RecruitmentCountRaw: getOptionalText(row, headerMap, "2모집"),
    year25ApplicantCountRaw: getOptionalText(row, headerMap, "2지원"),
    year25CompetitionRateRaw: getOptionalText(row, headerMap, "2경쟁률"),
    year25AdditionalPassCountRaw: getOptionalText(row, headerMap, "2충원"),
    year25MinSatisfiedRateRaw: getOptionalText(row, headerMap, "2최저율"),
    year25MinSatisfiedCountRaw: getOptionalText(row, headerMap, "2최저인원"),
    year25ActualCompetitionRateRaw: getOptionalText(row, headerMap, "2실경쟁률"),
    year25Score50Raw: getOptionalText(row, headerMap, "2성적1"),
    year25Score70Raw: getOptionalText(row, headerMap, "2성적2"),
    year25Converted50Raw: getOptionalText(row, headerMap, "2환산1"),
    year25Converted70Raw: getOptionalText(row, headerMap, "2환산2"),

    year24RecruitmentCountRaw: getOptionalText(row, headerMap, "3모집"),
    year24ApplicantCountRaw: getOptionalText(row, headerMap, "3지원"),
    year24CompetitionRateRaw: getOptionalText(row, headerMap, "3경쟁률"),
    year24AdditionalPassCountRaw: getOptionalText(row, headerMap, "3충원"),
    year24MinSatisfiedRateRaw: getOptionalText(row, headerMap, "3최저율"),
    year24MinSatisfiedCountRaw: getOptionalText(row, headerMap, "3최저인원"),
    year24ActualCompetitionRateRaw: getOptionalText(row, headerMap, "3실경쟁률"),
    year24Score50Raw: getOptionalText(row, headerMap, "3성적1"),
    year24Score70Raw: getOptionalText(row, headerMap, "3성적2"),
    year24Converted50Raw: getOptionalText(row, headerMap, "3환산1"),
    year24Converted70Raw: getOptionalText(row, headerMap, "3환산2"),

    rawRow,
    isActive: true,
  };
}

type AdmissionCreateData = ReturnType<typeof buildCreateData>;

function toUpdateData(createData: AdmissionCreateData) {
  return { ...createData };
}

async function deleteExistingAdmissionResults() {
  const existingRows = await prisma.admissionResult.findMany({
    where: {
      admissionYear: ADMISSION_YEAR,
    },
    select: {
      id: true,
    },
  });

  const admissionResultIds = existingRows.map((row) => row.id);

  if (admissionResultIds.length === 0) {
    return {
      deletedAdmissionResults: 0,
      deletedAnalysisResults: 0,
      deletedSavedRecruitmentUnits: 0,
    };
  }

  const [deletedAnalysisResults, deletedSavedRecruitmentUnits, deletedAdmissionResults] =
    await prisma.$transaction([
      prisma.studentAdmissionAnalysisResult.deleteMany({
        where: {
          admissionResultId: { in: admissionResultIds },
        },
      }),
      prisma.studentSavedRecruitmentUnit.deleteMany({
        where: {
          admissionResultId: { in: admissionResultIds },
        },
      }),
      prisma.admissionResult.deleteMany({
        where: {
          id: { in: admissionResultIds },
        },
      }),
    ]);

  return {
    deletedAdmissionResults: deletedAdmissionResults.count,
    deletedAnalysisResults: deletedAnalysisResults.count,
    deletedSavedRecruitmentUnits: deletedSavedRecruitmentUnits.count,
  };
}

async function rebuildStudentAdmissionAnalyses() {
  const lockedSubmissions = await prisma.studentRecordSubmission.findMany({
    where: {
      isLocked: true,
    },
    select: {
      userId: true,
    },
    distinct: ["userId"],
  });

  if (lockedSubmissions.length === 0) {
    return {
      analysisTargetUserCount: 0,
      analysisRebuiltUserCount: 0,
      analysisRebuildFailedUserCount: 0,
    };
  }

  let analysisRebuiltUserCount = 0;
  let analysisRebuildFailedUserCount = 0;

  for (const submission of lockedSubmissions) {
    try {
      await upsertStudentAdmissionAnalysisForUser(submission.userId);
      analysisRebuiltUserCount += 1;
    } catch (analysisError) {
      analysisRebuildFailedUserCount += 1;
      console.error(
        "[ADMIN admissions-db] rebuild student admission analysis failed",
        {
          userId: submission.userId,
          analysisError,
        }
      );
    }
  }

  return {
    analysisTargetUserCount: lockedSubmissions.length,
    analysisRebuiltUserCount,
    analysisRebuildFailedUserCount,
  };
}

export async function POST(request: NextRequest) {
  const adminSession = getAdminSession(request);

  if (!adminSession) {
    return jsonError("관리자 인증이 필요합니다.", 401);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("업로드할 파일이 필요합니다.", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = XLSX.read(buffer, {
      type: "buffer",
      cellDates: false,
      raw: false,
    });

    const sheetName = workbook.SheetNames.includes(SHEET_NAME)
      ? SHEET_NAME
      : workbook.SheetNames[0];

    if (!sheetName) {
      return jsonError("워크북에서 시트를 찾을 수 없습니다.", 400);
    }

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      return jsonError(`시트를 찾을 수 없습니다: ${sheetName}`, 400);
    }

    const matrix = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
      header: 1,
      raw: false,
      defval: "",
      blankrows: false,
    });

    if (matrix.length < 2) {
      return jsonError("헤더 또는 데이터가 없는 엑셀 파일입니다.", 400);
    }

    const headers = (matrix[0] ?? []).map((cell) => normalizeText(cell));
    const rows = matrix.slice(1) as ExcelRow[];
    const headerMap = getHeaderIndexMap(headers);
    const sourceFileName = file.name;

    const deleted = await deleteExistingAdmissionResults();

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    const updatedRows: UpdatedRowInfo[] = [];
    const skippedRows: SkippedRowInfo[] = [];
    const failedRows: FailedRowInfo[] = [];
    const seenNaturalKeys = new Map<string, number>();

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      const rowNumber = rowIndex + 2;

      try {
        const region = normalizeText(getCell(row, headerMap, "지역"));
        const universityName = normalizeText(getCell(row, headerMap, "대학"));
        const admissionType = normalizeText(getCell(row, headerMap, "전형유형"));
        const admissionName = normalizeText(getCell(row, headerMap, "전형명"));
        const recruitmentUnit = normalizeText(getCell(row, headerMap, "모집단위"));

        if (
          !region ||
          !universityName ||
          !admissionType ||
          !admissionName ||
          !recruitmentUnit
        ) {
          const missingFields = [
            !region ? "지역" : null,
            !universityName ? "대학" : null,
            !admissionType ? "전형유형" : null,
            !admissionName ? "전형명" : null,
            !recruitmentUnit ? "모집단위" : null,
          ].filter((value): value is string => Boolean(value));

          const reason = `필수값 누락: ${missingFields.join(", ")}`;

          skipped += 1;
          skippedRows.push({
            rowNumber,
            reason,
          });

          console.warn(`[ADMIN admissions-db] skipped row: ${rowNumber} - ${reason}`);
          continue;
        }

        const track = normalizeText(getCell(row, headerMap, "계열"));
        const collegeName = normalizeText(getCell(row, headerMap, "단과대학"));
        const rawRow = buildRawRowObject(headers, row);

        const naturalKey = buildNaturalKey({
          region,
          universityName,
          admissionType,
          admissionName,
          track,
          collegeName,
          recruitmentUnit,
        });

        const firstRowNumber = seenNaturalKeys.get(naturalKey);

        if (!firstRowNumber) {
          seenNaturalKeys.set(naturalKey, rowNumber);
        }

        const createData = buildCreateData({
          sourceSheetName: sheetName,
          sourceRowNumber: rowNumber,
          sourceFileName,
          rawRow,
          row,
          headerMap,
        });

        const where = {
          admissionResultNaturalKey: {
            admissionYear: ADMISSION_YEAR,
            region,
            universityName,
            admissionType,
            admissionName,
            track,
            collegeName,
            recruitmentUnit,
          },
        };

        const existing = await prisma.admissionResult.findUnique({
          where,
          select: { id: true },
        });

        await prisma.admissionResult.upsert({
          where,
          create: createData,
          update: toUpdateData(createData),
        });

        if (existing) {
          updated += 1;

          const reason = firstRowNumber
            ? buildDuplicateReason({
                firstRowNumber,
                region,
                universityName,
                admissionType,
                admissionName,
                track,
                collegeName,
                recruitmentUnit,
              })
            : "동일 자연키 데이터가 이미 존재하여 업데이트되었습니다.";

          updatedRows.push({
            rowNumber,
            reason,
          });

          console.warn(
            `[ADMIN admissions-db] duplicate row updated: ${rowNumber} - ${reason}`
          );
        } else {
          inserted += 1;
        }
      } catch (error) {
        const reason =
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.";

        failed += 1;
        failedRows.push({
          rowNumber,
          reason,
        });

        console.error(
          `[ADMIN admissions-db] failed row: ${rowNumber} - ${reason}`,
          error
        );
      }
    }

    const analysisRebuild = await rebuildStudentAdmissionAnalyses();

    const currentTotal = await prisma.admissionResult.count({
      where: {
        admissionYear: ADMISSION_YEAR,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `${ADMISSION_YEAR}학년도 수시 통합DB 업로드가 완료되었습니다.`,
        data: {
          admissionYear: ADMISSION_YEAR,
          sourceFileName,
          sheetName,
          totalRows: rows.length,
          deletedAdmissionResults: deleted.deletedAdmissionResults,
          deletedAnalysisResults: deleted.deletedAnalysisResults,
          deletedSavedRecruitmentUnits: deleted.deletedSavedRecruitmentUnits,
          inserted,
          updated,
          updatedRows,
          skipped,
          skippedRows,
          failed,
          failedRows,
          currentTotal,
          analysisTargetUserCount: analysisRebuild.analysisTargetUserCount,
          analysisRebuiltUserCount: analysisRebuild.analysisRebuiltUserCount,
          analysisRebuildFailedUserCount:
            analysisRebuild.analysisRebuildFailedUserCount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/admin/uploads/admissions-db] error:", error);

    return jsonError(
      error instanceof Error
        ? error.message
        : "수시 통합DB 업로드 중 서버 오류가 발생했습니다.",
      500
    );
  }
}
