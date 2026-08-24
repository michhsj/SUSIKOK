import { NextRequest, NextResponse } from "next/server";
import {
  EntitlementFeatureCode,
  EntitlementStatus,
  Prisma,
  UniversityConversionRuleStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import {
  getSupportLevelLabel,
  isSupportLevel,
  type SupportLevel,
} from "@/lib/student/support-level";
import { calculateUniversityConversionSummaryFromTestSet } from "@/lib/university-conversion/calculate-rule-summary";

type PremiumItem = {
  label: string;
  value: string;
  premium?: {
    locked: boolean;
  };
};

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
    label: "26환산70%";
    shortLabel: "26환산70%";
    raw: string | null;
    display: string;
  };
  premium?: {
    locked: boolean;
    items: PremiumItem[];
  };
  analysisMeta?: {
    convertedScoreRaw: number | null;
    supportLevelRaw: string | null;
    calculationMemo: string | null;
    calculatedAt: string | null;
    comprehensiveTotalScoreRaw?: number | null;
    academicWeightedScoreRaw?: number | null;
    careerWeightedScoreRaw?: number | null;
    communityWeightedScoreRaw?: number | null;
    academicCompetencyScoreRaw?: number | null;
    careerCompetencyScoreRaw?: number | null;
    communityCompetencyScoreRaw?: number | null;
  };
};

type SearchRow = {
  id: string;
  updatedAt: Date;
  region: string;
  universityName: string;
  admissionType: string;
  admissionName: string;
  track: string;
  collegeName: string;
  recruitmentUnit: string;
  currentHeadcountRaw: string | null;
  year26Converted70Raw: string | null;
};

type RuleTargetScope = {
  region: string;
  university: string;
  admissionType: string;
  admissionName: string;
  track: string;
  collegeName: string;
  recruitmentUnit: string;
};

type RuleCandidate = {
  id: string;
  version: number;
  updatedAt: Date;
  region: string;
  university: string;
  admissionType: string;
  admissionName: string;
  track: string;
  collegeName: string;
  recruitmentUnit: string;
  rawPayload: Prisma.JsonValue | null;
};

type StudentGradeRow = {
  schoolYear: number | null;
  semester: number | null;
  academicTermLabel: string;
  subjectGroupSnapshot: string;
  completionTypeSnapshot: string | null;
  subjectName: string;
  credits: number | null;
  rawScore: number | null;
  averageScore: number | null;
  standardDeviation: number | null;
  achievement: string | null;
  grade: number | null;
  enrolledStudentCount: number | null;
  achievementARatio: number | null;
  achievementBRatio: number | null;
  achievementCRatio: number | null;
};

type StudentAttendanceRow = {
  includeAttendance: boolean;
  absence: number | null;
  lateness: number | null;
  earlyLeave: number | null;
  outing: number | null;
  updatedAt: Date;
};

type CalculateUniversityConversionInput = Parameters<
  typeof calculateUniversityConversionSummaryFromTestSet
>[0];

type CalculateUniversityConversionPayload =
  CalculateUniversityConversionInput["payload"];

const RULE_SPECIFICITY_PRIORITY_KEYS = [
  "recruitmentUnit",
  "collegeName",
  "admissionName",
  "track",
] as const;

type ComprehensiveRatioTargetScope = {
  region: string;
  universityName: string;
  admissionType: string;
  admissionName: string;
  track: string;
  collegeName: string;
  recruitmentUnit: string;
};

type ComprehensiveRatioCandidate = {
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

type HakjongAnswerRow = {
  questionId: string;
  displayOrder: number;
  earnedScore: number;
  domainSnapshot: string;
};

type HakjongSubmissionForChart = {
  id: string;
  version: string;
  totalQuestionCount: number;
  completedAt: Date | null;
  updatedAt: Date;
  answers: HakjongAnswerRow[];
};

type UniversityComprehensiveRatioFindManyArgs = {
  where: {
    isActive: boolean;
    admissionYear?: number;
    region?: string | { in: string[] };
    universityName?: string | { in: string[] };
    admissionType?: string;
    admissionName?: string;
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
  findMany: (
    args: UniversityComprehensiveRatioFindManyArgs
  ) => Promise<ComprehensiveRatioCandidate[]>;
};

const COMPREHENSIVE_RATIO_SPECIFICITY_PRIORITY_KEYS = [
  "recruitmentUnit",
  "collegeName",
  "admissionName",
  "track",
] as const;

const DOMAIN_RAW_MAX_SCORE = 150;
const DOMAIN_CONVERTED_MAX_SCORE = 100;

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function toStringValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function toDisplayText(value: unknown, fallback = "-"): string {
  return toStringValue(value) ?? fallback;
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

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;

  const text = value.replace(/,/g, "").trim();
  if (!text) return null;

  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function toFixedScore(value: unknown, digits = 2): string | null {
  const num = toFiniteNumber(value);
  if (num == null) return null;
  return num.toFixed(digits);
}

function normalizeNullableScore(value: unknown): number | null {
  const num = toFiniteNumber(value);
  return num == null ? null : Number(num.toFixed(2));
}

function toPercentValue(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Number(value)));
}

function normalizeComprehensiveRatioValue(
  value: number | null | undefined
): number {
  if (value == null || !Number.isFinite(value)) return 0;
  return Math.max(0, Number(value));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getQuery(searchParams: URLSearchParams, key: string): string {
  return searchParams.get(key)?.trim() ?? "";
}

function normalizeSupportLevel(value: unknown): SupportLevel | null {
  if (!hasText(value)) return null;
  return isSupportLevel(value) ? value : null;
}

function getOptionalSupportLevelLabel(
  value: SupportLevel | null | undefined
): string {
  if (!value) return "-";
  return getSupportLevelLabel(value);
}

async function getOptionalCurrentUser() {
  try {
    return await getCurrentUser();
  } catch {
    return null;
  }
}

function normalizeCompareText(value: unknown): string {
  return (toStringValue(value) ?? "").replace(/\s+/g, "").toLowerCase();
}


function matchesRuleToTarget(rule: RuleCandidate, target: RuleTargetScope): boolean {
  if (normalizeCompareText(rule.region) !== normalizeCompareText(target.region)) {
    return false;
  }

  if (
    normalizeCompareText(rule.university) !==
    normalizeCompareText(target.university)
  ) {
    return false;
  }

  if (
    normalizeCompareText(rule.admissionType) !==
    normalizeCompareText(target.admissionType)
  ) {
    return false;
  }

  const optionalKeys: Array<
    keyof Pick<
      RuleTargetScope,
      "admissionName" | "track" | "collegeName" | "recruitmentUnit"
    >
  > = ["admissionName", "track", "collegeName", "recruitmentUnit"];

  for (const key of optionalKeys) {
    const ruleValue = normalizeCompareText(rule[key]);
    const targetValue = normalizeCompareText(target[key]);

    if (ruleValue && ruleValue !== targetValue) {
      return false;
    }
  }

  return true;
}

function getRuleSpecificityTuple(rule: RuleCandidate): number[] {
  return RULE_SPECIFICITY_PRIORITY_KEYS.map((key) =>
    hasText(rule[key]) ? 1 : 0,
  );
}

function compareRulesBySpecificity(a: RuleCandidate, b: RuleCandidate): number {
  const tupleA = getRuleSpecificityTuple(a);
  const tupleB = getRuleSpecificityTuple(b);

  for (let i = 0; i < tupleA.length; i += 1) {
    if (tupleA[i] !== tupleB[i]) {
      return tupleB[i] - tupleA[i];
    }
  }

  const updatedAtDiff = b.updatedAt.getTime() - a.updatedAt.getTime();
  if (updatedAtDiff !== 0) return updatedAtDiff;

  return b.version - a.version;
}

function extractCalculatedScore(summary: unknown): number | null {
  if (!summary || typeof summary !== "object") return null;

  const record = summary as Record<string, unknown>;
  const finalScoreValue = record.finalScore;
  const convertedScoreValue = record.convertedScore;
  const totalScoreValue = record.totalScore;

  const from = (value: unknown): number | null =>
    typeof value === "number"
      ? (Number.isFinite(value) ? value : null)
      : (typeof value === "string" ? toNumber(value) : null);

  return from(finalScoreValue) ?? from(convertedScoreValue) ?? from(totalScoreValue);
}

function mapStudentGradeToCalculationRow(grade: StudentGradeRow) {
  const schoolYear = grade.schoolYear ?? 0;
  const semester = grade.semester ?? 0;
  const credits = grade.credits ?? 0;
  const rawScore = grade.rawScore ?? 0;
  const averageScore = grade.averageScore ?? 0;
  const standardDeviation = grade.standardDeviation ?? 0;
  const achievement = grade.achievement ?? "";
  const rankGrade = grade.grade ?? 0;
  const enrolledStudentCount = grade.enrolledStudentCount ?? 0;
  const achievementARatio = grade.achievementARatio ?? 0;
  const achievementBRatio = grade.achievementBRatio ?? 0;
  const achievementCRatio = grade.achievementCRatio ?? 0;

  return {
    academicTerm:
      grade.academicTermLabel || `${schoolYear}학년 ${semester}학기`,
    schoolYear,
    semester,
    subjectName: grade.subjectName ?? "",
    subjectGroup: grade.subjectGroupSnapshot ?? "",
    completionType: grade.completionTypeSnapshot ?? "",
    unit: String(credits),
    credits,
    rawScore,
    score: rawScore,
    averageScore,
    standardDeviation,
    achievement,
    grade: rankGrade,
    rankGrade,
    enrolledStudentCount,
    achievementARatio,
    achievementBRatio,
    achievementCRatio,
  };
}

function mapAttendanceToCalculationInput(attendance: StudentAttendanceRow | null) {
  if (!attendance) return null;

  return {
    includeAttendance: attendance.includeAttendance,
    absence: attendance.absence != null ? String(attendance.absence) : "",
    absenceDays: attendance.absence != null ? String(attendance.absence) : "",
    lateness: attendance.lateness != null ? String(attendance.lateness) : "",
    earlyLeave: attendance.earlyLeave != null ? String(attendance.earlyLeave) : "",
    outing: attendance.outing != null ? String(attendance.outing) : "",
  };
}

function getLatestTimestamp(
  values: Array<Date | string | number | null | undefined>,
): number {
  return values.reduce<number>((max, value) => {
    if (value == null) return max;

    if (value instanceof Date) {
      const time = value.getTime();
      return Number.isFinite(time) ? Math.max(max, time) : max;
    }

    if (typeof value === "number") {
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }

    if (typeof value === "string") {
      const time = new Date(value).getTime();
      return Number.isFinite(time) ? Math.max(max, time) : max;
    }

    return max;
  }, 0);
}

function isRulePayloadObject(
  value: Prisma.JsonValue | null,
): value is Prisma.JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isComprehensiveAdmission(
  admissionType: string | null | undefined,
  admissionName: string | null | undefined
): boolean {
  const merged = `${toStringValue(admissionType) ?? ""}${
    toStringValue(admissionName) ?? ""
  }`.replace(/\s+/g, "");

  return merged.includes("종합") || merged.includes("학종");
}

function matchesComprehensiveAdmissionContext(
  candidateAdmissionType: string | null | undefined,
  candidateAdmissionName: string | null | undefined,
  targetAdmissionType: string | null | undefined,
  targetAdmissionName: string | null | undefined,
): boolean {
  const candidateAdmissionTypeText = normalizeCompareText(candidateAdmissionType);
  const targetAdmissionTypeText = normalizeCompareText(targetAdmissionType);
  const candidateAdmissionNameText = normalizeCompareText(candidateAdmissionName);
  const targetAdmissionNameText = normalizeCompareText(targetAdmissionName);

  if (!candidateAdmissionTypeText || !targetAdmissionTypeText) {
    return false;
  }

  const hasExactAdmissionTypeMatch =
    candidateAdmissionTypeText === targetAdmissionTypeText;

  if (!hasExactAdmissionTypeMatch) {
    const candidateMerged = `${candidateAdmissionTypeText}${candidateAdmissionNameText}`;
    const targetMerged = `${targetAdmissionTypeText}${targetAdmissionNameText}`;
    const bothComprehensive =
      isComprehensiveAdmission(candidateAdmissionType, candidateAdmissionName) &&
      isComprehensiveAdmission(targetAdmissionType, targetAdmissionName);

    const hasCompatibleComprehensiveText =
      bothComprehensive &&
      (
        candidateAdmissionTypeText.includes(targetAdmissionTypeText) ||
        targetAdmissionTypeText.includes(candidateAdmissionTypeText) ||
        candidateMerged.includes(targetAdmissionTypeText) ||
        targetMerged.includes(candidateAdmissionTypeText)
      );

    if (!hasCompatibleComprehensiveText) {
      return false;
    }
  }

  if (!candidateAdmissionNameText) {
    return true;
  }

  if (!targetAdmissionNameText) {
    return false;
  }

  return (
    candidateAdmissionNameText === targetAdmissionNameText ||
    candidateAdmissionNameText.includes(targetAdmissionNameText) ||
    targetAdmissionNameText.includes(candidateAdmissionNameText)
  );
}

function buildNormalizedComprehensiveRatioSet(
  ratio: ComprehensiveRatioCandidate | null
): {
  academic: number;
  career: number;
  community: number;
  rawTotal: number;
  normalizedTotal: number;
  wasNormalized: boolean;
} {
  const academic = normalizeComprehensiveRatioValue(
    ratio?.academicCompetencyRatio
  );
  const career = normalizeComprehensiveRatioValue(ratio?.careerCompetencyRatio);
  const community = normalizeComprehensiveRatioValue(
    ratio?.communityCompetencyRatio
  );

  const rawTotal = academic + career + community;

  if (rawTotal <= 0) {
    return {
      academic: 0,
      career: 0,
      community: 0,
      rawTotal: 0,
      normalizedTotal: 0,
      wasNormalized: false,
    };
  }

  if (Math.abs(rawTotal - 100) < 0.01) {
    return {
      academic: Number(academic.toFixed(2)),
      career: Number(career.toFixed(2)),
      community: Number(community.toFixed(2)),
      rawTotal,
      normalizedTotal: Number(rawTotal.toFixed(2)),
      wasNormalized: false,
    };
  }

  return {
    academic: Number(((academic / rawTotal) * 100).toFixed(2)),
    career: Number(((career / rawTotal) * 100).toFixed(2)),
    community: Number(((community / rawTotal) * 100).toFixed(2)),
    rawTotal,
    normalizedTotal: 100,
    wasNormalized: true,
  };
}

function rebalanceWeightedPercentItems<T extends { weightedPercent: number | null }>(
  items: T[]
): T[] {
  const total = items.reduce((sum, item) => {
    const value = item.weightedPercent;
    return sum + (value != null && Number.isFinite(value) ? value : 0);
  }, 0);

  if (total <= 100.000001) {
    return items;
  }

  const scale = 100 / total;
  const weightedIndexes = items
    .map((item, index) => ({ item, index }))
    .filter(
      ({ item }) =>
        item.weightedPercent != null && Number.isFinite(item.weightedPercent)
    );

  if (weightedIndexes.length === 0) {
    return items;
  }

  let accumulated = 0;

  return items.map((item, index) => {
    const value = item.weightedPercent;

    if (value == null || !Number.isFinite(value)) {
      return item;
    }

    const currentPosition = weightedIndexes.findIndex(
      (entry) => entry.index === index
    );
    const isLastWeighted = currentPosition === weightedIndexes.length - 1;

    const nextValue = isLastWeighted
      ? Number(Math.max(0, 100 - accumulated).toFixed(2))
      : Number((value * scale).toFixed(2));

    accumulated = Number((accumulated + nextValue).toFixed(2));

    return {
      ...item,
      weightedPercent: nextValue,
    };
  });
}

const COMPREHENSIVE_RATIO_OPTIONAL_KEYS = [
  "track",
  "collegeName",
  "recruitmentUnit",
] as const;

type ComprehensiveRatioOptionalKey =
  (typeof COMPREHENSIVE_RATIO_OPTIONAL_KEYS)[number];

function matchesComprehensiveRatioToTarget(
  ratio: ComprehensiveRatioCandidate,
  target: ComprehensiveRatioTargetScope,
  options?: {
    relaxRegion?: boolean;
    optionalKeys?: readonly ComprehensiveRatioOptionalKey[];
  },
): boolean {
  const relaxRegion = options?.relaxRegion ?? false;
  const optionalKeys =
    options?.optionalKeys ?? COMPREHENSIVE_RATIO_OPTIONAL_KEYS;

  if (
    !relaxRegion &&
    normalizeCompareText(ratio.region) !== normalizeCompareText(target.region)
  ) {
    return false;
  }

  if (
    normalizeCompareText(ratio.universityName) !==
    normalizeCompareText(target.universityName)
  ) {
    return false;
  }

  if (
    !matchesComprehensiveAdmissionContext(
      ratio.admissionType,
      ratio.admissionName,
      target.admissionType,
      target.admissionName,
    )
  ) {
    return false;
  }

  for (const key of optionalKeys) {
    const ratioValue = normalizeCompareText(ratio[key]);
    const targetValue = normalizeCompareText(target[key]);

    if (ratioValue && targetValue && ratioValue !== targetValue) {
      return false;
    }
  }

  return true;
}

function compareComprehensiveRatiosForTarget(
  a: ComprehensiveRatioCandidate,
  b: ComprehensiveRatioCandidate,
  target: ComprehensiveRatioTargetScope,
): number {
  const targetRegion = normalizeCompareText(target.region);
  const targetAdmissionName = normalizeCompareText(target.admissionName);

  const regionMatchA = normalizeCompareText(a.region) === targetRegion ? 1 : 0;
  const regionMatchB = normalizeCompareText(b.region) === targetRegion ? 1 : 0;

  if (regionMatchA !== regionMatchB) {
    return regionMatchB - regionMatchA;
  }

  const admissionNameExactA =
    targetAdmissionName && normalizeCompareText(a.admissionName) === targetAdmissionName
      ? 1
      : 0;
  const admissionNameExactB =
    targetAdmissionName && normalizeCompareText(b.admissionName) === targetAdmissionName
      ? 1
      : 0;

  if (admissionNameExactA !== admissionNameExactB) {
    return admissionNameExactB - admissionNameExactA;
  }

  return compareComprehensiveRatiosBySpecificity(a, b, target);
}

function getComprehensiveRatioSpecificityTuple(
  ratio: ComprehensiveRatioCandidate,
  target: ComprehensiveRatioTargetScope
): number[] {
  return COMPREHENSIVE_RATIO_SPECIFICITY_PRIORITY_KEYS.map((key) => {
    const ratioValue = normalizeCompareText(ratio[key]);
    const targetValue = normalizeCompareText(target[key]);

    return ratioValue && ratioValue === targetValue ? 1 : 0;
  });
}

function compareComprehensiveRatiosBySpecificity(
  a: ComprehensiveRatioCandidate,
  b: ComprehensiveRatioCandidate,
  target: ComprehensiveRatioTargetScope
): number {
  const tupleA = getComprehensiveRatioSpecificityTuple(a, target);
  const tupleB = getComprehensiveRatioSpecificityTuple(b, target);

  for (let i = 0; i < tupleA.length; i += 1) {
    if (tupleA[i] !== tupleB[i]) {
      return tupleB[i] - tupleA[i];
    }
  }

  const specifiedCountA = [
    toStringValue(a.recruitmentUnit),
    toStringValue(a.collegeName),
    toStringValue(a.admissionName),
    toStringValue(a.track),
  ].filter(Boolean).length;

  const specifiedCountB = [
    toStringValue(b.recruitmentUnit),
    toStringValue(b.collegeName),
    toStringValue(b.admissionName),
    toStringValue(b.track),
  ].filter(Boolean).length;

  if (specifiedCountA !== specifiedCountB) {
    return specifiedCountB - specifiedCountA;
  }

  return b.updatedAt.getTime() - a.updatedAt.getTime();
}

function pickMatchedComprehensiveRatio(
  candidates: ComprehensiveRatioCandidate[],
  target: ComprehensiveRatioTargetScope,
): ComprehensiveRatioCandidate | null {
  const targetUniversityName = normalizeCompareText(target.universityName);
  const targetAdmissionName = normalizeCompareText(target.admissionName);

  const baseMatched = candidates.filter((ratio) => {
    if (normalizeCompareText(ratio.universityName) !== targetUniversityName) {
      return false;
    }

    return matchesComprehensiveAdmissionContext(
      ratio.admissionType,
      ratio.admissionName,
      target.admissionType,
      target.admissionName,
    );
  });

  const stageConfigs: Array<{
    relaxRegion: boolean;
    admissionNameMode: "exact" | "blank" | "any";
    optionalKeys: readonly ComprehensiveRatioOptionalKey[];
  }> = [
    {
      relaxRegion: false,
      admissionNameMode: "exact",
      optionalKeys: COMPREHENSIVE_RATIO_OPTIONAL_KEYS,
    },
    {
      relaxRegion: false,
      admissionNameMode: "exact",
      optionalKeys: ["track", "collegeName"],
    },
    {
      relaxRegion: false,
      admissionNameMode: "exact",
      optionalKeys: ["track"],
    },
    {
      relaxRegion: false,
      admissionNameMode: "exact",
      optionalKeys: [],
    },
    {
      relaxRegion: false,
      admissionNameMode: "blank",
      optionalKeys: COMPREHENSIVE_RATIO_OPTIONAL_KEYS,
    },
    {
      relaxRegion: false,
      admissionNameMode: "blank",
      optionalKeys: ["track", "collegeName"],
    },
    {
      relaxRegion: false,
      admissionNameMode: "blank",
      optionalKeys: ["track"],
    },
    {
      relaxRegion: false,
      admissionNameMode: "blank",
      optionalKeys: [],
    },
    {
      relaxRegion: true,
      admissionNameMode: "exact",
      optionalKeys: COMPREHENSIVE_RATIO_OPTIONAL_KEYS,
    },
    {
      relaxRegion: true,
      admissionNameMode: "exact",
      optionalKeys: ["track", "collegeName"],
    },
    {
      relaxRegion: true,
      admissionNameMode: "exact",
      optionalKeys: ["track"],
    },
    {
      relaxRegion: true,
      admissionNameMode: "exact",
      optionalKeys: [],
    },
    {
      relaxRegion: true,
      admissionNameMode: "blank",
      optionalKeys: COMPREHENSIVE_RATIO_OPTIONAL_KEYS,
    },
    {
      relaxRegion: true,
      admissionNameMode: "blank",
      optionalKeys: ["track", "collegeName"],
    },
    {
      relaxRegion: true,
      admissionNameMode: "blank",
      optionalKeys: ["track"],
    },
    {
      relaxRegion: true,
      admissionNameMode: "blank",
      optionalKeys: [],
    },
    {
      relaxRegion: true,
      admissionNameMode: "any",
      optionalKeys: [],
    },
  ];

  for (const stage of stageConfigs) {
    const matched = baseMatched
      .filter((ratio) => {
        const candidateAdmissionName = normalizeCompareText(ratio.admissionName);

        if (stage.admissionNameMode === "exact") {
          if (!candidateAdmissionName || !targetAdmissionName) {
            return false;
          }

          if (
            candidateAdmissionName !== targetAdmissionName &&
            !candidateAdmissionName.includes(targetAdmissionName) &&
            !targetAdmissionName.includes(candidateAdmissionName)
          ) {
            return false;
          }
        }

        if (stage.admissionNameMode === "blank" && candidateAdmissionName) {
          return false;
        }

        return matchesComprehensiveRatioToTarget(ratio, target, {
          relaxRegion: stage.relaxRegion,
          optionalKeys: stage.optionalKeys,
        });
      })
      .sort((a, b) => compareComprehensiveRatiosForTarget(a, b, target));

    if (matched.length > 0) {
      return matched[0];
    }
  }

  return null;
}

function normalizeHakjongDomainKey(
  domainSnapshot: string
): "academic" | "career" | "community" | null {
  const normalized = normalizeCompareText(domainSnapshot);

  if (!normalized) return null;
  if (normalized.includes("학업역량") || normalized.includes("학업")) return "academic";
  if (normalized.includes("진로역량") || normalized.includes("진로")) return "career";
  if (normalized.includes("공동체역량") || normalized.includes("공동체")) return "community";

  return null;
}

function buildHakjongDomainStats(submission: HakjongSubmissionForChart | null) {
  const empty = {
    academic: { questionCount: 0, score: 0 },
    career: { questionCount: 0, score: 0 },
    community: { questionCount: 0, score: 0 },
    totalScore: 0,
  };

  if (!submission) return empty;

  const stats = {
    academic: { questionCount: 0, score: 0 },
    career: { questionCount: 0, score: 0 },
    community: { questionCount: 0, score: 0 },
    totalScore: 0,
  };

  for (const answer of submission.answers) {
    const key = normalizeHakjongDomainKey(answer.domainSnapshot);
    if (!key) continue;

    const earnedScore = Number.isFinite(answer.earnedScore)
      ? answer.earnedScore
      : 0;

    stats[key].questionCount += 1;
    stats[key].score += earnedScore;
    stats.totalScore += earnedScore;
  }

  return stats;
}

function convertHakjongRawDomainScoreToHundredScale(rawScore: number): number {
  if (!Number.isFinite(rawScore) || rawScore <= 0) return 0;
  return Number(
    ((rawScore / DOMAIN_RAW_MAX_SCORE) * DOMAIN_CONVERTED_MAX_SCORE).toFixed(2)
  );
}

function getComprehensiveCompetencyTotalScore(params: {
  ratio: ComprehensiveRatioCandidate | null;
  submission: HakjongSubmissionForChart | null;
  admissionType: string | null | undefined;
  admissionName: string | null | undefined;
}): number | null {
  const { ratio, submission, admissionType, admissionName } = params;

  if (!isComprehensiveAdmission(admissionType, admissionName)) {
    return null;
  }

  const stats = buildHakjongDomainStats(submission);

  const answeredQuestionCount =
    stats.academic.questionCount +
    stats.career.questionCount +
    stats.community.questionCount;

  if (!ratio || answeredQuestionCount <= 0) {
    return null;
  }

  const normalizedRatios = buildNormalizedComprehensiveRatioSet(ratio);

  const academicConvertedScore =
    stats.academic.questionCount > 0
      ? convertHakjongRawDomainScoreToHundredScale(
          Number(stats.academic.score.toFixed(2))
        )
      : null;

  const careerConvertedScore =
    stats.career.questionCount > 0
      ? convertHakjongRawDomainScoreToHundredScale(
          Number(stats.career.score.toFixed(2))
        )
      : null;

  const communityConvertedScore =
    stats.community.questionCount > 0
      ? convertHakjongRawDomainScoreToHundredScale(
          Number(stats.community.score.toFixed(2))
        )
      : null;

  const items = rebalanceWeightedPercentItems([
    {
      weightedPercent:
        academicConvertedScore != null
          ? Number(
              (
                (academicConvertedScore * normalizedRatios.academic) /
                100
              ).toFixed(2)
            )
          : null,
    },
    {
      weightedPercent:
        careerConvertedScore != null
          ? Number(
              (
                (careerConvertedScore * normalizedRatios.career) /
                100
              ).toFixed(2)
            )
          : null,
    },
    {
      weightedPercent:
        communityConvertedScore != null
          ? Number(
              (
                (communityConvertedScore * normalizedRatios.community) /
                100
              ).toFixed(2)
            )
          : null,
    },
  ]);

  const total = items.reduce((sum, item) => {
    const value = item.weightedPercent;
    return sum + (value != null && Number.isFinite(value) ? value : 0);
  }, 0);

  return Number(total.toFixed(2));
}

function stringifyError(error: unknown): string {
  if (error instanceof Error) {
    const own = Object.getOwnPropertyNames(error).reduce<Record<string, unknown>>(
      (acc, key) => {
        acc[key] = (error as unknown as Record<string, unknown>)[key];
        return acc;
      },
      {}
    );
    return `${error.name}: ${error.message} ${JSON.stringify(own)}`;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function isUniversityComprehensiveRatioTableMissingError(error: unknown): boolean {
  const text = stringifyError(error);

  return (
    text.includes("UniversityComprehensiveRatio") &&
    (text.includes("TableDoesNotExist") ||
      text.includes("P2021") ||
      text.includes("no such table") ||
      (text.includes("relation") && text.includes("does not exist")))
  );
}

function getUniversityComprehensiveRatioDelegate():
  | UniversityComprehensiveRatioDelegate
  | null {
  const candidate = (prisma as unknown as Record<string, unknown>)[
    "universityComprehensiveRatio"
  ];

  if (
    candidate &&
    typeof candidate === "object" &&
    "findMany" in candidate &&
    typeof (candidate as { findMany?: unknown }).findMany === "function"
  ) {
    return candidate as UniversityComprehensiveRatioDelegate;
  }

  return null;
}

function buildComprehensiveRatioTargetScope(
  row: SearchRow
): ComprehensiveRatioTargetScope {
  return {
    region: row.region,
    universityName: row.universityName,
    admissionType: row.admissionType,
    admissionName: row.admissionName,
    track: row.track,
    collegeName: row.collegeName,
    recruitmentUnit: row.recruitmentUnit,
  };
}

function normalizeSearchItem(
  row: SearchRow,
  options?: {
    premiumLocked?: boolean;
    convertedScoreDisplay?: string;
    supportLevelDisplay?: string;
    analysisMeta?: SearchItem["analysisMeta"];
  }
): SearchItem {
  const premiumLocked = options?.premiumLocked ?? true;
  const convertedScoreDisplay = options?.convertedScoreDisplay ?? "-";
  const supportLevelDisplay = options?.supportLevelDisplay ?? "-";

  const item: SearchItem = {
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
    premium: {
      locked: premiumLocked,
      items: [
        {
          label: "내성적",
          value: premiumLocked ? "유료" : convertedScoreDisplay,
          premium: { locked: premiumLocked },
        },
        {
          label: "지원가능성",
          value: premiumLocked ? "유료" : supportLevelDisplay,
          premium: { locked: premiumLocked },
        },
      ],
    },
  };

  if (options?.analysisMeta) {
    item.analysisMeta = options.analysisMeta;
  }

  return item;
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

    const andFilters: Prisma.AdmissionResultWhereInput[] = [
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
          { region: { contains: keyword } },
          { universityName: { contains: keyword } },
          { admissionType: { contains: keyword } },
          { admissionName: { contains: keyword } },
          { track: { contains: keyword } },
          { collegeName: { contains: keyword } },
          { recruitmentUnit: { contains: keyword } },
        ],
      });
    }

    const where: Prisma.AdmissionResultWhereInput = { AND: andFilters };

    const [totalCount, rows, user] = await Promise.all([
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
          updatedAt: true,
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
      getOptionalCurrentUser(),
    ]);

    if (!user) {
      const items = rows.map((row) =>
        normalizeSearchItem(row, {
          premiumLocked: true,
          convertedScoreDisplay: "-",
          supportLevelDisplay: "-",
        })
      );

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
    }

    const now = new Date();

    let entitlement: { id: string } | null = null;

    try {
      entitlement = await prisma.userEntitlement.findFirst({
        where: {
          userId: user.id,
          featureCode: EntitlementFeatureCode.ANALYSIS_30D,
          status: EntitlementStatus.ACTIVE,
          expiresAt: { gt: now },
        },
        orderBy: [{ expiresAt: "desc" }],
        select: {
          id: true,
        },
      });
    } catch (error) {
      console.error("[student/admissions/search] entitlement lookup error:", error);
      entitlement = null;
    }

    const premiumLocked = !entitlement;

    if (premiumLocked) {
      const items = rows.map((row) =>
        normalizeSearchItem(row, {
          premiumLocked: true,
          convertedScoreDisplay: "-",
          supportLevelDisplay: "-",
        })
      );

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
    }

    const rowIds = rows.map((row) => row.id);

    const analysisResults =
      rowIds.length > 0
        ? await prisma.studentAdmissionAnalysisResult
            .findMany({
              where: {
                userId: user.id,
                admissionResultId: { in: rowIds },
              },
              select: {
                admissionResultId: true,
                convertedScore: true,
                supportLevel: true,
                calculationMemo: true,
                calculatedAt: true,
                comprehensiveTotalScore: true,
                academicWeightedScore: true,
                careerWeightedScore: true,
                communityWeightedScore: true,
                academicCompetencyScore: true,
                careerCompetencyScore: true,
                communityCompetencyScore: true,
              },
            })
            .catch((error) => {
              console.error(
                "[student/admissions/search] analysis results lookup error:",
                error,
              );
              return [];
            })
        : [];

    const analysisMap = new Map(
      analysisResults.map((result) => [result.admissionResultId, result])
    );

    const unresolvedComprehensiveRows = rows.filter((row) => {
      if (!isComprehensiveAdmission(row.admissionType, row.admissionName)) {
        return false;
      }

      const analysis = analysisMap.get(row.id);
      return !(
        analysis?.convertedScore != null &&
        Number.isFinite(analysis.convertedScore)
      );
    });

    const nonComprehensiveRows = rows.filter(
      (row) => !isComprehensiveAdmission(row.admissionType, row.admissionName)
    );

    const ratioDelegate = getUniversityComprehensiveRatioDelegate();

    const uniqueRegions = [
      ...new Set(
        unresolvedComprehensiveRows
          .map((row) => row.region)
          .filter((value) => hasText(value))
      ),
    ];

    const uniqueUniversities = [
      ...new Set(
        unresolvedComprehensiveRows
          .map((row) => row.universityName)
          .filter((value) => hasText(value))
      ),
    ];

    const nonComprehensiveRuleScopes = Array.from(
      new Map(
        nonComprehensiveRows
          .filter(
            (row) =>
              hasText(row.region) &&
              hasText(row.universityName) &&
              hasText(row.admissionType)
          )
          .map((row) => [
            `${row.region}__${row.universityName}__${row.admissionType}`,
            {
              region: row.region,
              university: row.universityName,
              admissionType: row.admissionType,
            },
          ])
      ).values()
    );

    const [
      latestHakjongSubmission,
      comprehensiveRatioCandidates,
      lockedSubmission,
      attendance,
      ruleCandidates,
    ] = await Promise.all([
      unresolvedComprehensiveRows.length > 0
        ? prisma.hakjongFitSubmission
            .findFirst({
              where: {
                userId: user.id,
                completedAt: {
                  not: null,
                },
              },
              orderBy: [
                { completedAt: "desc" },
                { updatedAt: "desc" },
                { createdAt: "desc" },
              ],
              select: {
                id: true,
                version: true,
                totalQuestionCount: true,
                completedAt: true,
                updatedAt: true,
                answers: {
                  orderBy: [{ displayOrder: "asc" }],
                  select: {
                    questionId: true,
                    displayOrder: true,
                    earnedScore: true,
                    domainSnapshot: true,
                  },
                },
              },
            })
            .catch((error) => {
              console.error(
                "[student/admissions/search] hakjong submission lookup error:",
                error,
              );
              return null;
            })
        : Promise.resolve(null),
      unresolvedComprehensiveRows.length > 0 &&
      ratioDelegate &&
      uniqueRegions.length > 0 &&
      uniqueUniversities.length > 0
        ? (async () => {
            try {
              return await ratioDelegate.findMany({
                where: {
                  isActive: true,
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
            } catch (error) {
              if (isUniversityComprehensiveRatioTableMissingError(error)) {
                console.warn(
                  "[student/admissions/search] UniversityComprehensiveRatio table missing; continuing without ratio data."
                );
                return [];
              }

              console.error(
                "[student/admissions/search] comprehensive ratio lookup error:",
                error,
              );
              return [];
            }
          })()
        : Promise.resolve([]),
      nonComprehensiveRows.length > 0
        ? prisma.studentRecordSubmission
            .findFirst({
              where: {
                userId: user.id,
                isLocked: true,
              },
              orderBy: [
                { finalizedAt: "desc" },
                { updatedAt: "desc" },
                { createdAt: "desc" },
              ],
              select: {
                id: true,
                updatedAt: true,
                finalizedAt: true,
                inputMethod: true,
                grades: {
                  orderBy: [
                    { schoolYear: "asc" },
                    { semester: "asc" },
                    { subjectName: "asc" },
                  ],
                  select: {
                    schoolYear: true,
                    semester: true,
                    academicTermLabel: true,
                    subjectGroupSnapshot: true,
                    completionTypeSnapshot: true,
                    subjectName: true,
                    credits: true,
                    rawScore: true,
                    averageScore: true,
                    standardDeviation: true,
                    achievement: true,
                    grade: true,
                    enrolledStudentCount: true,
                    achievementARatio: true,
                    achievementBRatio: true,
                    achievementCRatio: true,
                  },
                },
              },
            })
            .catch((error) => {
              console.error(
                "[student/admissions/search] locked submission lookup error:",
                error,
              );
              return null;
            })
        : Promise.resolve(null),
      nonComprehensiveRows.length > 0
        ? prisma.studentRecordAttendance
            .findUnique({
              where: {
                userId: user.id,
              },
              select: {
                includeAttendance: true,
                absence: true,
                lateness: true,
                earlyLeave: true,
                outing: true,
                updatedAt: true,
              },
            })
            .catch((error) => {
              console.error(
                "[student/admissions/search] attendance lookup error:",
                error,
              );
              return null;
            })
        : Promise.resolve(null),
      nonComprehensiveRuleScopes.length > 0
        ? prisma.universityConversionRule
            .findMany({
              where: {
                status: UniversityConversionRuleStatus.ACTIVE,
                isActive: true,
                OR: nonComprehensiveRuleScopes,
              },
              select: {
                id: true,
                version: true,
                updatedAt: true,
                region: true,
                university: true,
                admissionType: true,
                admissionName: true,
                track: true,
                collegeName: true,
                recruitmentUnit: true,
                rawPayload: true,
              },
            })
            .catch((error) => {
              console.error(
                "[student/admissions/search] rule candidates lookup error:",
                error,
              );
              return [];
            })
        : Promise.resolve([]),
    ]);

    const items = await Promise.all(
      rows.map(async (row) => {
        try {
          let analysis = analysisMap.get(row.id) ?? null;

          const storedComprehensiveTotalScore = normalizeNullableScore(
            analysis?.comprehensiveTotalScore
          );

          const storedAcademicWeightedScore = normalizeNullableScore(
            analysis?.academicWeightedScore
          );
          const storedCareerWeightedScore = normalizeNullableScore(
            analysis?.careerWeightedScore
          );
          const storedCommunityWeightedScore = normalizeNullableScore(
            analysis?.communityWeightedScore
          );

          const storedAcademicCompetencyScore = normalizeNullableScore(
            analysis?.academicCompetencyScore
          );
          const storedCareerCompetencyScore = normalizeNullableScore(
            analysis?.careerCompetencyScore
          );
          const storedCommunityCompetencyScore = normalizeNullableScore(
            analysis?.communityCompetencyScore
          );

          let runtimeComprehensiveTotalScore: number | null = null;

          if (isComprehensiveAdmission(row.admissionType, row.admissionName)) {
            if (storedComprehensiveTotalScore == null) {
              const matchedComprehensiveRatio = pickMatchedComprehensiveRatio(
                comprehensiveRatioCandidates,
                buildComprehensiveRatioTargetScope(row)
              );

              runtimeComprehensiveTotalScore = getComprehensiveCompetencyTotalScore({
                ratio: matchedComprehensiveRatio,
                submission: latestHakjongSubmission,
                admissionType: row.admissionType,
                admissionName: row.admissionName,
              });
            }

            const finalDisplayedScore =
              storedComprehensiveTotalScore ??
              runtimeComprehensiveTotalScore ??
              normalizeNullableScore(analysis?.convertedScore);

            const convertedScoreDisplay =
              finalDisplayedScore != null ? finalDisplayedScore.toFixed(2) : "-";

            return normalizeSearchItem(row, {
              premiumLocked: false,
              convertedScoreDisplay,
              supportLevelDisplay: getOptionalSupportLevelLabel(
                normalizeSupportLevel(analysis?.supportLevel)
              ),
              analysisMeta: {
                convertedScoreRaw: finalDisplayedScore,
                supportLevelRaw:
                  typeof analysis?.supportLevel === "string"
                    ? analysis.supportLevel
                    : null,
                calculationMemo: analysis?.calculationMemo ?? null,
                calculatedAt: analysis?.calculatedAt
                  ? analysis.calculatedAt.toISOString()
                  : null,
                comprehensiveTotalScoreRaw: storedComprehensiveTotalScore,
                academicWeightedScoreRaw: storedAcademicWeightedScore,
                careerWeightedScoreRaw: storedCareerWeightedScore,
                communityWeightedScoreRaw: storedCommunityWeightedScore,
                academicCompetencyScoreRaw: storedAcademicCompetencyScore,
                careerCompetencyScoreRaw: storedCareerCompetencyScore,
                communityCompetencyScoreRaw: storedCommunityCompetencyScore,
              },
            });
          }

          const hasUsableCachedScore =
            analysis?.convertedScore != null &&
            Number.isFinite(analysis.convertedScore) &&
            analysis.convertedScore > 0;

          const targetScope: RuleTargetScope = {
            region: row.region,
            university: row.universityName,
            admissionType: row.admissionType,
            admissionName: row.admissionName,
            track: row.track,
            collegeName: row.collegeName,
            recruitmentUnit: row.recruitmentUnit,
          };

          const matchedRule =
            ruleCandidates
              .filter((rule) => matchesRuleToTarget(rule, targetScope))
              .sort((a, b) => compareRulesBySpecificity(a, b))[0] ?? null;

          const latestSourceUpdatedAt = getLatestTimestamp([
            row.updatedAt,
            lockedSubmission?.updatedAt,
            lockedSubmission?.finalizedAt,
            attendance?.updatedAt,
            matchedRule?.updatedAt,
          ]);

          const cacheFresh = Boolean(
            analysis?.calculatedAt &&
              analysis.calculatedAt.getTime() >= latestSourceUpdatedAt &&
              hasUsableCachedScore,
          );

          if (!cacheFresh && lockedSubmission && lockedSubmission.grades.length > 0) {
            let nextConvertedScore: number | null = null;
            let nextMemo = "";

            if (!matchedRule) {
              nextMemo = "RULE_NOT_FOUND";
            } else if (!isRulePayloadObject(matchedRule.rawPayload)) {
              nextMemo = "INVALID_RULE_PAYLOAD";
            } else {
              const attendanceInput = mapAttendanceToCalculationInput(attendance);
              const scoreRows = lockedSubmission.grades.map(mapStudentGradeToCalculationRow);

              const summary = calculateUniversityConversionSummaryFromTestSet({
                payload: matchedRule.rawPayload as CalculateUniversityConversionPayload,
                scoreRows,
                attendance: attendanceInput,
              });

              nextConvertedScore = extractCalculatedScore(summary);
              nextMemo = `RULE:${matchedRule.id}`;
            }

            analysis = await prisma.studentAdmissionAnalysisResult.upsert({
              where: {
                userId_admissionResultId: {
                  userId: user.id,
                  admissionResultId: row.id,
                },
              },
              update: {
                convertedScore: nextConvertedScore,
                supportLevel: null,
                calculatedAt: new Date(),
                calculationMemo: nextMemo,
              },
              create: {
                userId: user.id,
                admissionResultId: row.id,
                convertedScore: nextConvertedScore,
                supportLevel: null,
                calculatedAt: new Date(),
                calculationMemo: nextMemo,
              },
              select: {
                admissionResultId: true,
                convertedScore: true,
                supportLevel: true,
                calculationMemo: true,
                calculatedAt: true,
                comprehensiveTotalScore: true,
                academicWeightedScore: true,
                careerWeightedScore: true,
                communityWeightedScore: true,
                academicCompetencyScore: true,
                careerCompetencyScore: true,
                communityCompetencyScore: true,
              },
            });
          }

          const finalDisplayedScore = normalizeNullableScore(analysis?.convertedScore);
          const convertedScoreDisplay =
            finalDisplayedScore != null ? finalDisplayedScore.toFixed(2) : "-";

          return normalizeSearchItem(row, {
            premiumLocked: false,
            convertedScoreDisplay,
            supportLevelDisplay: getOptionalSupportLevelLabel(
              normalizeSupportLevel(analysis?.supportLevel)
            ),
            analysisMeta: {
              convertedScoreRaw: finalDisplayedScore,
              supportLevelRaw:
                typeof analysis?.supportLevel === "string"
                  ? analysis.supportLevel
                  : null,
              calculationMemo: analysis?.calculationMemo ?? null,
              calculatedAt: analysis?.calculatedAt
                ? analysis.calculatedAt.toISOString()
                : null,
              comprehensiveTotalScoreRaw: null,
              academicWeightedScoreRaw: null,
              careerWeightedScoreRaw: null,
              communityWeightedScoreRaw: null,
              academicCompetencyScoreRaw: null,
              careerCompetencyScoreRaw: null,
              communityCompetencyScoreRaw: null,
            },
          });
        } catch (error) {
          console.error("[student/admissions/search] row enrichment error:", {
            admissionResultId: row.id,
            universityName: row.universityName,
            admissionType: row.admissionType,
            admissionName: row.admissionName,
            recruitmentUnit: row.recruitmentUnit,
            error,
          });

          const fallbackAnalysis = analysisMap.get(row.id) ?? null;
          const fallbackConvertedScore = normalizeNullableScore(
            fallbackAnalysis?.comprehensiveTotalScore ?? fallbackAnalysis?.convertedScore
          );
          const fallbackConvertedScoreDisplay =
            fallbackConvertedScore != null ? fallbackConvertedScore.toFixed(2) : "-";
          const fallbackStoredAcademicWeightedScore = normalizeNullableScore(
            fallbackAnalysis?.academicWeightedScore
          );
          const fallbackStoredCareerWeightedScore = normalizeNullableScore(
            fallbackAnalysis?.careerWeightedScore
          );
          const fallbackStoredCommunityWeightedScore = normalizeNullableScore(
            fallbackAnalysis?.communityWeightedScore
          );
          const fallbackStoredAcademicCompetencyScore = normalizeNullableScore(
            fallbackAnalysis?.academicCompetencyScore
          );
          const fallbackStoredCareerCompetencyScore = normalizeNullableScore(
            fallbackAnalysis?.careerCompetencyScore
          );
          const fallbackStoredCommunityCompetencyScore = normalizeNullableScore(
            fallbackAnalysis?.communityCompetencyScore
          );
          const fallbackStoredComprehensiveTotalScore = normalizeNullableScore(
            fallbackAnalysis?.comprehensiveTotalScore
          );

          return normalizeSearchItem(row, {
            premiumLocked: false,
            convertedScoreDisplay: fallbackConvertedScoreDisplay,
            supportLevelDisplay: getOptionalSupportLevelLabel(
              normalizeSupportLevel(fallbackAnalysis?.supportLevel)
            ),
            analysisMeta: {
              convertedScoreRaw: fallbackConvertedScore,
              supportLevelRaw:
                typeof fallbackAnalysis?.supportLevel === "string"
                  ? fallbackAnalysis.supportLevel
                  : null,
              calculationMemo:
                fallbackAnalysis?.calculationMemo ?? "ROW_ENRICHMENT_ERROR",
              calculatedAt: fallbackAnalysis?.calculatedAt
                ? fallbackAnalysis.calculatedAt.toISOString()
                : null,
              comprehensiveTotalScoreRaw: fallbackStoredComprehensiveTotalScore,
              academicWeightedScoreRaw: fallbackStoredAcademicWeightedScore,
              careerWeightedScoreRaw: fallbackStoredCareerWeightedScore,
              communityWeightedScoreRaw: fallbackStoredCommunityWeightedScore,
              academicCompetencyScoreRaw: fallbackStoredAcademicCompetencyScore,
              careerCompetencyScoreRaw: fallbackStoredCareerCompetencyScore,
              communityCompetencyScoreRaw: fallbackStoredCommunityCompetencyScore,
            },
          });
        }
      })
    );

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
