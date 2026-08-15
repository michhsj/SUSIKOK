import path from "path";
import { readFile } from "fs/promises";
import * as XLSX from "xlsx";

import { db } from "../src/lib/db";

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

async function main() {
  const targetPath =
    process.argv[2] ||
    path.resolve(process.cwd(), "data", "hakjong-fit-questions.xlsx");

  const fileBuffer = await readFile(targetPath);
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });

  if (!workbook.SheetNames.length) {
    throw new Error("엑셀 시트가 없습니다.");
  }

  const firstSheetName = workbook.SheetNames[0];
  const firstSheet = workbook.Sheets[firstSheetName];

  if (!firstSheet) {
    throw new Error("첫 번째 시트를 읽을 수 없습니다.");
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
    throw new Error(
      `엑셀 헤더가 올바르지 않습니다. 누락된 헤더: ${missingHeaders.join(", ")}`
    );
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
    defval: "",
  });

  if (!rows.length) {
    throw new Error("문항 데이터가 비어 있습니다.");
  }

  const normalizedRows = rows.map((row, index) => normalizeRow(row, index + 2));
  const activeRows = normalizedRows.filter((row) => row.isActive);

  if (activeRows.length !== 100) {
    throw new Error(
      `활성 문항 수가 100개가 아닙니다. 현재 활성 문항 수: ${activeRows.length}`
    );
  }

  const duplicateKeys = new Set<string>();
  for (const row of activeRows) {
    const key = `${row.version}__${row.questionNumber}`;
    if (duplicateKeys.has(key)) {
      throw new Error(
        `중복 문항이 있습니다. version=${row.version}, questionNumber=${row.questionNumber}`
      );
    }
    duplicateKeys.add(key);
  }

  const versions = [...new Set(activeRows.map((row) => row.version))];

  await db.$transaction(async (tx) => {
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

  console.log("학종 적합성 검사 문항 import 완료");
  console.log(`- 파일: ${targetPath}`);
  console.log(`- 전체 데이터 행 수: ${rows.length}`);
  console.log(`- 활성 문항 수: ${activeRows.length}`);
  console.log(`- 버전: ${versions.join(", ")}`);
  console.log("- 영역별 문항 수:");
  for (const [domain, count] of Object.entries(domainCounts)) {
    console.log(`  · ${domain}: ${count}`);
  }
}

main()
  .catch((error) => {
    console.error("학종 적합성 검사 문항 import 실패");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
