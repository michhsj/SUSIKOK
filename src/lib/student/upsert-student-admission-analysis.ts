import { Prisma, UniversityConversionRuleStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { calculateUniversityConversionSummaryFromTestSet } from "@/lib/university-conversion/calculate-rule-summary";

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
} | null;

type CalculateUniversityConversionInput = Parameters<
  typeof calculateUniversityConversionSummaryFromTestSet
>[0];

type CalculateUniversityConversionPayload =
  CalculateUniversityConversionInput["payload"];

type ActiveAdmissionRow = {
  id: string;
  admissionYear: number;
  updatedAt: Date;
  region: string;
  universityName: string;
  admissionType: string;
  admissionName: string;
  track: string;
  collegeName: string;
  recruitmentUnit: string;
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

type ComprehensiveRatioLike = {
  academicCompetencyRatio: number | null | undefined;
  careerCompetencyRatio: number | null | undefined;
  communityCompetencyRatio: number | null | undefined;
};

type UniversityComprehensiveRatioFindManyArgs = {
  where: {
    isActive: boolean;
    admissionYear?: number;
    region?: string | { in: string[] };
    universityName?: string | { in: string[] };
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
    args: UniversityComprehensiveRatioFindManyArgs
  ) => Promise<ComprehensiveRatioCandidate[]>;
};

export type UpsertStudentAdmissionAnalysisOptions = {
  admissionYear?: number;
  onlyAdmissionResultIds?: string[];
};

export type UpsertStudentAdmissionAnalysisSummary = {
  userId: string;
  processedCount: number;
  updatedCount: number;
  noLockedRecordCount: number;
  noRuleCount: number;
  invalidPayloadCount: number;
  zeroOrEmptyScoreCount: number;
  errorCount: number;
};

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
  if (value == null) return "";
  return String(value).trim();
}

function hasText(value: unknown): boolean {
  return toStringValue(value).length > 0;
}

function normalizeCompareText(value: unknown): string {
  return toStringValue(value).replace(/\s+/g, "").toLowerCase();
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

function isRulePayloadObject(
  value: Prisma.JsonValue | null,
): value is Prisma.JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
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

function normalizeHakjongDomainKey(
  domainSnapshot: string,
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

    const earnedScore = Number.isFinite(answer.earnedScore) ? answer.earnedScore : 0;

    stats[key].questionCount += 1;
    stats[key].score += earnedScore;
    stats.totalScore += earnedScore;
  }

  return stats;
}

function mapStudentGradeToCalculationRow(grade: StudentGradeRow) {
  return {
    academicTermLabel: grade.academicTermLabel || null,
    subjectGroupSnapshot: grade.subjectGroupSnapshot || null,
    completionTypeSnapshot: grade.completionTypeSnapshot || null,
    subjectName: grade.subjectName || null,
    credits: grade.credits ?? null,
    rawScore: grade.rawScore ?? null,
    averageScore: grade.averageScore ?? null,
    standardDeviation: grade.standardDeviation ?? null,
    achievement: grade.achievement ?? null,
    grade: grade.grade ?? null,
    schoolYear: grade.schoolYear ?? null,
    semester: grade.semester ?? null,
  };
}

function mapAttendanceToCalculationInput(attendance: StudentAttendanceRow) {
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

function getUniversityComprehensiveRatioDelegate(): UniversityComprehensiveRatioDelegate | null {
  const candidate = (db as unknown as Record<string, unknown>)["universityComprehensiveRatio"];
  if (!candidate || typeof candidate !== "object") return null;
  const delegate = candidate as Partial<UniversityComprehensiveRatioDelegate>;
  if (typeof delegate.findMany !== "function") return null;
  return delegate as UniversityComprehensiveRatioDelegate;
}

export async function upsertStudentAdmissionAnalysisForUser(
  userId: string,
  options: UpsertStudentAdmissionAnalysisOptions = {},
): Promise<UpsertStudentAdmissionAnalysisSummary> {
  const { admissionYear, onlyAdmissionResultIds } = options;

  const [
    lockedSubmission,
    attendance,
    latestHakjongSubmission,
    admissionRows,
    ruleCandidates,
  ] = await Promise.all([
    db.studentRecordSubmission.findFirst({
      where: {
        userId,
        isLocked: true,
      },
      orderBy: [
        { finalizedAt: "desc" },
        { updatedAt: "desc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
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
    }),
    db.studentRecordAttendance.findUnique({
      where: {
        userId,
      },
      select: {
        includeAttendance: true,
        absence: true,
        lateness: true,
        earlyLeave: true,
        outing: true,
        updatedAt: true,
      },
    }),
    db.hakjongFitSubmission.findFirst({
      where: {
        userId,
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
    }),
    db.admissionResult.findMany({
      where: {
        isActive: true,
        ...(typeof admissionYear === "number" ? { admissionYear } : {}),
        ...(onlyAdmissionResultIds?.length
          ? { id: { in: onlyAdmissionResultIds } }
          : {}),
      },
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
      },
    }),
    db.universityConversionRule.findMany({
      where: {
        status: UniversityConversionRuleStatus.ACTIVE,
        isActive: true,
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
    }),
  ]);

  const summary: UpsertStudentAdmissionAnalysisSummary = {
    userId,
    processedCount: admissionRows.length,
    updatedCount: 0,
    noLockedRecordCount: 0,
    noRuleCount: 0,
    invalidPayloadCount: 0,
    zeroOrEmptyScoreCount: 0,
    errorCount: 0,
  };

  const ratioDelegate = getUniversityComprehensiveRatioDelegate();
  let comprehensiveRatioCandidates: ComprehensiveRatioCandidate[] = [];

  if (ratioDelegate && admissionRows.length > 0) {
    const uniqueRegions = [
      ...new Set(
        admissionRows.map((row) => row.region).filter((value) => hasText(value)),
      ),
    ];
    const uniqueUniversities = [
      ...new Set(
        admissionRows
          .map((row) => row.universityName)
          .filter((value) => hasText(value)),
      ),
    ];
    const uniqueAdmissionYears = [
      ...new Set(
        admissionRows
          .map((row) => row.admissionYear)
          .filter((value): value is number => Number.isFinite(value)),
      ),
    ];

    try {
      comprehensiveRatioCandidates = await ratioDelegate.findMany({
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
          "[upsertStudentAdmissionAnalysisForUser] UniversityComprehensiveRatio table missing; continuing without ratio data.",
        );
        comprehensiveRatioCandidates = [];
      } else {
        throw error;
      }
    }
  }

  const attendanceInput = mapAttendanceToCalculationInput(attendance);
  const scoreRows = lockedSubmission?.grades?.map(mapStudentGradeToCalculationRow) ?? [];

  for (const row of admissionRows as ActiveAdmissionRow[]) {
    const isComprehensive = isComprehensiveAdmission(
      row.admissionType,
      row.admissionName,
    );

    let convertedScore: number | null = null;
    let calculationMemo = "";

    let hakjongSubmissionId: string | null = null;
    let comprehensiveRatioId: string | null = null;
    let academicCompetencyScore: number | null = null;
    let careerCompetencyScore: number | null = null;
    let communityCompetencyScore: number | null = null;
    let academicCompetencyRatio: number | null = null;
    let careerCompetencyRatio: number | null = null;
    let communityCompetencyRatio: number | null = null;
    let academicWeightedScore: number | null = null;
    let careerWeightedScore: number | null = null;
    let communityWeightedScore: number | null = null;
    let comprehensiveTotalScore: number | null = null;

    try {
      if (isComprehensive) {
        if (!latestHakjongSubmission) {
          summary.zeroOrEmptyScoreCount += 1;
          calculationMemo = "NO_COMPLETED_HAKJONG_SUBMISSION";
        } else {
          const comprehensiveRatioTarget: ComprehensiveRatioTargetScope = {
            region: row.region,
            universityName: row.universityName,
            admissionType: row.admissionType,
            admissionName: row.admissionName,
            track: row.track,
            collegeName: row.collegeName,
            recruitmentUnit: row.recruitmentUnit,
          };

          const matchedComprehensiveRatio = pickMatchedComprehensiveRatio(
            comprehensiveRatioCandidates,
            comprehensiveRatioTarget,
          );

          const domainStats = buildHakjongDomainStats(latestHakjongSubmission);

          hakjongSubmissionId = latestHakjongSubmission.id;
          academicCompetencyScore = Number(
            ((domainStats.academic.score * 2) / 3).toFixed(2),
          );
          careerCompetencyScore = Number(
            ((domainStats.career.score * 2) / 3).toFixed(2),
          );
          communityCompetencyScore = Number(
            ((domainStats.community.score * 2) / 3).toFixed(2),
          );

          calculationMemo = "HAKJONG_SCORE_ONLY";
          summary.updatedCount += 1;

          if (matchedComprehensiveRatio) {
            const normalizedRatios = buildNormalizedComprehensiveRatioSet(
              matchedComprehensiveRatio,
            );

            comprehensiveRatioId = matchedComprehensiveRatio.id;
            academicCompetencyRatio = normalizedRatios.academic;
            careerCompetencyRatio = normalizedRatios.career;
            communityCompetencyRatio = normalizedRatios.community;

            academicWeightedScore = Number(
              ((academicCompetencyScore * normalizedRatios.academic) / 100).toFixed(2),
            );
            careerWeightedScore = Number(
              ((careerCompetencyScore * normalizedRatios.career) / 100).toFixed(2),
            );
            communityWeightedScore = Number(
              ((communityCompetencyScore * normalizedRatios.community) / 100).toFixed(2),
            );

            comprehensiveTotalScore = Number(
              (
                academicWeightedScore +
                careerWeightedScore +
                communityWeightedScore
              ).toFixed(2),
            );

            convertedScore = comprehensiveTotalScore;
            calculationMemo = `COMPREHENSIVE_RATIO:${matchedComprehensiveRatio.id}`;
          } else {
            calculationMemo = "NO_MATCHED_COMPREHENSIVE_RATIO";
          }
        }
      } else {
        if (!lockedSubmission || lockedSubmission.grades.length === 0) {
          summary.noLockedRecordCount += 1;
          calculationMemo = "NO_LOCKED_STUDENT_RECORD";
        } else {
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
            (ruleCandidates as RuleCandidate[])
              .filter((rule) => matchesRuleToTarget(rule, targetScope))
              .sort(compareRulesBySpecificity)[0] ?? null;

          if (!matchedRule) {
            summary.noRuleCount += 1;
            calculationMemo = "NO_ACTIVE_UNIVERSITY_CONVERSION_RULE";
          } else if (!isRulePayloadObject(matchedRule.rawPayload)) {
            summary.invalidPayloadCount += 1;
            calculationMemo = "INVALID_RULE_PAYLOAD";
          } else {
            const result = calculateUniversityConversionSummaryFromTestSet({
              payload: matchedRule.rawPayload as CalculateUniversityConversionPayload,
              scoreRows,
              attendance: attendanceInput,
            });

            const extractedScore = extractCalculatedScore(result);

            if (extractedScore != null && Number.isFinite(extractedScore)) {
              convertedScore = extractedScore;
              calculationMemo = `RULE:${matchedRule.id}`;
              summary.updatedCount += 1;
            } else {
              summary.zeroOrEmptyScoreCount += 1;
              calculationMemo = `RULE:${matchedRule.id}:EMPTY_OR_ZERO_SCORE`;
            }
          }
        }
      }
    } catch (error) {
      summary.errorCount += 1;
      calculationMemo = isComprehensive
        ? "COMPREHENSIVE_CALCULATION_ERROR"
        : "CALCULATION_ERROR";

      console.error("[upsertStudentAdmissionAnalysisForUser] calculation error", {
        userId,
        admissionResultId: row.id,
        isComprehensive,
        error,
      });
    }

    await db.studentAdmissionAnalysisResult.upsert({
      where: {
        userId_admissionResultId: {
          userId,
          admissionResultId: row.id,
        },
      },
      update: {
        convertedScore,
        supportLevel: null,
        calculatedAt: new Date(),
        calculationMemo,
      },
      create: {
        userId,
        admissionResultId: row.id,
        convertedScore,
        supportLevel: null,
        calculatedAt: new Date(),
        calculationMemo,
      },
    });
  }

  return summary;
}
