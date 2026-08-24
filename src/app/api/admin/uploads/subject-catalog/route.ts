import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { prisma } from "@/lib/prisma";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/auth/admin-session";

export const runtime = "nodejs";

const REQUIRED_HEADERS = ["교과", "이수구분", "과목명"] as const;

type CatalogRow = {
  subjectGroup: string;
  completionType: string;
  subjectName: string;
  displayOrder: number;
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

function toTrimmedString(value: unknown) {
  return String(value ?? "").trim();
}

function parseBooleanFlag(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim().toUpperCase();
  return text === "Y" || text === "1" || text === "TRUE" || text === "ON";
}

function normalizeCatalogRowsFromBuffer(buffer: Buffer): CatalogRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
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
    throw new Error(`필수 헤더가 누락되었습니다: ${missingHeaders.join(", ")}`);
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
    const key = [row.subjectGroup, row.completionType, row.subjectName].join("|||");
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
  const uniqueNames = Array.from(new Set(rows.map((row) => row.completionType)));

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
    await prisma.subjectGroupOption.updateMany({
      data: {
        isActive: false,
      },
    });
    await prisma.completionTypeOption.updateMany({
      data: {
        isActive: false,
      },
    });
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
    const key = [row.subjectGroup, row.completionType, row.subjectName].join("|||");

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

export async function POST(request: NextRequest) {
  const adminSession = getAdminSession(request);

  if (!adminSession) {
    return jsonError("관리자 인증이 필요합니다.", 401);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const reset = parseBooleanFlag(formData.get("reset"));

    if (!(file instanceof File)) {
      return jsonError("업로드할 파일이 필요합니다.", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const rows = normalizeCatalogRowsFromBuffer(buffer);

    if (rows.length === 0) {
      return jsonError("가져올 subject catalog 데이터가 없습니다.", 400);
    }

    await syncSubjectGroupOptions(rows);
    await syncCompletionTypeOptions(rows);
    await syncSubjectCatalog(rows, reset);

    return NextResponse.json(
      {
        success: true,
        message: "교과 · 과목 업로드가 완료되었습니다.",
        data: {
          sourceFileName: file.name,
          reset,
          uniqueRows: rows.length,
          subjectGroupCount: new Set(rows.map((row) => row.subjectGroup)).size,
          completionTypeCount: new Set(rows.map((row) => row.completionType)).size,
          subjectCount: rows.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/admin/uploads/subject-catalog] error:", error);

    return jsonError(
      error instanceof Error
        ? error.message
        : "교과 · 과목 업로드 중 서버 오류가 발생했습니다.",
      500
    );
  }
}
