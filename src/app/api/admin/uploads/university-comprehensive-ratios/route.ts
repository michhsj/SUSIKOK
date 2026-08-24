import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/auth/admin-session";

export const runtime = "nodejs";

const ADMISSION_YEAR = 2027;
const RATIO_SUM_TOLERANCE = 0.5;

const SHEET_NAME_CANDIDATES = [
  "학종 역량 비율",
  "학종역량비율",
  "대학별 종합전형 비율",
  "대학별종합전형비율",
] as const;

type RowIssueItem = {
  rowNumber: number;
  reason: string;
};

type HeaderKey =
  | "region"
  | "universityName"
  | "admissionType"
  | "admissionName"
  | "track"
  | "collegeName"
  | "recruitmentUnit"
  | "academicCompetencyDescription"
  | "careerCompetencyDescription"
  | "communityCompetencyDescription"
  | "academicCompetencyRatio"
  | "careerCompetencyRatio"
  | "communityCompetencyRatio";

type UniversityComprehensiveRatioNaturalKey = {
  admissionYear: number;
  region: string;
  universityName: string;
  admissionType: string;
  admissionName: string;
  track: string;
  collegeName: string;
  recruitmentUnit: string;
};

type UniversityComprehensiveRatioUpsertInput = {
  admissionYear: number;
  sourceSheetName: string;
  region: string;
  universityName: string;
  admissionType: string;
  admissionName: string;
  track: string;
  collegeName: string;
  recruitmentUnit: string;
  academicCompetencyRatio: number;
  academicCompetencyDescription: string | null;
  careerCompetencyRatio: number;
  careerCompetencyDescription: string | null;
  communityCompetencyRatio: number;
  communityCompetencyDescription: string | null;
  rawRow: Prisma.JsonValue | null;
  isActive: boolean;
};

type UniversityComprehensiveRatioWhereUnique = {
  universityComprehensiveRatioNaturalKey: UniversityComprehensiveRatioNaturalKey;
};

type UniversityComprehensiveRatioDelegate = {
  deleteMany: (args: {
    where: {
      admissionYear?: number;
      isActive?: boolean;
    };
  }) => Promise<{ count: number }>;
  upsert: (args: {
    where: UniversityComprehensiveRatioWhereUnique;
    create: UniversityComprehensiveRatioUpsertInput;
    update: Partial<UniversityComprehensiveRatioUpsertInput>;
  }) => Promise<{ id: string }>;
  count: (args?: {
    where?: {
      admissionYear?: number;
      isActive?: boolean;
    };
  }) => Promise<number>;
};

type TransactionCapablePrisma = {
  $transaction: <T>(fn: (tx: unknown) => Promise<T>) => Promise<T>;
};

type ParsedUploadRow = {
  rowNumber: number;
  naturalKey: UniversityComprehensiveRatioNaturalKey;
  naturalKeyString: string;
  createData: UniversityComprehensiveRatioUpsertInput;
  updateData: Partial<UniversityComprehensiveRatioUpsertInput>;
};

const REQUIRED_HEADER_KEYS: HeaderKey[] = [
  "region",
  "universityName",
  "admissionType",
  "academicCompetencyDescription",
  "careerCompetencyDescription",
  "communityCompetencyDescription",
  "academicCompetencyRatio",
  "careerCompetencyRatio",
  "communityCompetencyRatio",
];

const OPTIONAL_HEADER_KEYS: HeaderKey[] = [
  "admissionName",
  "track",
  "collegeName",
  "recruitmentUnit",
];

const HEADER_CANDIDATES: Record<HeaderKey, readonly string[]> = {
  region: ["지역"],
  universityName: ["대학", "대학명", "학교", "학교명"],
  admissionType: ["전형유형", "전형 유형"],
  admissionName: ["전형명", "전형 명"],
  track: ["계열"],
  collegeName: ["단과대학", "단과 대학"],
  recruitmentUnit: ["모집단위", "모집 단위", "학과", "학부"],

  academicCompetencyDescription: [
    "학업역량",
    "학업 역량",
    "학업역량설명",
    "학업역량 설명",
  ],
  careerCompetencyDescription: [
    "진로역량",
    "진로 역량",
    "진학의지",
    "진로역량설명",
    "진로역량 설명",
  ],
  communityCompetencyDescription: [
    "공동체역량",
    "공동체 역량",
    "인성역량",
    "인성 역량",
    "인성",
    "공동체역량설명",
    "공동체역량 설명",
  ],

  academicCompetencyRatio: [
    "학업역량비율",
    "학업역량 비율",
    "학업역량(%)",
    "학업역량%",
    "학업비율",
    "학업 비율",
  ],
  careerCompetencyRatio: [
    "진로역량비율",
    "진로역량 비율",
    "진로역량(%)",
    "진로역량%",
    "진로비율",
    "진로 비율",
  ],
  communityCompetencyRatio: [
    "공동체역량비율",
    "공동체역량 비율",
    "공동체역량(%)",
    "공동체역량%",
    "공동체비율",
    "공동체 비율",
    "인성비율",
    "인성 비율",
  ],
};

function jsonError(message: string, status = 400, data?: Record<string, unknown>) {
  return NextResponse.json(
    {
      success: false,
      message,
      ...(data ? { data } : {}),
    },
    { status }
  );
}

function normalizeText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeCompareText(value: unknown): string {
  return normalizeText(value).replace(/\s+/g, "").toLowerCase();
}

function isBlankRow(row: unknown[]): boolean {
  return row.every((cell) => normalizeText(cell) === "");
}

function isComprehensiveAdmission(
  admissionType: string,
  admissionName: string
): boolean {
  const merged = `${admissionType} ${admissionName}`.replace(/\s+/g, "");
  return merged.includes("종합") || merged.includes("학종");
}

function resolveHeaderIndex(
  headers: string[],
  candidates: readonly string[]
): number {
  const normalizedHeaderMap = new Map<string, number>();

  headers.forEach((header: string, index: number) => {
    normalizedHeaderMap.set(normalizeCompareText(header), index);
  });

  for (const candidate of candidates) {
    const found = normalizedHeaderMap.get(normalizeCompareText(candidate));
    if (typeof found === "number") return found;
  }

  return -1;
}

function getCell(row: unknown[], index: number): unknown {
  if (index < 0) return "";
  return row[index];
}

function parseRatioPercent(value: unknown): number | null {
  const text = normalizeText(value);
  if (!text) return null;

  const cleaned = text.replace(/,/g, "").replace(/%/g, "").trim();
  if (!cleaned) return null;

  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return null;

  const normalized =
    parsed >= 0 && parsed <= 1
      ? Number((parsed * 100).toFixed(2))
      : Number(parsed.toFixed(2));

  if (normalized < 0 || normalized > 100) {
    return null;
  }

  return normalized;
}

function buildNaturalKeyString(
  key: UniversityComprehensiveRatioNaturalKey
): string {
  return [
    key.admissionYear,
    key.region,
    key.universityName,
    key.admissionType,
    key.admissionName,
    key.track,
    key.collegeName,
    key.recruitmentUnit,
  ]
    .map((value: string | number) => normalizeCompareText(value))
    .join("::");
}

function buildRawRowObject(headers: string[], row: unknown[]): Prisma.JsonObject {
  const raw: Record<string, string> = {};

  headers.forEach((header: string, index: number) => {
    const key = normalizeText(header) || `column_${index + 1}`;
    raw[key] = normalizeText(row[index]);
  });

  return raw as Prisma.JsonObject;
}

function getUniversityComprehensiveRatioDelegate(
  client: unknown
): UniversityComprehensiveRatioDelegate | null {
  const candidate = (client as Record<string, unknown>)?.[
    "universityComprehensiveRatio"
  ];

  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const delegate = candidate as Partial<UniversityComprehensiveRatioDelegate>;

  if (
    typeof delegate.deleteMany !== "function" ||
    typeof delegate.upsert !== "function" ||
    typeof delegate.count !== "function"
  ) {
    return null;
  }

  return delegate as UniversityComprehensiveRatioDelegate;
}

function getTransactionCapablePrisma(client: unknown): TransactionCapablePrisma | null {
  if (!client || typeof client !== "object") return null;

  const transaction = (client as Record<string, unknown>)["$transaction"];
  if (typeof transaction !== "function") return null;

  return client as TransactionCapablePrisma;
}

function resolveMatchedSheetName(sheetNames: string[]): string | null {
  const normalizedCandidates = SHEET_NAME_CANDIDATES.map((name) =>
    normalizeCompareText(name)
  );

  for (const sheetName of sheetNames) {
    const normalizedSheetName = normalizeCompareText(sheetName);
    if (normalizedCandidates.includes(normalizedSheetName)) {
      return sheetName;
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value ?? "";
    const session = verifyAdminSessionToken(token);

    if (!session) {
      return jsonError("관리자 인증이 필요합니다.", 401);
    }

    const ratioDelegate = getUniversityComprehensiveRatioDelegate(prisma);
    const transactionPrisma = getTransactionCapablePrisma(prisma);

    if (!ratioDelegate || !transactionPrisma) {
      return jsonError(
        "UniversityComprehensiveRatio 모델이 Prisma Client에 반영되지 않았습니다. prisma generate 이후 다시 시도해 주세요.",
        500
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("업로드할 엑셀 파일을 선택해 주세요.", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(Buffer.from(arrayBuffer), { type: "buffer" });

    if (!workbook.SheetNames.length) {
      return jsonError("엑셀 시트를 찾을 수 없습니다.", 400);
    }

    const matchedSheetName = resolveMatchedSheetName(workbook.SheetNames);

    if (!matchedSheetName) {
      return jsonError(
        `허용된 시트를 찾을 수 없습니다. 현재 파일 시트명: ${workbook.SheetNames.join(", ")}`,
        400,
        {
          allowedSheetNames: [...SHEET_NAME_CANDIDATES],
          detectedSheetNames: workbook.SheetNames,
        }
      );
    }

    const worksheet = workbook.Sheets[matchedSheetName];
    const matrix = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      defval: "",
      blankrows: false,
    }) as unknown[][];

    if (!matrix.length) {
      return jsonError("엑셀 데이터가 비어 있습니다.", 400);
    }

    const headers = (matrix[0] ?? []).map((cell: unknown) => normalizeText(cell));

    if (!headers.length) {
      return jsonError("헤더 행을 찾을 수 없습니다.", 400);
    }

    const headerIndexMap = {} as Record<HeaderKey, number>;

    for (const key of REQUIRED_HEADER_KEYS) {
      const foundIndex = resolveHeaderIndex(headers, HEADER_CANDIDATES[key]);
      if (foundIndex < 0) {
        return jsonError(
          `필수 헤더를 찾을 수 없습니다: ${HEADER_CANDIDATES[key][0]}`,
          400,
          {
            sheetName: matchedSheetName,
            headers,
          }
        );
      }
      headerIndexMap[key] = foundIndex;
    }

    for (const key of OPTIONAL_HEADER_KEYS) {
      headerIndexMap[key] = resolveHeaderIndex(headers, HEADER_CANDIDATES[key]);
    }

    const totalRows = Math.max(matrix.length - 1, 0);
    const updatedRows: RowIssueItem[] = [];
    const skippedRows: RowIssueItem[] = [];
    const failedRows: RowIssueItem[] = [];

    const seenNaturalKeys = new Map<string, number>();
    const parsedRowsByKey = new Map<string, ParsedUploadRow>();

    for (let rowIndex = 1; rowIndex < matrix.length; rowIndex += 1) {
      const row = matrix[rowIndex] ?? [];
      const rowNumber = rowIndex + 1;

      if (isBlankRow(row)) {
        skippedRows.push({
          rowNumber,
          reason: "빈 행입니다.",
        });
        continue;
      }

      const region = normalizeText(getCell(row, headerIndexMap.region));
      const universityName = normalizeText(
        getCell(row, headerIndexMap.universityName)
      );
      const admissionType = normalizeText(
        getCell(row, headerIndexMap.admissionType)
      );
      const admissionName = normalizeText(
        getCell(row, headerIndexMap.admissionName)
      );
      const track = normalizeText(getCell(row, headerIndexMap.track));
      const collegeName = normalizeText(getCell(row, headerIndexMap.collegeName));
      const recruitmentUnit = normalizeText(
        getCell(row, headerIndexMap.recruitmentUnit)
      );

      const academicCompetencyDescription = normalizeText(
        getCell(row, headerIndexMap.academicCompetencyDescription)
      );
      const careerCompetencyDescription = normalizeText(
        getCell(row, headerIndexMap.careerCompetencyDescription)
      );
      const communityCompetencyDescription = normalizeText(
        getCell(row, headerIndexMap.communityCompetencyDescription)
      );

      const academicCompetencyRatio = parseRatioPercent(
        getCell(row, headerIndexMap.academicCompetencyRatio)
      );
      const careerCompetencyRatio = parseRatioPercent(
        getCell(row, headerIndexMap.careerCompetencyRatio)
      );
      const communityCompetencyRatio = parseRatioPercent(
        getCell(row, headerIndexMap.communityCompetencyRatio)
      );

      if (!region || !universityName || !admissionType) {
        failedRows.push({
          rowNumber,
          reason: "지역 / 대학명 / 전형유형은 필수입니다.",
        });
        continue;
      }

      if (!isComprehensiveAdmission(admissionType, admissionName)) {
        skippedRows.push({
          rowNumber,
          reason: "종합/학종 전형이 아니므로 건너뜁니다.",
        });
        continue;
      }

      if (
        academicCompetencyRatio === null ||
        careerCompetencyRatio === null ||
        communityCompetencyRatio === null
      ) {
        failedRows.push({
          rowNumber,
          reason:
            "학업역량비율 / 진로역량비율 / 공동체역량비율은 0~100 범위의 숫자여야 합니다.",
        });
        continue;
      }

      const ratioSum =
        academicCompetencyRatio +
        careerCompetencyRatio +
        communityCompetencyRatio;

      if (Math.abs(ratioSum - 100) > RATIO_SUM_TOLERANCE) {
        failedRows.push({
          rowNumber,
          reason: `역량 비율 합계가 100이 아닙니다. (현재 합계: ${ratioSum})`,
        });
        continue;
      }

      const naturalKey: UniversityComprehensiveRatioNaturalKey = {
        admissionYear: ADMISSION_YEAR,
        region,
        universityName,
        admissionType,
        admissionName,
        track,
        collegeName,
        recruitmentUnit,
      };

      const naturalKeyString = buildNaturalKeyString(naturalKey);
      const previousRowNumber = seenNaturalKeys.get(naturalKeyString);

      if (typeof previousRowNumber === "number") {
        updatedRows.push({
          rowNumber,
          reason: `엑셀 내부 중복 키입니다. ${previousRowNumber}행 데이터를 현재 행으로 덮어썼습니다.`,
        });
      }

      seenNaturalKeys.set(naturalKeyString, rowNumber);

      const rawRow = buildRawRowObject(headers, row);

      const createData: UniversityComprehensiveRatioUpsertInput = {
        admissionYear: ADMISSION_YEAR,
        sourceSheetName: matchedSheetName,
        region,
        universityName,
        admissionType,
        admissionName,
        track,
        collegeName,
        recruitmentUnit,
        academicCompetencyRatio,
        academicCompetencyDescription: academicCompetencyDescription || null,
        careerCompetencyRatio,
        careerCompetencyDescription: careerCompetencyDescription || null,
        communityCompetencyRatio,
        communityCompetencyDescription: communityCompetencyDescription || null,
        rawRow,
        isActive: true,
      };

      const updateData: Partial<UniversityComprehensiveRatioUpsertInput> = {
        sourceSheetName: matchedSheetName,
        academicCompetencyRatio,
        academicCompetencyDescription: academicCompetencyDescription || null,
        careerCompetencyRatio,
        careerCompetencyDescription: careerCompetencyDescription || null,
        communityCompetencyRatio,
        communityCompetencyDescription: communityCompetencyDescription || null,
        rawRow,
        isActive: true,
      };

      parsedRowsByKey.set(naturalKeyString, {
        rowNumber,
        naturalKey,
        naturalKeyString,
        createData,
        updateData,
      });
    }

    const validRows = Array.from(parsedRowsByKey.values());
    const skippedCount = skippedRows.length;
    const failedCount = failedRows.length;
    const updatedCount = updatedRows.length;

    if (failedCount > 0) {
      return jsonError(
        `업로드 파일 검증에 실패했습니다. 실패 ${failedCount}건을 수정한 뒤 다시 업로드해 주세요.`,
        400,
        {
          admissionYear: ADMISSION_YEAR,
          sourceFileName: file.name,
          sheetName: matchedSheetName,
          totalRows,
          validCount: validRows.length,
          skippedCount,
          failedCount,
          updatedCount,
          updatedRows,
          skippedRows,
          failedRows,
        }
      );
    }

    if (validRows.length === 0) {
      return jsonError(
        "저장 가능한 학종 역량 비율 데이터가 없습니다. 파일 내용을 확인해 주세요.",
        400,
        {
          admissionYear: ADMISSION_YEAR,
          sourceFileName: file.name,
          sheetName: matchedSheetName,
          totalRows,
          skippedCount,
          failedCount,
          updatedCount,
          updatedRows,
          skippedRows,
          failedRows,
        }
      );
    }

    const transactionResult = await transactionPrisma.$transaction(async (tx) => {
      const txDelegate = getUniversityComprehensiveRatioDelegate(tx);

      if (!txDelegate) {
        throw new Error(
          "UniversityComprehensiveRatio 트랜잭션 delegate를 찾을 수 없습니다."
        );
      }

      const deletedResult = await txDelegate.deleteMany({
        where: {
          admissionYear: ADMISSION_YEAR,
        },
      });

      for (const parsedRow of validRows) {
        await txDelegate.upsert({
          where: {
            universityComprehensiveRatioNaturalKey: parsedRow.naturalKey,
          },
          create: parsedRow.createData,
          update: parsedRow.updateData,
        });
      }

      const finalTotal = await txDelegate.count({
        where: {
          admissionYear: ADMISSION_YEAR,
        },
      });

      return {
        deletedCount: deletedResult.count,
        finalTotal,
      };
    });

    return NextResponse.json({
      success: true,
      message: "학종 역량 비율 업로드가 완료되었습니다.",
      data: {
        admissionYear: ADMISSION_YEAR,
        sourceFileName: file.name,
        sheetName: matchedSheetName,
        totalRows,
        deletedCount: transactionResult.deletedCount,
        insertedCount: validRows.length,
        updatedCount,
        skippedCount,
        failedCount,
        finalTotal: transactionResult.finalTotal,
        updatedRows,
        skippedRows,
        failedRows,
      },
    });
  } catch (error) {
    console.error(
      "[API] /api/admin/uploads/university-comprehensive-ratios 오류:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "학종 역량 비율 업로드 처리 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
