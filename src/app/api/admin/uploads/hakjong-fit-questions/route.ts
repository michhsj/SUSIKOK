import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { prisma } from "@/lib/prisma";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/auth/admin-session";

export const runtime = "nodejs";

type ExcelRow = {
  questionNumber: number;
  domain: string;
  questionText: string;
  choice1Label: string;
  choice2Label: string;
  choice3Label: string;
  choice4Label: string;
  choice5Label: string;
  choice1Score: number;
  choice2Score: number;
  choice3Score: number;
  choice4Score: number;
  choice5Score: number;
  isActive: boolean;
  version: string;
  note: string | null;
};

const REQUIRED_HEADERS = [
  "문항번호",
  "반영 역량",
  "문제 내용",
  "1번 답변 설명",
  "2번 답변 설명",
  "3번 답변 설명",
  "4번 답변 설명",
  "5번 답변 설명",
  "1번 문항 점수",
  "2번 문항 점수",
  "3번 문항 점수",
  "4번 문항 점수",
  "5번 문항 점수",
  "사용 여부",
  "버전",
  "비고",
] as const;

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

function toTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function toRequiredString(value: unknown, label: string) {
  const text = toTrimmedString(value);
  if (!text) {
    throw new Error(`${label} 값이 비어 있습니다.`);
  }
  return text;
}

function toRequiredInt(value: unknown, label: string) {
  const num = Number(value);
  if (!Number.isInteger(num)) {
    throw new Error(`${label} 값이 올바른 정수가 아닙니다.`);
  }
  return num;
}

function toOptionalString(value: unknown) {
  const text = toTrimmedString(value);
  return text ? text : null;
}

function parseActiveFlag(value: unknown) {
  return toTrimmedString(value).toUpperCase() === "Y";
}

function normalizeRow(raw: Record<string, unknown>, rowIndex: number): ExcelRow {
  return {
    questionNumber: toRequiredInt(raw["문항번호"], `${rowIndex}행 문항번호`),
    domain: toRequiredString(raw["반영 역량"], `${rowIndex}행 반영 역량`),
    questionText: toRequiredString(raw["문제 내용"], `${rowIndex}행 문제 내용`),

    choice1Label: toRequiredString(raw["1번 답변 설명"], `${rowIndex}행 1번 답변 설명`),
    choice2Label: toRequiredString(raw["2번 답변 설명"], `${rowIndex}행 2번 답변 설명`),
    choice3Label: toRequiredString(raw["3번 답변 설명"], `${rowIndex}행 3번 답변 설명`),
    choice4Label: toRequiredString(raw["4번 답변 설명"], `${rowIndex}행 4번 답변 설명`),
    choice5Label: toRequiredString(raw["5번 답변 설명"], `${rowIndex}행 5번 답변 설명`),

    choice1Score: toRequiredInt(raw["1번 문항 점수"], `${rowIndex}행 1번 문항 점수`),
    choice2Score: toRequiredInt(raw["2번 문항 점수"], `${rowIndex}행 2번 문항 점수`),
    choice3Score: toRequiredInt(raw["3번 문항 점수"], `${rowIndex}행 3번 문항 점수`),
    choice4Score: toRequiredInt(raw["4번 문항 점수"], `${rowIndex}행 4번 문항 점수`),
    choice5Score: toRequiredInt(raw["5번 문항 점수"], `${rowIndex}행 5번 문항 점수`),

    isActive: parseActiveFlag(raw["사용 여부"]),
    version: toRequiredString(raw["버전"], `${rowIndex}행 버전`),
    note: toOptionalString(raw["비고"]),
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

    if (!workbook.SheetNames.length) {
      return jsonError("엑셀 시트가 없습니다.", 400);
    }

    const firstSheetName = workbook.SheetNames[0];
    const firstSheet = workbook.Sheets[firstSheetName];

    if (!firstSheet) {
      return jsonError("첫 번째 시트를 읽을 수 없습니다.", 400);
    }

    const headerRows = XLSX.utils.sheet_to_json<(string | number | null)[]>(firstSheet, {
      header: 1,
      range: 0,
      blankrows: false,
    });

    const firstHeaderRow = headerRows[0] ?? [];
    const headers = firstHeaderRow.map((value) => toTrimmedString(value));
    const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header));

    if (missingHeaders.length > 0) {
      return jsonError(
        `엑셀 헤더가 올바르지 않습니다. 누락된 헤더: ${missingHeaders.join(", ")}`,
        400
      );
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
      defval: "",
    });

    if (!rows.length) {
      return jsonError("문항 데이터가 비어 있습니다.", 400);
    }

    const normalizedRows = rows.map((row, index) => normalizeRow(row, index + 2));
    const activeRows = normalizedRows.filter((row) => row.isActive);

    if (activeRows.length !== 100) {
      return jsonError(
        `활성 문항 수가 100개가 아닙니다. 현재 활성 문항 수: ${activeRows.length}`,
        400
      );
    }

    const duplicateKeys = new Set<string>();
    for (const row of activeRows) {
      const key = `${row.version}__${row.questionNumber}`;
      if (duplicateKeys.has(key)) {
        return jsonError(
          `중복 문항이 있습니다. version=${row.version}, questionNumber=${row.questionNumber}`,
          400
        );
      }
      duplicateKeys.add(key);
    }

    const versions = [...new Set(activeRows.map((row) => row.version))];

    await prisma.$transaction(async (tx) => {
      for (const version of versions) {
        await tx.hakjongFitQuestion.deleteMany({
          where: { version },
        });
      }

      await tx.hakjongFitQuestion.createMany({
        data: activeRows.map((row) => ({
          questionNumber: row.questionNumber,
          domain: row.domain,
          questionText: row.questionText,

          choice1Label: row.choice1Label,
          choice2Label: row.choice2Label,
          choice3Label: row.choice3Label,
          choice4Label: row.choice4Label,
          choice5Label: row.choice5Label,

          choice1Score: row.choice1Score,
          choice2Score: row.choice2Score,
          choice3Score: row.choice3Score,
          choice4Score: row.choice4Score,
          choice5Score: row.choice5Score,

          isActive: row.isActive,
          version: row.version,
          note: row.note,
        })),
      });
    });

    const domainCounts = activeRows.reduce<Record<string, number>>((acc, row) => {
      acc[row.domain] = (acc[row.domain] ?? 0) + 1;
      return acc;
    }, {});

    return NextResponse.json(
      {
        success: true,
        message: "학종 적합성 평가 문항 업로드가 완료되었습니다.",
        data: {
          sourceFileName: file.name,
          totalRows: rows.length,
          activeRows: activeRows.length,
          versions,
          domainCounts,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/admin/uploads/hakjong-fit-questions] error:", error);

    return jsonError(
      error instanceof Error
        ? error.message
        : "학종 적합성 평가 문항 업로드 중 서버 오류가 발생했습니다.",
      500
    );
  }
}
