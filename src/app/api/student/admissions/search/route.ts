import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type SearchItem = {
  id: string;
  identity: {
    region: string;
    universityName: string;
    admissionType: string;
    admissionName: string;
    track: string;
    collegeName: string;
    recruitmentUnit: string;
  };
  recruitmentCount2027: {
    label: string;
    shortLabel: string;
    raw: string | null;
    display: string;
  };
  converted70_2026: {
    label: string;
    shortLabel: string;
    raw: string | null;
    display: string;
  };
};

function toStringValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function toDisplayText(value: unknown): string {
  return toStringValue(value) ?? "-";
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;

  const text = value.replace(/,/g, "").trim();
  if (!text) return 0;

  const match = text.match(/-?\d+(\.\d+)?/);
  if (!match) return 0;

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getQuery(searchParams: URLSearchParams, key: string): string {
  return searchParams.get(key)?.trim() ?? "";
}

function normalizeSearchItem(row: {
  id: string;
  region: string;
  universityName: string;
  admissionType: string;
  admissionName: string;
  track: string;
  collegeName: string;
  recruitmentUnit: string;
  currentHeadcountRaw: string | null;
  year26Converted70Raw: string | null;
}): SearchItem {
  return {
    id: row.id,
    identity: {
      region: toDisplayText(row.region),
      universityName: toDisplayText(row.universityName),
      admissionType: toDisplayText(row.admissionType),
      admissionName: toDisplayText(row.admissionName),
      track: toDisplayText(row.track),
      collegeName: toDisplayText(row.collegeName),
      recruitmentUnit: toDisplayText(row.recruitmentUnit),
    },
    recruitmentCount2027: {
      label: "27인원",
      shortLabel: "27인원",
      raw: toStringValue(row.currentHeadcountRaw),
      display: toDisplayText(row.currentHeadcountRaw),
    },
    converted70_2026: {
      label: "26환산70%",
      shortLabel: "26환산70%",
      raw: toStringValue(row.year26Converted70Raw),
      display: toDisplayText(row.year26Converted70Raw),
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const page = clamp(toNumber(searchParams.get("page")) || 1, 1, 999999);
    const pageSize = clamp(toNumber(searchParams.get("pageSize")) || 20, 1, 100);

    const region = getQuery(searchParams, "region");
    const universityName = getQuery(searchParams, "universityName");
    const admissionType = getQuery(searchParams, "admissionType");
    const admissionName = getQuery(searchParams, "admissionName");
    const collegeName = getQuery(searchParams, "collegeName");
    const track = getQuery(searchParams, "track");
    const keyword = getQuery(searchParams, "keyword");
    const admissionYear = toNumber(searchParams.get("admissionYear")) || 2027;

    const andFilters: any[] = [
      { isActive: true },
      { admissionYear },
    ];

    if (region) andFilters.push({ region });
    if (universityName) andFilters.push({ universityName });
    if (admissionType) andFilters.push({ admissionType });
    if (admissionName) andFilters.push({ admissionName });
    if (collegeName) andFilters.push({ collegeName });
    if (track) andFilters.push({ track });

    if (keyword) {
      andFilters.push({
        OR: [
          { region: { contains: keyword, mode: "insensitive" } },
          { universityName: { contains: keyword, mode: "insensitive" } },
          { admissionType: { contains: keyword, mode: "insensitive" } },
          { admissionName: { contains: keyword, mode: "insensitive" } },
          { track: { contains: keyword, mode: "insensitive" } },
          { collegeName: { contains: keyword, mode: "insensitive" } },
          { recruitmentUnit: { contains: keyword, mode: "insensitive" } },
        ],
      });
    }

    const where = { AND: andFilters };

    const [totalCount, rows] = await Promise.all([
      prisma.admissionResult.count({ where }),
      prisma.admissionResult.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [
          { region: "asc" },
          { universityName: "asc" },
          { admissionType: "asc" },
          { admissionName: "asc" },
          { track: "asc" },
          { collegeName: "asc" },
          { recruitmentUnit: "asc" },
          { sourceRowNumber: "asc" },
          { id: "asc" },
        ],
        select: {
          id: true,
          region: true,
          universityName: true,
          admissionType: true,
          admissionName: true,
          track: true,
          collegeName: true,
          recruitmentUnit: true,
          currentHeadcountRaw: true,
          year26Converted70Raw: true,
        },
      }),
    ]);

    const items = rows.map(normalizeSearchItem);

    return NextResponse.json({
      success: true,
      items,
      meta: {
        totalCount,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
      },
    });
  } catch (error) {
    console.error("[student/admissions/search] GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "검색 데이터를 불러오는 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
