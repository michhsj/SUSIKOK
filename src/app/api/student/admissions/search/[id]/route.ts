import { NextRequest, NextResponse } from "next/server";
import {
  EntitlementFeatureCode,
  EntitlementStatus,
  Prisma,
  UniversityConversionRuleStatus,
} from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getSupportLevelLabel } from "@/lib/student/support-level";
import { calculateUniversityConversionSummaryFromTestSet } from "@/lib/university-conversion/calculate-rule-summary";

type SummaryField = { label: string; value: string };

type YearTableRow = {
  year: string;
  recruitmentCount: string;
  applicantCount: string;
  competitionRate: string;
  additionalPassCount: string;
  minSatisfiedRate: string;
  minSatisfiedCount: string;
  actualCompetitionRate: string;
  score50: string;
  score70: string;
  converted50: string;
  converted70: string;
};

type ChartSeries = { name: string; data: (number | null)[] };

type ComprehensiveCompetencyChartItem = {
  key: "academic" | "career" | "community";
  label: string;
  description: string;
  universityRatioPercent: number;
  questionCount: number;
  userScore: number | null;
  userMaxScore: number | null;
  userPercent: number | null;
  weightedPercent: number | null;
};

type ComprehensiveCompetencyChartBlock = {
  title: string;
  subtitle: string;
  locked: boolean;
  items: ComprehensiveCompetencyChartItem[];
};

type DetailItem = {
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
  summaryFields: SummaryField[];
  yearTable: {
    columns: string[];
    rows: YearTableRow[];
  };
  charts: {
    competitionRate: {
      title: string;
      labels: string[];
      series: ChartSeries[];
    };
    scoreTrend: {
      title: string;
      labels: string[];
      series: ChartSeries[];
    };
    comprehensiveCompetency?: ComprehensiveCompetencyChartBlock | null;
  };
  premium: {
    locked: boolean;
    title: string;
    items: {
      label: string;
      description?: string;
      locked: boolean;
    }[];
    saveAction?: {
      label: string;
    };
  };
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

type UniversityComprehensiveRatioFindManyArgs = {
  where: {
    isActive: boolean;
    region?: string;
    universityName?: string;
    admissionType?: string;
    admissionName?: string;
    track?: string;
    collegeName?: string;
    recruitmentUnit?: string;
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
    args: UniversityComprehensiveRatioFindManyArgs,
  ) => Promise<ComprehensiveRatioCandidate[]>;
};

type StudentAttendanceRow = {
  includeAttendance: boolean;
  absence: number | null;
  lateness: number | null;
  earlyLeave: number | null;
  outing: number | null;
  updatedAt: Date;
};

type StudentAdmissionAnalysisSnapshot = {
  convertedScore: number | null;
  supportLevel: Parameters<typeof getSupportLevelLabel>[0] | null;
  calculatedAt: Date | null;
  calculationMemo: string | null;
  hakjongSubmissionId?: string | null;
  comprehensiveRatioId?: string | null;
  academicCompetencyScore?: number | null;
  careerCompetencyScore?: number | null;
  communityCompetencyScore?: number | null;
  academicCompetencyRatio?: number | null;
  careerCompetencyRatio?: number | null;
  communityCompetencyRatio?: number | null;
  academicWeightedScore?: number | null;
  careerWeightedScore?: number | null;
  communityWeightedScore?: number | null;
  comprehensiveTotalScore?: number | null;
};

type ComprehensiveRatioLike = {
  academicCompetencyRatio: number | null | undefined;
  careerCompetencyRatio: number | null | undefined;
  communityCompetencyRatio: number | null | undefined;
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

const COMPREHENSIVE_RATIO_SPECIFICITY_PRIORITY_KEYS = [
  "recruitmentUnit",
  "collegeName",
  "admissionName",
  "track",
] as const;

function toStringValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toDisplayText(value: unknown): string {
  const text = toStringValue(value);
  return text || "-";
}

function toNumber(value: string | number | null | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (!value) return null;

  const parsed = Number(
    String(value).replace(/,/g, "").replace(/[^0-9.\-]/g, "").trim(),
  );

  return Number.isFinite(parsed) ? parsed : null;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toFixedScore(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  if (!Number.isFinite(value)) return "-";
  return value.toFixed(2);
}

function toPercentValue(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Number(value)));
}

function normalizeComprehensiveRatioValue(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0;
  return Math.max(0, Number(value));
}

function buildNormalizedComprehensiveRatioSet(
  ratio: ComprehensiveRatioLike | null,
): {
  academic: number;
  career: number;
  community: number;
  rawTotal: number;
  normalizedTotal: number;
  wasNormalized: boolean;
} {
  const academic = normalizeComprehensiveRatioValue(ratio?.academicCompetencyRatio);
  const career = normalizeComprehensiveRatioValue(ratio?.careerCompetencyRatio);
  const community = normalizeComprehensiveRatioValue(ratio?.communityCompetencyRatio);

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

function rebalanceWeightedPercentItems<T extends { weightedPercent: number | null }>(items: T[]): T[] {
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
    .filter(({ item }) => item.weightedPercent != null && Number.isFinite(item.weightedPercent));

  if (weightedIndexes.length === 0) {
    return items;
  }

  let accumulated = 0;

  return items.map((item, index) => {
    const value = item.weightedPercent;

    if (value == null || !Number.isFinite(value)) {
      return item;
    }

    const currentPosition = weightedIndexes.findIndex((entry) => entry.index === index);
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

function extractCalculatedScore(summary: unknown): number | null {
  if (!summary || typeof summary !== "object") return null;

  const record = summary as Record<string, unknown>;
  const finalScoreValue = record.finalScore;
  const convertedScoreValue = record.convertedScore;
  const totalScoreValue = record.totalScore;

  return (
    toFiniteNumber(finalScoreValue) ??
    toNumber(
      typeof finalScoreValue === "string" || typeof finalScoreValue === "number"
        ? finalScoreValue
        : null,
    ) ??
    toFiniteNumber(convertedScoreValue) ??
    toNumber(
      typeof convertedScoreValue === "string" ||
        typeof convertedScoreValue === "number"
        ? convertedScoreValue
        : null,
    ) ??
    toFiniteNumber(totalScoreValue) ??
    toNumber(
      typeof totalScoreValue === "string" || typeof totalScoreValue === "number"
        ? totalScoreValue
        : null,
    )
  );
}

function buildSummaryFields(row: {
  admissionMethod: string | null;
  studentRecordReflection: string | null;
  minimumAcademicRequirement: string | null;
  applicationPeriod: string | null;
  firstRoundAnnouncement: string | null;
  interviewOrEssayDate: string | null;
  finalAnnouncement: string | null;
  admissionSpecialNotes: string | null;
}): SummaryField[] {
  return [
    { label: "전형방법", value: toDisplayText(row.admissionMethod) },
    { label: "학생부반영", value: toDisplayText(row.studentRecordReflection) },
    { label: "최저학력기준", value: toDisplayText(row.minimumAcademicRequirement) },
    { label: "원서접수", value: toDisplayText(row.applicationPeriod) },
    { label: "1차합격", value: toDisplayText(row.firstRoundAnnouncement) },
    { label: "논술/면접", value: toDisplayText(row.interviewOrEssayDate) },
    { label: "최종합격", value: toDisplayText(row.finalAnnouncement) },
    { label: "전형특기사항", value: toDisplayText(row.admissionSpecialNotes) },
  ];
}

function buildYearTableRows(row: {
  year26RecruitmentCountRaw: string | null;
  year26ApplicantCountRaw: string | null;
  year26CompetitionRateRaw: string | null;
  year26AdditionalPassCountRaw: string | null;
  year26MinSatisfiedRateRaw: string | null;
  year26MinSatisfiedCountRaw: string | null;
  year26ActualCompetitionRateRaw: string | null;
  year26Score50Raw: string | null;
  year26Score70Raw: string | null;
  year26Converted50Raw: string | null;
  year26Converted70Raw: string | null;
  year25RecruitmentCountRaw: string | null;
  year25ApplicantCountRaw: string | null;
  year25CompetitionRateRaw: string | null;
  year25AdditionalPassCountRaw: string | null;
  year25MinSatisfiedRateRaw: string | null;
  year25MinSatisfiedCountRaw: string | null;
  year25ActualCompetitionRateRaw: string | null;
  year25Score50Raw: string | null;
  year25Score70Raw: string | null;
  year25Converted50Raw: string | null;
  year25Converted70Raw: string | null;
  year24RecruitmentCountRaw: string | null;
  year24ApplicantCountRaw: string | null;
  year24CompetitionRateRaw: string | null;
  year24AdditionalPassCountRaw: string | null;
  year24MinSatisfiedRateRaw: string | null;
  year24MinSatisfiedCountRaw: string | null;
  year24ActualCompetitionRateRaw: string | null;
  year24Score50Raw: string | null;
  year24Score70Raw: string | null;
  year24Converted50Raw: string | null;
  year24Converted70Raw: string | null;
}): YearTableRow[] {
  return [
    {
      year: "2026",
      recruitmentCount: toDisplayText(row.year26RecruitmentCountRaw),
      applicantCount: toDisplayText(row.year26ApplicantCountRaw),
      competitionRate: toDisplayText(row.year26CompetitionRateRaw),
      additionalPassCount: toDisplayText(row.year26AdditionalPassCountRaw),
      minSatisfiedRate: toDisplayText(row.year26MinSatisfiedRateRaw),
      minSatisfiedCount: toDisplayText(row.year26MinSatisfiedCountRaw),
      actualCompetitionRate: toDisplayText(row.year26ActualCompetitionRateRaw),
      score50: toDisplayText(row.year26Score50Raw),
      score70: toDisplayText(row.year26Score70Raw),
      converted50: toDisplayText(row.year26Converted50Raw),
      converted70: toDisplayText(row.year26Converted70Raw),
    },
    {
      year: "2025",
      recruitmentCount: toDisplayText(row.year25RecruitmentCountRaw),
      applicantCount: toDisplayText(row.year25ApplicantCountRaw),
      competitionRate: toDisplayText(row.year25CompetitionRateRaw),
      additionalPassCount: toDisplayText(row.year25AdditionalPassCountRaw),
      minSatisfiedRate: toDisplayText(row.year25MinSatisfiedRateRaw),
      minSatisfiedCount: toDisplayText(row.year25MinSatisfiedCountRaw),
      actualCompetitionRate: toDisplayText(row.year25ActualCompetitionRateRaw),
      score50: toDisplayText(row.year25Score50Raw),
      score70: toDisplayText(row.year25Score70Raw),
      converted50: toDisplayText(row.year25Converted50Raw),
      converted70: toDisplayText(row.year25Converted70Raw),
    },
    {
      year: "2024",
      recruitmentCount: toDisplayText(row.year24RecruitmentCountRaw),
      applicantCount: toDisplayText(row.year24ApplicantCountRaw),
      competitionRate: toDisplayText(row.year24CompetitionRateRaw),
      additionalPassCount: toDisplayText(row.year24AdditionalPassCountRaw),
      minSatisfiedRate: toDisplayText(row.year24MinSatisfiedRateRaw),
      minSatisfiedCount: toDisplayText(row.year24MinSatisfiedCountRaw),
      actualCompetitionRate: toDisplayText(row.year24ActualCompetitionRateRaw),
      score50: toDisplayText(row.year24Score50Raw),
      score70: toDisplayText(row.year24Score70Raw),
      converted50: toDisplayText(row.year24Converted50Raw),
      converted70: toDisplayText(row.year24Converted70Raw),
    },
  ];
}

function buildBaseCharts(
  yearRows: YearTableRow[],
  currentHeadcountRaw: string | null,
): DetailItem["charts"] {
  const graphRows = [...yearRows].sort((a, b) => Number(a.year) - Number(b.year));

  return {
    competitionRate: {
      title: "경쟁률 추이",
      labels: ["2024", "2025", "2026", "2027"],
      series: [
        {
          name: "모집인원",
          data: [
            toNumber(graphRows[0]?.recruitmentCount),
            toNumber(graphRows[1]?.recruitmentCount),
            toNumber(graphRows[2]?.recruitmentCount),
            toNumber(currentHeadcountRaw),
          ],
        },
        {
          name: "경쟁률",
          data: [
            toNumber(graphRows[0]?.competitionRate),
            toNumber(graphRows[1]?.competitionRate),
            toNumber(graphRows[2]?.competitionRate),
            null,
          ],
        },
      ],
    },
    scoreTrend: {
      title: "점수 추이",
      labels: graphRows.map((r) => r.year),
      series: [
        {
          name: "성적70%",
          data: graphRows.map((r) => toNumber(r.score70)),
        },
        {
          name: "환산70%",
          data: graphRows.map((r) => toNumber(r.converted70)),
        },
      ],
    },
    comprehensiveCompetency: null,
  };
}

function hasText(value: unknown): boolean {
  return toStringValue(value).length > 0;
}

function normalizeCompareText(value: unknown): string {
  return toStringValue(value).replace(/\s+/g, "").toLowerCase();
}

function isComprehensiveAdmission(
  admissionType: string | null | undefined,
  admissionName: string | null | undefined,
): boolean {
  const merged = `${toStringValue(admissionType)} ${toStringValue(admissionName)}`.replace(
    /\s+/g,
    "",
  );

  return merged.includes("종합") || merged.includes("학종");
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
  target: ComprehensiveRatioTargetScope,
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
  target: ComprehensiveRatioTargetScope,
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
  domainSnapshot: string,
): ComprehensiveCompetencyChartItem["key"] | null {
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

    const earnedScore = Number.isFinite(answer.earnedScore) ? answer.earnedScore : 0;

    stats[key].questionCount += 1;
    stats[key].score += earnedScore;
    stats.totalScore += earnedScore;
  }

  return stats;
}

function hasStoredComprehensiveBreakdown(
  analysis: StudentAdmissionAnalysisSnapshot | null | undefined,
): boolean {
  if (!analysis) return false;

  return [
    analysis.academicCompetencyScore,
    analysis.careerCompetencyScore,
    analysis.communityCompetencyScore,
    analysis.academicWeightedScore,
    analysis.careerWeightedScore,
    analysis.communityWeightedScore,
    analysis.comprehensiveTotalScore,
  ].some((value) => value != null && Number.isFinite(value));
}

function buildComprehensiveCompetencyChart(params: {
  ratio: ComprehensiveRatioCandidate | null;
  submission: HakjongSubmissionForChart | null;
  premiumLocked: boolean;
  admissionType: string | null;
  admissionName: string | null;
  storedAnalysis?: StudentAdmissionAnalysisSnapshot | null;
}): ComprehensiveCompetencyChartBlock | null {
  const {
    ratio,
    submission,
    premiumLocked,
    admissionType,
    admissionName,
    storedAnalysis = null,
  } = params;

  if (!isComprehensiveAdmission(admissionType, admissionName)) {
    return null;
  }

  const stats = buildHakjongDomainStats(submission);

  const answeredQuestionCount =
    stats.academic.questionCount +
    stats.career.questionCount +
    stats.community.questionCount;

  const hasSubmissionScore = answeredQuestionCount > 0;
  const hasRatio = Boolean(ratio);

  const storedRatioSource: ComprehensiveRatioLike | null = storedAnalysis
    ? {
        academicCompetencyRatio: storedAnalysis.academicCompetencyRatio,
        careerCompetencyRatio: storedAnalysis.careerCompetencyRatio,
        communityCompetencyRatio: storedAnalysis.communityCompetencyRatio,
      }
    : null;

  const storedRatios = buildNormalizedComprehensiveRatioSet(storedRatioSource);
  const liveRatios = buildNormalizedComprehensiveRatioSet(ratio);
  const normalizedRatios = storedRatios.rawTotal > 0 ? storedRatios : liveRatios;

  const hasStoredBreakdown = hasStoredComprehensiveBreakdown(storedAnalysis);

  if (!hasRatio && !hasSubmissionScore && !hasStoredBreakdown) {
    return null;
  }

  function createItem(
    key: "academic" | "career" | "community",
    label: string,
    description: string | null,
    fallbackUniversityRatioPercent: number,
  ): ComprehensiveCompetencyChartItem {
    const domain = stats[key];
    const storedScoreMap = {
      academic: storedAnalysis?.academicCompetencyScore,
      career: storedAnalysis?.careerCompetencyScore,
      community: storedAnalysis?.communityCompetencyScore,
    } as const;
    const storedWeightedMap = {
      academic: storedAnalysis?.academicWeightedScore,
      career: storedAnalysis?.careerWeightedScore,
      community: storedAnalysis?.communityWeightedScore,
    } as const;
    const storedRatioMap = {
      academic: normalizedRatios.academic,
      career: normalizedRatios.career,
      community: normalizedRatios.community,
    } as const;

    const storedScore = toNumber(storedScoreMap[key]);
    const fallbackScore =
      hasSubmissionScore && domain.questionCount > 0
        ? Number(((domain.score * 2) / 3).toFixed(2))
        : null;
    const userPercent = storedScore ?? fallbackScore;

    const storedWeighted = toNumber(storedWeightedMap[key]);
    const universityRatioPercent =
      storedRatioMap[key] > 0 ? storedRatioMap[key] : fallbackUniversityRatioPercent;
    const weightedPercent =
      storedWeighted ??
      (userPercent != null
        ? Number(((userPercent * universityRatioPercent) / 100).toFixed(2))
        : null);

    return {
      key,
      label,
      description: toStringValue(description),
      universityRatioPercent: toPercentValue(universityRatioPercent),
      questionCount: domain.questionCount,
      userScore: userPercent != null ? Number(userPercent.toFixed(2)) : null,
      userMaxScore: null,
      userPercent: userPercent != null ? Number(userPercent.toFixed(2)) : null,
      weightedPercent:
        weightedPercent != null ? Number(weightedPercent.toFixed(2)) : null,
    };
  }

  const rebalancedItems = rebalanceWeightedPercentItems([
    createItem(
      "academic",
      "학업역량",
      ratio?.academicCompetencyDescription ?? null,
      liveRatios.academic,
    ),
    createItem(
      "career",
      "진로역량",
      ratio?.careerCompetencyDescription ?? null,
      liveRatios.career,
    ),
    createItem(
      "community",
      "공동체역량",
      ratio?.communityCompetencyDescription ?? null,
      liveRatios.community,
    ),
  ]);

  const subtitle = premiumLocked
    ? "결제 후 학종 적합성 결과와 대학별 반영 비율을 함께 확인할 수 있습니다."
    : hasStoredBreakdown
      ? `저장된 학종 적합성 결과와 모집단위별 대학 반영 비율을 불러왔습니다.${storedAnalysis?.calculatedAt ? ` 계산 시각: ${storedAnalysis.calculatedAt.toISOString()}` : ""}`
      : hasRatio && hasSubmissionScore
        ? normalizedRatios.wasNormalized
          ? `학종 적합성 최신 완료 제출(${submission?.version ?? "-"})의 영역별 점수와 모집단위별 대학 반영 비율을 계산했습니다. 비율 합계가 ${normalizedRatios.rawTotal.toFixed(2)}여서 100 기준으로 정규화했습니다.`
          : `학종 적합성 최신 완료 제출(${submission?.version ?? "-"})의 영역별 점수와 모집단위별 대학 반영 비율을 함께 계산했습니다.`
        : hasRatio && !hasSubmissionScore
          ? normalizedRatios.wasNormalized
            ? `학종 적합성 완료 제출이 없어 모집단위별 대학 역량 반영 비율만 표시합니다. 비율 합계가 ${normalizedRatios.rawTotal.toFixed(2)}여서 100 기준으로 정규화했습니다.`
            : "학종 적합성 완료 제출이 없어 모집단위별 대학 역량 반영 비율만 표시합니다."
          : hasSubmissionScore
            ? `대학별 역량 반영 비율 데이터가 없어 학종 적합성 최신 완료 제출(${submission?.version ?? "-"})의 영역별 점수만 표시합니다.`
            : "학종 역량 데이터를 표시합니다.";

  return {
    title: "대학별 종합전형 비율",
    subtitle,
    locked: premiumLocked,
    items: rebalancedItems,
  };
}

function buildComprehensiveScoreTrendChart(
  chart: ComprehensiveCompetencyChartBlock,
): {
  title: string;
  labels: string[];
  series: ChartSeries[];
} {
  return {
    title: "학종 적합성 반영 그래프",
    labels: chart.items.map((item) => item.label),
    series: [
      {
        name: "대학별 반영 비율",
        data: chart.items.map((item) => toPercentValue(item.universityRatioPercent)),
      },
      {
        name: "학종 적합성 검사",
        data: chart.items.map((item) =>
          item.userPercent != null ? Number(item.userPercent.toFixed(2)) : null,
        ),
      },
      {
        name: "반영 결과",
        data: chart.items.map((item) =>
          item.weightedPercent != null ? Number(item.weightedPercent.toFixed(2)) : null,
        ),
      },
    ],
  };
}

function getComprehensiveCompetencyTotalScore(
  chart: ComprehensiveCompetencyChartBlock | null | undefined,
  storedAnalysis?: StudentAdmissionAnalysisSnapshot | null,
): number | null {
  const storedTotal = toNumber(storedAnalysis?.comprehensiveTotalScore);
  if (storedTotal != null) {
    return Number(storedTotal.toFixed(2));
  }

  if (!chart || chart.locked) return null;

  const total = chart.items.reduce((sum, item) => {
    const value = item.weightedPercent;
    return sum + (value != null && Number.isFinite(value) ? value : 0);
  }, 0);

  return Number(total.toFixed(2));
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

function getUniversityComprehensiveRatioDelegate(): UniversityComprehensiveRatioDelegate | null {
  const candidate = (db as unknown as Record<string, unknown>)["universityComprehensiveRatio"];
  if (!candidate || typeof candidate !== "object") return null;
  const delegate = candidate as Partial<UniversityComprehensiveRatioDelegate>;
  if (typeof delegate.findMany !== "function") return null;
  return delegate as UniversityComprehensiveRatioDelegate;
}

function stringifyError(error: unknown): string {
  if (error instanceof Error) {
    const own = Object.getOwnPropertyNames(error).reduce<Record<string, unknown>>(
      (acc, key) => {
        acc[key] = (error as unknown as Record<string, unknown>)[key];
        return acc;
      },
      {},
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

async function getOptionalCurrentUser() {
  try {
    return await getCurrentUser();
  } catch (error) {
    console.error("[student/admissions/search/[id]] getCurrentUser failed:", error);
    return null;
  }
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "id가 없습니다." },
        { status: 400 },
      );
    }

    const row = await db.admissionResult.findFirst({
      where: { id, isActive: true },
      select: {
        id: true,
        admissionYear: true,
        updatedAt: true,
        region: true,
        universityName: true,
        admissionType: true,
        admissionName: true,
        track: true,
        collegeName: true,
        recruitmentUnit: true,
        admissionMethod: true,
        studentRecordReflection: true,
        admissionSpecialNotes: true,
        minimumAcademicRequirement: true,
        applicationPeriod: true,
        firstRoundAnnouncement: true,
        interviewOrEssayDate: true,
        finalAnnouncement: true,
        currentHeadcountRaw: true,
        year26RecruitmentCountRaw: true,
        year26ApplicantCountRaw: true,
        year26CompetitionRateRaw: true,
        year26AdditionalPassCountRaw: true,
        year26MinSatisfiedRateRaw: true,
        year26MinSatisfiedCountRaw: true,
        year26ActualCompetitionRateRaw: true,
        year26Score50Raw: true,
        year26Score70Raw: true,
        year26Converted50Raw: true,
        year26Converted70Raw: true,
        year25RecruitmentCountRaw: true,
        year25ApplicantCountRaw: true,
        year25CompetitionRateRaw: true,
        year25AdditionalPassCountRaw: true,
        year25MinSatisfiedRateRaw: true,
        year25MinSatisfiedCountRaw: true,
        year25ActualCompetitionRateRaw: true,
        year25Score50Raw: true,
        year25Score70Raw: true,
        year25Converted50Raw: true,
        year25Converted70Raw: true,
        year24RecruitmentCountRaw: true,
        year24ApplicantCountRaw: true,
        year24CompetitionRateRaw: true,
        year24AdditionalPassCountRaw: true,
        year24MinSatisfiedRateRaw: true,
        year24MinSatisfiedCountRaw: true,
        year24ActualCompetitionRateRaw: true,
        year24Score50Raw: true,
        year24Score70Raw: true,
        year24Converted50Raw: true,
        year24Converted70Raw: true,
      },
    });

    if (!row) {
      return NextResponse.json(
        { success: false, message: "데이터를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const region = toStringValue(row.region);
    const universityName = toStringValue(row.universityName);
    const admissionType = toStringValue(row.admissionType);
    const admissionName = toStringValue(row.admissionName);
    const track = toStringValue(row.track);
    const collegeName = toStringValue(row.collegeName);
    const recruitmentUnit = toStringValue(row.recruitmentUnit);

    const universityComprehensiveRatioDelegate =
      getUniversityComprehensiveRatioDelegate();

    let comprehensiveRatioCandidates: ComprehensiveRatioCandidate[] = [];

    if (
      isComprehensiveAdmission(admissionType, admissionName) &&
      universityComprehensiveRatioDelegate
    ) {
      try {
        comprehensiveRatioCandidates =
          await universityComprehensiveRatioDelegate
            .findMany({
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
            })
            .then((rows) =>
              rows.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
            );
      } catch (error) {
        if (isUniversityComprehensiveRatioTableMissingError(error)) {
          console.warn(
            "[student/admissions/search/[id]] UniversityComprehensiveRatio table missing; continuing without ratio data.",
          );
          comprehensiveRatioCandidates = [];
        } else {
          throw error;
        }
      }
    }

    const comprehensiveRatioTarget: ComprehensiveRatioTargetScope = {
      region,
      universityName,
      admissionType,
      admissionName,
      track,
      collegeName,
      recruitmentUnit,
    };

    const matchedComprehensiveRatio: ComprehensiveRatioCandidate | null =
      pickMatchedComprehensiveRatio(
        comprehensiveRatioCandidates,
        comprehensiveRatioTarget,
      );

    console.log("[admissions detail] comprehensive target", {
      region,
      universityName,
      admissionType,
      admissionName,
      track,
      collegeName,
      recruitmentUnit,
    });

    console.log(
      "[admissions detail] comprehensive ratio candidates",
      comprehensiveRatioCandidates.map((ratio) => ({
        id: ratio.id,
        region: ratio.region,
        universityName: ratio.universityName,
        admissionType: ratio.admissionType,
        admissionName: ratio.admissionName,
        track: ratio.track,
        collegeName: ratio.collegeName,
        recruitmentUnit: ratio.recruitmentUnit,
        academicCompetencyRatio: ratio.academicCompetencyRatio,
        careerCompetencyRatio: ratio.careerCompetencyRatio,
        communityCompetencyRatio: ratio.communityCompetencyRatio,
      })),
    );

    console.log(
      "[admissions detail] matched comprehensive ratio",
      matchedComprehensiveRatio,
    );

    const user = await getOptionalCurrentUser();

    let premiumLocked = true;
    let convertedScoreDisplay = "결제 후 이용 가능";
    let supportLevelDisplay = "결제 후 이용 가능";
    let saved = false;
    let latestHakjongSubmission: HakjongSubmissionForChart | null = null;
    let effectiveAnalysis: StudentAdmissionAnalysisSnapshot | null = null;

    if (user) {
      const currentUser = user;

      try {
        if (isComprehensiveAdmission(admissionType, admissionName)) {
          try {
            latestHakjongSubmission = await db.hakjongFitSubmission.findFirst({
              where: {
                userId: currentUser.id,
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
            });
          } catch (error) {
            console.error(
              "[student/admissions/search/[id]] hakjong submission lookup error:",
              error,
            );
          }
        }

        let entitlement: { id: string } | null = null;

        try {
          entitlement = await db.userEntitlement.findFirst({
            where: {
              userId: currentUser.id,
              featureCode: EntitlementFeatureCode.ANALYSIS_30D,
              status: EntitlementStatus.ACTIVE,
              expiresAt: {
                gt: new Date(),
              },
            },
            select: {
              id: true,
            },
          });
        } catch (error) {
          console.error(
            "[student/admissions/search/[id]] entitlement lookup error:",
            error,
          );
        }

        premiumLocked = !entitlement;

        if (entitlement) {
          convertedScoreDisplay = "-";
          supportLevelDisplay = "-";

          try {
            const [cachedAnalysis, savedItem] = await Promise.all([
db.studentAdmissionAnalysisResult.findUnique({
  where: {
    userId_admissionResultId: {
      userId: currentUser.id,
      admissionResultId: row.id,
    },
  },
  select: {
    convertedScore: true,
    supportLevel: true,
    calculatedAt: true,
    calculationMemo: true,
  },
}),
              db.studentSavedRecruitmentUnit.findUnique({
                where: {
                  userId_admissionResultId: {
                    userId: currentUser.id,
                    admissionResultId: row.id,
                  },
                },
                select: {
                  id: true,
                },
              }),
            ]);

            saved = Boolean(savedItem);
            effectiveAnalysis = cachedAnalysis;

            convertedScoreDisplay =
              isComprehensiveAdmission(admissionType, admissionName) &&
              toNumber(effectiveAnalysis?.comprehensiveTotalScore) != null
                ? toFixedScore(toNumber(effectiveAnalysis?.comprehensiveTotalScore))
                : toFixedScore(effectiveAnalysis?.convertedScore);

            supportLevelDisplay = effectiveAnalysis?.supportLevel
              ? getSupportLevelLabel(effectiveAnalysis.supportLevel)
              : "-";
          } catch (error) {
            console.error(
              "[student/admissions/search/[id]] premium enrichment error:",
              error,
            );
          }
        }
      } catch (error) {
        console.error(
          "[student/admissions/search/[id]] premium block fatal error:",
          error,
        );
      }
    }

    const yearRows = buildYearTableRows(row);
    const baseCharts = buildBaseCharts(yearRows, row.currentHeadcountRaw);
    const comprehensiveCompetencyChart = buildComprehensiveCompetencyChart({
      ratio: matchedComprehensiveRatio,
      submission: latestHakjongSubmission,
      premiumLocked,
      admissionType,
      admissionName,
      storedAnalysis: effectiveAnalysis,
    });
    console.log("[admissions detail] comprehensive chart", comprehensiveCompetencyChart);

    const scoreTrendChart =
      isComprehensiveAdmission(admissionType, admissionName) &&
      comprehensiveCompetencyChart
        ? buildComprehensiveScoreTrendChart(comprehensiveCompetencyChart)
        : baseCharts.scoreTrend;
    const comprehensiveTotalScore = getComprehensiveCompetencyTotalScore(
      comprehensiveCompetencyChart,
      effectiveAnalysis,
    );
    const scoreDisplayValue =
      !premiumLocked && comprehensiveTotalScore != null
        ? comprehensiveTotalScore.toFixed(2)
        : convertedScoreDisplay;

    const item: DetailItem = {
      id: row.id,
      identity: {
        region: toDisplayText(region),
        universityName: toDisplayText(universityName),
        admissionType: toDisplayText(admissionType),
        admissionName: toDisplayText(admissionName),
        track: toDisplayText(track),
        collegeName: toDisplayText(collegeName),
        recruitmentUnit: toDisplayText(recruitmentUnit),
      },
      recruitmentCount2027: {
        label: "2027학년도 모집인원",
        shortLabel: "27인원",
        raw: row.currentHeadcountRaw,
        display: toDisplayText(row.currentHeadcountRaw),
      },
      summaryFields: buildSummaryFields(row),
      yearTable: {
        columns: [
          "학년도",
          "모집인원",
          "지원인원",
          "경쟁률",
          "추가합격",
          "최저충족률",
          "최저충족인원",
          "실질경쟁률",
          "50컷",
          "70컷",
          "환산50%",
          "환산70%",
        ],
        rows: yearRows,
      },
      charts: {
        competitionRate: baseCharts.competitionRate,
        scoreTrend: scoreTrendChart,
        comprehensiveCompetency: comprehensiveCompetencyChart,
      },
      premium: {
        locked: premiumLocked,
        title: "유료 서비스",
        items: [
          {
            label: "내성적",
            description: premiumLocked ? "결제 후 이용 가능" : scoreDisplayValue,
            locked: premiumLocked,
          },
          {
            label: "지원가능성",
            description: premiumLocked ? "결제 후 이용 가능" : supportLevelDisplay,
            locked: premiumLocked,
          },
          {
            label: saved ? "저장됨" : "저장",
            description: premiumLocked
              ? "결제 후 이용 가능"
              : saved
                ? "내 입시 전략에 저장됨"
                : "클릭하여 저장",
            locked: premiumLocked,
          },
        ],
        saveAction: {
          label: saved ? "저장됨" : "저장",
        },
      },
    };

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error("[student/admissions/search/[id]] GET error:", error);
    return NextResponse.json(
      { success: false, message: "입결 상세 데이터를 불러오는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
