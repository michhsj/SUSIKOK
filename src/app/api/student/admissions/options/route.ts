import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db"; // 프로젝트 경로에 맞게 수정

function normalizeText(value: string | null): string {
  return value?.trim() ?? "";
}

function uniqueSortedStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value?.trim() ?? "")
        .filter((value) => value.length > 0)
    )
  ).sort((a, b) => a.localeCompare(b, "ko-KR"));
}

function toOptions(values: string[]) {
  return values.map((value) => ({
    label: value,
    value,
  }));
}

function buildBaseWhere(): Prisma.AdmissionResultWhereInput {
  return {
    isActive: true,
  };
}

function buildWhere(filters: {
  region?: string;
  universityName?: string;
  admissionType?: string;
  admissionName?: string;
  collegeName?: string;
  track?: string;
}): Prisma.AdmissionResultWhereInput {
  const andConditions: Prisma.AdmissionResultWhereInput[] = [buildBaseWhere()];

  if (filters.region) {
    andConditions.push({ region: filters.region });
  }

  if (filters.universityName) {
    andConditions.push({ universityName: filters.universityName });
  }

  if (filters.admissionType) {
    andConditions.push({ admissionType: filters.admissionType });
  }

  if (filters.admissionName) {
    andConditions.push({ admissionName: filters.admissionName });
  }

  if (filters.collegeName) {
    andConditions.push({ collegeName: filters.collegeName });
  }

  if (filters.track) {
    andConditions.push({
      track: {
        contains: filters.track,
        mode: Prisma.QueryMode.insensitive,
      },
    });
  }

  return {
    AND: andConditions,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const region = normalizeText(searchParams.get("region"));
    const universityName = normalizeText(searchParams.get("universityName"));
    const admissionType = normalizeText(searchParams.get("admissionType"));
    const admissionName = normalizeText(searchParams.get("admissionName"));
    const collegeName = normalizeText(searchParams.get("collegeName"));
    const track = normalizeText(searchParams.get("track"));

    const hasCoreFilters =
      Boolean(region) &&
      Boolean(universityName) &&
      Boolean(admissionType) &&
      Boolean(admissionName);

    const [
      regionRows,
      universityRows,
      admissionTypeRows,
      admissionNameRows,
      collegeNameRows,
      trackRows,
    ] = await Promise.all([
      db.admissionResult.findMany({
        where: buildBaseWhere(),
        select: { region: true },
        distinct: ["region"],
        orderBy: { region: "asc" },
      }),

      db.admissionResult.findMany({
        where: buildWhere({
          region: region || undefined,
        }),
        select: { universityName: true },
        distinct: ["universityName"],
        orderBy: { universityName: "asc" },
      }),

      db.admissionResult.findMany({
        where: buildWhere({
          region: region || undefined,
          universityName: universityName || undefined,
        }),
        select: { admissionType: true },
        distinct: ["admissionType"],
        orderBy: { admissionType: "asc" },
      }),

      db.admissionResult.findMany({
        where: buildWhere({
          region: region || undefined,
          universityName: universityName || undefined,
          admissionType: admissionType || undefined,
        }),
        select: { admissionName: true },
        distinct: ["admissionName"],
        orderBy: { admissionName: "asc" },
      }),

      hasCoreFilters
        ? db.admissionResult.findMany({
            where: buildWhere({
              region,
              universityName,
              admissionType,
              admissionName,
            }),
            select: { collegeName: true },
            distinct: ["collegeName"],
            orderBy: { collegeName: "asc" },
          })
        : Promise.resolve([]),

      hasCoreFilters
        ? db.admissionResult.findMany({
            where: buildWhere({
              region,
              universityName,
              admissionType,
              admissionName,
              collegeName: collegeName || undefined,
            }),
            select: { track: true },
            distinct: ["track"],
            orderBy: { track: "asc" },
          })
        : Promise.resolve([]),
    ]);

    const regions = uniqueSortedStrings(regionRows.map((row) => row.region));
    const universityNames = uniqueSortedStrings(
      universityRows.map((row) => row.universityName)
    );
    const admissionTypes = uniqueSortedStrings(
      admissionTypeRows.map((row) => row.admissionType)
    );
    const admissionNames = uniqueSortedStrings(
      admissionNameRows.map((row) => row.admissionName)
    );
    const collegeNames = uniqueSortedStrings(
      collegeNameRows.map((row) => row.collegeName)
    );
    const tracks = uniqueSortedStrings(trackRows.map((row) => row.track));

    return NextResponse.json({
      success: true,
      filters: {
        region: region || null,
        universityName: universityName || null,
        admissionType: admissionType || null,
        admissionName: admissionName || null,
        collegeName: collegeName || null,
        track: track || null,
      },
      meta: {
        requiredFields: ["region", "universityName", "admissionType", "admissionName"],
        hasCoreFilters,
        canSearch: hasCoreFilters,
        years: {
          current: 2027,
          history: [2026, 2025, 2024],
          prefixMap: {
            "1": 2026,
            "2": 2025,
            "3": 2024,
          },
        },
      },
      optionGroups: {
        region: {
          label: "지역",
          options: toOptions(regions),
          count: regions.length,
        },
        universityName: {
          label: "대학명",
          options: toOptions(universityNames),
          count: universityNames.length,
        },
        admissionType: {
          label: "전형유형",
          options: toOptions(admissionTypes),
          count: admissionTypes.length,
        },
        admissionName: {
          label: "전형명",
          options: toOptions(admissionNames),
          count: admissionNames.length,
        },
        collegeName: {
          label: "단과대학",
          options: toOptions(collegeNames),
          count: collegeNames.length,
          enabled: hasCoreFilters,
        },
        track: {
          label: "계열",
          options: toOptions(tracks),
          count: tracks.length,
          enabled: hasCoreFilters,
        },
      },
    });
  } catch (error) {
    console.error("[GET /api/student/admissions/options] error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "수시 입결 검색 옵션을 불러오지 못했습니다.",
      },
      { status: 500 }
    );
  }
}
