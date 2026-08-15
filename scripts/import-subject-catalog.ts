import "dotenv/config";
import path from "path";
import * as XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  throw new Error("DATABASE_URL 환경변수가 설정되어 있지 않습니다.");
}

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
});

const REQUIRED_HEADERS = ["교과", "이수구분", "과목명"] as const;

type CatalogRow = {
  subjectGroup: string;
  completionType: string;
  subjectName: string;
  displayOrder: number;
};

function toTrimmedString(value: unknown) {
  return String(value ?? "").trim();
}

function getArgValue(flagName: string) {
  const index = process.argv.findIndex((arg) => arg === flagName);
  if (index < 0) return "";
  return process.argv[index + 1] ?? "";
}

function hasFlag(flagName: string) {
  return process.argv.includes(flagName);
}

function normalizeCatalogRows(filePath: string): CatalogRow[] {
  const workbook = XLSX.readFile(filePath);
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("엑셀 파일에서 첫 번째 시트를 찾을 수 없습니다.");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<(string | number | null)[]>(
    worksheet,
    {
      header: 1,
      defval: "",
    }
  );

  if (rawRows.length === 0) {
    throw new Error("엑셀 파일에 데이터가 없습니다.");
  }

  const headerRow = (rawRows[0] ?? []).map((value) => toTrimmedString(value));
  const missingHeaders = REQUIRED_HEADERS.filter(
    (header) => !headerRow.includes(header)
  );

  if (missingHeaders.length > 0) {
    throw new Error(
      `필수 헤더가 누락되었습니다: ${missingHeaders.join(", ")}`
    );
  }

  const headerIndexMap = Object.fromEntries(
    headerRow.map((header, index) => [header, index])
  ) as Record<string, number>;

  const rows = rawRows
    .slice(1)
    .map((row, index) => {
      const subjectGroup = toTrimmedString(row?.[headerIndexMap["교과"]]);
      const completionType = toTrimmedString(row?.[headerIndexMap["이수구분"]]);
      const subjectName = toTrimmedString(row?.[headerIndexMap["과목명"]]);

      return {
        subjectGroup,
        completionType,
        subjectName,
        displayOrder: index,
      };
    })
    .filter(
      (row) =>
        row.subjectGroup.length > 0 ||
        row.completionType.length > 0 ||
        row.subjectName.length > 0
    );

  const invalidRow = rows.find(
    (row) => !row.subjectGroup || !row.completionType || !row.subjectName
  );

  if (invalidRow) {
    throw new Error(
      "교과 / 이수구분 / 과목명 중 비어 있는 행이 있습니다. 엑셀 데이터를 확인해 주세요."
    );
  }

  const uniqueRows = new Map<string, CatalogRow>();

  for (const row of rows) {
    const key = [
      row.subjectGroup,
      row.completionType,
      row.subjectName,
    ].join("|||");

    if (!uniqueRows.has(key)) {
      uniqueRows.set(key, row);
    }
  }

  return Array.from(uniqueRows.values());
}

async function syncSubjectGroupOptions(rows: CatalogRow[]) {
  const uniqueNames = Array.from(new Set(rows.map((row) => row.subjectGroup)));

  const existing = await prisma.subjectGroupOption.findMany({
    select: {
      id: true,
      name: true,
      isActive: true,
      displayOrder: true,
    },
  });

  const existingByName = new Map(
    existing.map((item) => [toTrimmedString(item.name), item])
  );

  for (const [index, name] of uniqueNames.entries()) {
    const found = existingByName.get(name);

    if (!found) {
      await prisma.subjectGroupOption.create({
        data: {
          name,
          displayOrder: index,
          isActive: true,
        },
      });
      continue;
    }

    if (!found.isActive || found.displayOrder !== index) {
      await prisma.subjectGroupOption.update({
        where: { id: found.id },
        data: {
          isActive: true,
          displayOrder: index,
        },
      });
    }
  }
}

async function syncCompletionTypeOptions(rows: CatalogRow[]) {
  const uniqueNames = Array.from(
    new Set(rows.map((row) => row.completionType))
  );

  const existing = await prisma.completionTypeOption.findMany({
    select: {
      id: true,
      name: true,
      isActive: true,
      displayOrder: true,
    },
  });

  const existingByName = new Map(
    existing.map((item) => [toTrimmedString(item.name), item])
  );

  for (const [index, name] of uniqueNames.entries()) {
    const found = existingByName.get(name);

    if (!found) {
      await prisma.completionTypeOption.create({
        data: {
          name,
          displayOrder: index,
          isActive: true,
        },
      });
      continue;
    }

    if (!found.isActive || found.displayOrder !== index) {
      await prisma.completionTypeOption.update({
        where: { id: found.id },
        data: {
          isActive: true,
          displayOrder: index,
        },
      });
    }
  }
}

async function syncSubjectCatalog(rows: CatalogRow[], reset: boolean) {
  if (reset) {
    await prisma.studentRecordSubjectCatalog.deleteMany({});
  }

  const existing = await prisma.studentRecordSubjectCatalog.findMany({
    select: {
      id: true,
      subjectGroup: true,
      completionType: true,
      subjectName: true,
      isActive: true,
      displayOrder: true,
    },
  });

  const existingByKey = new Map(
    existing.map((item) => [
      [
        toTrimmedString(item.subjectGroup),
        toTrimmedString(item.completionType),
        toTrimmedString(item.subjectName),
      ].join("|||"),
      item,
    ])
  );

  for (const row of rows) {
    const key = [
      row.subjectGroup,
      row.completionType,
      row.subjectName,
    ].join("|||");

    const found = existingByKey.get(key);

    if (!found) {
      await prisma.studentRecordSubjectCatalog.create({
        data: {
          subjectGroup: row.subjectGroup,
          completionType: row.completionType,
          subjectName: row.subjectName,
          displayOrder: row.displayOrder,
          isActive: true,
        },
      });
      continue;
    }

    if (!found.isActive || found.displayOrder !== row.displayOrder) {
      await prisma.studentRecordSubjectCatalog.update({
        where: { id: found.id },
        data: {
          isActive: true,
          displayOrder: row.displayOrder,
        },
      });
    }
  }
}

async function main() {
  const fileArg = getArgValue("--file");
  const reset = hasFlag("--reset");

  const filePath = fileArg
    ? path.resolve(process.cwd(), fileArg)
    : path.resolve(process.cwd(), "subject-catalog.xlsx");

  console.log(`[import-subject-catalog] file: ${filePath}`);
  console.log(`[import-subject-catalog] reset: ${reset ? "yes" : "no"}`);

  const rows = normalizeCatalogRows(filePath);

  if (rows.length === 0) {
    throw new Error("가져올 subject catalog 데이터가 없습니다.");
  }

  console.log(`[import-subject-catalog] parsed rows: ${rows.length}`);

  await syncSubjectGroupOptions(rows);
  await syncCompletionTypeOptions(rows);
  await syncSubjectCatalog(rows, reset);

  console.log("[import-subject-catalog] 완료");
  console.log(
    `[import-subject-catalog] 교과 ${new Set(
      rows.map((row) => row.subjectGroup)
    ).size}개, 이수구분 ${new Set(
      rows.map((row) => row.completionType)
    ).size}개, 과목 ${rows.length}개 반영`
  );
}

main()
  .catch((error) => {
    console.error("[import-subject-catalog] 실패");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
