import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type RatioItem = {
  id: string;
  updatedAt: Date;
  admissionYear: number;
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
};

type RatioTargetScope = {
  admissionYear: number;
  region: string;
  universityName: string;
  admissionType: string;
  admissionName: string;
  track: string;
  collegeName: string;
  recruitmentUnit: string;
};

type UniversityComprehensiveRatioFindManyArgs = {
  where: {
    isActive: boolean;
    admissionYear: number;
    region: string;
    universityName: string;
    admissionType: string;
    admissionName: string;
  };
  select: {
    id: true;
    updatedAt: true;
    admissionYear: true;
    region: true;
    universityName: true;
    admissionType: true;
    admissionName: true;
    track: true;
    collegeName: true;
    recruitmentUnit: true;
    academicCompetencyRatio: true;
    academicCompetencyDescription: true;
    careerCompetencyRatio: true;
    careerCompetencyDescription: true;
    communityCompetencyRatio: true;
    communityCompetencyDescription: true;
  };
};

type UniversityComprehensiveRatioDelegate = {
  findMany: (args: UniversityComprehensiveRatioFindManyArgs) => Promise<RatioItem[]>;
};

const SPECIFICITY_PRIORITY_KEYS = [
  "recruitmentUnit",
  "collegeName",
  "track",
] as const;

function getUniversityComprehensiveRatioDelegate():
  | UniversityComprehensiveRatioDelegate
  | null {
  const candidate = (db as unknown as Record<string, unknown>)[
    "universityComprehensiveRatio"
  ];

  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const delegate = candidate as Partial<UniversityComprehensiveRatioDelegate>;

  if (typeof delegate.findMany !== "function") {
    return null;
  }

  return delegate as UniversityComprehensiveRatioDelegate;
}

function toStringValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeCompareText(value: unknown): string {
  return toStringValue(value).replace(/\s+/g, "").toLowerCase();
}

function hasText(value: unknown): boolean {
  return toStringValue(value).length > 0;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseAdmissionYear(value: string | null): number {
  const parsed = toNumber(value);
  return parsed && parsed > 0 ? parsed : 2027;
}

function matchesRatioToTarget(
  ratio: RatioItem,
  target: RatioTargetScope,
): boolean {
  if (ratio.admissionYear !== target.admissionYear) {
    return false;
  }

  if (normalizeCompareText(ratio.region) !== normalizeCompareText(target.region)) {
    return false;
  }

  if (
    normalizeCompareText(ratio.universityName) !==
    normalizeCompareText(target.universityName)
  ) {
    return false;
  }

  if (
    normalizeCompareText(ratio.admissionType) !==
    normalizeCompareText(target.admissionType)
  ) {
    return false;
  }

  if (
    normalizeCompareText(ratio.admissionName) !==
    normalizeCompareText(target.admissionName)
  ) {
    return false;
  }

  const optionalKeys: Array<
    keyof Pick<RatioTargetScope, "track" | "collegeName" | "recruitmentUnit">
  > = ["track", "collegeName", "recruitmentUnit"];

  for (const key of optionalKeys) {
    const ratioValue = normalizeCompareText(ratio[key]);
    const targetValue = normalizeCompareText(target[key]);

    if (ratioValue && ratioValue !== targetValue) {
      return false;
    }
  }

  return true;
}

function getSpecificityTuple(ratio: RatioItem): number[] {
  return SPECIFICITY_PRIORITY_KEYS.map((key) => (hasText(ratio[key]) ? 1 : 0));
}

function compareBySpecificity(a: RatioItem, b: RatioItem): number {
  const tupleA = getSpecificityTuple(a);
  const tupleB = getSpecificityTuple(b);

  for (let i = 0; i < tupleA.length; i += 1) {
    if (tupleA[i] !== tupleB[i]) {
      return tupleB[i] - tupleA[i];
    }
  }

  return b.updatedAt.getTime() - a.updatedAt.getTime();
}

function toResponseItem(ratio: RatioItem) {
  return {
    id: ratio.id,
    admissionYear: ratio.admissionYear,
    region: ratio.region,
    universityName: ratio.universityName,
    admissionType: ratio.admissionType,
    admissionName: ratio.admissionName,
    track: ratio.track,
    collegeName: ratio.collegeName,
    recruitmentUnit: ratio.recruitmentUnit,
    academicCompetencyRatio: ratio.academicCompetencyRatio,
    academicCompetencyDescription: ratio.academicCompetencyDescription,
    careerCompetencyRatio: ratio.careerCompetencyRatio,
    careerCompetencyDescription: ratio.careerCompetencyDescription,
    communityCompetencyRatio: ratio.communityCompetencyRatio,
    communityCompetencyDescription: ratio.communityCompetencyDescription,
    updatedAt: ratio.updatedAt,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const admissionYear = parseAdmissionYear(searchParams.get("admissionYear"));
    const region = toStringValue(searchParams.get("region"));
    const universityName = toStringValue(searchParams.get("universityName"));
    const admissionType = toStringValue(searchParams.get("admissionType"));
    const admissionName = toStringValue(searchParams.get("admissionName"));
    const track = toStringValue(searchParams.get("track"));
    const collegeName = toStringValue(searchParams.get("collegeName"));
    const recruitmentUnit = toStringValue(searchParams.get("recruitmentUnit"));

    if (!region || !universityName || !admissionType || !admissionName) {
      return NextResponse.json(
        {
          success: false,
          message:
            "region, universityName, admissionType, admissionName 파라미터가 필요합니다.",
        },
        { status: 400 },
      );
    }

    const delegate = getUniversityComprehensiveRatioDelegate();

    if (!delegate) {
      console.warn(
        "[student/admissions/university-comprehensive-ratios] universityComprehensiveRatio delegate unavailable",
      );

      return NextResponse.json({
        success: true,
        message: "대학별 종합전형 비율 데이터를 찾을 수 없습니다.",
        data: {
          found: false,
          candidateCount: 0,
          target: {
            admissionYear,
            region,
            universityName,
            admissionType,
            admissionName,
            track,
            collegeName,
            recruitmentUnit,
          },
          item: null,
        },
      });
    }

    const candidates = await delegate.findMany({
      where: {
        isActive: true,
        admissionYear,
        region,
        universityName,
        admissionType,
        admissionName,
      },
      select: {
        id: true,
        updatedAt: true,
        admissionYear: true,
        region: true,
        universityName: true,
        admissionType: true,
        admissionName: true,
        track: true,
        collegeName: true,
        recruitmentUnit: true,
        academicCompetencyRatio: true,
        academicCompetencyDescription: true,
        careerCompetencyRatio: true,
        careerCompetencyDescription: true,
        communityCompetencyRatio: true,
        communityCompetencyDescription: true,
      },
    });

    const target: RatioTargetScope = {
      admissionYear,
      region,
      universityName,
      admissionType,
      admissionName,
      track,
      collegeName,
      recruitmentUnit,
    };

    const matched =
      candidates
        .filter((ratio: RatioItem) => matchesRatioToTarget(ratio, target))
        .sort((a: RatioItem, b: RatioItem) => compareBySpecificity(a, b))[0] ??
      null;

    return NextResponse.json({
      success: true,
      message: matched
        ? "대학별 종합전형 비율 데이터를 찾았습니다."
        : "대학별 종합전형 비율 데이터를 찾을 수 없습니다.",
      data: {
        found: Boolean(matched),
        candidateCount: candidates.length,
        target,
        item: matched ? toResponseItem(matched) : null,
      },
    });
  } catch (error) {
    console.error(
      "[student/admissions/university-comprehensive-ratios] GET error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "대학별 종합전형 비율 데이터를 불러오는 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
