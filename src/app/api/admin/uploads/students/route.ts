import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/auth/admin-session";

export const runtime = "nodejs";

const REQUIRED_HEADERS = ["email", "password", "name"] as const;
const OPTIONAL_HEADERS = [
  "phone",
  "schoolCode",
  "gradeLevel",
  "isActive",
  "termsConsent",
  "privacyConsent",
  "marketingConsent",
] as const;

type RequiredHeader = (typeof REQUIRED_HEADERS)[number];
type OptionalHeader = (typeof OPTIONAL_HEADERS)[number];
type HeaderName = RequiredHeader | OptionalHeader;

type ExcelCell = string | number | boolean | Date | null | undefined;
type ExcelRow = ExcelCell[];

type StudentUploadRow = {
  email: string;
  password: string;
  name: string;
  phone: string | null;
  schoolCode: string | null;
  gradeLevel: number | null;
  isActive: boolean;
  termsConsent: boolean;
  privacyConsent: boolean;
  marketingConsent: boolean;
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

function toRequiredString(value: ExcelCell, label: string): string {
  const text = normalizeText(value);
  if (!text) {
    throw new Error(`${label} 값이 비어 있습니다.`);
  }
  return text;
}

function toOptionalString(value: ExcelCell): string | null {
  const text = normalizeText(value);
  return text ? text : null;
}

function parseYesNo(value: ExcelCell, defaultValue = false): boolean {
  const text = normalizeText(value).toUpperCase();
  if (!text) return defaultValue;
  return ["Y", "YES", "TRUE", "1"].includes(text);
}

function parseOptionalGradeLevel(value: ExcelCell, rowNumber: number): number | null {
  const text = normalizeText(value);
  if (!text) return null;

  const num = Number(text);
  if (!Number.isInteger(num)) {
    throw new Error(`${rowNumber}행 gradeLevel 값이 올바른 정수가 아닙니다.`);
  }

  return num;
}

function buildHeaderIndexMap(headerRow: ExcelRow) {
  const headerMap = new Map<string, number>();
  headerRow.forEach((cell, index) => {
    const header = normalizeText(cell);
    if (header) {
      headerMap.set(header, index);
    }
  });

  for (const header of REQUIRED_HEADERS) {
    if (!headerMap.has(header)) {
      throw new Error(`필수 헤더가 누락되었습니다: ${header}`);
    }
  }

  return headerMap;
}

function getCellValue(row: ExcelRow, headerMap: Map<string, number>, header: HeaderName) {
  const index = headerMap.get(header);
  if (index === undefined) return "";
  return row[index];
}

function isTemplateMetaRow(row: ExcelRow) {
  const values = row.map((cell) => normalizeText(cell));
  return values.some((value) => value === "필수" || value === "선택");
}

function isEmptyRow(row: ExcelRow) {
  return row.every((cell) => normalizeText(cell) === "");
}

function normalizeStudentRow(
  row: ExcelRow,
  headerMap: Map<string, number>,
  rowNumber: number
): StudentUploadRow {
  return {
    email: toRequiredString(getCellValue(row, headerMap, "email"), `${rowNumber}행 email`),
    password: toRequiredString(
      getCellValue(row, headerMap, "password"),
      `${rowNumber}행 password`
    ),
    name: toRequiredString(getCellValue(row, headerMap, "name"), `${rowNumber}행 name`),
    phone: toOptionalString(getCellValue(row, headerMap, "phone")),
    schoolCode: toOptionalString(getCellValue(row, headerMap, "schoolCode")),
    gradeLevel: parseOptionalGradeLevel(
      getCellValue(row, headerMap, "gradeLevel"),
      rowNumber
    ),
    isActive: parseYesNo(getCellValue(row, headerMap, "isActive"), true),
    termsConsent: parseYesNo(getCellValue(row, headerMap, "termsConsent"), false),
    privacyConsent: parseYesNo(getCellValue(row, headerMap, "privacyConsent"), false),
    marketingConsent: parseYesNo(
      getCellValue(row, headerMap, "marketingConsent"),
      false
    ),
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
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      return jsonError("엑셀 파일에서 첫 번째 시트를 찾을 수 없습니다.", 400);
    }

    const worksheet = workbook.Sheets[firstSheetName];
    if (!worksheet) {
      return jsonError("첫 번째 시트를 읽을 수 없습니다.", 400);
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

    const headerRow = matrix[0] ?? [];
    const headerMap = buildHeaderIndexMap(headerRow);

    const secondRow = matrix[1] ?? [];
    const thirdRow = matrix[2] ?? [];
    const looksLikeTemplate =
      isTemplateMetaRow(secondRow) || thirdRow.some((cell) => normalizeText(cell) !== "");

    const dataStartIndex = looksLikeTemplate ? 4 : 1;
    const rawDataRows = matrix.slice(dataStartIndex).filter((row) => !isEmptyRow(row));

    if (rawDataRows.length === 0) {
      return jsonError("업로드할 학생 데이터가 없습니다.", 400);
    }

    const schoolCodes = Array.from(
      new Set(
        rawDataRows
          .map((row, index) =>
            normalizeStudentRow(row, headerMap, dataStartIndex + index + 1).schoolCode
          )
          .filter((value): value is string => Boolean(value))
      )
    );

    const schools = schoolCodes.length
      ? await prisma.school.findMany({
          where: {
            schoolCode: { in: schoolCodes },
          },
          select: {
            id: true,
            schoolCode: true,
          },
        })
      : [];

    const schoolByCode = new Map(schools.map((school) => [school.schoolCode, school]));
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    let linkedSchoolCount = 0;

    for (let index = 0; index < rawDataRows.length; index += 1) {
      const row = rawDataRows[index];
      const rowNumber = dataStartIndex + index + 1;

      try {
        const normalized = normalizeStudentRow(row, headerMap, rowNumber);

        if (!normalized.email || !normalized.password || !normalized.name) {
          skipped += 1;
          continue;
        }

        let schoolId: string | null = null;

        if (normalized.schoolCode) {
          const school = schoolByCode.get(normalized.schoolCode);
          if (!school) {
            throw new Error(
              `${rowNumber}행 schoolCode(${normalized.schoolCode})에 해당하는 학교를 찾을 수 없습니다.`
            );
          }
          schoolId = school.id;
          linkedSchoolCount += 1;
        }

        const existingUser = await prisma.user.findUnique({
          where: {
            email: normalized.email,
          },
          select: {
            id: true,
            role: true,
          },
        });

        const passwordHash = await bcrypt.hash(normalized.password, 10);

        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: normalized.email,
              passwordHash,
              name: normalized.name,
              phone: normalized.phone,
              role: UserRole.STUDENT,
              schoolId,
              gradeLevel: normalized.gradeLevel,
              termsConsent: normalized.termsConsent,
              privacyConsent: normalized.privacyConsent,
              marketingConsent: normalized.marketingConsent,
              isActive: normalized.isActive,
            },
          });
          inserted += 1;
          continue;
        }

        if (existingUser.role !== UserRole.STUDENT) {
          throw new Error(
            `${rowNumber}행 email(${normalized.email})은 학생 계정이 아닌 기존 계정과 충돌합니다.`
          );
        }

        await prisma.user.update({
          where: {
            id: existingUser.id,
          },
          data: {
            passwordHash,
            name: normalized.name,
            phone: normalized.phone,
            schoolId,
            gradeLevel: normalized.gradeLevel,
            termsConsent: normalized.termsConsent,
            privacyConsent: normalized.privacyConsent,
            marketingConsent: normalized.marketingConsent,
            isActive: normalized.isActive,
          },
        });

        updated += 1;
      } catch (error) {
        failed += 1;
        console.error(`[ADMIN students] row failed: ${rowNumber}`, error);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "학생 DB 업로드가 완료되었습니다.",
        data: {
          sourceFileName: file.name,
          totalRows: rawDataRows.length,
          inserted,
          updated,
          skipped,
          failed,
          linkedSchoolCount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/admin/uploads/students] error:", error);

    return jsonError(
      error instanceof Error
        ? error.message
        : "학생 DB 업로드 중 서버 오류가 발생했습니다.",
      500
    );
  }
}
