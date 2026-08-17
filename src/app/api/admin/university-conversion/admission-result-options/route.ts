import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AdmissionTargetOptionRow = {
  region: string;
  university: string;
  admissionType: string;
  admissionName: string;
  track: string;
  collegeName: string;
  recruitmentUnit: string;
};

type RawAdmissionResultRow = {
  region: string | null;
  universityName: string | null;
  admissionType: string | null;
  admissionName: string | null;
  track: string | null;
  collegeName: string | null;
  recruitmentUnit: string | null;
  isActive: boolean | null;
};

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function toTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function compareKorean(a: string, b: string) {
  return a.localeCompare(b, "ko");
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort(compareKorean);
}

function normalizeRow(
  row: RawAdmissionResultRow
): AdmissionTargetOptionRow | null {
  const normalized: AdmissionTargetOptionRow = {
    region: toTrimmedString(row.region),
    university: toTrimmedString(row.universityName),
    admissionType: toTrimmedString(row.admissionType),
    admissionName: toTrimmedString(row.admissionName),
    track: toTrimmedString(row.track),
    collegeName: toTrimmedString(row.collegeName),
    recruitmentUnit: toTrimmedString(row.recruitmentUnit),
  };

  if (
    !normalized.region ||
    !normalized.university ||
    !normalized.admissionType ||
    !normalized.admissionName ||
    !normalized.track
  ) {
    return null;
  }

  return normalized;
}

function dedupeRows(rows: AdmissionTargetOptionRow[]) {
  const map = new Map<string, AdmissionTargetOptionRow>();

  for (const row of rows) {
    const key = [
      row.region,
      row.university,
      row.admissionType,
      row.admissionName,
      row.track,
      row.collegeName,
      row.recruitmentUnit,
    ].join("||");

    if (!map.has(key)) {
      map.set(key, row);
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const left = [
      a.region,
      a.university,
      a.admissionType,
      a.admissionName,
      a.track,
      a.collegeName,
      a.recruitmentUnit,
    ].join(" ");

    const right = [
      b.region,
      b.university,
      b.admissionType,
      b.admissionName,
      b.track,
      b.collegeName,
      b.recruitmentUnit,
    ].join(" ");

    return compareKorean(left, right);
  });
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

  console.error("[admission-result-options][GET] unexpected error:", error);

  return NextResponse.json(
    {
      success: false,
      message: "전형 대상 옵션을 불러오는 중 오류가 발생했습니다.",
    },
    { status: 500 }
  );
}

export async function GET() {
  try {
    const rawRows = (await db.admissionResult.findMany({
      where: {
        isActive: true,
      },
      select: {
        region: true,
        universityName: true,
        admissionType: true,
        admissionName: true,
        track: true,
        collegeName: true,
        recruitmentUnit: true,
        isActive: true,
      },
      orderBy: [
        { region: "asc" },
        { universityName: "asc" },
        { admissionType: "asc" },
        { admissionName: "asc" },
        { track: "asc" },
        { collegeName: "asc" },
        { recruitmentUnit: "asc" },
      ],
    })) as RawAdmissionResultRow[];

    const rows = dedupeRows(
      rawRows
        .map(normalizeRow)
        .filter((row): row is AdmissionTargetOptionRow => row !== null)
    );

    if (rows.length === 0) {
      throw new ApiError(
        503,
        "AdmissionResult 원천 데이터가 비어 있습니다. 지역/대학/전형 데이터를 먼저 적재해 주세요."
      );
    }

    const meta = {
      totalCount: rows.length,
      regionCount: uniqueStrings(rows.map((row) => row.region)).length,
      universityCount: uniqueStrings(rows.map((row) => row.university)).length,
      admissionTypeCount: uniqueStrings(rows.map((row) => row.admissionType))
        .length,
      admissionNameCount: uniqueStrings(rows.map((row) => row.admissionName))
        .length,
      trackCount: uniqueStrings(rows.map((row) => row.track)).length,
      collegeNameCount: uniqueStrings(
        rows.map((row) => row.collegeName).filter(Boolean)
      ).length,
      recruitmentUnitCount: uniqueStrings(
        rows.map((row) => row.recruitmentUnit).filter(Boolean)
      ).length,
    };

    return NextResponse.json(
      {
        success: true,
        rows,
        meta,
      },
      { status: 200 }
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
