require("dotenv/config");

const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const SUBJECT_GROUP_HEADER = "교과";
const COMPLETION_TYPE_HEADER = "이수구분";
const SUBJECT_NAME_HEADER = "과목명";

const connectionString =
  process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DIRECT_URL 또는 DATABASE_URL 환경변수가 필요합니다."
  );
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\u00A0/g, " ")
    .trim();
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const fullRefresh = args.includes("--full-refresh");
  const fileArg = args.find((arg) => !arg.startsWith("--"));

  const filePath = fileArg
    ? path.resolve(process.cwd(), fileArg)
    : path.resolve(process.cwd(), "subject-catalog.xlsx");

  return {
    filePath,
    fullRefresh,
  };
}

function assertFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`엑셀 파일을 찾을 수 없습니다: ${filePath}`);
  }
}

function loadWorkbookRows(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("엑셀 파일에 시트가 없습니다.");
  }

  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    defval: "",
    raw: false,
  });

  return {
    sheetName,
    rows,
  };
}

function validateHeaders(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(
      "엑셀에 데이터가 없습니다. 최소 1행 이상의 데이터가 필요합니다."
    );
  }

  const firstRow = rows[0];
  const keys = Object.keys(firstRow);

  if (!keys.includes(SUBJECT_GROUP_HEADER)) {
    throw new Error(`엑셀 헤더에 "${SUBJECT_GROUP_HEADER}" 열이 없습니다.`);
  }

  if (!keys.includes(COMPLETION_TYPE_HEADER)) {
    throw new Error(`엑셀 헤더에 "${COMPLETION_TYPE_HEADER}" 열이 없습니다.`);
  }

  if (!keys.includes(SUBJECT_NAME_HEADER)) {
    throw new Error(`엑셀 헤더에 "${SUBJECT_NAME_HEADER}" 열이 없습니다.`);
  }
}

function buildCatalogRows(rawRows) {
  const seen = new Set();
  const result = [];

  for (const row of rawRows) {
    const subjectGroup = normalizeText(row[SUBJECT_GROUP_HEADER]);
    const completionType = normalizeText(row[COMPLETION_TYPE_HEADER]);
    const subjectName = normalizeText(row[SUBJECT_NAME_HEADER]);

    if (!subjectGroup || !completionType || !subjectName) {
      continue;
    }

    const dedupeKey = `${subjectGroup}__${completionType}__${subjectName}`;
    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);

    result.push({
      subjectGroup,
      completionType,
      subjectName,
    });
  }

  return result;
}

function buildOrderedUniqueValues(items, selector) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const value = normalizeText(selector(item));

    if (!value || seen.has(value)) {
      continue;
    }

    seen.add(value);
    result.push(value);
  }

  return result;
}

async function upsertSubjectGroupOptions(subjectGroups) {
  let created = 0;
  let updated = 0;

  for (let index = 0; index < subjectGroups.length; index += 1) {
    const name = subjectGroups[index];

    const existing = await prisma.subjectGroupOption.findFirst({
      where: { name },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (existing) {
      await prisma.subjectGroupOption.update({
        where: { id: existing.id },
        data: {
          name,
          isActive: true,
          displayOrder: index + 1,
        },
      });
      updated += 1;
    } else {
      await prisma.subjectGroupOption.create({
        data: {
          name,
          displayOrder: index + 1,
          isActive: true,
        },
      });
      created += 1;
    }
  }

  return { created, updated };
}

async function upsertCompletionTypeOptions(completionTypes) {
  let created = 0;
  let updated = 0;

  for (let index = 0; index < completionTypes.length; index += 1) {
    const name = completionTypes[index];

    const existing = await prisma.completionTypeOption.findFirst({
      where: { name },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (existing) {
      await prisma.completionTypeOption.update({
        where: { id: existing.id },
        data: {
          name,
          isActive: true,
          displayOrder: index + 1,
        },
      });
      updated += 1;
    } else {
      await prisma.completionTypeOption.create({
        data: {
          name,
          displayOrder: index + 1,
          isActive: true,
        },
      });
      created += 1;
    }
  }

  return { created, updated };
}

async function reactivateExistingCatalogRows(catalogRows) {
  let reactivated = 0;
  let reordered = 0;

  for (let index = 0; index < catalogRows.length; index += 1) {
    const row = catalogRows[index];

    const existing = await prisma.studentRecordSubjectCatalog.findFirst({
      where: {
        subjectGroup: row.subjectGroup,
        completionType: row.completionType,
        subjectName: row.subjectName,
      },
      select: {
        id: true,
        isActive: true,
        displayOrder: true,
      },
    });

    if (!existing) {
      continue;
    }

    const nextDisplayOrder = index + 1;
    const shouldReactivate = existing.isActive === false;
    const shouldReorder = existing.displayOrder !== nextDisplayOrder;

    if (!shouldReactivate && !shouldReorder) {
      continue;
    }

    await prisma.studentRecordSubjectCatalog.update({
      where: { id: existing.id },
      data: {
        isActive: true,
        displayOrder: nextDisplayOrder,
      },
    });

    if (shouldReactivate) {
      reactivated += 1;
    }

    if (shouldReorder) {
      reordered += 1;
    }
  }

  return { reactivated, reordered };
}

async function refreshCatalogRows(catalogRows) {
  await prisma.studentRecordSubjectCatalog.deleteMany({});

  if (catalogRows.length === 0) {
    return { inserted: 0 };
  }

  await prisma.studentRecordSubjectCatalog.createMany({
    data: catalogRows.map((row, index) => ({
      subjectGroup: row.subjectGroup,
      completionType: row.completionType,
      subjectName: row.subjectName,
      displayOrder: index + 1,
      isActive: true,
    })),
  });

  return { inserted: catalogRows.length };
}

async function incrementalCatalogInsert(catalogRows) {
  const existingRows = await prisma.studentRecordSubjectCatalog.findMany({
    select: {
      subjectGroup: true,
      completionType: true,
      subjectName: true,
    },
  });

  const existingKeys = new Set(
    existingRows.map(
      (row) =>
        `${normalizeText(row.subjectGroup)}__${normalizeText(
          row.completionType
        )}__${normalizeText(row.subjectName)}`
    )
  );

  const rowsToInsert = [];

  for (let index = 0; index < catalogRows.length; index += 1) {
    const row = catalogRows[index];
    const key = `${row.subjectGroup}__${row.completionType}__${row.subjectName}`;

    if (existingKeys.has(key)) {
      continue;
    }

    rowsToInsert.push({
      subjectGroup: row.subjectGroup,
      completionType: row.completionType,
      subjectName: row.subjectName,
      displayOrder: index + 1,
      isActive: true,
    });
  }

  if (rowsToInsert.length > 0) {
    await prisma.studentRecordSubjectCatalog.createMany({
      data: rowsToInsert,
    });
  }

  return {
    inserted: rowsToInsert.length,
    skipped: catalogRows.length - rowsToInsert.length,
  };
}

async function main() {
  const { filePath, fullRefresh } = parseArgs(process.argv);

  console.log("=".repeat(80));
  console.log("[seed-subject-catalog] 시작");
  console.log(`- 연결 URL 소스: ${process.env.DIRECT_URL ? "DIRECT_URL" : "DATABASE_URL"}`);
  console.log(`- 파일 경로: ${filePath}`);
  console.log(`- 전체 재적재 모드: ${fullRefresh ? "예" : "아니오"}`);
  console.log("=".repeat(80));

  assertFileExists(filePath);

  const { sheetName, rows: rawRows } = loadWorkbookRows(filePath);
  validateHeaders(rawRows);

  const catalogRows = buildCatalogRows(rawRows);

  if (catalogRows.length === 0) {
    throw new Error(
      "유효한 카탈로그 데이터가 없습니다. 헤더(교과, 이수구분, 과목명)와 행 데이터를 확인해 주세요."
    );
  }

  const subjectGroups = buildOrderedUniqueValues(
    catalogRows,
    (item) => item.subjectGroup
  );

  const completionTypes = buildOrderedUniqueValues(
    catalogRows,
    (item) => item.completionType
  );

  console.log("[1] 엑셀 파싱 완료");
  console.log(`- 시트명: ${sheetName}`);
  console.log(`- 원본 행 수: ${rawRows.length}`);
  console.log(`- 유효 카탈로그 행 수(중복 제거 후): ${catalogRows.length}`);
  console.log(`- 교과 수: ${subjectGroups.length}`);
  console.log(`- 이수구분 수: ${completionTypes.length}`);

  const subjectGroupResult = await upsertSubjectGroupOptions(subjectGroups);
  const completionTypeResult = await upsertCompletionTypeOptions(completionTypes);

  console.log("[2] 옵션 테이블 반영 완료");
  console.log(
    `- SubjectGroupOption: 생성 ${subjectGroupResult.created}, 업데이트 ${subjectGroupResult.updated}`
  );
  console.log(
    `- CompletionTypeOption: 생성 ${completionTypeResult.created}, 업데이트 ${completionTypeResult.updated}`
  );

  if (fullRefresh) {
    const refreshResult = await refreshCatalogRows(catalogRows);

    console.log("[3] StudentRecordSubjectCatalog 전체 재적재 완료");
    console.log(`- 삽입: ${refreshResult.inserted}`);
  } else {
    const reactivateResult = await reactivateExistingCatalogRows(catalogRows);
    const incrementalResult = await incrementalCatalogInsert(catalogRows);

    console.log("[3] StudentRecordSubjectCatalog 증분 반영 완료");
    console.log(`- 신규 삽입: ${incrementalResult.inserted}`);
    console.log(`- 기존 중복 스킵: ${incrementalResult.skipped}`);
    console.log(`- 비활성 데이터 재활성화: ${reactivateResult.reactivated}`);
    console.log(`- displayOrder 재정렬: ${reactivateResult.reordered}`);
  }

  const [
    subjectGroupOptionCount,
    completionTypeOptionCount,
    subjectCatalogCount,
    activeSubjectCatalogCount,
  ] = await Promise.all([
    prisma.subjectGroupOption.count(),
    prisma.completionTypeOption.count(),
    prisma.studentRecordSubjectCatalog.count(),
    prisma.studentRecordSubjectCatalog.count({
      where: {
        isActive: true,
      },
    }),
  ]);

  console.log("[4] 최종 집계");
  console.log(`- SubjectGroupOption 총 건수: ${subjectGroupOptionCount}`);
  console.log(`- CompletionTypeOption 총 건수: ${completionTypeOptionCount}`);
  console.log(`- StudentRecordSubjectCatalog 총 건수: ${subjectCatalogCount}`);
  console.log(
    `- StudentRecordSubjectCatalog 활성 건수: ${activeSubjectCatalogCount}`
  );

  console.log("=".repeat(80));
  console.log("[seed-subject-catalog] 완료");
  console.log("=".repeat(80));
}

main()
  .catch((error) => {
    console.error("[seed-subject-catalog] 실패");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
