"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type CommonSubjectItem = {
  label: string;
  subTag?: string;
};

type CommonSubjectSelections = Record<string, boolean>;
type CommonUseAllSubjects = Record<string, boolean>;
type CommonReflectionCounts = Record<string, string>;
type CommonWeights = Record<string, string>;

type CareerSubjectKey =
  | "국어"
  | "수학"
  | "영어"
  | "사회"
  | "과학"
  | "기타과목";

type CareerSubjectSelections = Record<CareerSubjectKey, boolean>;
type CareerUseAllSubjects = Record<CareerSubjectKey, boolean>;
type CareerReflectionCounts = Record<CareerSubjectKey, string>;
type CareerAchievementScoreMode = "direct_score" | "ratio_grade";
type AchievementRatioScoreRow = {
  grade: string;
  ratio: string;
  score: string;
};

type AttendanceRowType = "fixed" | "range" | "above";
type SocialScienceSelectionMode = "combined_subjects" | "best_group";
type CareerSocialScienceSelectionMode = "separate" | "best_group";
type SubjectCalculationMode = "integrated" | "separate_weighted";
type IntegratedSelectionMode = "count_limit" | "all_selected";
type FinalFormulaValueKey = "commonScore" | "careerScore" | "attendanceScore";

type AttendanceRow = {
  id: string;
  labelType: AttendanceRowType;
  label?: string;
  upper?: string;
  lower?: string;
  score: string;
};

type TestScoreRow = {
  academicTerm: string;
  subjectGroup: string;
  completionType: string;
  subjectName: string;
  credits: string;
  rawScore: string;
  averageScore: string;
  standardDeviation: string;
  achievement: string;
  grade: string;
};

type TestScoreAttendance = {
  absenceDays?: string;
  lateness?: string;
  earlyLeave?: string;
  outing?: string;
} | null;

type TestScoreApiResponse = {
  success: boolean;
  testSetId?: string | null;
  testSetName?: string;
  rows?: TestScoreRow[];
  attendance?: TestScoreAttendance;
  message?: string;
};

type AdmissionTargetCatalogRow = {
  region: string;
  university: string;
  admissionType: string;
  admissionName: string;
  track: string;
  collegeName: string;
  recruitmentUnit: string;
};

type AdmissionTargetOptionsApiResponse = {
  success: boolean;
  rows?: AdmissionTargetCatalogRow[];
  message?: string;
};

type ConversionSummaryItem = {
  label: string;
  value: string;
  tone: "slate" | "blue";
  helper?: string;
};

type TargetValues = {
  region: string;
  university: string;
  admissionType: string;
  admissionName: string;
  track: string;
  collegeName: string;
  recruitmentUnit: string;
};

type SaveAction = "draft" | "review" | "activate";

type SaveMessageState = { type: "success" | "error"; text: string } | null;

type SaveUniversityConversionPayload = {
  mode: "create" | "edit";
  action: SaveAction;
  ruleId: string | null;
  targetValues: TargetValues;
  subjectCalculationMode: SubjectCalculationMode;
  integratedSelectionMode: IntegratedSelectionMode;
  integratedTotalReflectionCount: string;
  integratedMaxCareerReflectionCount: string;
  commonSubjectSelections: CommonSubjectSelections;
  commonUseAllSubjects: CommonUseAllSubjects;
  commonReflectionCounts: CommonReflectionCounts;
  commonWeights: CommonWeights;
  gradeScoreMap: Record<string, string>;
  careerSubjectSelections: CareerSubjectSelections;
  careerUseAllSubjects: CareerUseAllSubjects;
  careerReflectionCounts: CareerReflectionCounts;
  careerAchievementScores: Record<string, string>;
  careerAchievementFormulaName: string;
  careerAchievementFormulaBody: string;
  careerAchievementScoreMode: CareerAchievementScoreMode;
  achievementRatioScoreRows: AchievementRatioScoreRow[];
  attendanceRows: AttendanceRow[];
  formulaName: string;
  formulaBody: string;
  formulaMemo: string;
  applyCustomCommonFormula: boolean;
  commonCustomFormulaBody: string;
  socialScienceSelectionMode: SocialScienceSelectionMode;
  careerSocialScienceSelectionMode: CareerSocialScienceSelectionMode;
  includeSecondForeignLanguageInEnglish: boolean;
  includeKoreanHistoryInSocial: boolean;
  includeKoreanHistoryInSocialScience: boolean;
  includeKoreanHistoryInSocialWhenBestGroup: boolean;
  switches: {
    applyUnitWeight: boolean;
    applyCommonWeight: boolean;
    applyConvertedScore: boolean;
    includeCommonSubjects: boolean;
    includeRegularElectiveSubjects: boolean;
    includeCareerSubjects: boolean;
    includeCareerSelectionSubjects: boolean;
    includeSpecializedSubjects: boolean;
    applyCareerBonus: boolean;
    includeAttendance: boolean;
  };
  testScoreLink: {
    testSetId: string | null;
    testSetName: string;
    rowCount: number;
    attendanceIncluded: boolean;
  };
  calculatedSummary: {
    commonScore: string;
    careerContributionScore: string;
    attendanceScore: string;
    finalScore: string;
  };
};

type SaveUniversityConversionResponse = {
  success: boolean;
  message?: string;
  data?: {
    ruleId: string;
    mode: "create" | "edit";
    action: SaveAction;
    status: "draft" | "review_requested" | "active" | "inactive";
    savedAt: string;
    targetValues: TargetValues;
  };
};

type RuleDetailApiResponse = {
  success: boolean;
  message?: string;
  data?: {
    ruleId: string;
    ruleGroupKey: string;
    version: number;
    previousRuleId: string | null;
    mode: "create" | "edit";
    action: "draft" | "review" | "activate";
    status: "draft" | "review_requested" | "active" | "inactive";
    isActive: boolean;
    targetValues: TargetValues;

    subjectCalculationMode?: SubjectCalculationMode;
    integratedSelectionMode?: IntegratedSelectionMode;
    integratedTotalReflectionCount?: string;
    integratedMaxCareerReflectionCount?: string;

    commonSubjectSelections?: Record<string, boolean>;
    commonUseAllSubjects?: Record<string, boolean>;
    commonReflectionCounts: Record<string, string>;
    commonWeights: Record<string, string>;
    gradeScoreMap: Record<string, string>;

    careerSubjectSelections?: Record<string, boolean>;
    careerUseAllSubjects?: Record<string, boolean>;
    careerReflectionCounts?: Record<string, string>;

    careerAchievementScores: Record<string, string>;
    careerAchievementFormulaName: string;
    careerAchievementFormulaBody: string;
    careerAchievementScoreMode?: CareerAchievementScoreMode;
    achievementRatioScoreRows?: AchievementRatioScoreRow[];

    attendanceRows: AttendanceRow[];
    formulaName: string;
    formulaBody: string;
    formulaMemo: string;

    applyCustomCommonFormula: boolean;
    commonCustomFormulaBody: string;

    socialScienceSelectionMode?: SocialScienceSelectionMode;
    careerSocialScienceSelectionMode?: CareerSocialScienceSelectionMode;
    includeSecondForeignLanguageInEnglish?: boolean;
    includeKoreanHistoryInSocial?: boolean;
    includeKoreanHistoryInSocialScience?: boolean;
    includeKoreanHistoryInSocialWhenBestGroup?: boolean;

    switches: {
      applyUnitWeight: boolean;
      applyCommonWeight: boolean;
      applyConvertedScore: boolean;
      includeCommonSubjects?: boolean;
      includeRegularElectiveSubjects?: boolean;
      includeCareerSubjects: boolean;
      includeCareerSelectionSubjects?: boolean;
      includeSpecializedSubjects?: boolean;
      applyCareerBonus: boolean;
      includeAttendance: boolean;
    };

    calculatedSummary: {
      commonScore: string;
      careerContributionScore: string;
      attendanceScore: string;
      finalScore: string;
    };

    createdAt: string;
    updatedAt: string;
    draftSavedAt: string | null;
    reviewRequestedAt: string | null;
    activatedAt: string | null;

    careerGroupSettings?: {
      enabled?: boolean;
      useAllSubjects?: boolean;
      reflectionCount?: string;
    };
    useMixedSelectionMode?: boolean;
    mixedTotalReflectionCount?: string;
    mixedMaxCareerSpecializedCount?: string;
  };
};

const commonSubjects: CommonSubjectItem[] = [
  { label: "국어" },
  { label: "수학" },
  { label: "영어", subTag: "제2외국어 선택 반영" },
  { label: "사회", subTag: "한국사 선택 반영" },
  { label: "과학" },
  { label: "사회/과학", subTag: "통합/우수교과" },
  { label: "한국사" },
  { label: "기타과목" },
];

const careerSubjectKeys: CareerSubjectKey[] = [
  "국어",
  "수학",
  "영어",
  "사회",
  "과학",
  "기타과목",
];

const gradeLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

const defaultAttendanceRows: AttendanceRow[] = [
  { id: "fixed-0", labelType: "fixed", label: "0일", score: "100" },
  { id: "range-2", labelType: "range", upper: "2", score: "99" },
  { id: "range-5", labelType: "range", upper: "5", score: "97" },
  { id: "range-10", labelType: "range", upper: "10", score: "94" },
  { id: "range-15", labelType: "range", upper: "15", score: "90" },
  { id: "above-16", labelType: "above", lower: "16", score: "85" },
];

const initialTargetValues: TargetValues = {
  region: "",
  university: "",
  admissionType: "",
  admissionName: "",
  track: "",
  collegeName: "",
  recruitmentUnit: "",
};

const commonSubjectKeys = commonSubjects.map((subject) => subject.label);

const commonSubjectProcessingOrder = [
  "국어",
  "수학",
  "영어",
  "한국사",
  "사회",
  "과학",
  "사회/과학",
  "기타과목",
] as const;

const careerSubjectProcessingOrder: CareerSubjectKey[] = [
  "국어",
  "수학",
  "영어",
  "사회",
  "과학",
  "기타과목",
];

const DEFAULT_SUBJECT_CALCULATION_MODE: SubjectCalculationMode =
  "separate_weighted";
const DEFAULT_INTEGRATED_SELECTION_MODE: IntegratedSelectionMode =
  "count_limit";

const DEFAULT_SEPARATE_FORMULA_BODY =
  "공통/일반선택 반영점수 + 진로선택/전문교과 반영점수 + 출결 반영점수";

const DEFAULT_INTEGRATED_FORMULA_BODY =
  "통합 교과 반영점수 + 출결 반영점수";

const LEGACY_DEFAULT_INTEGRATED_FORMULA_BODY =
  "공통/일반선택 반영점수 + 출결 반영점수";

const initialGradeScoreMap: Record<number, string> = {
  1: "100",
  2: "98",
  3: "96",
  4: "94",
  5: "90",
  6: "85",
  7: "80",
  8: "75",
  9: "70",
};

const initialCareerAchievementScores: Record<string, string> = {
  A: "100",
  B: "85",
  C: "70",
};

const initialAchievementRatioScoreRows: AchievementRatioScoreRow[] = gradeLevels.map(
  (grade) => ({
    grade: String(grade),
    ratio: "",
    score: initialGradeScoreMap[grade],
  })
);

const INITIAL_CAREER_ACHIEVEMENT_FORMULA_NAME = "성취도 환산식";
const INITIAL_FORMULA_NAME = "기본 환산 계산식";

const SECOND_FOREIGN_LANGUAGE_GROUPS = ["제2외국어", "외국어"];
const SECOND_FOREIGN_LANGUAGE_AMBIGUOUS_GROUPS = ["제2외국어/한문"];
const SECOND_FOREIGN_LANGUAGE_KEYWORDS = [
  "일본어",
  "중국어",
  "독일어",
  "프랑스어",
  "스페인어",
  "러시아어",
  "아랍어",
  "베트남어",
];

const FINAL_FORMULA_TOKEN_ALIASES: Record<
  FinalFormulaValueKey,
  readonly string[]
> = {
  commonScore: [
    "통합 교과 반영점수",
    "통합교과반영점수",
    "통합 반영점수",
    "통합반영점수",
    "공통/일반선택 반영점수",
    "공통/일반선택반영점수",
    "공통교과 반영점수",
    "공통교과반영점수",
    "공통과목 반영점수",
    "공통과목반영점수",
  ],
  careerScore: [
    "진로선택/전문교과 반영점수",
    "진로선택/전문교과반영점수",
    "진로/전문교과 반영점수",
    "진로/전문교과반영점수",
    "진로선택 반영점수",
    "진로선택반영점수",
    "전문교과 반영점수",
    "전문교과반영점수",
  ],
  attendanceScore: ["출결 반영점수", "출결반영점수"],
};

function createBooleanMap<T extends string>(
  keys: readonly T[],
  defaultValue = false
): Record<T, boolean> {
  return Object.fromEntries(
    keys.map((key) => [key, defaultValue])
  ) as Record<T, boolean>;
}

function createStringMap<T extends string>(
  keys: readonly T[],
  defaultValue = ""
): Record<T, string> {
  return Object.fromEntries(keys.map((key) => [key, defaultValue])) as Record<
    T,
    string
  >;
}

function createRowMap<T extends string>(
  keys: readonly T[]
): Record<T, TestScoreRow[]> {
  return Object.fromEntries(
    keys.map((key) => [key, [] as TestScoreRow[]])
  ) as Record<T, TestScoreRow[]>;
}

function getDefaultFormulaBody(mode: SubjectCalculationMode) {
  return mode === "integrated"
    ? DEFAULT_INTEGRATED_FORMULA_BODY
    : DEFAULT_SEPARATE_FORMULA_BODY;
}

function mergeBooleanMap<T extends string>(
  base: Record<T, boolean>,
  incoming?: Partial<Record<T, boolean>> | null
) {
  return {
    ...base,
    ...(incoming ?? {}),
  };
}

function mergeStringMap<T extends string>(
  base: Record<T, string>,
  incoming?: Partial<Record<T, string>> | null
) {
  return {
    ...base,
    ...(incoming ?? {}),
  };
}

const emptyCommonReflectionCounts: CommonReflectionCounts =
  createStringMap(commonSubjectKeys, "");

const emptyCommonWeights: CommonWeights = createStringMap(commonSubjectKeys, "");

const initialCommonReflectionCounts: CommonReflectionCounts = {
  국어: "3",
  수학: "3",
  영어: "3",
  사회: "2",
  과학: "2",
  "사회/과학": "2",
  한국사: "1",
  기타과목: "0",
};

const initialCommonWeights: CommonWeights = {
  국어: "100",
  수학: "100",
  영어: "100",
  사회: "100",
  과학: "100",
  "사회/과학": "100",
  한국사: "100",
  기타과목: "100",
};

const initialCommonSubjectSelections: CommonSubjectSelections = {
  국어: true,
  수학: true,
  영어: true,
  사회: true,
  과학: true,
  "사회/과학": false,
  한국사: false,
  기타과목: false,
};

const initialCommonUseAllSubjects: CommonUseAllSubjects =
  createBooleanMap(commonSubjectKeys, false);

const initialCareerSubjectSelections: CareerSubjectSelections = {
  국어: false,
  수학: false,
  영어: false,
  사회: false,
  과학: false,
  기타과목: false,
};

const initialCareerUseAllSubjects: CareerUseAllSubjects =
  createBooleanMap(careerSubjectKeys, false);

const initialCareerReflectionCounts: CareerReflectionCounts = {
  국어: "1",
  수학: "1",
  영어: "1",
  사회: "1",
  과학: "1",
  기타과목: "1",
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function uniqueStrings(values: string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "ko"));
}

function normalizeAdmissionTargetRow(
  row: Partial<AdmissionTargetCatalogRow> | null | undefined
): AdmissionTargetCatalogRow | null {
  if (!row) return null;

  const normalized: AdmissionTargetCatalogRow = {
    region: normalizeText(row.region),
    university: normalizeText(row.university),
    admissionType: normalizeText(row.admissionType),
    admissionName: normalizeText(row.admissionName),
    track: normalizeText(row.track),
    collegeName: normalizeText(row.collegeName),
    recruitmentUnit: normalizeText(row.recruitmentUnit),
  };

  if (
    !normalized.region ||
    !normalized.university ||
    !normalized.admissionType
  ) {
    return null;
  }

  return normalized;
}

function dedupeAdmissionTargetRows(rows: AdmissionTargetCatalogRow[]) {
  const map = new Map<string, AdmissionTargetCatalogRow>();

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

    return left.localeCompare(right, "ko");
  });
}

function parseNumber(value: string | null | undefined) {
  if (!value) return null;
  const cleaned = value.replace(/,/g, "").trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatScore(value: number) {
  return value.toFixed(2);
}

function normalizeAchievementRatioScoreRows(
  incoming?: AchievementRatioScoreRow[] | null,
  fallbackScoreMap?: Record<number, string>
) {
  const rowMap = new Map<number, AchievementRatioScoreRow>();

  for (const row of incoming ?? []) {
    const parsedGrade = parseNumber(row?.grade ?? "");
    if (parsedGrade == null) continue;
    const normalizedGrade = clamp(Math.round(parsedGrade), 1, 9);
    rowMap.set(normalizedGrade, {
      grade: String(normalizedGrade),
      ratio: typeof row?.ratio === "string" ? row.ratio.trim() : "",
      score: typeof row?.score === "string" ? row.score.trim() : "",
    });
  }

  return gradeLevels.map((grade) => {
    const matched = rowMap.get(grade);
    return {
      grade: String(grade),
      ratio: matched?.ratio ?? "",
      score: matched?.score || fallbackScoreMap?.[grade] || "",
    };
  });
}

function resolveAchievementRatioConvertedScore(
  gradeInput: string,
  rows: AchievementRatioScoreRow[],
  fallbackScoreMap?: Record<number, string>
) {
  const parsedGrade = parseNumber(gradeInput);

  if (parsedGrade == null) {
    return null;
  }

  const normalizedGrade = clamp(Math.round(parsedGrade), 1, 9);
  const matchedRow = rows.find(
    (row) => parseNumber(row.grade) === normalizedGrade
  );
  const matchedScore = parseNumber(matchedRow?.score ?? "");

  if (matchedScore != null) {
    return matchedScore;
  }

  return fallbackScoreMap
    ? parseNumber(fallbackScoreMap[normalizedGrade])
    : null;
}

function resolveCareerAchievementScoreInputs(
  scoreMode: CareerAchievementScoreMode,
  inputScores: Record<string, string>,
  ratioRows: AchievementRatioScoreRow[],
  fallbackGradeScoreMap?: Record<number, string>
) {
  if (scoreMode === "ratio_grade") {
    return {
      A:
        resolveAchievementRatioConvertedScore(
          inputScores.A ?? "",
          ratioRows,
          fallbackGradeScoreMap
        )?.toString() ?? "",
      B:
        resolveAchievementRatioConvertedScore(
          inputScores.B ?? "",
          ratioRows,
          fallbackGradeScoreMap
        )?.toString() ?? "",
      C:
        resolveAchievementRatioConvertedScore(
          inputScores.C ?? "",
          ratioRows,
          fallbackGradeScoreMap
        )?.toString() ?? "",
    };
  }

  return { ...inputScores };
}

function getAchievementRatio(achievement: string) {
  switch (achievement.trim().toUpperCase()) {
    case "A":
      return 1;
    case "B":
      return 0.85;
    case "C":
      return 0.7;
    case "D":
      return 0.55;
    case "E":
      return 0.4;
    case "F":
      return 0.2;
    case "P":
      return 1;
    default:
      return null;
  }
}

function getAchievementPriority(achievement: string) {
  switch (achievement.trim().toUpperCase()) {
    case "A":
    case "P":
      return 1;
    case "B":
      return 2;
    case "C":
      return 3;
    case "D":
      return 4;
    case "E":
      return 5;
    case "F":
      return 6;
    default:
      return null;
  }
}

function getAttendanceBaseScore(
  absenceDays: number | null,
  rows: AttendanceRow[]
): number | null {
  if (absenceDays == null) return null;

  for (const row of rows) {
    const score = parseNumber(row.score) ?? 0;

    if (row.labelType === "fixed") {
      const labelDays = parseNumber((row.label ?? "").replace("일", ""));
      if (labelDays != null && absenceDays === labelDays) {
        return score;
      }
    }

    if (row.labelType === "range") {
      const upper = parseNumber(row.upper);
      if (upper != null && absenceDays <= upper) {
        return score;
      }
    }

    if (row.labelType === "above") {
      const lower = parseNumber(row.lower);
      if (lower != null && absenceDays >= lower) {
        return score;
      }
    }
  }

  return null;
}

function getConvertedScoreFromGrade(
  grade: number | null,
  gradeScoreMap: Record<number, string>
) {
  if (grade == null) {
    return null;
  }

  const normalizedGrade = clamp(
    Math.round(grade),
    1,
    9
  ) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

  return parseNumber(gradeScoreMap[normalizedGrade]);
}

function normalizeSubjectGroupLabel(value: string) {
  return value.replace(/\s+/g, "").trim();
}

function normalizeCompletionTypeLabel(value: string) {
  return value.replace(/\s+/g, "").trim();
}

function getReflectionCount(value: string | null | undefined) {
  const parsed = parseNumber(value ?? "");
  if (parsed == null) return 0;
  return Math.max(0, Math.floor(parsed));
}

function getPercentWeight(value: string | null | undefined) {
  const parsed = parseNumber(value ?? "");
  if (parsed == null) return 1;
  return Math.max(0, parsed) / 100;
}

function compareRowsForSelection(a: TestScoreRow, b: TestScoreRow) {
  const gradeA = parseNumber(a.grade);
  const gradeB = parseNumber(b.grade);

  if (gradeA != null || gradeB != null) {
    if (gradeA == null) return 1;
    if (gradeB == null) return -1;
    if (gradeA !== gradeB) {
      return gradeA - gradeB;
    }
  }

  const achievementA = getAchievementPriority(a.achievement);
  const achievementB = getAchievementPriority(b.achievement);

  if (achievementA != null || achievementB != null) {
    if (achievementA == null) return 1;
    if (achievementB == null) return -1;
    if (achievementA !== achievementB) {
      return achievementA - achievementB;
    }
  }

  const rawScoreA = parseNumber(a.rawScore);
  const rawScoreB = parseNumber(b.rawScore);

  if (rawScoreA != null || rawScoreB != null) {
    if (rawScoreA == null) return 1;
    if (rawScoreB == null) return -1;
    if (rawScoreA !== rawScoreB) {
      return rawScoreB - rawScoreA;
    }
  }

  const creditsA = parseNumber(a.credits) ?? 0;
  const creditsB = parseNumber(b.credits) ?? 0;

  if (creditsA !== creditsB) {
    return creditsB - creditsA;
  }

  return [a.subjectGroup, a.subjectName, a.academicTerm]
    .join(" ")
    .localeCompare(
      [b.subjectGroup, b.subjectName, b.academicTerm].join(" "),
      "ko"
    );
}

function isKoreanHistoryRow(row: TestScoreRow) {
  const rowGroup = normalizeSubjectGroupLabel(row.subjectGroup);
  const subjectName = normalizeSubjectGroupLabel(row.subjectName);

  return rowGroup === "한국사" || subjectName.includes("한국사");
}

function isChineseClassicsRow(row: TestScoreRow) {
  const rowGroup = normalizeSubjectGroupLabel(row.subjectGroup);
  const subjectName = normalizeSubjectGroupLabel(row.subjectName);

  return rowGroup === "한문" || subjectName.includes("한문");
}

function isSocialRow(row: TestScoreRow) {
  const rowGroup = normalizeSubjectGroupLabel(row.subjectGroup);
  return rowGroup === "사회";
}

function isScienceRow(row: TestScoreRow) {
  const rowGroup = normalizeSubjectGroupLabel(row.subjectGroup);
  return rowGroup === "과학";
}

function isSocialScienceRow(row: TestScoreRow) {
  const rowGroup = normalizeSubjectGroupLabel(row.subjectGroup);
  return rowGroup === "사회/과학";
}

function isSecondForeignLanguageRow(row: TestScoreRow) {
  const rowGroup = normalizeSubjectGroupLabel(row.subjectGroup);
  const subjectName = normalizeSubjectGroupLabel(row.subjectName);

  if (isChineseClassicsRow(row)) {
    return false;
  }

  if (SECOND_FOREIGN_LANGUAGE_GROUPS.includes(rowGroup)) {
    return true;
  }

  if (SECOND_FOREIGN_LANGUAGE_AMBIGUOUS_GROUPS.includes(rowGroup)) {
    return SECOND_FOREIGN_LANGUAGE_KEYWORDS.some((keyword) =>
      subjectName.includes(keyword)
    );
  }

  return SECOND_FOREIGN_LANGUAGE_KEYWORDS.some((keyword) =>
    subjectName.includes(keyword)
  );
}

function isCareerSelectionRow(row: TestScoreRow) {
  return normalizeCompletionTypeLabel(row.completionType) === "진로선택";
}

function isSpecializedCourseRow(row: TestScoreRow) {
  const completionType = normalizeCompletionTypeLabel(row.completionType);
  const rowGroup = normalizeSubjectGroupLabel(row.subjectGroup);

  return (
    completionType === "전문교과" ||
    completionType === "전문" ||
    rowGroup === "전문교과" ||
    rowGroup === "전문"
  );
}

function isCareerOrSpecializedRow(row: TestScoreRow) {
  return isCareerSelectionRow(row) || isSpecializedCourseRow(row);
}

function isCommonCurriculumRow(row: TestScoreRow) {
  const completionType = normalizeCompletionTypeLabel(row.completionType);
  return (
    completionType === "공통" ||
    completionType === "공통과목" ||
    completionType === "공통교과" ||
    completionType === "보통교과공통" ||
    completionType.includes("공통")
  );
}

function isRegularElectiveSubjectRow(row: TestScoreRow) {
  const completionType = normalizeCompletionTypeLabel(row.completionType);
  return (
    completionType === "일반선택" ||
    completionType === "보통교과일반선택" ||
    completionType === "일반" ||
    completionType.includes("일반선택")
  );
}

function shouldIncludeCommonPoolRow(
  row: TestScoreRow,
  includeCommonSubjects: boolean,
  includeRegularElectiveSubjects: boolean
) {
  if (isCareerOrSpecializedRow(row)) return true;
  if (isCommonCurriculumRow(row)) return includeCommonSubjects;
  if (isRegularElectiveSubjectRow(row)) return includeRegularElectiveSubjects;
  return includeCommonSubjects || includeRegularElectiveSubjects;
}

function shouldIncludeCareerPoolRow(
  row: TestScoreRow,
  includeCareerSelectionSubjects: boolean,
  includeSpecializedSubjects: boolean
) {
  if (isCareerSelectionRow(row)) {
    return includeCareerSelectionSubjects;
  }

  if (isSpecializedCourseRow(row)) {
    return includeSpecializedSubjects;
  }

  return false;
}
function matchesCommonSubjectGroup(
  row: TestScoreRow,
  subjectLabel: string,
  options?: {
    includeSecondForeignLanguageInEnglish?: boolean;
    includeKoreanHistoryInSocial?: boolean;
    includeKoreanHistoryInSocialScience?: boolean;
    socialScienceSelectionMode?: SocialScienceSelectionMode;
  }
) {
  const rowGroup = normalizeSubjectGroupLabel(row.subjectGroup);
  const target = normalizeSubjectGroupLabel(subjectLabel);

  if (!rowGroup) return false;

  if (target === "영어") {
    if (rowGroup === "영어") return true;
    return options?.includeSecondForeignLanguageInEnglish
      ? isSecondForeignLanguageRow(row)
      : false;
  }

  if (target === "사회") {
    if (isSocialRow(row)) return true;
    return options?.includeKoreanHistoryInSocial
      ? isKoreanHistoryRow(row)
      : false;
  }

  if (target === "과학") {
    return isScienceRow(row);
  }

  if (target === "한국사") {
    return isKoreanHistoryRow(row);
  }

  if (target === "사회/과학") {
    if (options?.socialScienceSelectionMode === "best_group") {
      return false;
    }

    if (isSocialRow(row) || isScienceRow(row) || isSocialScienceRow(row)) {
      return true;
    }

    return options?.includeKoreanHistoryInSocialScience
      ? isKoreanHistoryRow(row)
      : false;
  }

  if (target === "기타과목") {
    if (
      rowGroup === "국어" ||
      rowGroup === "수학" ||
      rowGroup === "영어" ||
      rowGroup === "사회" ||
      rowGroup === "과학" ||
      rowGroup === "사회/과학" ||
      isKoreanHistoryRow(row)
    ) {
      return false;
    }

    if (
      options?.includeSecondForeignLanguageInEnglish &&
      isSecondForeignLanguageRow(row)
    ) {
      return false;
    }

    return true;
  }

  return rowGroup === target;
}

function getMatchedCommonSubjectLabelForSelection(
  row: TestScoreRow,
  selectedSubjectLabels: string[],
  options?: {
    includeSecondForeignLanguageInEnglish?: boolean;
    includeKoreanHistoryInSocial?: boolean;
    includeKoreanHistoryInSocialScience?: boolean;
    socialScienceSelectionMode?: SocialScienceSelectionMode;
  }
) {
  for (const subjectLabel of commonSubjectProcessingOrder) {
    if (!selectedSubjectLabels.includes(subjectLabel)) continue;

    if (matchesCommonSubjectGroup(row, subjectLabel, options)) {
      return subjectLabel;
    }
  }

  return null;
}

function matchesCareerSubjectGroup(
  row: TestScoreRow,
  subjectLabel: CareerSubjectKey
) {
  if (!isCareerOrSpecializedRow(row)) {
    return false;
  }

  const rowGroup = normalizeSubjectGroupLabel(row.subjectGroup);
  const target = normalizeSubjectGroupLabel(subjectLabel);

  if (!rowGroup) return false;

  if (target === "국어") {
    return rowGroup === "국어";
  }

  if (target === "수학") {
    return rowGroup === "수학";
  }

  if (target === "영어") {
    return rowGroup === "영어";
  }

  if (target === "사회") {
    return isSocialRow(row) || isKoreanHistoryRow(row);
  }

  if (target === "과학") {
    return isScienceRow(row);
  }

  if (target === "기타과목") {
    return !(
      rowGroup === "국어" ||
      rowGroup === "수학" ||
      rowGroup === "영어" ||
      isSocialRow(row) ||
      isScienceRow(row) ||
      isKoreanHistoryRow(row)
    );
  }

  return false;
}

function getMatchedCareerSubjectLabelForSelection(
  row: TestScoreRow,
  selectedSubjectLabels: CareerSubjectKey[]
) {
  for (const subjectLabel of careerSubjectProcessingOrder) {
    if (!selectedSubjectLabels.includes(subjectLabel)) continue;

    if (matchesCareerSubjectGroup(row, subjectLabel)) {
      return subjectLabel;
    }
  }

  return null;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceFinalFormulaTokenAliases(
  expression: string,
  aliases: readonly string[],
  numericValue: number
) {
  const replacement = String(numericValue);
  const sortedAliases = [...aliases].sort((a, b) => b.length - a.length);

  let nextExpression = expression;

  for (const token of sortedAliases) {
    const escapedToken = escapeRegExp(token);
    nextExpression = nextExpression.replace(
      new RegExp(`\\{\\s*${escapedToken}\\s*\\}`, "g"),
      replacement
    );
  }

  for (const token of sortedAliases) {
    const escapedToken = escapeRegExp(token);
    nextExpression = nextExpression.replace(
      new RegExp(escapedToken, "g"),
      replacement
    );
  }

  return nextExpression;
}

function normalizeFinalFormulaExpression(
  formula: string,
  values: {
    commonScore: number;
    careerScore: number;
    attendanceScore: number;
  }
) {
  const trimmedFormula = normalizeText(formula);

  if (!trimmedFormula) {
    return "";
  }

  let expression = trimmedFormula;

  expression = replaceFinalFormulaTokenAliases(
    expression,
    FINAL_FORMULA_TOKEN_ALIASES.commonScore,
    values.commonScore
  );

  expression = replaceFinalFormulaTokenAliases(
    expression,
    FINAL_FORMULA_TOKEN_ALIASES.careerScore,
    values.careerScore
  );

  expression = replaceFinalFormulaTokenAliases(
    expression,
    FINAL_FORMULA_TOKEN_ALIASES.attendanceScore,
    values.attendanceScore
  );

  expression = expression.replace(/\s+/g, "");

  if (!expression) {
    return "";
  }

  if (/[{}]/.test(expression)) {
    return null;
  }

  if (/[^0-9+\-*/().]/.test(expression)) {
    return null;
  }

  return expression;
}

function evaluateFinalFormula(
  formula: string,
  values: {
    commonScore: number;
    careerScore: number;
    attendanceScore: number;
  }
) {
  const normalizedExpression = normalizeFinalFormulaExpression(formula, values);

  if (normalizedExpression === null) {
    return null;
  }

  if (!normalizedExpression) {
    return values.commonScore + values.careerScore + values.attendanceScore;
  }

  try {
    const result = Function(`"use strict"; return (${normalizedExpression});`)();

    if (!Number.isFinite(result)) {
      return null;
    }

    return Number(result);
  } catch {
    return null;
  }
}

function evaluateCommonCustomFormula(
  formula: string,
  values: {
    defaultCommonScore: number;
    scoreSum: number;
    subjectCount: number;
    unitSum: number;
    scoreUnitSum: number;
    weightedSubjectSum: number;
    weightedUnitSubjectSum: number;
  }
) {
  const trimmedFormula = normalizeText(formula);

  if (!trimmedFormula) {
    return null;
  }

  let expression = trimmedFormula;

  const replacementMap: Array<[string, number]> = [
    ["기본 공통과목 반영점수", values.defaultCommonScore],
    ["기본공통과목반영점수", values.defaultCommonScore],
    ["반영 과목별 등급 합", values.scoreSum],
    ["반영과목별등급합", values.scoreSum],
    ["반영 과목별 환산점수 합", values.scoreSum],
    ["반영과목별환산점수합", values.scoreSum],
    ["반영 과목별 점수 합", values.scoreSum],
    ["반영과목별점수합", values.scoreSum],
    ["반영 과목 수", values.subjectCount],
    ["반영과목수", values.subjectCount],
    ["반영 과목별 학점 합", values.unitSum],
    ["반영과목별학점합", values.unitSum],
    ["반영 과목별 이수단위 합", values.unitSum],
    ["반영과목별이수단위합", values.unitSum],
    ["반영 과목별 등급 × 학점 합", values.scoreUnitSum],
    ["반영과목별등급×학점합", values.scoreUnitSum],
    ["반영과목별등급x학점합", values.scoreUnitSum],
    ["반영 과목별 (등급 × 학점) 합", values.scoreUnitSum],
    ["반영과목별(등급×학점)합", values.scoreUnitSum],
    ["((반영 과목 등급 × 반영 과목 학점))합", values.scoreUnitSum],
    ["((반영과목등급×반영과목학점))합", values.scoreUnitSum],
    ["반영 과목별 환산점수 × 학점 합", values.scoreUnitSum],
    ["반영과목별환산점수×학점합", values.scoreUnitSum],
    ["반영과목별환산점수x학점합", values.scoreUnitSum],
    ["반영 과목별 (환산점수 × 학점) 합", values.scoreUnitSum],
    ["반영과목별(환산점수×학점)합", values.scoreUnitSum],
    ["((반영 과목 환산점수 × 반영 과목 학점))합", values.scoreUnitSum],
    ["((반영과목환산점수×반영과목학점))합", values.scoreUnitSum],
    ["반영 과목별 점수 × 반영 과목별 이수단위 합", values.scoreUnitSum],
    ["반영과목별점수×반영과목별이수단위합", values.scoreUnitSum],
    ["반영과목별점수x반영과목별이수단위합", values.scoreUnitSum],
    ["교과별 가중 평균등급 합계", values.weightedSubjectSum],
    ["교과별가중평균등급합계", values.weightedSubjectSum],
    ["교과별 평균등급 가중 합계", values.weightedSubjectSum],
    ["교과별평균등급가중합계", values.weightedSubjectSum],
    ["교과별 가중 평균 환산점수 합계", values.weightedSubjectSum],
    ["교과별가중평균환산점수합계", values.weightedSubjectSum],
    ["교과별 평균 환산점수 가중 합계", values.weightedSubjectSum],
    ["교과별평균환산점수가중합계", values.weightedSubjectSum],
    ["교과별 가중치 적용 합계 점수", values.weightedSubjectSum],
    ["교과별가중치적용합계점수", values.weightedSubjectSum],
    ["교과별 학점 가중 평균등급 합계", values.weightedUnitSubjectSum],
    ["교과별학점가중평균등급합계", values.weightedUnitSubjectSum],
    ["교과별 학점 가중 평균 환산점수 합계", values.weightedUnitSubjectSum],
    ["교과별학점가중평균환산점수합계", values.weightedUnitSubjectSum],
    ["교과별 이수단위 가중치 적용 합계 점수", values.weightedUnitSubjectSum],
    ["교과별이수단위가중치적용합계점수", values.weightedUnitSubjectSum],
  ];

  for (const [token, value] of replacementMap) {
    expression = expression.split(token).join(String(value));
  }

  expression = expression.replace(/\s+/g, "");

  if (!expression) {
    return null;
  }

  if (/[^0-9+\-*/().]/.test(expression)) {
    return null;
  }

  try {
    const result = Function(`"use strict"; return (${expression});`)();

    if (!Number.isFinite(result)) {
      return null;
    }

    return Number(result);
  } catch {
    return null;
  }
}

function getResolvedCommonBaseValue(
  row: TestScoreRow,
  gradeScoreMap: Record<number, string>,
  applyConvertedScore: boolean
) {
  const grade = parseNumber(row.grade);

  if (grade == null) {
    return null;
  }

  const normalizedGrade = clamp(grade, 1, 9);

  if (applyConvertedScore) {
    return getConvertedScoreFromGrade(normalizedGrade, gradeScoreMap);
  }

  return normalizedGrade;
}

function getCareerAchievementScore(
  achievement: string,
  careerAchievementScores: Record<string, string>
) {
  const manualScore = parseNumber(
    careerAchievementScores[achievement.trim().toUpperCase()]
  );

  if (manualScore != null) {
    return manualScore;
  }

  const ratio = getAchievementRatio(achievement);
  if (ratio == null) {
    return null;
  }

  return ratio * 100;
}

function getResolvedSubjectBaseValue(
  row: TestScoreRow,
  gradeScoreMap: Record<number, string>,
  applyConvertedScore: boolean,
  careerAchievementScores: Record<string, string>
) {
  if (isCareerOrSpecializedRow(row)) {
    return getCareerAchievementScore(row.achievement, careerAchievementScores);
  }

  return getResolvedCommonBaseValue(row, gradeScoreMap, applyConvertedScore);
}

function getCreditWeight(row: TestScoreRow) {
  const credit = parseNumber(row.credits);

  if (credit == null) {
    return null;
  }

  const safeCredit = Math.max(credit, 0);
  return safeCredit > 0 ? safeCredit : null;
}

function calculateSubjectAverageForRows(
  rows: TestScoreRow[],
  gradeScoreMap: Record<number, string>,
  applyConvertedScore: boolean,
  applyUnitWeight: boolean,
  careerAchievementScores: Record<string, string>
) {
  let numerator = 0;
  let denominator = 0;

  for (const row of rows) {
    const baseValue = getResolvedSubjectBaseValue(
      row,
      gradeScoreMap,
      applyConvertedScore,
      careerAchievementScores
    );

    if (baseValue == null) continue;

    if (applyUnitWeight) {
      const creditWeight = getCreditWeight(row);
      if (creditWeight == null) continue;

      numerator += baseValue * creditWeight;
      denominator += creditWeight;
      continue;
    }

    numerator += baseValue;
    denominator += 1;
  }

  if (denominator === 0) {
    return null;
  }

  return numerator / denominator;
}

function resolveEffectiveCareerSocialScienceSelectionMode(options: {
  subjectCalculationMode: SubjectCalculationMode;
  socialScienceSelectionMode: SocialScienceSelectionMode;
  careerSocialScienceSelectionMode: CareerSocialScienceSelectionMode;
}): CareerSocialScienceSelectionMode {
  if (
    options.subjectCalculationMode === "integrated" &&
    options.socialScienceSelectionMode === "best_group"
  ) {
    return "best_group";
  }

  return options.careerSocialScienceSelectionMode;
}

function resolveCareerRowsByBestGroup(
  grouped: Record<CareerSubjectKey, TestScoreRow[]>,
  options: {
    selectedCareerSubjectLabels: CareerSubjectKey[];
    gradeScoreMap: Record<number, string>;
    applyConvertedScore: boolean;
    applyUnitWeight: boolean;
    careerAchievementScores: Record<string, string>;
  }
) {
  const next = createRowMap(careerSubjectKeys);

  for (const key of careerSubjectKeys) {
    next[key] = [...(grouped[key] ?? [])];
  }

  const hasSocialSelected = options.selectedCareerSubjectLabels.includes("사회");
  const hasScienceSelected = options.selectedCareerSubjectLabels.includes("과학");

  if (!hasSocialSelected || !hasScienceSelected) {
    return next;
  }

  const socialAverage = calculateSubjectAverageForRows(
    next["사회"],
    options.gradeScoreMap,
    options.applyConvertedScore,
    options.applyUnitWeight,
    options.careerAchievementScores
  );

  const scienceAverage = calculateSubjectAverageForRows(
    next["과학"],
    options.gradeScoreMap,
    options.applyConvertedScore,
    options.applyUnitWeight,
    options.careerAchievementScores
  );

  if (socialAverage == null && scienceAverage == null) {
    return next;
  }

  if (socialAverage == null) {
    next["사회"] = [];
    return next;
  }

  if (scienceAverage == null) {
    next["과학"] = [];
    return next;
  }

  if (socialAverage >= scienceAverage) {
    next["과학"] = [];
  } else {
    next["사회"] = [];
  }

  return next;
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-5 md:px-6">
      <div className="mx-auto max-w-[1600px] space-y-5">{children}</div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  right,
  children,
}: {
  title: string;
  description?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-[18px] font-semibold tracking-tight text-slate-900">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
        {right ? <div>{right}</div> : null}
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-[52px] items-center rounded-full transition ${
        checked ? "bg-slate-900" : "bg-slate-300"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-7" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function ActionChip({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "blue" | "emerald" | "amber" | "rose";
}) {
  const toneClass =
    tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : tone === "rose"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${toneClass}`}
    >
      {children}
    </span>
  );
}

function TextField({
  value,
  onChange,
  placeholder,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`h-11 w-full rounded-full border bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 ${
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
          : "border-slate-200 text-slate-700 focus:border-slate-400 focus:ring-slate-200"
      }`}
    />
  );
}

function NumberField({
  value,
  onChange,
  placeholder,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      inputMode="decimal"
      placeholder={placeholder}
      disabled={disabled}
      className={`h-11 w-full rounded-full border bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 ${
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
          : "border-slate-200 text-slate-700 focus:border-slate-400 focus:ring-slate-200"
      }`}
    />
  );
}

function SelectField({
  value,
  onChange,
  placeholder,
  options,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className={`h-11 w-full rounded-full border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 ${
        disabled ? "cursor-not-allowed text-slate-400" : "text-slate-700"
      }`}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function SubjectHeader({
  label,
  subTag,
}: {
  label: string;
  subTag?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {subTag ? (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
          {subTag}
        </span>
      ) : null}
    </div>
  );
}

function FieldLabel({
  label,
  required = false,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {required ? (
        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600">
          필수
        </span>
      ) : (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
          선택
        </span>
      )}
    </div>
  );
}

function UniversityConversionPageContent() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState("");

  const [targetValues, setTargetValues] = useState<TargetValues>(
    initialTargetValues
  );

  const [admissionTargetCatalogRows, setAdmissionTargetCatalogRows] = useState<
    AdmissionTargetCatalogRow[]
  >([]);
  const [loadingAdmissionTargets, setLoadingAdmissionTargets] = useState(true);
  const [admissionTargetMessage, setAdmissionTargetMessage] = useState("");

  const [subjectCalculationMode, setSubjectCalculationMode] =
    useState<SubjectCalculationMode>(DEFAULT_SUBJECT_CALCULATION_MODE);
  const [integratedSelectionMode, setIntegratedSelectionMode] =
    useState<IntegratedSelectionMode>(DEFAULT_INTEGRATED_SELECTION_MODE);
  const [integratedTotalReflectionCount, setIntegratedTotalReflectionCount] =
    useState("12");
  const [
    integratedMaxCareerReflectionCount,
    setIntegratedMaxCareerReflectionCount,
  ] = useState("0");

  const [commonSubjectSelections, setCommonSubjectSelections] =
    useState<CommonSubjectSelections>(initialCommonSubjectSelections);
  const [commonUseAllSubjects, setCommonUseAllSubjects] =
    useState<CommonUseAllSubjects>(initialCommonUseAllSubjects);
  const [commonReflectionCounts, setCommonReflectionCounts] =
    useState<CommonReflectionCounts>(initialCommonReflectionCounts);
  const [commonWeights, setCommonWeights] =
    useState<CommonWeights>(initialCommonWeights);

  const [gradeScoreMap, setGradeScoreMap] =
    useState<Record<number, string>>(initialGradeScoreMap);

  const [careerSubjectSelections, setCareerSubjectSelections] =
    useState<CareerSubjectSelections>(initialCareerSubjectSelections);
  const [careerUseAllSubjects, setCareerUseAllSubjects] =
    useState<CareerUseAllSubjects>(initialCareerUseAllSubjects);
  const [careerReflectionCounts, setCareerReflectionCounts] =
    useState<CareerReflectionCounts>(initialCareerReflectionCounts);

  const [careerAchievementScores, setCareerAchievementScores] = useState<
    Record<string, string>
  >(initialCareerAchievementScores);
  const [careerAchievementFormulaName, setCareerAchievementFormulaName] =
    useState(INITIAL_CAREER_ACHIEVEMENT_FORMULA_NAME);
  const [careerAchievementFormulaBody, setCareerAchievementFormulaBody] =
    useState("");
  const [careerAchievementScoreMode, setCareerAchievementScoreMode] =
    useState<CareerAchievementScoreMode>("direct_score");
  const [achievementRatioScoreRows, setAchievementRatioScoreRows] = useState<
    AchievementRatioScoreRow[]
  >(normalizeAchievementRatioScoreRows(undefined, initialGradeScoreMap));

  const [attendanceRows, setAttendanceRows] =
    useState<AttendanceRow[]>(defaultAttendanceRows);

  const [formulaName, setFormulaName] = useState(INITIAL_FORMULA_NAME);
  const [formulaBody, setFormulaBody] = useState(
    getDefaultFormulaBody(DEFAULT_SUBJECT_CALCULATION_MODE)
  );
  const [formulaMemo, setFormulaMemo] = useState("");

  const [applyCustomCommonFormula, setApplyCustomCommonFormula] =
    useState(false);
  const [commonCustomFormulaBody, setCommonCustomFormulaBody] = useState("");

  const [socialScienceSelectionMode, setSocialScienceSelectionMode] =
    useState<SocialScienceSelectionMode>("combined_subjects");
  const [
    careerSocialScienceSelectionMode,
    setCareerSocialScienceSelectionMode,
  ] = useState<CareerSocialScienceSelectionMode>("separate");

  const [
    includeSecondForeignLanguageInEnglish,
    setIncludeSecondForeignLanguageInEnglish,
  ] = useState(false);
  const [includeKoreanHistoryInSocial, setIncludeKoreanHistoryInSocial] =
    useState(false);
  const [
    includeKoreanHistoryInSocialScience,
    setIncludeKoreanHistoryInSocialScience,
  ] = useState(false);
  const [
    includeKoreanHistoryInSocialWhenBestGroup,
    setIncludeKoreanHistoryInSocialWhenBestGroup,
  ] = useState(false);

  const [applyUnitWeight, setApplyUnitWeight] = useState(true);
  const [applyCommonWeight, setApplyCommonWeight] = useState(false);
  const [applyConvertedScore, setApplyConvertedScore] = useState(true);
  const [includeCommonSubjects, setIncludeCommonSubjects] = useState(true);
  const [includeRegularElectiveSubjects, setIncludeRegularElectiveSubjects] =
    useState(true);
  const [includeCareerSelectionSubjects, setIncludeCareerSelectionSubjects] =
    useState(true);
  const [includeSpecializedSubjects, setIncludeSpecializedSubjects] =
    useState(true);
  const [includeAttendance, setIncludeAttendance] = useState(false);

  const [loadingTestScore, setLoadingTestScore] = useState(true);
  const [testScoreMessage, setTestScoreMessage] = useState("");
  const [testSetId, setTestSetId] = useState<string | null>(null);
  const [testSetName, setTestSetName] = useState("");
  const [testRows, setTestRows] = useState<TestScoreRow[]>([]);
  const [testAttendance, setTestAttendance] =
    useState<TestScoreAttendance>(null);

  const [loadingRuleDetail, setLoadingRuleDetail] = useState(false);
  const [ruleDetailMessage, setRuleDetailMessage] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [savingAction, setSavingAction] = useState<SaveAction | null>(null);
  const [saveMessage, setSaveMessage] = useState<SaveMessageState>(null);

  useEffect(() => {
    let mounted = true;

    async function loadAdmissionTargetOptions() {
      setLoadingAdmissionTargets(true);
      setAdmissionTargetMessage("");

      try {
        const response = await fetch(
          "/api/admin/university-conversion/admission-result-options",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const json =
          (await response.json()) as AdmissionTargetOptionsApiResponse;

        if (!response.ok || !json.success) {
          throw new Error(
            json.message || "대학 / 전형 대상 옵션을 불러오지 못했습니다."
          );
        }

        if (!mounted) return;

        const normalizedRows = dedupeAdmissionTargetRows(
          (json.rows ?? [])
            .map((row) => normalizeAdmissionTargetRow(row))
            .filter((row): row is AdmissionTargetCatalogRow => row !== null)
        );

        setAdmissionTargetCatalogRows(normalizedRows);
      } catch (error) {
        if (!mounted) return;

        setAdmissionTargetMessage(
          error instanceof Error
            ? error.message
            : "대학 / 전형 대상 옵션을 불러오지 못했습니다."
        );
      } finally {
        if (!mounted) return;
        setLoadingAdmissionTargets(false);
      }
    }

    loadAdmissionTargetOptions();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadTestScore() {
      setLoadingTestScore(true);
      setTestScoreMessage("");

      try {
        const response = await fetch(
          "/api/admin/university-conversion/test-score",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const json = (await response.json()) as TestScoreApiResponse;

        if (!response.ok || !json.success) {
          throw new Error(
            json.message || "테스트 성적 데이터를 불러오지 못했습니다."
          );
        }

        if (!mounted) return;

        setTestSetId(json.testSetId ?? null);
        setTestSetName(json.testSetName ?? "");
        setTestRows(json.rows ?? []);
        setTestAttendance(json.attendance ?? null);
      } catch (error) {
        if (!mounted) return;

        setTestScoreMessage(
          error instanceof Error
            ? error.message
            : "테스트 성적 데이터를 불러오지 못했습니다."
        );
      } finally {
        if (!mounted) return;
        setLoadingTestScore(false);
      }
    }

    loadTestScore();

    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const nextIsEditMode = params.get("mode") === "edit";
    const nextRuleId = params.get("ruleId") ?? "";

    setIsEditMode(nextIsEditMode);
    setEditingRuleId(nextRuleId);

    if (!nextIsEditMode) return;

    setTargetValues({
      region: params.get("region") ?? "",
      university: params.get("university") ?? "",
      admissionType: params.get("admissionType") ?? "",
      admissionName: params.get("admissionName") ?? "",
      track: params.get("track") ?? "",
      collegeName: params.get("collegeName") ?? "",
      recruitmentUnit: params.get("recruitmentUnit") ?? "",
    });
  }, []);
  useEffect(() => {
    if (!isEditMode || !editingRuleId) return;

    let mounted = true;

    async function loadRuleDetail() {
      setLoadingRuleDetail(true);
      setRuleDetailMessage("");

      try {
        const response = await fetch(
          `/api/admin/university-conversion?ruleId=${encodeURIComponent(
            editingRuleId
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const json = (await response.json()) as RuleDetailApiResponse;

        if (!response.ok || !json.success || !json.data) {
          throw new Error(
            json.message || "수정 대상 환산규칙을 불러오지 못했습니다."
          );
        }

        if (!mounted) return;

        const data = json.data;

        const nextCommonReflectionCounts = mergeStringMap(
          emptyCommonReflectionCounts,
          data.commonReflectionCounts
        );

        const nextCommonWeights = mergeStringMap(
          emptyCommonWeights,
          data.commonWeights
        );

        const fallbackSelections = createBooleanMap(commonSubjectKeys, false);

        for (const subjectLabel of commonSubjectKeys) {
          const hasReflectionCount = Object.prototype.hasOwnProperty.call(
            data.commonReflectionCounts ?? {},
            subjectLabel
          );
          const hasWeight = Object.prototype.hasOwnProperty.call(
            data.commonWeights ?? {},
            subjectLabel
          );

          fallbackSelections[subjectLabel] = hasReflectionCount || hasWeight;
        }

        const nextCommonSubjectSelections = data.commonSubjectSelections
          ? mergeBooleanMap(
              createBooleanMap(commonSubjectKeys, false),
              data.commonSubjectSelections
            )
          : fallbackSelections;

        const nextCommonUseAllSubjects = mergeBooleanMap(
          createBooleanMap(commonSubjectKeys, false),
          data.commonUseAllSubjects
        );

        for (const subjectLabel of commonSubjectKeys) {
          if (nextCommonUseAllSubjects[subjectLabel]) {
            nextCommonReflectionCounts[subjectLabel] = "";
          }
        }

        const nextMode =
          data.subjectCalculationMode ??
          (data.useMixedSelectionMode ? "integrated" : "separate_weighted");

        const nextIntegratedSelectionMode =
          data.integratedSelectionMode ?? DEFAULT_INTEGRATED_SELECTION_MODE;

        const hasNewCareerSelections =
          data.careerSubjectSelections &&
          careerSubjectKeys.some((key) =>
            Object.prototype.hasOwnProperty.call(
              data.careerSubjectSelections,
              key
            )
          );

        const legacyCareerEnabled =
          data.careerGroupSettings?.enabled ??
          (data.careerSubjectSelections as Record<string, boolean> | undefined)
            ?.전체 ??
          data.switches?.includeCareerSubjects ??
          false;

        const legacyCareerUseAll =
          data.careerGroupSettings?.useAllSubjects ??
          (data.careerUseAllSubjects as Record<string, boolean> | undefined)
            ?.전체 ??
          false;

        const legacyCareerReflectionCount =
          data.careerGroupSettings?.reflectionCount ??
          (data.careerReflectionCounts as Record<string, string> | undefined)
            ?.전체 ??
          data.mixedMaxCareerSpecializedCount ??
          "1";

        const nextCareerSubjectSelections = hasNewCareerSelections
          ? mergeBooleanMap(
              initialCareerSubjectSelections,
              data.careerSubjectSelections as Partial<CareerSubjectSelections>
            )
          : createBooleanMap(careerSubjectKeys, legacyCareerEnabled);

        const nextCareerUseAllSubjects = hasNewCareerSelections
          ? mergeBooleanMap(
              initialCareerUseAllSubjects,
              data.careerUseAllSubjects as Partial<CareerUseAllSubjects>
            )
          : createBooleanMap(
              careerSubjectKeys,
              nextMode === "separate_weighted" ? legacyCareerUseAll : false
            );

        const nextCareerReflectionCounts = hasNewCareerSelections
          ? mergeStringMap(
              initialCareerReflectionCounts,
              data.careerReflectionCounts as Partial<CareerReflectionCounts>
            )
          : createStringMap(careerSubjectKeys, legacyCareerReflectionCount);

        if (nextMode === "integrated") {
          for (const subjectKey of careerSubjectKeys) {
            nextCareerUseAllSubjects[subjectKey] = false;
          }
        } else {
          for (const subjectKey of careerSubjectKeys) {
            if (nextCareerUseAllSubjects[subjectKey]) {
              nextCareerReflectionCounts[subjectKey] = "";
            }
          }
        }

        setTargetValues(data.targetValues);
        setSubjectCalculationMode(nextMode);
        setIntegratedSelectionMode(nextIntegratedSelectionMode);
        setIntegratedTotalReflectionCount(
          data.integratedTotalReflectionCount ??
            data.mixedTotalReflectionCount ??
            "12"
        );
        setIntegratedMaxCareerReflectionCount(
          data.integratedMaxCareerReflectionCount ??
            data.mixedMaxCareerSpecializedCount ??
            "0"
        );

        setCommonSubjectSelections(nextCommonSubjectSelections);
        setCommonUseAllSubjects(nextCommonUseAllSubjects);
        setCommonReflectionCounts(nextCommonReflectionCounts);
        setCommonWeights(nextCommonWeights);

        setGradeScoreMap((prev) => {
          const next = { ...prev };

          Object.entries(data.gradeScoreMap ?? {}).forEach(([grade, score]) => {
            next[Number(grade)] = score;
          });

          return next;
        });

        setCareerSubjectSelections(nextCareerSubjectSelections);
        setCareerUseAllSubjects(nextCareerUseAllSubjects);
        setCareerReflectionCounts(nextCareerReflectionCounts);

        setCareerAchievementScores((prev) => ({
          ...prev,
          ...data.careerAchievementScores,
        }));

        setCareerAchievementFormulaName(data.careerAchievementFormulaName ?? "");
        setCareerAchievementFormulaBody(data.careerAchievementFormulaBody ?? "");
        setCareerAchievementScoreMode(
          data.careerAchievementScoreMode ?? "direct_score"
        );
        setAchievementRatioScoreRows(
          normalizeAchievementRatioScoreRows(
            data.achievementRatioScoreRows,
            Object.fromEntries(
              Object.entries(data.gradeScoreMap ?? {}).map(([grade, score]) => [
                Number(grade),
                score,
              ])
            ) as Record<number, string>
          )
        );

        setAttendanceRows(
          Array.isArray(data.attendanceRows) && data.attendanceRows.length > 0
            ? data.attendanceRows
            : defaultAttendanceRows.map((row) => ({ ...row }))
        );

        setFormulaName(data.formulaName ?? "");
        setFormulaBody(data.formulaBody ?? getDefaultFormulaBody(nextMode));
        setFormulaMemo(data.formulaMemo ?? "");
        setApplyCustomCommonFormula(!!data.applyCustomCommonFormula);
        setCommonCustomFormulaBody(data.commonCustomFormulaBody ?? "");

        setSocialScienceSelectionMode(
          data.socialScienceSelectionMode ?? "combined_subjects"
        );
        setCareerSocialScienceSelectionMode(
          data.careerSocialScienceSelectionMode ?? "separate"
        );
        setIncludeSecondForeignLanguageInEnglish(
          !!data.includeSecondForeignLanguageInEnglish
        );
        setIncludeKoreanHistoryInSocial(!!data.includeKoreanHistoryInSocial);
        setIncludeKoreanHistoryInSocialScience(
          !!data.includeKoreanHistoryInSocialScience
        );
        setIncludeKoreanHistoryInSocialWhenBestGroup(
          !!data.includeKoreanHistoryInSocialWhenBestGroup
        );

        setApplyUnitWeight(data.switches.applyUnitWeight);
        setApplyCommonWeight(data.switches.applyCommonWeight);
        setApplyConvertedScore(data.switches.applyConvertedScore);
        setIncludeCommonSubjects(data.switches.includeCommonSubjects ?? true);
        setIncludeRegularElectiveSubjects(
          data.switches.includeRegularElectiveSubjects ?? true
        );
        setIncludeCareerSelectionSubjects(
          data.switches.includeCareerSelectionSubjects ?? true
        );
        setIncludeSpecializedSubjects(
          data.switches.includeSpecializedSubjects ?? true
        );
        setIncludeAttendance(data.switches.includeAttendance);
      } catch (error) {
        if (!mounted) return;

        setRuleDetailMessage(
          error instanceof Error
            ? error.message
            : "수정 대상 환산규칙을 불러오지 못했습니다."
        );
      } finally {
        if (!mounted) return;
        setLoadingRuleDetail(false);
      }
    }

    loadRuleDetail();

    return () => {
      mounted = false;
    };
  }, [editingRuleId, isEditMode]);

  const regionOptions = useMemo(() => {
    return uniqueStrings(admissionTargetCatalogRows.map((row) => row.region));
  }, [admissionTargetCatalogRows]);

  const universityOptions = useMemo(() => {
    if (!targetValues.region) return [];
    return uniqueStrings(
      admissionTargetCatalogRows
        .filter((row) => row.region === targetValues.region)
        .map((row) => row.university)
    );
  }, [admissionTargetCatalogRows, targetValues.region]);

  const admissionTypeOptions = useMemo(() => {
    if (!targetValues.region || !targetValues.university) return [];
    return uniqueStrings(
      admissionTargetCatalogRows
        .filter(
          (row) =>
            row.region === targetValues.region &&
            row.university === targetValues.university
        )
        .map((row) => row.admissionType)
    );
  }, [
    admissionTargetCatalogRows,
    targetValues.region,
    targetValues.university,
  ]);

  const trackOptions = useMemo(() => {
    if (
      !targetValues.region ||
      !targetValues.university ||
      !targetValues.admissionType
    ) {
      return [];
    }

    return uniqueStrings(
      admissionTargetCatalogRows
        .filter(
          (row) =>
            row.region === targetValues.region &&
            row.university === targetValues.university &&
            row.admissionType === targetValues.admissionType
        )
        .map((row) => row.track)
    );
  }, [
    admissionTargetCatalogRows,
    targetValues.admissionType,
    targetValues.region,
    targetValues.university,
  ]);

  const admissionNameOptions = useMemo(() => {
    if (
      !targetValues.region ||
      !targetValues.university ||
      !targetValues.admissionType ||
      !targetValues.track
    ) {
      return [];
    }

    return uniqueStrings(
      admissionTargetCatalogRows
        .filter(
          (row) =>
            row.region === targetValues.region &&
            row.university === targetValues.university &&
            row.admissionType === targetValues.admissionType &&
            row.track === targetValues.track
        )
        .map((row) => row.admissionName)
    );
  }, [
    admissionTargetCatalogRows,
    targetValues.admissionType,
    targetValues.region,
    targetValues.track,
    targetValues.university,
  ]);

  const collegeNameOptions = useMemo(() => {
    if (
      !targetValues.region ||
      !targetValues.university ||
      !targetValues.admissionType ||
      !targetValues.track ||
      !targetValues.admissionName
    ) {
      return [];
    }

    return uniqueStrings(
      admissionTargetCatalogRows
        .filter(
          (row) =>
            row.region === targetValues.region &&
            row.university === targetValues.university &&
            row.admissionType === targetValues.admissionType &&
            row.track === targetValues.track &&
            row.admissionName === targetValues.admissionName
        )
        .map((row) => row.collegeName)
    );
  }, [
    admissionTargetCatalogRows,
    targetValues.admissionType,
    targetValues.region,
    targetValues.track,
    targetValues.admissionName,
    targetValues.university,
  ]);

  const recruitmentUnitOptions = useMemo(() => {
    if (
      !targetValues.region ||
      !targetValues.university ||
      !targetValues.admissionType ||
      !targetValues.admissionName ||
      !targetValues.track
    ) {
      return [];
    }

    return uniqueStrings(
      admissionTargetCatalogRows
        .filter((row) => {
          if (row.region !== targetValues.region) return false;
          if (row.university !== targetValues.university) return false;
          if (row.admissionType !== targetValues.admissionType) return false;
          if (row.admissionName !== targetValues.admissionName) return false;
          if (row.track !== targetValues.track) return false;
          if (
            targetValues.collegeName &&
            row.collegeName !== targetValues.collegeName
          ) {
            return false;
          }
          return true;
        })
        .map((row) => row.recruitmentUnit)
    );
  }, [
    admissionTargetCatalogRows,
    targetValues.admissionName,
    targetValues.admissionType,
    targetValues.collegeName,
    targetValues.region,
    targetValues.track,
    targetValues.university,
  ]);

  const targetMatchRows = useMemo(() => {
    return admissionTargetCatalogRows.filter((row) => {
      if (targetValues.region && row.region !== targetValues.region) return false;
      if (targetValues.university && row.university !== targetValues.university) {
        return false;
      }
      if (
        targetValues.admissionType &&
        row.admissionType !== targetValues.admissionType
      ) {
        return false;
      }
      if (
        targetValues.admissionName &&
        row.admissionName !== targetValues.admissionName
      ) {
        return false;
      }
      if (targetValues.track && row.track !== targetValues.track) return false;
      if (
        targetValues.collegeName &&
        row.collegeName !== targetValues.collegeName
      ) {
        return false;
      }
      if (
        targetValues.recruitmentUnit &&
        row.recruitmentUnit !== targetValues.recruitmentUnit
      ) {
        return false;
      }
      return true;
    });
  }, [admissionTargetCatalogRows, targetValues]);

  const requiredTargetReady = useMemo(() => {
    return (
      !!targetValues.region &&
      !!targetValues.university &&
      !!targetValues.admissionType
    );
  }, [targetValues]);

  const canActivateSave =
    requiredTargetReady && !loadingAdmissionTargets && !loadingTestScore;

const targetApplyScopeMessage = useMemo(() => {
  if (!requiredTargetReady) {
    return "지역, 대학, 전형유형을 선택하면 실제 반영 범위를 확인할 수 있습니다.";
  }

  if (targetValues.recruitmentUnit) {
    return "현재 모드: 선택한 모집단위 1건에만 같은 성적을 반영합니다. 같은 단과대학에 더 넓은 규칙이 있어도 모집단위 규칙이 가장 먼저 적용됩니다.";
  }

  if (targetValues.collegeName) {
    return `현재 모드: 지역부터 단과대학까지 일치하는 모든 모집단위 ${targetMatchRows.length}건에 같은 성적을 반영합니다. 단, 같은 단과대학 안에 모집단위까지 별도 설정한 규칙이 있으면 해당 모집단위에는 그 규칙이 우선 적용됩니다.`;
  }

  if (targetValues.admissionName) {
    return `현재 모드: 지역부터 전형명까지 일치하는 모든 모집단위 ${targetMatchRows.length}건에 같은 성적을 반영합니다. 단과대학 또는 모집단위까지 더 세부적으로 설정된 규칙이 있으면 그 규칙이 먼저 적용됩니다.`;
  }

  if (targetValues.track) {
    return `현재 모드: 지역부터 계열까지 일치하는 모든 모집단위 ${targetMatchRows.length}건에 같은 성적을 반영합니다. 전형명, 단과대학, 모집단위 규칙이 있으면 더 세부적인 규칙이 우선 적용됩니다.`;
  }

  return `현재 모드: 지역부터 전형유형까지 일치하는 모든 모집단위 ${targetMatchRows.length}건에 같은 성적을 반영합니다.`;
}, [
  requiredTargetReady,
  targetMatchRows.length,
  targetValues.admissionName,
  targetValues.collegeName,
  targetValues.recruitmentUnit,
  targetValues.track,
]);

const targetApplyScopeChipLabel = useMemo(() => {
  if (!requiredTargetReady) {
    return "적용 범위 확인 전";
  }

  if (targetValues.recruitmentUnit) {
    return "모집단위 우선 적용";
  }

  if (targetValues.collegeName) {
    return "단과대학 기준 적용";
  }

  if (targetValues.admissionName) {
    return "전형명 기준 적용";
  }

  if (targetValues.track) {
    return "계열 기준 적용";
  }

  return "전형유형 기준 적용";
}, [
  requiredTargetReady,
  targetValues.admissionName,
  targetValues.collegeName,
  targetValues.recruitmentUnit,
  targetValues.track,
]);

  const filledTestRows = useMemo(() => {
    return testRows.filter((row) =>
      [
        row.academicTerm,
        row.subjectGroup,
        row.completionType,
        row.subjectName,
        row.credits,
        row.rawScore,
        row.averageScore,
        row.standardDeviation,
        row.achievement,
        row.grade,
      ].some((value) => value?.trim())
    );
  }, [testRows]);

  const commonTestRows = useMemo(() => {
    return filledTestRows.filter(
      (row) =>
        !isCareerOrSpecializedRow(row) &&
        shouldIncludeCommonPoolRow(
          row,
          includeCommonSubjects,
          includeRegularElectiveSubjects
        )
    );
  }, [filledTestRows, includeCommonSubjects, includeRegularElectiveSubjects]);

  const careerTestRows = useMemo(() => {
    return filledTestRows.filter(
      (row) =>
        isCareerOrSpecializedRow(row) &&
        shouldIncludeCareerPoolRow(
          row,
          includeCareerSelectionSubjects,
          includeSpecializedSubjects
        )
    );
  }, [
    filledTestRows,
    includeCareerSelectionSubjects,
    includeSpecializedSubjects,
  ]);

  const selectedCommonSubjectLabels = useMemo(() => {
    return commonSubjectKeys.filter(
      (subjectLabel) => commonSubjectSelections[subjectLabel] === true
    );
  }, [commonSubjectSelections]);

  const selectedCareerSubjectLabels = useMemo(() => {
    return careerSubjectKeys.filter(
      (subjectLabel) => careerSubjectSelections[subjectLabel] === true
    );
  }, [careerSubjectSelections]);

  const hasSelectedCareerSubjects = selectedCareerSubjectLabels.length > 0;
  const hasEnabledCareerCategory =
    includeCareerSelectionSubjects || includeSpecializedSubjects;
  const hasActiveCareerSelection =
    hasSelectedCareerSubjects && hasEnabledCareerCategory;

  const isCareerAchievementInputDisabled =
    subjectCalculationMode === "integrated"
      ? isSaving
      : !hasActiveCareerSelection || isSaving;

  const careerAchievementSectionTitle =
    subjectCalculationMode === "integrated"
      ? "통합 선발형 진로선택/전문교과 성취도 환산 설정"
      : "진로선택/전문교과 반영 설정";

  const integratedSelectionModeLabel =
    integratedSelectionMode === "all_selected"
      ? "선택 교과 전체 반영"
      : "과목수 제한 반영";

  const effectiveCareerSocialScienceSelectionMode = useMemo(() => {
    return resolveEffectiveCareerSocialScienceSelectionMode({
      subjectCalculationMode,
      socialScienceSelectionMode,
      careerSocialScienceSelectionMode,
    });
  }, [
    careerSocialScienceSelectionMode,
    socialScienceSelectionMode,
    subjectCalculationMode,
  ]);

  useEffect(() => {
    if (
      subjectCalculationMode === "integrated" &&
      socialScienceSelectionMode === "best_group" &&
      careerSocialScienceSelectionMode !== "best_group"
    ) {
      setCareerSocialScienceSelectionMode("best_group");
    }
  }, [
    careerSocialScienceSelectionMode,
    socialScienceSelectionMode,
    subjectCalculationMode,
  ]);

  function resetFormInputs() {
    setTargetValues({ ...initialTargetValues });
    setSubjectCalculationMode(DEFAULT_SUBJECT_CALCULATION_MODE);
    setIntegratedSelectionMode(DEFAULT_INTEGRATED_SELECTION_MODE);
    setIntegratedTotalReflectionCount("12");
    setIntegratedMaxCareerReflectionCount("0");

    setCommonSubjectSelections({ ...initialCommonSubjectSelections });
    setCommonUseAllSubjects({ ...initialCommonUseAllSubjects });
    setCommonReflectionCounts({ ...initialCommonReflectionCounts });
    setCommonWeights({ ...initialCommonWeights });

    setGradeScoreMap({ ...initialGradeScoreMap });

    setCareerSubjectSelections({ ...initialCareerSubjectSelections });
    setCareerUseAllSubjects({ ...initialCareerUseAllSubjects });
    setCareerReflectionCounts({ ...initialCareerReflectionCounts });
    setCareerAchievementScores({ ...initialCareerAchievementScores });
    setCareerAchievementFormulaName(INITIAL_CAREER_ACHIEVEMENT_FORMULA_NAME);
    setCareerAchievementFormulaBody("");
    setCareerAchievementScoreMode("direct_score");
    setAchievementRatioScoreRows(
      normalizeAchievementRatioScoreRows(undefined, initialGradeScoreMap)
    );

    setAttendanceRows(defaultAttendanceRows.map((row) => ({ ...row })));

    setFormulaName(INITIAL_FORMULA_NAME);
    setFormulaBody(getDefaultFormulaBody(DEFAULT_SUBJECT_CALCULATION_MODE));
    setFormulaMemo("");

    setApplyCustomCommonFormula(false);
    setCommonCustomFormulaBody("");

    setSocialScienceSelectionMode("combined_subjects");
    setCareerSocialScienceSelectionMode("separate");
    setIncludeSecondForeignLanguageInEnglish(false);
    setIncludeKoreanHistoryInSocial(false);
    setIncludeKoreanHistoryInSocialScience(false);
    setIncludeKoreanHistoryInSocialWhenBestGroup(false);

    setApplyUnitWeight(true);
    setApplyCommonWeight(false);
    setApplyConvertedScore(true);
    setIncludeCommonSubjects(true);
    setIncludeRegularElectiveSubjects(true);
    setIncludeCareerSelectionSubjects(true);
    setIncludeSpecializedSubjects(true);
    setIncludeAttendance(false);

    setSaveMessage(null);
    setRuleDetailMessage("");
  }

  function updateTargetValue<K extends keyof TargetValues>(
    key: K,
    value: TargetValues[K]
  ) {
    setTargetValues((prev) => {
      if (key === "region") {
        return {
          ...prev,
          region: value,
          university: "",
          admissionType: "",
          admissionName: "",
          track: "",
          collegeName: "",
          recruitmentUnit: "",
        };
      }

      if (key === "university") {
        return {
          ...prev,
          university: value,
          admissionType: "",
          admissionName: "",
          track: "",
          collegeName: "",
          recruitmentUnit: "",
        };
      }

      if (key === "admissionType") {
        return {
          ...prev,
          admissionType: value,
          admissionName: "",
          track: "",
          collegeName: "",
          recruitmentUnit: "",
        };
      }

      if (key === "track") {
        return {
          ...prev,
          track: value,
          admissionName: "",
          collegeName: "",
          recruitmentUnit: "",
        };
      }

      if (key === "track") {
        return {
          ...prev,
          track: value,
          admissionName: "",
          collegeName: "",
          recruitmentUnit: "",
        };
      }

      if (key === "admissionName") {
        return {
          ...prev,
          admissionName: value,
          collegeName: "",
          recruitmentUnit: "",
        };
      }

      return {
        ...prev,
        [key]: value,
      };
    });
  }
  function handleChangeSubjectCalculationMode(nextMode: SubjectCalculationMode) {
    const previousDefault = getDefaultFormulaBody(subjectCalculationMode);
    const nextDefault = getDefaultFormulaBody(nextMode);

    setSubjectCalculationMode(nextMode);
    setFormulaBody((prev) => {
      const trimmed = normalizeText(prev);

      if (
        !trimmed ||
        trimmed === previousDefault ||
        trimmed === DEFAULT_SEPARATE_FORMULA_BODY ||
        trimmed === DEFAULT_INTEGRATED_FORMULA_BODY ||
        trimmed === LEGACY_DEFAULT_INTEGRATED_FORMULA_BODY
      ) {
        return nextDefault;
      }

      return prev;
    });

    if (nextMode === "integrated") {
      setCareerUseAllSubjects(createBooleanMap(careerSubjectKeys, false));
    }
  }

  function handleChangeCommonSubjectSelection(
    subjectLabel: string,
    checked: boolean
  ) {
    setCommonSubjectSelections((prev) => ({
      ...prev,
      [subjectLabel]: checked,
    }));

    if (checked) {
      setCommonReflectionCounts((prev) => ({
        ...prev,
        [subjectLabel]:
          prev[subjectLabel] || initialCommonReflectionCounts[subjectLabel] || "",
      }));

      setCommonWeights((prev) => ({
        ...prev,
        [subjectLabel]:
          prev[subjectLabel] || initialCommonWeights[subjectLabel] || "",
      }));

      return;
    }

    setCommonUseAllSubjects((prev) => ({
      ...prev,
      [subjectLabel]: false,
    }));

    setCommonReflectionCounts((prev) => ({
      ...prev,
      [subjectLabel]: "",
    }));

    setCommonWeights((prev) => ({
      ...prev,
      [subjectLabel]: "",
    }));
  }

  function handleChangeCommonUseAllSubjects(
    subjectLabel: string,
    checked: boolean
  ) {
    if (!commonSubjectSelections[subjectLabel]) return;
    if (subjectCalculationMode === "integrated") return;

    setCommonUseAllSubjects((prev) => ({
      ...prev,
      [subjectLabel]: checked,
    }));

    setCommonReflectionCounts((prev) => ({
      ...prev,
      [subjectLabel]: checked
        ? ""
        : prev[subjectLabel] || initialCommonReflectionCounts[subjectLabel] || "",
    }));
  }

  function handleChangeCommonReflectionCount(
    subjectLabel: string,
    value: string
  ) {
    if (!commonSubjectSelections[subjectLabel]) return;
    if (commonUseAllSubjects[subjectLabel]) return;
    if (subjectCalculationMode === "integrated") return;

    setCommonReflectionCounts((prev) => ({
      ...prev,
      [subjectLabel]: value,
    }));
  }

  function handleChangeCommonWeight(subjectLabel: string, value: string) {
    if (!commonSubjectSelections[subjectLabel]) return;

    setCommonWeights((prev) => ({
      ...prev,
      [subjectLabel]: value,
    }));
  }

  function handleChangeCareerSubjectSelection(
    subjectLabel: CareerSubjectKey,
    checked: boolean
  ) {
    setCareerSubjectSelections((prev) => ({
      ...prev,
      [subjectLabel]: checked,
    }));

    if (checked) {
      setCareerReflectionCounts((prev) => ({
        ...prev,
        [subjectLabel]:
          prev[subjectLabel] || initialCareerReflectionCounts[subjectLabel] || "",
      }));
      return;
    }

    setCareerUseAllSubjects((prev) => ({
      ...prev,
      [subjectLabel]: false,
    }));

    setCareerReflectionCounts((prev) => ({
      ...prev,
      [subjectLabel]: "",
    }));
  }

  function handleChangeCareerUseAllSubjects(
    subjectLabel: CareerSubjectKey,
    checked: boolean
  ) {
    if (!careerSubjectSelections[subjectLabel]) return;
    if (subjectCalculationMode === "integrated") return;

    setCareerUseAllSubjects((prev) => ({
      ...prev,
      [subjectLabel]: checked,
    }));

    setCareerReflectionCounts((prev) => ({
      ...prev,
      [subjectLabel]: checked
        ? ""
        : prev[subjectLabel] || initialCareerReflectionCounts[subjectLabel] || "",
    }));
  }

  function handleChangeCareerReflectionCount(
    subjectLabel: CareerSubjectKey,
    value: string
  ) {
    if (!careerSubjectSelections[subjectLabel]) return;
    if (careerUseAllSubjects[subjectLabel]) return;
    if (subjectCalculationMode === "integrated") return;

    setCareerReflectionCounts((prev) => ({
      ...prev,
      [subjectLabel]: value,
    }));
  }

  function normalizeCommonSubjectPayload() {
    const nextSelections: CommonSubjectSelections = {};
    const nextUseAllSubjects: CommonUseAllSubjects = {};
    const nextReflectionCounts: CommonReflectionCounts = {};
    const nextWeights: CommonWeights = {};

    for (const subjectLabel of commonSubjectKeys) {
      const selected = commonSubjectSelections[subjectLabel] === true;

      nextSelections[subjectLabel] = selected;

      if (!selected) {
        nextUseAllSubjects[subjectLabel] = false;
        nextReflectionCounts[subjectLabel] = "";
        nextWeights[subjectLabel] = "";
        continue;
      }

      const useAllSubjects =
        subjectCalculationMode !== "integrated" &&
        commonUseAllSubjects[subjectLabel] === true;

      nextUseAllSubjects[subjectLabel] = useAllSubjects;
      nextReflectionCounts[subjectLabel] = useAllSubjects
        ? ""
        : commonReflectionCounts[subjectLabel] ?? "";
      nextWeights[subjectLabel] = commonWeights[subjectLabel] ?? "";
    }

    return {
      commonSubjectSelections: nextSelections,
      commonUseAllSubjects: nextUseAllSubjects,
      commonReflectionCounts: nextReflectionCounts,
      commonWeights: nextWeights,
    };
  }

  function normalizeCareerSubjectPayload() {
    const nextSelections = { ...initialCareerSubjectSelections };
    const nextUseAllSubjects = { ...initialCareerUseAllSubjects };
    const nextReflectionCounts = { ...initialCareerReflectionCounts };
    for (const subjectLabel of careerSubjectKeys) {
      const selected = careerSubjectSelections[subjectLabel] === true;

      nextSelections[subjectLabel] = selected;

      if (!selected) {
        nextUseAllSubjects[subjectLabel] = false;
        nextReflectionCounts[subjectLabel] = "";
        continue;
      }

      if (subjectCalculationMode === "integrated") {
        nextUseAllSubjects[subjectLabel] = false;
        nextReflectionCounts[subjectLabel] = "";
        continue;
      }

      const useAllSubjects = careerUseAllSubjects[subjectLabel] === true;
      nextUseAllSubjects[subjectLabel] = useAllSubjects;
      nextReflectionCounts[subjectLabel] = useAllSubjects
        ? ""
        : careerReflectionCounts[subjectLabel] ?? "";
    }

    return {
      careerSubjectSelections: nextSelections,
      careerUseAllSubjects: nextUseAllSubjects,
      careerReflectionCounts: nextReflectionCounts,
    };
  }

  function validateCommonSubjectInputs() {
    const selectedSubjects = commonSubjectKeys.filter(
      (subjectLabel) => commonSubjectSelections[subjectLabel] === true
    );

    if (selectedSubjects.length === 0) {
      return "공통/일반선택 반영 교과를 최소 1개 이상 선택해 주세요.";
    }

    if (subjectCalculationMode === "integrated") {
      if (integratedSelectionMode === "count_limit") {
        const totalReflectionCount = getReflectionCount(
          integratedTotalReflectionCount
        );
        const maxCareerReflectionCount = getReflectionCount(
          integratedMaxCareerReflectionCount
        );

        if (totalReflectionCount <= 0) {
          return "통합 선발형에서 과목수 제한 반영을 선택한 경우 전체 반영과목수를 1 이상 입력해 주세요.";
        }

        if (maxCareerReflectionCount > totalReflectionCount) {
          return "진로선택/전문교과 최대 과목수는 전체 반영과목수보다 클 수 없습니다.";
        }
      }

      for (const subjectLabel of selectedSubjects) {
        const weight = normalizeText(commonWeights[subjectLabel]);

        if (applyCommonWeight && !weight) {
          return `${subjectLabel} 가중치를 입력해 주세요.`;
        }
      }

      return null;
    }

    for (const subjectLabel of selectedSubjects) {
      const useAllSubjects = commonUseAllSubjects[subjectLabel] === true;
      const reflectionCount = getReflectionCount(
        commonReflectionCounts[subjectLabel]
      );
      const weight = normalizeText(commonWeights[subjectLabel]);

      if (!useAllSubjects && reflectionCount <= 0) {
        return `${subjectLabel} 반영 과목 수를 입력해 주세요.`;
      }

      if (applyCommonWeight && !weight) {
        return `${subjectLabel} 가중치를 입력해 주세요.`;
      }
    }

    return null;
  }

  function validateCareerGroupInputs() {
    if (!hasActiveCareerSelection) {
      return null;
    }

    if (careerAchievementScoreMode === "direct_score") {
      for (const level of ["A", "B", "C"] as const) {
        if (parseNumber(careerAchievementScores[level]) == null) {
          return `성취도 ${level} 점수를 입력해 주세요.`;
        }
      }
    } else {
      for (const level of ["A", "B", "C"] as const) {
        const inputGrade = careerAchievementScores[level] ?? "";
        if (parseNumber(inputGrade) == null) {
          return `성취도 ${level} 대응 등급을 입력해 주세요.`;
        }

        if (
          resolveAchievementRatioConvertedScore(
            inputGrade,
            achievementRatioScoreRows,
            gradeScoreMap
          ) == null
        ) {
          return `성취도 ${level} 대응 등급에 맞는 성취도 비율법 환산점수를 입력해 주세요.`;
        }
      }
    }

    if (subjectCalculationMode === "integrated") {
      return null;
    }

    for (const subjectLabel of selectedCareerSubjectLabels) {
      const useAllSubjects = careerUseAllSubjects[subjectLabel] === true;
      const reflectionCount = getReflectionCount(
        careerReflectionCounts[subjectLabel]
      );

      if (!useAllSubjects && reflectionCount <= 0) {
        return `${subjectLabel} 진로선택/전문교과 반영 과목 수를 입력해 주세요.`;
      }
    }

    return null;
  }

  const effectiveCareerAchievementScores = useMemo(
    () =>
      resolveCareerAchievementScoreInputs(
        careerAchievementScoreMode,
        careerAchievementScores,
        achievementRatioScoreRows,
        gradeScoreMap
      ),
    [
      achievementRatioScoreRows,
      careerAchievementScoreMode,
      careerAchievementScores,
      gradeScoreMap,
    ]
  );

  const integratedSelectionResult = useMemo(() => {
    const emptyCommonGrouped = createRowMap(commonSubjectKeys);
    const emptyCareerGrouped = createRowMap(careerSubjectKeys);

    if (subjectCalculationMode !== "integrated") {
      return {
        commonGrouped: emptyCommonGrouped,
        careerGrouped: emptyCareerGrouped,
        selectedRows: [] as TestScoreRow[],
        selectedCareerRows: [] as TestScoreRow[],
      };
    }

    const isCountLimited = integratedSelectionMode === "count_limit";
    const totalLimit = isCountLimited
      ? getReflectionCount(integratedTotalReflectionCount)
      : 0;
    const maxCareerLimit = isCountLimited
      ? getReflectionCount(integratedMaxCareerReflectionCount)
      : 0;

    if (isCountLimited && totalLimit <= 0) {
      return {
        commonGrouped: emptyCommonGrouped,
        careerGrouped: emptyCareerGrouped,
        selectedRows: [] as TestScoreRow[],
        selectedCareerRows: [] as TestScoreRow[],
      };
    }

    type IntegratedCandidate =
      | {
          row: TestScoreRow;
          kind: "career";
          commonSubject: string;
          careerSubject: CareerSubjectKey;
          bestGroupBucket: null;
        }
      | {
          row: TestScoreRow;
          kind: "common";
          commonSubject: string;
          careerSubject: null;
          bestGroupBucket: "social" | "science" | null;
        };

    const rawCandidates: Array<IntegratedCandidate | null> = filledTestRows.map(
      (row) => {
        if (isCareerOrSpecializedRow(row)) {
          if (
            !shouldIncludeCareerPoolRow(
              row,
              includeCareerSelectionSubjects,
              includeSpecializedSubjects
            )
          ) {
            return null;
          }

          const assignedCareerSubject = getMatchedCareerSubjectLabelForSelection(
            row,
            selectedCareerSubjectLabels
          );

          if (!assignedCareerSubject) {
            return null;
          }

          return {
            row,
            kind: "career",
            commonSubject: assignedCareerSubject,
            careerSubject: assignedCareerSubject,
            bestGroupBucket: null,
          };
        }

        if (
          !shouldIncludeCommonPoolRow(
            row,
            includeCommonSubjects,
            includeRegularElectiveSubjects
          )
        ) {
          return null;
        }

        const useIntegratedBestGroupForCommon =
          socialScienceSelectionMode === "best_group" &&
          selectedCommonSubjectLabels.includes("사회/과학");

        if (useIntegratedBestGroupForCommon) {
          const bestGroupBucket =
            isSocialRow(row) ||
            (includeKoreanHistoryInSocialWhenBestGroup && isKoreanHistoryRow(row))
              ? "social"
              : isScienceRow(row)
              ? "science"
              : null;

          if (bestGroupBucket) {
            return {
              row,
              kind: "common",
              commonSubject: "사회/과학",
              careerSubject: null,
              bestGroupBucket,
            };
          }
        }

        const assignedCommonSubject = getMatchedCommonSubjectLabelForSelection(
          row,
          selectedCommonSubjectLabels,
          {
            includeSecondForeignLanguageInEnglish,
            includeKoreanHistoryInSocial,
            includeKoreanHistoryInSocialScience,
            socialScienceSelectionMode,
          }
        );

        if (!assignedCommonSubject) {
          return null;
        }

        return {
          row,
          kind: "common",
          commonSubject: assignedCommonSubject,
          careerSubject: null,
          bestGroupBucket: null,
        };
      }
    );

    const candidates: IntegratedCandidate[] = (() => {
      const sortedCandidates = rawCandidates
        .filter((item): item is IntegratedCandidate => item !== null)
        .sort((a, b) => compareRowsForSelection(a.row, b.row));

      const useIntegratedBestGroupForCommon =
        socialScienceSelectionMode === "best_group" &&
        selectedCommonSubjectLabels.includes("사회/과학");

      if (!useIntegratedBestGroupForCommon) {
        return sortedCandidates;
      }

      const socialCandidates = sortedCandidates.filter(
        (candidate) =>
          candidate.kind === "common" &&
          candidate.commonSubject === "사회/과학" &&
          candidate.bestGroupBucket === "social"
      );
      const scienceCandidates = sortedCandidates.filter(
        (candidate) =>
          candidate.kind === "common" &&
          candidate.commonSubject === "사회/과학" &&
          candidate.bestGroupBucket === "science"
      );

      const socialAverage = calculateSubjectAverageForRows(
        socialCandidates.map((candidate) => candidate.row),
        gradeScoreMap,
        applyConvertedScore,
        applyUnitWeight,
        effectiveCareerAchievementScores
      );
      const scienceAverage = calculateSubjectAverageForRows(
        scienceCandidates.map((candidate) => candidate.row),
        gradeScoreMap,
        applyConvertedScore,
        applyUnitWeight,
        effectiveCareerAchievementScores
      );

      const pickedBucket =
        socialAverage == null && scienceAverage == null
          ? null
          : socialAverage == null
          ? "science"
          : scienceAverage == null
          ? "social"
          : socialAverage >= scienceAverage
          ? "social"
          : "science";

      return sortedCandidates.filter((candidate) => {
        if (
          candidate.kind !== "common" ||
          candidate.commonSubject !== "사회/과학"
        ) {
          return true;
        }

        if (pickedBucket == null) {
          return false;
        }

        return candidate.bestGroupBucket === pickedBucket;
      });
    })();

    const commonGrouped = createRowMap(commonSubjectKeys);
    const careerGrouped = createRowMap(careerSubjectKeys);
    const selectedRows: TestScoreRow[] = [];
    const selectedCareerRows: TestScoreRow[] = [];

    const applyCandidate = (candidate: IntegratedCandidate) => {
      commonGrouped[candidate.commonSubject].push(candidate.row);
      selectedRows.push(candidate.row);

      if (candidate.kind === "career" && candidate.careerSubject) {
        careerGrouped[candidate.careerSubject].push(candidate.row);
        selectedCareerRows.push(candidate.row);
      }
    };

    if (!isCountLimited) {
      for (const candidate of candidates) {
        applyCandidate(candidate);
      }

      return {
        commonGrouped,
        careerGrouped,
        selectedRows,
        selectedCareerRows,
      };
    }

    if (maxCareerLimit <= 0) {
      for (const candidate of candidates) {
        if (selectedRows.length >= totalLimit) {
          break;
        }
        applyCandidate(candidate);
      }

      return {
        commonGrouped,
        careerGrouped,
        selectedRows,
        selectedCareerRows,
      };
    }

    let selectedCareerCount = 0;

    for (const candidate of candidates) {
      if (selectedRows.length >= totalLimit) {
        break;
      }

      if (candidate.kind === "career") {
        if (selectedCareerCount >= maxCareerLimit) {
          continue;
        }

        applyCandidate(candidate);
        selectedCareerCount += 1;
        continue;
      }

      applyCandidate(candidate);
    }

    return {
      commonGrouped,
      careerGrouped,
      selectedRows,
      selectedCareerRows,
    };
  }, [
    filledTestRows,
    includeCommonSubjects,
    includeRegularElectiveSubjects,
    includeCareerSelectionSubjects,
    includeSpecializedSubjects,
    includeKoreanHistoryInSocial,
    includeKoreanHistoryInSocialScience,
    includeKoreanHistoryInSocialWhenBestGroup,
    includeSecondForeignLanguageInEnglish,
    integratedSelectionMode,
    integratedTotalReflectionCount,
    integratedMaxCareerReflectionCount,
    selectedCareerSubjectLabels,
    selectedCommonSubjectLabels,
    socialScienceSelectionMode,
    gradeScoreMap,
    applyConvertedScore,
    applyUnitWeight,
    effectiveCareerAchievementScores,
    subjectCalculationMode,
  ]);

  const selectedCommonRowsBySubject = useMemo(() => {
    if (subjectCalculationMode === "integrated") {
      return integratedSelectionResult.commonGrouped;
    }

    const grouped = createRowMap(commonSubjectKeys);
    const usedIndexes = new Set<number>();

    const pickRows = (
      candidates: Array<{ row: TestScoreRow; index: number }>,
      useAllSubjects: boolean,
      reflectionCount: number
    ) => {
      return useAllSubjects ? candidates : candidates.slice(0, reflectionCount);
    };

    for (const subjectLabel of commonSubjectProcessingOrder) {
      const isSelected = commonSubjectSelections[subjectLabel] === true;

      if (!isSelected) continue;

      const useAllSubjects = commonUseAllSubjects[subjectLabel] === true;
      const reflectionCount = getReflectionCount(
        commonReflectionCounts[subjectLabel]
      );

      if (subjectLabel === "사회/과학") {
        if (socialScienceSelectionMode === "best_group") {
          const socialCandidates = commonTestRows
            .map((row, index) => ({ row, index }))
            .filter(({ row, index }) => {
              if (usedIndexes.has(index)) return false;
              if (isSocialRow(row)) return true;
              if (
                includeKoreanHistoryInSocialWhenBestGroup &&
                isKoreanHistoryRow(row)
              ) {
                return true;
              }
              return false;
            })
            .sort((a, b) => compareRowsForSelection(a.row, b.row));

          const scienceCandidates = commonTestRows
            .map((row, index) => ({ row, index }))
            .filter(
              ({ row, index }) => !usedIndexes.has(index) && isScienceRow(row)
            )
            .sort((a, b) => compareRowsForSelection(a.row, b.row));

          const pickedSocial = pickRows(
            socialCandidates,
            useAllSubjects,
            reflectionCount
          );
          const pickedScience = pickRows(
            scienceCandidates,
            useAllSubjects,
            reflectionCount
          );

          const socialAverage = calculateSubjectAverageForRows(
            pickedSocial.map((item) => item.row),
            gradeScoreMap,
            applyConvertedScore,
            applyUnitWeight,
            effectiveCareerAchievementScores
          );

          const scienceAverage = calculateSubjectAverageForRows(
            pickedScience.map((item) => item.row),
            gradeScoreMap,
            applyConvertedScore,
            applyUnitWeight,
            effectiveCareerAchievementScores
          );

          const finalPicked =
            socialAverage == null && scienceAverage == null
              ? []
              : socialAverage == null
              ? pickedScience
              : scienceAverage == null
              ? pickedSocial
              : socialAverage >= scienceAverage
              ? pickedSocial
              : pickedScience;

          for (const item of finalPicked) {
            usedIndexes.add(item.index);
            grouped[subjectLabel].push(item.row);
          }

          continue;
        }

        const combinedCandidates = commonTestRows
          .map((row, index) => ({ row, index }))
          .filter(
            ({ row, index }) =>
              !usedIndexes.has(index) &&
              matchesCommonSubjectGroup(row, subjectLabel, {
                includeSecondForeignLanguageInEnglish,
                includeKoreanHistoryInSocial,
                includeKoreanHistoryInSocialScience,
                socialScienceSelectionMode,
              })
          )
          .sort((a, b) => compareRowsForSelection(a.row, b.row));

        const pickedCombined = pickRows(
          combinedCandidates,
          useAllSubjects,
          reflectionCount
        );

        for (const item of pickedCombined) {
          usedIndexes.add(item.index);
          grouped[subjectLabel].push(item.row);
        }

        continue;
      }

      const candidates = commonTestRows
        .map((row, index) => ({ row, index }))
        .filter(
          ({ row, index }) =>
            !usedIndexes.has(index) &&
            matchesCommonSubjectGroup(row, subjectLabel, {
              includeSecondForeignLanguageInEnglish,
              includeKoreanHistoryInSocial,
              includeKoreanHistoryInSocialScience,
              socialScienceSelectionMode,
            })
        )
        .sort((a, b) => compareRowsForSelection(a.row, b.row));

      const pickedItems = pickRows(candidates, useAllSubjects, reflectionCount);

      for (const item of pickedItems) {
        usedIndexes.add(item.index);
        grouped[subjectLabel].push(item.row);
      }
    }

    return grouped;
  }, [
    applyConvertedScore,
    applyUnitWeight,
    effectiveCareerAchievementScores,
    commonReflectionCounts,
    commonSubjectSelections,
    commonTestRows,
    commonUseAllSubjects,
    gradeScoreMap,
    includeKoreanHistoryInSocial,
    includeKoreanHistoryInSocialScience,
    includeKoreanHistoryInSocialWhenBestGroup,
    includeSecondForeignLanguageInEnglish,
    integratedSelectionResult.commonGrouped,
    socialScienceSelectionMode,
    subjectCalculationMode,
  ]);

  const selectedCareerRowsBySubject = useMemo(() => {
    if (subjectCalculationMode === "integrated") {
      return integratedSelectionResult.careerGrouped;
    }

    const grouped = createRowMap(careerSubjectKeys);
    const usedIndexes = new Set<number>();

    for (const subjectLabel of careerSubjectProcessingOrder) {
      const isSelected = careerSubjectSelections[subjectLabel] === true;

      if (!isSelected) continue;

      const useAllSubjects = careerUseAllSubjects[subjectLabel] === true;
      const reflectionCount = getReflectionCount(
        careerReflectionCounts[subjectLabel]
      );

      const candidates = careerTestRows
        .map((row, index) => ({ row, index }))
        .filter(
          ({ row, index }) =>
            !usedIndexes.has(index) &&
            matchesCareerSubjectGroup(row, subjectLabel)
        )
        .sort((a, b) => compareRowsForSelection(a.row, b.row));

      const pickedItems = useAllSubjects
        ? candidates
        : candidates.slice(0, reflectionCount);

      for (const item of pickedItems) {
        usedIndexes.add(item.index);
        grouped[subjectLabel].push(item.row);
      }
    }

    return grouped;
  }, [
    careerReflectionCounts,
    careerSubjectSelections,
    careerTestRows,
    careerUseAllSubjects,
    integratedSelectionResult.careerGrouped,
    subjectCalculationMode,
  ]);

  const selectedCommonRows = useMemo(() => {
    if (subjectCalculationMode === "integrated") {
      return integratedSelectionResult.selectedRows;
    }

    return commonSubjectKeys.flatMap(
      (subjectLabel) => selectedCommonRowsBySubject[subjectLabel] ?? []
    );
  }, [
    integratedSelectionResult.selectedRows,
    selectedCommonRowsBySubject,
    subjectCalculationMode,
  ]);

  const effectiveSelectedCareerRowsBySubject = useMemo(() => {
    if (effectiveCareerSocialScienceSelectionMode !== "best_group") {
      return subjectCalculationMode === "integrated"
        ? integratedSelectionResult.careerGrouped
        : selectedCareerRowsBySubject;
    }

    return resolveCareerRowsByBestGroup(
      subjectCalculationMode === "integrated"
        ? integratedSelectionResult.careerGrouped
        : selectedCareerRowsBySubject,
      {
        selectedCareerSubjectLabels,
        gradeScoreMap,
        applyConvertedScore,
        applyUnitWeight,
        careerAchievementScores: effectiveCareerAchievementScores,
      }
    );
  }, [
    effectiveCareerSocialScienceSelectionMode,
    subjectCalculationMode,
    integratedSelectionResult.careerGrouped,
    selectedCareerRowsBySubject,
    selectedCareerSubjectLabels,
    gradeScoreMap,
    applyConvertedScore,
    applyUnitWeight,
    effectiveCareerAchievementScores,
  ]);

  const selectedCareerRows = useMemo(() => {
    return careerSubjectKeys.flatMap(
      (subjectLabel) => effectiveSelectedCareerRowsBySubject[subjectLabel] ?? []
    );
  }, [effectiveSelectedCareerRowsBySubject]);

  const commonScoreStats = useMemo(() => {
    let scoreSum = 0;
    let subjectCount = 0;
    let unitSum = 0;
    let scoreUnitSum = 0;
    let weightedSubjectSum = 0;
    let weightedUnitSubjectSum = 0;

    for (const row of selectedCommonRows) {
      const baseValue = getResolvedSubjectBaseValue(
        row,
        gradeScoreMap,
        applyConvertedScore,
        effectiveCareerAchievementScores
      );

      if (baseValue == null) continue;

      const credit = Math.max(parseNumber(row.credits) ?? 0, 0);

      scoreSum += baseValue;
      subjectCount += 1;

      if (credit > 0) {
        unitSum += credit;
        scoreUnitSum += baseValue * credit;
      }
    }

    for (const subjectLabel of commonSubjectKeys) {
      const subjectRows = selectedCommonRowsBySubject[subjectLabel] ?? [];

      if (subjectRows.length === 0) continue;

      const weightFactor = getPercentWeight(commonWeights[subjectLabel]);

      const simpleAverage = calculateSubjectAverageForRows(
        subjectRows,
        gradeScoreMap,
        applyConvertedScore,
        false,
        effectiveCareerAchievementScores
      );

      if (simpleAverage != null) {
        weightedSubjectSum += simpleAverage * weightFactor;
      }

      const creditAverage = calculateSubjectAverageForRows(
        subjectRows,
        gradeScoreMap,
        applyConvertedScore,
        true,
        effectiveCareerAchievementScores
      );

      if (creditAverage != null) {
        weightedUnitSubjectSum += creditAverage * weightFactor;
      }
    }

    return {
      scoreSum,
      subjectCount,
      unitSum,
      scoreUnitSum,
      weightedSubjectSum,
      weightedUnitSubjectSum,
      simpleAverage: subjectCount > 0 ? scoreSum / subjectCount : 0,
      unitAverage: unitSum > 0 ? scoreUnitSum / unitSum : 0,
    };
  }, [
    applyConvertedScore,
    effectiveCareerAchievementScores,
    commonWeights,
    gradeScoreMap,
    selectedCommonRows,
    selectedCommonRowsBySubject,
  ]);

  const commonAutoFormulaSummary = useMemo(() => {
    return `공통교과 ${
      includeCommonSubjects ? "포함" : "제외"
    } / 일반선택 ${
      includeRegularElectiveSubjects ? "포함" : "제외"
    } / 학점반영 ${applyUnitWeight ? "ON" : "OFF"} / 가중치 적용 ${
      applyCommonWeight ? "ON" : "OFF"
    }`;
  }, [
    applyCommonWeight,
    applyUnitWeight,
    includeCommonSubjects,
    includeRegularElectiveSubjects,
  ]);

  const commonAutoFormulaBody = useMemo(() => {
    if (!applyConvertedScore) {
      if (!applyUnitWeight && !applyCommonWeight) {
        return "(반영 과목별 등급 합) / (반영 과목 수)";
      }
      if (applyUnitWeight && !applyCommonWeight) {
        return "(반영 과목별 (등급 × 학점) 합) / (반영 과목별 학점 합)";
      }
      if (!applyUnitWeight && applyCommonWeight) {
        return "교과별 가중 평균등급 합계";
      }
      return "교과별 학점 가중 평균등급 합계";
    }

    if (!applyUnitWeight && !applyCommonWeight) {
      return "(반영 과목별 환산점수 합) / (반영 과목 수)";
    }
    if (applyUnitWeight && !applyCommonWeight) {
      return "(반영 과목별 (환산점수 × 학점) 합) / (반영 과목별 학점 합)";
    }
    if (!applyUnitWeight && applyCommonWeight) {
      return "교과별 가중 평균 환산점수 합계";
    }
    return "교과별 학점 가중 평균 환산점수 합계";
  }, [applyCommonWeight, applyConvertedScore, applyUnitWeight]);

  useEffect(() => {
    if (!applyCustomCommonFormula) return;
    if (normalizeText(commonCustomFormulaBody)) return;
    setCommonCustomFormulaBody(commonAutoFormulaBody);
  }, [
    applyCustomCommonFormula,
    commonAutoFormulaBody,
    commonCustomFormulaBody,
  ]);

  const defaultCommonScore = useMemo(() => {
    if (selectedCommonRows.length === 0) {
      return 0;
    }

    if (!applyCommonWeight) {
      return applyUnitWeight
        ? commonScoreStats.unitAverage
        : commonScoreStats.simpleAverage;
    }

    return applyUnitWeight
      ? commonScoreStats.weightedUnitSubjectSum
      : commonScoreStats.weightedSubjectSum;
  }, [
    applyCommonWeight,
    applyUnitWeight,
    commonScoreStats,
    selectedCommonRows.length,
  ]);

  const customCommonFormulaScore = useMemo(() => {
    if (!applyCustomCommonFormula) {
      return null;
    }

    return evaluateCommonCustomFormula(commonCustomFormulaBody, {
      defaultCommonScore,
      scoreSum: commonScoreStats.scoreSum,
      subjectCount: commonScoreStats.subjectCount,
      unitSum: commonScoreStats.unitSum,
      scoreUnitSum: commonScoreStats.scoreUnitSum,
      weightedSubjectSum: commonScoreStats.weightedSubjectSum,
      weightedUnitSubjectSum: commonScoreStats.weightedUnitSubjectSum,
    });
  }, [
    applyCustomCommonFormula,
    commonCustomFormulaBody,
    commonScoreStats,
    defaultCommonScore,
  ]);

  const isCommonCustomFormulaValid =
    !applyCustomCommonFormula || customCommonFormulaScore !== null;

  const commonScore = useMemo(() => {
    if (!applyCustomCommonFormula) {
      return defaultCommonScore;
    }

    if (customCommonFormulaScore == null) {
      return defaultCommonScore;
    }

    return customCommonFormulaScore;
  }, [
    applyCustomCommonFormula,
    customCommonFormulaScore,
    defaultCommonScore,
  ]);

const careerScore = useMemo(() => {
  const effectiveIncludeCareerSubjects =
    includeCareerSelectionSubjects || includeSpecializedSubjects;

  if (!effectiveIncludeCareerSubjects) {
    return 0;
  }

  const sourceRows = selectedCareerRows;

  if (!sourceRows.length) {
    return 0;
  }

  const resolvedRows = sourceRows
    .map((row) => {
      const achievementScore = getCareerAchievementScore(
        row.achievement,
        effectiveCareerAchievementScores
      );

      const rawCredit = getCreditWeight(row);
      const credit =
        rawCredit != null && Number.isFinite(rawCredit)
          ? Math.max(0, rawCredit)
          : 0;

      return {
        achievementScore,
        credit,
      };
    })
    .filter(
      (
        item
      ): item is {
        achievementScore: number;
        credit: number;
      } =>
        item.achievementScore != null &&
        Number.isFinite(item.achievementScore) &&
        item.achievementScore > 0
    );

  if (!resolvedRows.length) {
    return 0;
  }

  const simpleAverageCareerScore =
    resolvedRows.reduce((sum, item) => sum + item.achievementScore, 0) /
    resolvedRows.length;

  const totalCredits = resolvedRows.reduce(
    (sum, item) => sum + item.credit,
    0
  );

  const weightedCareerScore =
    totalCredits > 0
      ? resolvedRows.reduce(
          (sum, item) => sum + item.achievementScore * item.credit,
          0
        ) / totalCredits
      : null;

  // applyUnitWeight ON  -> Σ(반영 과목 성취도 환산점수 × 반영 과목 학점) ÷ Σ(반영 과목 학점)
  // applyUnitWeight OFF -> 반영 과목별 성취도 환산점수 단순평균
  if (applyUnitWeight && weightedCareerScore != null) {
    return weightedCareerScore;
  }

  return simpleAverageCareerScore;
}, [
  includeCareerSelectionSubjects,
  includeSpecializedSubjects,
  subjectCalculationMode,
  selectedCareerRows,
  effectiveCareerAchievementScores,
  applyUnitWeight,
]);

const effectiveAttendanceAbsenceDays = useMemo(() => {
  const rawAbsence = parseNumber(testAttendance?.absenceDays ?? "");
  const rawLateness = parseNumber(testAttendance?.lateness ?? "");
  const rawEarlyLeave = parseNumber(testAttendance?.earlyLeave ?? "");
  const rawOuting = parseNumber(testAttendance?.outing ?? "");

  const hasAnyAttendanceValue = [
    rawAbsence,
    rawLateness,
    rawEarlyLeave,
    rawOuting,
  ].some((value) => value != null && Number.isFinite(value));

  if (!hasAnyAttendanceValue) {
    return null;
  }

  const absence = rawAbsence ?? 0;
  const lateness = rawLateness ?? 0;
  const earlyLeave = rawEarlyLeave ?? 0;
  const outing = rawOuting ?? 0;

  return absence + (lateness + earlyLeave + outing) / 3;
}, [testAttendance]);

const attendanceScore = useMemo(() => {
  if (!includeAttendance) {
    return 0;
  }

  const baseScore = getAttendanceBaseScore(
    effectiveAttendanceAbsenceDays,
    attendanceRows
  );

  if (baseScore == null) {
    return 0;
  }

  return clamp((baseScore / 100) * 4.1, 0, 4.1);
}, [attendanceRows, effectiveAttendanceAbsenceDays, includeAttendance]);
  const integratedSelectionDescription = useMemo(() => {
    if (subjectCalculationMode !== "integrated") {
      return "분리 합산형에서는 공통/일반선택과 진로선택/전문교과를 각각 계산합니다.";
    }

    if (integratedSelectionMode === "all_selected") {
      return "통합 선발형 / 선택된 공통·일반선택·진로·전문교과 전체를 하나의 풀로 반영합니다.";
    }

    const totalCount = getReflectionCount(integratedTotalReflectionCount);
    const maxCareerCount = getReflectionCount(integratedMaxCareerReflectionCount);

    if (maxCareerCount <= 0) {
      return `통합 선발형 / 공통·일반선택·진로·전문교과를 하나의 풀로 합산하고 상위 ${
        totalCount || 0
      }과목을 반영합니다.`;
    }

    const maxCommonCount = Math.max(0, totalCount - maxCareerCount);

    return `통합 선발형 / 전체 ${totalCount || 0}과목 중 공통·일반선택 최대 ${maxCommonCount}과목, 진로·전문교과 최대 ${maxCareerCount}과목을 반영합니다.`;
  }, [
    integratedMaxCareerReflectionCount,
    integratedSelectionMode,
    integratedTotalReflectionCount,
    subjectCalculationMode,
  ]);

  const customFormulaScore = useMemo(() => {
    return evaluateFinalFormula(formulaBody, {
      commonScore,
      careerScore,
      attendanceScore,
    });
  }, [attendanceScore, careerScore, commonScore, formulaBody]);

  const finalScore = useMemo(() => {
    if (customFormulaScore == null) {
      return commonScore + careerScore + attendanceScore;
    }

    return customFormulaScore;
  }, [attendanceScore, careerScore, commonScore, customFormulaScore]);

  const isFormulaValid = customFormulaScore !== null;

  const commonScoreLabel =
    subjectCalculationMode === "integrated"
      ? "통합 교과 반영점수"
      : "공통/일반선택 반영점수";

  const commonScoreHelper = useMemo(() => {
    const selectionModeSummary =
      subjectCalculationMode === "integrated"
        ? `통합 선발형 / ${integratedSelectionModeLabel}`
        : "분리 합산형";

    const modeSummary = `${selectionModeSummary} / ${commonAutoFormulaSummary} / ${
      applyConvertedScore ? "환산점수표 적용" : "등급 직접 반영"
    }`;

    if (applyCustomCommonFormula) {
      return `${modeSummary} / 직접 입력 계산식 적용`;
    }

    return `${modeSummary} / ${commonAutoFormulaBody}`;
  }, [
    applyConvertedScore,
    applyCustomCommonFormula,
    commonAutoFormulaBody,
    commonAutoFormulaSummary,
    integratedSelectionModeLabel,
    subjectCalculationMode,
  ]);

  const conversionScoreSummary: ConversionSummaryItem[] = useMemo(
    () => [
      {
        label: commonScoreLabel,
        value: formatScore(commonScore),
        tone: "slate",
        helper:
          subjectCalculationMode === "integrated"
            ? `${commonScoreHelper} / ${integratedSelectionDescription}`
            : commonScoreHelper,
      },
      {
        label: "진로선택/전문교과 반영점수",
        value: formatScore(careerScore),
        tone: "slate",
        helper:
          subjectCalculationMode === "integrated"
            ? applyUnitWeight
              ? "통합 선발형에서는 진로선택/전문교과 점수가 통합 교과 반영점수에 포함되며, 현재 값은 참고용 학점가중평균(Σ(성취도 환산점수 × 학점) ÷ Σ(학점))입니다."
              : "통합 선발형에서는 진로선택/전문교과 점수가 통합 교과 반영점수에 포함되며, 현재 값은 참고용 단순평균입니다."
            : hasActiveCareerSelection
            ? applyUnitWeight
              ? "분리 합산형에서 Σ(성취도 환산점수 × 학점) ÷ Σ(학점) 방식으로 계산합니다."
              : "분리 합산형에서 반영 과목별 성취도 환산점수 단순평균으로 계산합니다."
            : "계산 제외",
      },
      {
        label: "출결 반영점수",
        value: formatScore(attendanceScore),
        tone: "slate",
        helper: includeAttendance ? "출결 반영 ON" : "출결 반영 OFF",
      },
      {
        label: "최종 환산 점수",
        value: formatScore(finalScore),
        tone: "blue",
        helper: isFormulaValid
          ? "계산식 상세 기준 최종 계산"
          : "계산식 상세 형식 오류로 기본 합산값 적용",
      },
    ],
    [
      attendanceScore,
      careerScore,
      commonScore,
      commonScoreHelper,
      commonScoreLabel,
      finalScore,
      hasActiveCareerSelection,
      applyUnitWeight,
      includeAttendance,
      integratedSelectionDescription,
      isFormulaValid,
      subjectCalculationMode,
    ]
  );

  const testDataStatusTone =
    testSetId && filledTestRows.length > 0 ? "emerald" : "slate";

  const targetStatusTone = loadingAdmissionTargets
    ? "slate"
    : admissionTargetCatalogRows.length > 0
    ? "emerald"
    : "rose";
  function buildSavePayload(action: SaveAction): SaveUniversityConversionPayload {
    const normalizedCommonSubjectPayload = normalizeCommonSubjectPayload();
    const normalizedCareerSubjectPayload = normalizeCareerSubjectPayload();

    return {
      mode: isEditMode ? "edit" : "create",
      action,
      ruleId: isEditMode ? editingRuleId || null : null,
      targetValues: {
        region: targetValues.region,
        university: targetValues.university,
        admissionType: targetValues.admissionType,
        admissionName: targetValues.admissionName,
        track: targetValues.track,
        collegeName: targetValues.collegeName,
        recruitmentUnit: targetValues.recruitmentUnit,
      },
      subjectCalculationMode,
      integratedSelectionMode,
      integratedTotalReflectionCount: integratedTotalReflectionCount.trim(),
      integratedMaxCareerReflectionCount:
        integratedMaxCareerReflectionCount.trim(),
      ...normalizedCommonSubjectPayload,
      gradeScoreMap: Object.fromEntries(
        Object.entries(gradeScoreMap).map(([grade, score]) => [
          String(grade),
          score,
        ])
      ) as Record<string, string>,
      ...normalizedCareerSubjectPayload,
      careerAchievementScores: { ...careerAchievementScores },
      careerAchievementFormulaName,
      careerAchievementFormulaBody,
      careerAchievementScoreMode,
      achievementRatioScoreRows: achievementRatioScoreRows.map((row) => ({
        grade: row.grade,
        ratio: row.ratio,
        score: row.score,
      })),
      attendanceRows: attendanceRows.map((row) => ({
        id: row.id,
        labelType: row.labelType,
        label: row.label ?? "",
        upper: row.upper ?? "",
        lower: row.lower ?? "",
        score: row.score,
      })),
      formulaName,
      formulaBody,
      formulaMemo,
      applyCustomCommonFormula,
      commonCustomFormulaBody,
      socialScienceSelectionMode,
      careerSocialScienceSelectionMode: effectiveCareerSocialScienceSelectionMode,
      includeSecondForeignLanguageInEnglish,
      includeKoreanHistoryInSocial,
      includeKoreanHistoryInSocialScience,
      includeKoreanHistoryInSocialWhenBestGroup,
      switches: {
        applyUnitWeight,
        applyCommonWeight,
        applyConvertedScore,
        includeCommonSubjects,
        includeRegularElectiveSubjects,
        includeCareerSubjects: hasActiveCareerSelection,
        includeCareerSelectionSubjects,
        includeSpecializedSubjects,
        applyCareerBonus: false,
        includeAttendance,
      },
      testScoreLink: {
        testSetId,
        testSetName,
        rowCount: filledTestRows.length,
        attendanceIncluded: !!testAttendance,
      },
      calculatedSummary: {
        commonScore: formatScore(commonScore),
        careerContributionScore: formatScore(careerScore),
        attendanceScore: formatScore(attendanceScore),
        finalScore: formatScore(finalScore),
      },
    };
  }

  async function handleSave(action: SaveAction) {
    if (isSaving) return;

    if ((action === "review" || action === "activate") && !requiredTargetReady) {
      setSaveMessage({
        type: "error",
        text: "지역, 대학, 전형유형 필수값을 먼저 선택해 주세요.",
      });
      return;
    }

    if (
      subjectCalculationMode === "integrated" &&
      integratedSelectionMode === "count_limit"
    ) {
      const totalReflectionCount = getReflectionCount(
        integratedTotalReflectionCount
      );
      const maxCareerReflectionCount = getReflectionCount(
        integratedMaxCareerReflectionCount
      );

      if (totalReflectionCount <= 0) {
        setSaveMessage({
          type: "error",
          text: "통합 선발형에서 과목수 제한 반영을 선택한 경우 전체 반영과목수를 1 이상 입력해 주세요.",
        });
        return;
      }

      if (maxCareerReflectionCount > totalReflectionCount) {
        setSaveMessage({
          type: "error",
          text: "진로선택/전문교과 최대 과목수는 전체 반영과목수보다 클 수 없습니다.",
        });
        return;
      }
    }

    if (applyCustomCommonFormula && !isCommonCustomFormulaValid) {
      setSaveMessage({
        type: "error",
        text: "공통/일반선택과목 계산식 상세 형식을 확인해 주세요. 지원 항목과 사칙연산만 사용할 수 있습니다.",
      });
      return;
    }

    if (!isFormulaValid) {
      setSaveMessage({
        type: "error",
        text: "환산 계산식 형식을 확인해 주세요. 통합 교과 반영점수, 통합 반영점수, 공통/일반선택 반영점수, 공통교과 반영점수, 진로선택/전문교과 반영점수, 진로선택 반영점수, 전문교과 반영점수, 출결 반영점수를 일반 표기 또는 {토큰} 표기로 사용할 수 있습니다.",
      });
      return;
    }

    if (action === "review" || action === "activate") {
      const commonSubjectError = validateCommonSubjectInputs();

      if (commonSubjectError) {
        setSaveMessage({
          type: "error",
          text: commonSubjectError,
        });
        return;
      }

      const careerGroupError = validateCareerGroupInputs();

      if (careerGroupError) {
        setSaveMessage({
          type: "error",
          text: careerGroupError,
        });
        return;
      }
    }

    if (isEditMode && !editingRuleId) {
      setSaveMessage({
        type: "error",
        text: "수정 대상 ruleId가 없어 저장할 수 없습니다.",
      });
      return;
    }

    setIsSaving(true);
    setSavingAction(action);
    setSaveMessage(null);

    try {
      const payload = buildSavePayload(action);
      const response = await fetch("/api/admin/university-conversion", {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json =
        (await response.json()) as SaveUniversityConversionResponse;

      if (!response.ok || !json.success) {
        throw new Error(json.message || "환산규칙 저장에 실패했습니다.");
      }

      const defaultSuccessMessage =
        action === "draft"
          ? "환산규칙이 임시저장되었습니다."
          : action === "review"
          ? "환산규칙이 검수요청 상태로 저장되었습니다."
          : isEditMode
          ? "환산규칙이 수정되어 다시 활성화되었습니다."
          : "환산규칙이 활성화 저장되었습니다.";

      setSaveMessage({
        type: "success",
        text: json.message || defaultSuccessMessage,
      });
    } catch (error) {
      setSaveMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "환산규칙 저장 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSaving(false);
      setSavingAction(null);
    }
  }

  return (
    <PageShell>
      <header className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/admin"
                className="text-sm font-medium text-slate-500 transition hover:text-slate-700"
              >
                관리자 홈
              </Link>
              <span className="text-slate-300">/</span>
              <Link
                href="/admin/university-conversion"
                className="text-sm font-medium text-slate-500 transition hover:text-slate-700"
              >
                대학별 환산규칙 설정
              </Link>
              <span className="text-slate-300">/</span>
              <Link
                href="/admin/university-conversion/test-score"
                className="text-sm font-medium text-slate-500 transition hover:text-slate-700"
              >
                테스트 성적 입력
              </Link>
            </div>

            <div>
              <h1 className="text-[24px] font-bold tracking-tight text-slate-900">
                {isEditMode ? "대학별 환산규칙 수정" : "대학별 환산규칙 설정"}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {isEditMode
                  ? "선택한 활성 규칙의 대상 정보를 불러와 수정한 뒤 다시 활성화할 수 있습니다."
                  : "AdmissionResult 기준 대상 선택과 테스트 성적 환산 검증을 함께 관리합니다."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ActionChip tone={targetStatusTone}>
              {loadingAdmissionTargets
                ? "대상 옵션 로딩 중"
                : admissionTargetCatalogRows.length > 0
                ? `대상 옵션 ${admissionTargetCatalogRows.length}건 연결`
                : "대상 옵션 없음"}
            </ActionChip>

            <ActionChip tone={testDataStatusTone}>
              {loadingTestScore
                ? "테스트 성적 로딩 중"
                : testSetId
                ? `연결된 테스트셋: ${testSetName || "이름 없음"}`
                : "연결된 테스트셋 없음"}
            </ActionChip>

            <Link
              href="/admin/university-conversion/active-rules"
              className="inline-flex h-10 items-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              활성 규칙 목록
            </Link>

            <Link
              href="/admin/university-conversion/rules"
              className="inline-flex h-10 items-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              전체 규칙 이력
            </Link>

            <Link
              href="/admin/university-conversion/test-score"
              className="inline-flex h-10 items-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              테스트 성적 입력 바로가기
            </Link>
          </div>
        </div>
      </header>

      {isEditMode ? (
        <div className="rounded-[24px] border border-blue-200 bg-blue-50 px-6 py-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold text-blue-800">
                수정 모드로 진입했습니다.
              </div>
              <p className="mt-1 text-sm text-blue-700">
                ruleId: {editingRuleId || "-"} / 저장된 환산규칙 상세값을 ruleId
                기준으로 불러와 수정할 수 있습니다.
              </p>
            </div>

            <ActionChip tone="blue">수정 후 다시 활성화 가능</ActionChip>
          </div>
        </div>
      ) : null}

      {isEditMode && loadingRuleDetail ? (
        <div className="rounded-[24px] border border-slate-200 bg-white px-6 py-4 text-sm font-medium text-slate-600">
          저장된 환산규칙을 불러오는 중입니다.
        </div>
      ) : null}

      {isEditMode && ruleDetailMessage ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-6 py-4 text-sm font-medium text-rose-700">
          {ruleDetailMessage}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <div className="space-y-5">
<SectionCard
  title="환산 규칙 대상 설정"
  description="AdmissionResult 기준으로 지역 → 대학 → 전형유형 이후 항목을 순서대로 선택합니다. 지역, 대학, 전형유형은 필수이며, 이후 항목은 선택 범위에 따라 같은 성적을 반영합니다. 규칙 적용 우선순위는 모집단위 → 단과대학 → 전형명 → 계열 순서이며, 더 세부적인 규칙이 있으면 해당 규칙이 먼저 적용됩니다."
  right={
    <div className="flex flex-wrap items-center gap-2">
      <ActionChip tone={requiredTargetReady ? "emerald" : "amber"}>
        {requiredTargetReady ? "필수값 입력 완료" : "필수값 입력 필요"}
      </ActionChip>
      <ActionChip tone="blue">{targetApplyScopeChipLabel}</ActionChip>
      <ActionChip tone="slate">
        현재 매칭 {targetMatchRows.length}건
      </ActionChip>
    </div>
  }
>

            <div className="space-y-4">
              {admissionTargetMessage ? (
                <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {admissionTargetMessage}
                </div>
              ) : null}

              <div className="rounded-[22px] border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                {targetApplyScopeMessage}
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <FieldLabel label="지역" required />
                  <SelectField
                    value={targetValues.region}
                    onChange={(value) => updateTargetValue("region", value)}
                    placeholder={
                      loadingAdmissionTargets ? "불러오는 중" : "지역 선택"
                    }
                    options={regionOptions}
                    disabled={
                      loadingAdmissionTargets || regionOptions.length === 0
                    }
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel label="대학" required />
                  <SelectField
                    value={targetValues.university}
                    onChange={(value) => updateTargetValue("university", value)}
                    placeholder={
                      !targetValues.region ? "먼저 지역 선택" : "대학 선택"
                    }
                    options={universityOptions}
                    disabled={
                      !targetValues.region || universityOptions.length === 0
                    }
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel label="전형유형" required />
                  <SelectField
                    value={targetValues.admissionType}
                    onChange={(value) =>
                      updateTargetValue("admissionType", value)
                    }
                    placeholder={
                      !targetValues.university
                        ? "먼저 대학 선택"
                        : "전형유형 선택"
                    }
                    options={admissionTypeOptions}
                    disabled={
                      !targetValues.university ||
                      admissionTypeOptions.length === 0
                    }
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel label="계열" />
                  <SelectField
                    value={targetValues.track}
                    onChange={(value) => updateTargetValue("track", value)}
                    placeholder={
                      !targetValues.admissionType
                        ? "먼저 전형유형 선택"
                        : "계열 선택"
                    }
                    options={trackOptions}
                    disabled={
                      !targetValues.admissionType || trackOptions.length === 0
                    }
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel label="전형명" />
                  <SelectField
                    value={targetValues.admissionName}
                    onChange={(value) =>
                      updateTargetValue("admissionName", value)
                    }
                    placeholder={
                      !targetValues.track ? "먼저 계열 선택" : "전형명 선택"
                    }
                    options={admissionNameOptions}
                    disabled={
                      !targetValues.track || admissionNameOptions.length === 0
                    }
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel label="단과대학" />
                  <SelectField
                    value={targetValues.collegeName}
                    onChange={(value) =>
                      updateTargetValue("collegeName", value)
                    }
                    placeholder={
                      !targetValues.track ? "먼저 계열 선택" : "단과대학 선택"
                    }
                    options={collegeNameOptions}
                    disabled={
                      !targetValues.track || collegeNameOptions.length === 0
                    }
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel label="모집단위" />
                  <SelectField
                    value={targetValues.recruitmentUnit}
                    onChange={(value) =>
                      updateTargetValue("recruitmentUnit", value)
                    }
                    placeholder={
                      !targetValues.track ? "먼저 계열 선택" : "모집단위 선택"
                    }
                    options={recruitmentUnitOptions}
                    disabled={
                      !targetValues.track || recruitmentUnitOptions.length === 0
                    }
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="교과 반영 계산 방식"
            description="대학별 기준에 따라 공통/일반선택과 진로선택/전문교과를 통합 선발하거나, 분리 계산 후 비율식으로 합산할 수 있습니다."
            right={
              <ActionChip tone="blue">
                {integratedSelectionDescription}
              </ActionChip>
            }
          >
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleChangeSubjectCalculationMode("integrated")}
                  className={`rounded-[24px] border px-5 py-4 text-left transition ${
                    subjectCalculationMode === "integrated"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="text-sm font-semibold">통합 선발형</div>
                  <p
                    className={`mt-2 text-sm leading-6 ${
                      subjectCalculationMode === "integrated"
                        ? "text-slate-100"
                        : "text-slate-500"
                    }`}
                  >
                    공통/일반선택과 진로선택/전문교과를 하나의 선발 풀로 보고
                    우수 과목을 함께 선발합니다.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleChangeSubjectCalculationMode("separate_weighted")
                  }
                  className={`rounded-[24px] border px-5 py-4 text-left transition ${
                    subjectCalculationMode === "separate_weighted"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="text-sm font-semibold">분리 합산형</div>
                  <p
                    className={`mt-2 text-sm leading-6 ${
                      subjectCalculationMode === "separate_weighted"
                        ? "text-slate-100"
                        : "text-slate-500"
                    }`}
                  >
                    공통/일반선택 점수와 진로선택/전문교과 점수를 각각 계산한 뒤
                    최종 환산 계산식에서 합산합니다.
                  </p>
                </button>
              </div>
              {subjectCalculationMode === "integrated" ? (
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => setIntegratedSelectionMode("count_limit")}
                          className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                            integratedSelectionMode === "count_limit"
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          과목수 입력 후 상위 반영
                        </button>

                        <button
                          type="button"
                          onClick={() => setIntegratedSelectionMode("all_selected")}
                          className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                            integratedSelectionMode === "all_selected"
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          선택 교과 전체 반영
                        </button>
                      </div>

                      <p className="text-sm leading-6 text-slate-600">
                        {integratedSelectionMode === "count_limit"
                          ? "선택된 공통/일반선택·진로/전문교과를 하나의 풀로 보되, 전체 반영과목수와 진로선택/전문교과 최대 과목수 기준으로 선발합니다. 진로선택/전문교과 최대 과목수가 0이면 전체를 통합 정렬해 상위 과목만 반영합니다."
                          : "전체 교과 반영 모드에서는 선택된 공통/일반선택·진로/전문교과를 모두 하나의 풀로 합산하여 반영합니다."}
                      </p>
                    </div>

                    {integratedSelectionMode === "count_limit" ? (
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <FieldLabel label="전체 반영과목수" required />
                          <NumberField
                            value={integratedTotalReflectionCount}
                            onChange={setIntegratedTotalReflectionCount}
                            placeholder="예: 20"
                            disabled={isSaving}
                          />
                        </div>

                        <div className="space-y-2">
                          <FieldLabel
                            label="진로선택/전문교과 최대 과목수"
                            required
                          />
                          <NumberField
                            value={integratedMaxCareerReflectionCount}
                            onChange={setIntegratedMaxCareerReflectionCount}
                            placeholder="예: 5 / 전체 통합 정렬은 0"
                            disabled={isSaving}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        선택된 교과 전체를 반영합니다. 별도의 과목 수 입력은 사용하지 않습니다.
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard
            title="공통/일반선택과목 반영 설정"
            description="반영할 교과를 먼저 선택하고, 분리 합산형일 때는 전과목 여부와 반영 과목 수를 교과별로 설정합니다. 통합 선발형일 때는 상위 과목 수 반영 또는 선택 교과 전체 반영을 별도로 사용합니다."
            right={
              <div className="flex flex-wrap items-center gap-4">
                <ActionChip
                  tone={
                    subjectCalculationMode === "integrated" ? "blue" : "slate"
                  }
                >
                  {subjectCalculationMode === "integrated"
                    ? `통합 선발형 / ${integratedSelectionModeLabel}`
                    : "분리 합산형"}
                </ActionChip>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-600">
                    공통교과 포함
                  </span>
                  <ToggleSwitch
                    checked={includeCommonSubjects}
                    onChange={setIncludeCommonSubjects}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-600">
                    일반선택
                  </span>
                  <ToggleSwitch
                    checked={includeRegularElectiveSubjects}
                    onChange={setIncludeRegularElectiveSubjects}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-600">
                    가중치 적용
                  </span>
                  <ToggleSwitch
                    checked={applyCommonWeight}
                    onChange={setApplyCommonWeight}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-600">
                    학점반영
                  </span>
                  <ToggleSwitch
                    checked={applyUnitWeight}
                    onChange={setApplyUnitWeight}
                  />
                </div>
              </div>
            }
          >
            <div className="space-y-4">
              <div className="rounded-[22px] border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-700">
                공통교과 포함을 OFF로 설정하면 공통과목은 제외되고 일반선택만
                반영됩니다. 일반선택을 OFF로 설정하면 공통교과만 반영됩니다.
                둘 다 ON이면 공통교과와 일반선택을 함께 반영합니다.
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                  <div className="text-sm font-semibold text-slate-700">
                    사회/과학 반영 방식
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSocialScienceSelectionMode("combined_subjects")
                      }
                      className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold transition ${
                        socialScienceSelectionMode === "combined_subjects"
                          ? "bg-slate-900 text-white"
                          : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      통합 과목 방식
                    </button>

                    <button
                      type="button"
                      onClick={() => setSocialScienceSelectionMode("best_group")}
                      className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold transition ${
                        socialScienceSelectionMode === "best_group"
                          ? "bg-slate-900 text-white"
                          : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      우수 교과 방식
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-700">
                          영어에 제2외국어 포함
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          일본어, 중국어 등 포함
                        </div>
                      </div>
                      <ToggleSwitch
                        checked={includeSecondForeignLanguageInEnglish}
                        onChange={setIncludeSecondForeignLanguageInEnglish}
                      />
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-700">
                          사회에 한국사 포함
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          사회 선택 시 한국사 포함
                        </div>
                      </div>
                      <ToggleSwitch
                        checked={includeKoreanHistoryInSocial}
                        onChange={setIncludeKoreanHistoryInSocial}
                      />
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-700">
                          사회/과학에 한국사 포함
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          통합 과목 방식에서 사용
                        </div>
                      </div>
                      <ToggleSwitch
                        checked={includeKoreanHistoryInSocialScience}
                        onChange={setIncludeKoreanHistoryInSocialScience}
                      />
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-700">
                          우수 교과 방식에 한국사 포함
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          사회군 비교 시 한국사 포함
                        </div>
                      </div>
                      <ToggleSwitch
                        checked={includeKoreanHistoryInSocialWhenBestGroup}
                        onChange={setIncludeKoreanHistoryInSocialWhenBestGroup}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-[24px] border border-slate-200">
                <div className="min-w-[980px]">
                  <div className="grid grid-cols-[170px_repeat(8,minmax(0,1fr))] border-b border-slate-200 bg-slate-50">
                    <div className="px-4 py-4 text-sm font-semibold text-slate-700">
                      설정 항목
                    </div>
                    {commonSubjects.map((subject) => (
                      <div
                        key={subject.label}
                        className="border-l border-slate-200 px-3 py-4"
                      >
                        <SubjectHeader
                          label={subject.label}
                          subTag={subject.subTag}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-[170px_repeat(8,minmax(0,1fr))] border-b border-slate-200">
                    <div className="flex items-center px-4 py-4 text-sm font-medium text-slate-600">
                      반영 여부
                    </div>
                    {commonSubjects.map((subject) => (
                      <div
                        key={subject.label}
                        className="flex items-center justify-center border-l border-slate-200 px-3 py-4"
                      >
                        <ToggleSwitch
                          checked={commonSubjectSelections[subject.label] === true}
                          onChange={(checked) =>
                            handleChangeCommonSubjectSelection(
                              subject.label,
                              checked
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-[170px_repeat(8,minmax(0,1fr))] border-b border-slate-200">
                    <div className="flex items-center px-4 py-4 text-sm font-medium text-slate-600">
                      전체 반영
                    </div>
                    {commonSubjects.map((subject) => {
                      const disabled =
                        !commonSubjectSelections[subject.label] ||
                        subjectCalculationMode === "integrated";

                      return (
                        <div
                          key={subject.label}
                          className="flex items-center justify-center border-l border-slate-200 px-3 py-4"
                        >
                          <ToggleSwitch
                            checked={commonUseAllSubjects[subject.label] === true}
                            onChange={(checked) =>
                              handleChangeCommonUseAllSubjects(
                                subject.label,
                                checked
                              )
                            }
                            disabled={disabled}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-[170px_repeat(8,minmax(0,1fr))] border-b border-slate-200">
                    <div className="flex items-center px-4 py-4 text-sm font-medium text-slate-600">
                      반영 과목 수
                    </div>
                    {commonSubjects.map((subject) => {
                      const selected = commonSubjectSelections[subject.label];
                      const useAllSubjects =
                        commonUseAllSubjects[subject.label] === true;
                      return (
                        <div
                          key={subject.label}
                          className="border-l border-slate-200 px-3 py-4"
                        >
                          <NumberField
                            value={commonReflectionCounts[subject.label] ?? ""}
                            onChange={(value) =>
                              handleChangeCommonReflectionCount(
                                subject.label,
                                value
                              )
                            }
                            placeholder={
                              subjectCalculationMode === "integrated"
                                ? "통합 선발형에서 미사용"
                                : useAllSubjects
                                ? "전과목"
                                : "반영 수"
                            }
                            disabled={
                              !selected ||
                              useAllSubjects ||
                              subjectCalculationMode === "integrated"
                            }
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-[170px_repeat(8,minmax(0,1fr))]">
                    <div className="flex items-center px-4 py-4 text-sm font-medium text-slate-600">
                      교과별 가중치
                    </div>
                    {commonSubjects.map((subject) => (
                      <div
                        key={subject.label}
                        className="border-l border-slate-200 px-3 py-4"
                      >
                        <NumberField
                          value={commonWeights[subject.label] ?? ""}
                          onChange={(value) =>
                            handleChangeCommonWeight(subject.label, value)
                          }
                          placeholder={applyCommonWeight ? "예: 120" : "100"}
                          disabled={
                            !commonSubjectSelections[subject.label] ||
                            !applyCommonWeight
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title={careerAchievementSectionTitle}
            description={
              subjectCalculationMode === "integrated"
                ? "통합 선발형에서는 진로선택과 전문교과도 공통/일반선택과 함께 선발 풀에 포함됩니다. 성취도 환산 기준(A/B/C)과 설명식은 기존 입력 영역에서 그대로 입력·저장합니다."
                : "진로선택과 전문교과를 통합한 6개 과목군 기준으로 반영 여부와 반영 수를 설정합니다."
            }
            right={
              <div className="flex flex-wrap items-center gap-4">
                <ActionChip
                  tone={
                    subjectCalculationMode === "integrated" ? "blue" : "slate"
                  }
                >
                  {subjectCalculationMode === "integrated"
                    ? "통합 선발형"
                    : "분리 합산형"}
                </ActionChip>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-600">
                    진로선택
                  </span>
                  <ToggleSwitch
                    checked={includeCareerSelectionSubjects}
                    onChange={setIncludeCareerSelectionSubjects}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-600">
                    전문교과
                  </span>
                  <ToggleSwitch
                    checked={includeSpecializedSubjects}
                    onChange={setIncludeSpecializedSubjects}
                  />
                </div>
              </div>
            }
          >
            <div className="space-y-5">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                진로선택 스위치를 OFF로 하면 전문교과만 반영하고, 전문교과
                스위치를 OFF로 하면 진로선택만 반영합니다. 둘 다 ON이면
                진로선택과 전문교과를 모두 반영합니다.
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                {subjectCalculationMode === "integrated"
                  ? integratedSelectionMode === "all_selected"
                    ? "통합 선발형 전체 반영 모드에서는 선택된 진로선택/전문교과 과목군이 공통/일반선택과 함께 하나의 선발 풀에 모두 포함됩니다."
                    : "통합 선발형 과목수 제한 모드에서는 선택된 진로선택/전문교과 과목군이 공통/일반선택과 함께 하나의 선발 풀에서 선발되며, 최대 과목수 제한이 적용될 수 있습니다."
                  : "분리 합산형에서는 선택된 진로선택/전문교과 과목군별로 반영 과목 수를 적용해 별도 평균 점수를 계산합니다."}
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-700">
                      사회/과학 반영 방식
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      사회와 과학이 모두 선택된 경우 진로선택/전문교과 반영 방식
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setCareerSocialScienceSelectionMode("separate")}
                      disabled={
                        subjectCalculationMode === "integrated" &&
                        socialScienceSelectionMode === "best_group"
                      }
                      className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold transition ${
                        effectiveCareerSocialScienceSelectionMode === "separate"
                          ? "bg-slate-900 text-white"
                          : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                      } ${
                        subjectCalculationMode === "integrated" &&
                        socialScienceSelectionMode === "best_group"
                          ? "cursor-not-allowed opacity-60"
                          : ""
                      }`}
                    >
                      분리 반영 방식
                    </button>

                    <button
                      type="button"
                      onClick={() => setCareerSocialScienceSelectionMode("best_group")}
                      className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold transition ${
                        effectiveCareerSocialScienceSelectionMode === "best_group"
                          ? "bg-slate-900 text-white"
                          : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      우수 교과 방식
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {subjectCalculationMode === "integrated" &&
                  socialScienceSelectionMode === "best_group"
                    ? "교과 반영 계산 방식이 통합 선발형이고 공통/일반선택의 사회/과학 반영 방식이 우수 교과 방식이므로, 이 설정도 자동으로 우수 교과 방식이 적용됩니다."
                    : effectiveCareerSocialScienceSelectionMode === "best_group"
                    ? "사회와 과학이 모두 선택된 경우 두 과목군 중 평균이 더 높은 쪽만 반영합니다."
                    : "사회와 과학은 각각 독립된 과목군으로 반영합니다."}
                </p>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[980px]">
                  <div className="grid grid-cols-[180px_repeat(6,minmax(110px,1fr))] gap-3">
                    <div className="flex items-center text-sm font-semibold text-slate-700">
                      구분
                    </div>

                    {careerSubjectKeys.map((subject) => (
                      <div
                        key={`${subject}-career-header`}
                        className="flex min-h-[64px] items-center justify-center rounded-[20px] border border-slate-200 bg-slate-50 px-3 py-3"
                      >
                        <SubjectHeader label={subject} />
                      </div>
                    ))}

                    <div className="flex items-center text-sm font-semibold text-slate-700">
                      반영여부
                    </div>

                    {careerSubjectKeys.map((subject) => {
                      const selected = careerSubjectSelections[subject] === true;

                      return (
                        <div
                          key={`${subject}-career-selected`}
                          className="flex h-14 items-center justify-center rounded-[20px] border border-slate-200 bg-white px-3"
                        >
                          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(event) =>
                                handleChangeCareerSubjectSelection(
                                  subject,
                                  event.target.checked
                                )
                              }
                              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
                            />
                            반영
                          </label>
                        </div>
                      );
                    })}

                    <div className="flex items-center text-sm font-semibold text-slate-700">
                      전과목
                    </div>

                    {careerSubjectKeys.map((subject) => {
                      const selected = careerSubjectSelections[subject] === true;
                      const useAllSubjects =
                        careerUseAllSubjects[subject] === true;

                      return (
                        <div
                          key={`${subject}-career-all`}
                          className="flex h-14 items-center justify-center rounded-[20px] border border-slate-200 bg-white px-3"
                        >
                          <ToggleSwitch
                            checked={useAllSubjects}
                            onChange={(next) =>
                              handleChangeCareerUseAllSubjects(subject, next)
                            }
                            disabled={
                              !selected ||
                              subjectCalculationMode === "integrated"
                            }
                          />
                        </div>
                      );
                    })}

                    <div className="flex items-center text-sm font-semibold text-slate-700">
                      반영 과목 수
                    </div>

                    {careerSubjectKeys.map((subject) => {
                      const selected = careerSubjectSelections[subject] === true;
                      const useAllSubjects =
                        careerUseAllSubjects[subject] === true;

                      return (
                        <NumberField
                          key={`${subject}-career-count`}
                          value={careerReflectionCounts[subject] ?? ""}
                          onChange={(value) =>
                            handleChangeCareerReflectionCount(subject, value)
                          }
                          placeholder={
                            subjectCalculationMode === "integrated"
                              ? "통합 선발형 사용"
                              : "반영 수"
                          }
                          disabled={
                            !selected ||
                            useAllSubjects ||
                            subjectCalculationMode === "integrated"
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-700">
                      성취도 점수 반영 방식
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      직접 점수 입력 또는 성취도 비율법 등급표 적용 중 선택
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setCareerAchievementScoreMode("direct_score")}
                      disabled={isCareerAchievementInputDisabled}
                      className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold transition ${
                        careerAchievementScoreMode === "direct_score"
                          ? "bg-slate-900 text-white"
                          : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                      } ${isCareerAchievementInputDisabled ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                      직접 점수 입력
                    </button>
                    <button
                      type="button"
                      onClick={() => setCareerAchievementScoreMode("ratio_grade")}
                      disabled={isCareerAchievementInputDisabled}
                      className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold transition ${
                        careerAchievementScoreMode === "ratio_grade"
                          ? "bg-slate-900 text-white"
                          : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                      } ${isCareerAchievementInputDisabled ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                      성취도 비율법 등급표 적용
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {careerAchievementScoreMode === "direct_score"
                    ? "현재 모드: 성취도 A/B/C에 직접 환산점수를 입력합니다."
                    : "현재 모드: 성취도 A에는 1등급, 성취도 B에는 (B+C) 비율 합 석차등급, 성취도 C에는 C 비율 석차등급을 입력하고, 아래 성취도 비율법 등급표의 환산점수를 적용합니다."}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {(["A", "B", "C"] as const).map((level) => (
                  <div key={level} className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      {careerAchievementScoreMode === "direct_score"
                        ? `성취도 ${level}`
                        : level === "A"
                        ? "성취도 A 대응 등급"
                        : level === "B"
                        ? "성취도 B+C 대응 등급"
                        : "성취도 C 대응 등급"}
                    </label>
                    <NumberField
                      value={careerAchievementScores[level] ?? ""}
                      onChange={(value) =>
                        setCareerAchievementScores((prev) => ({
                          ...prev,
                          [level]: value,
                        }))
                      }
                      placeholder={
                        careerAchievementScoreMode === "direct_score"
                          ? "점수"
                          : "등급"
                      }
                      disabled={isCareerAchievementInputDisabled}
                    />
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    성취도 환산식 이름
                  </label>
                  <TextField
                    value={careerAchievementFormulaName}
                    onChange={setCareerAchievementFormulaName}
                    placeholder="예: 진로선택/전문교과 성취도 환산식"
                    disabled={isCareerAchievementInputDisabled}
                  />
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {careerAchievementScoreMode === "direct_score"
                    ? "자동 계산은 A/B/C 점수 입력값을 사용하며, 이 영역은 대학별 기준 설명과 저장용 메모를 겸합니다."
                    : "자동 계산은 A/B/C 입력칸의 등급값과 아래 성취도 비율법 등급표의 환산점수를 사용하며, 비율 칸은 기준 설명용으로 함께 저장됩니다."}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  성취도 환산식 계산 입력
                </label>
                <textarea
                  value={careerAchievementFormulaBody}
                  onChange={(event) =>
                    setCareerAchievementFormulaBody(event.target.value)
                  }
                  rows={5}
                  disabled={isCareerAchievementInputDisabled}
                  className={`w-full rounded-[24px] border px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 ${
                    isCareerAchievementInputDisabled
                      ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                      : "border-slate-200 bg-white text-slate-700 focus:border-slate-400 focus:ring-slate-200"
                  }`}
                  placeholder={
                    careerAchievementScoreMode === "direct_score"
                      ? "예: A=100, B=85, C=70 / 또는 대학이 제시한 진로선택·전문교과 환산 기준 입력"
                      : "예: A=1등급, B=B+C 비율 합 석차등급, C=C 비율 석차등급 / 또는 대학이 제시한 성취도 비율법 설명 입력"
                  }
                />
              </div>
            </div>
          </SectionCard>


          <SectionCard
            title="공통/일반선택과목 계산식 입력"
            description="스위치 설정에 따른 기본 계산식을 표시합니다. 다른 계산 방식을 반영해야 하는 경우 적용 스위치를 켜고 계산식 상세를 직접 입력하면 해당 식으로 공통/일반선택 반영점수를 계산합니다."
            right={
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-600">적용</span>
                <ToggleSwitch
                  checked={applyCustomCommonFormula}
                  onChange={setApplyCustomCommonFormula}
                />
              </div>
            }
          >
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    계산식 요약
                  </label>
                  <TextField
                    value={`${
                      subjectCalculationMode === "integrated"
                        ? `통합 선발형 / ${integratedSelectionModeLabel} / `
                        : "분리 합산형 / "
                    }${commonAutoFormulaSummary} / ${
                      applyConvertedScore ? "환산점수표 적용" : "등급 직접 반영"
                    }`}
                    onChange={() => {}}
                    disabled
                  />
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {applyCustomCommonFormula ? (
                    <>
                      현재 모드: 직접 입력한 계산식을 공통/일반선택 반영점수 계산에
                      적용합니다.
                    </>
                  ) : (
                    <>
                      현재 모드: 스위치 조합에 따라 생성된 기본 계산식을 그대로
                      사용합니다.
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  계산식 상세
                </label>
                <textarea
                  value={
                    applyCustomCommonFormula
                      ? commonCustomFormulaBody
                      : commonAutoFormulaBody
                  }
                  onChange={(event) =>
                    setCommonCustomFormulaBody(event.target.value)
                  }
                  rows={5}
                  disabled={!applyCustomCommonFormula}
                  className={`w-full rounded-[24px] border px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 ${
                    !applyCustomCommonFormula
                      ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"
                      : "border-slate-200 bg-white text-slate-700 focus:border-slate-400 focus:ring-slate-200"
                  }`}
                  placeholder={commonAutoFormulaBody}
                />
              </div>

              <p className="text-xs leading-6 text-slate-500">
                기본 계산식은 현재 스위치 조합에 따라 자동 표시됩니다. 직접 입력
                시 사용 가능 항목: 기본 공통과목 반영점수, 반영 과목별 등급 합,
                반영 과목별 환산점수 합, 반영 과목 수, 반영 과목별 학점 합,
                반영 과목별 (등급 × 학점) 합, 반영 과목별 (환산점수 × 학점) 합,
                교과별 가중 평균등급 합계, 교과별 가중 평균 환산점수 합계, 교과별
                학점 가중 평균등급 합계, 교과별 학점 가중 평균 환산점수 합계 /
                사칙연산(+, -, *, /) 및 괄호 사용 가능
              </p>

              {!isCommonCustomFormulaValid ? (
                <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  공통/일반선택과목 계산식 상세 형식이 올바르지 않습니다. 지원
                  항목과 사칙연산만 사용해 주세요.
                </div>
              ) : null}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-5">
          <SectionCard
            title="테스트 성적 연결 상태"
            description="test-score 페이지에 저장된 최신 테스트셋 정보를 표시합니다."
          >
            <div className="space-y-4">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-500">
                    로딩 상태
                  </span>
                  <span className="text-sm font-semibold text-slate-800">
                    {loadingTestScore ? "불러오는 중" : "완료"}
                  </span>
                </div>
                <div className="mt-3 h-px bg-slate-200" />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-500">
                    테스트셋명
                  </span>
                  <span className="text-sm font-semibold text-slate-800">
                    {testSetName || "-"}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-500">
                    입력 과목 수
                  </span>
                  <span className="text-sm font-semibold text-slate-800">
                    {filledTestRows.length}건
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-500">
                    공통 선별 과목 수
                  </span>
                  <span className="text-sm font-semibold text-slate-800">
                    {selectedCommonRows.length}건
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-500">
                    {subjectCalculationMode === "integrated"
                      ? "통합 선발 진로·전문교과 수"
                      : "진로/전문교과 선별 과목 수"}
                  </span>
                  <span className="text-sm font-semibold text-slate-800">
                    {subjectCalculationMode === "integrated"
                      ? selectedCareerRows.length
                      : selectedCareerRows.length}
                    건
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-500">
                    출결 데이터
                  </span>
                  <span className="text-sm font-semibold text-slate-800">
                    {testAttendance ? "있음" : "없음"}
                  </span>
                </div>
              </div>

              {testScoreMessage ? (
                <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {testScoreMessage}
                </div>
              ) : null}

              <Link
                href="/admin/university-conversion/test-score"
                className="inline-flex h-11 w-full items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                테스트 성적 수정하기
              </Link>
            </div>
          </SectionCard>

          <SectionCard
            title="등급별 환산점수 설정"
            description="환산점수 적용 ON일 때 과목별 등급을 점수로 변환하는 등급별 환산점수표입니다."
            right={
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-600">
                  환산점수 적용
                </span>
                <ToggleSwitch
                  checked={applyConvertedScore}
                  onChange={setApplyConvertedScore}
                />
              </div>
            }
          >
            <div className="space-y-3">
              <div className="grid grid-cols-[1.4fr_1fr] gap-3 border-b border-slate-200 pb-2 text-sm font-semibold text-slate-700">
                <div>등급</div>
                <div>환산 점수</div>
              </div>

              {gradeLevels.map((grade) => (
                <div key={grade} className="grid grid-cols-[1.4fr_1fr] gap-3">
                  <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700">
                    {grade}등급
                  </div>

                  <NumberField
                    value={gradeScoreMap[grade] ?? ""}
                    onChange={(value) =>
                      setGradeScoreMap((prev) => ({
                        ...prev,
                        [grade]: value,
                      }))
                    }
                    placeholder="점수"
                    disabled={!applyConvertedScore}
                  />
                </div>
              ))}
            </div>
          </SectionCard>

<SectionCard
  title="출결 반영 설정"
  description="출결을 반영하는 대학에만 ON으로 전환합니다. OFF일 때는 출결 점수 입력이 비활성화됩니다. 출결 반영점수는 결석 + (지각 + 조퇴 + 결과) / 3 으로 계산한 결석일수에 해당하는 반영 점수를 사용합니다."
  right={
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-slate-600">
        출결 반영여부
      </span>
      <ToggleSwitch
        checked={includeAttendance}
        onChange={setIncludeAttendance}
      />
    </div>
  }
>
  <div className="space-y-3">
    <div className="rounded-[20px] border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-700">
      <div className="font-semibold">계산식</div>
      <div className="mt-1">
        결석일수 = 결석 + (지각 + 조퇴 + 결과) / 3
      </div>
    </div>

    <div className="grid grid-cols-[1.4fr_1fr] gap-3 border-b border-slate-200 pb-2 text-sm font-semibold text-slate-700">
      <div>결석</div>
      <div>반영 점수</div>
    </div>

    {attendanceRows.map((row, index) => (
      <div key={row.id} className="grid grid-cols-[1.4fr_1fr] gap-3">
        <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700">
          {row.labelType === "fixed" && row.label}
          {row.labelType === "range" && `~ ${row.upper}일`}
          {row.labelType === "above" && `${row.lower}일 이상`}
        </div>

        <NumberField
          value={row.score}
          onChange={(value) =>
            setAttendanceRows((prev) =>
              prev.map((item, itemIndex) =>
                itemIndex === index ? { ...item, score: value } : item
              )
            )
          }
          placeholder="점수"
          disabled={!includeAttendance}
        />
      </div>
    ))}
  </div>
</SectionCard>

          <SectionCard
            title="성취도 비율법 등급 점수 설정"
            description="성취도 비율법 등급표를 사용할 때 등급별 비율과 환산점수를 입력합니다. 성취도 A/B/C 입력칸의 등급값과 매칭되는 행의 환산점수를 적용합니다."
            right={
              <ActionChip
                tone={
                  careerAchievementScoreMode === "ratio_grade" ? "blue" : "slate"
                }
              >
                {careerAchievementScoreMode === "ratio_grade"
                  ? "성취도 비율법 등급표 적용 중"
                  : "직접 점수 입력 모드"}
              </ActionChip>
            }
          >
            <div className="space-y-3">
              <div className="grid grid-cols-[1fr_1.4fr_1fr] gap-3 border-b border-slate-200 pb-2 text-sm font-semibold text-slate-700">
                <div>등급</div>
                <div>비율</div>
                <div>환산점수</div>
              </div>

              {achievementRatioScoreRows.map((row, index) => (
                <div
                  key={`achievement-ratio-${row.grade}`}
                  className="grid grid-cols-[1fr_1.4fr_1fr] gap-3"
                >
                  <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700">
                    {row.grade}등급
                  </div>

                  <TextField
                    value={row.ratio}
                    onChange={(value) =>
                      setAchievementRatioScoreRows((prev) =>
                        prev.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, ratio: value } : item
                        )
                      )
                    }
                    placeholder="예: 0~4%"
                    disabled={careerAchievementScoreMode !== "ratio_grade"}
                  />

                  <NumberField
                    value={row.score}
                    onChange={(value) =>
                      setAchievementRatioScoreRows((prev) =>
                        prev.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, score: value } : item
                        )
                      )
                    }
                    placeholder="환산점수"
                    disabled={careerAchievementScoreMode !== "ratio_grade"}
                  />
                </div>
              ))}

              <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-600">
                성취도 비율법 등급표 적용 모드에서는 성취도 A/B/C 입력칸에 등급을 입력하고, 해당 등급 행의 환산점수를 성취도 점수로 사용합니다.
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="환산 성적 요약"
            description="확정된 설정에 따라 test-score 데이터를 계산한 결과입니다."
            right={
              <div className="flex flex-wrap items-center gap-2">
                <ActionChip tone="blue">
                  {testSetName ? `기준: ${testSetName}` : "기준 데이터 없음"}
                </ActionChip>
                <ActionChip
                  tone={
                    subjectCalculationMode === "integrated" ? "blue" : "slate"
                  }
                >
                  {subjectCalculationMode === "integrated"
                    ? `진로·전문교과: 통합 선발 / ${integratedSelectionModeLabel}`
                    : "진로·전문교과: 분리 합산"}
                </ActionChip>
              </div>
            }
          >
            <div className="space-y-3">
              {conversionScoreSummary.map((item) => (
                <div
                  key={item.label}
                  className={`rounded-[22px] border px-4 py-4 ${
                    item.tone === "blue"
                      ? "border-blue-200 bg-blue-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-[15px] font-semibold text-slate-700">
                      {item.label}
                    </div>
                    <div
                      className={`text-[22px] font-bold tracking-tight ${
                        item.tone === "blue"
                          ? "text-blue-700"
                          : "text-slate-900"
                      }`}
                    >
                      {item.value}
                    </div>
                  </div>
                  {item.helper ? (
                    <div className="mt-1 text-xs font-medium text-slate-500">
                      {item.helper}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      <SectionCard
        title="환산 계산식 입력"
        description={`분리 합산형 기본 계산식은 "${DEFAULT_SEPARATE_FORMULA_BODY}" 이고, 통합 선발형 기본 계산식은 "${DEFAULT_INTEGRATED_FORMULA_BODY}" 입니다.`}
      >
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              계산식 상세
            </label>
            <textarea
              value={formulaBody}
              onChange={(event) => setFormulaBody(event.target.value)}
              rows={5}
              className="w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              placeholder={getDefaultFormulaBody(subjectCalculationMode)}
            />
          </div>

          <p className="text-xs leading-6 text-slate-500">
            사용 가능 항목: 통합 교과 반영점수, 통합 반영점수, 공통/일반선택
            반영점수, 공통교과 반영점수, 공통과목 반영점수, 진로선택/전문교과
            반영점수, 진로선택 반영점수, 전문교과 반영점수, 출결 반영점수 /
            일반 표기와 {"{토큰}"} 표기 모두 지원 / 사칙연산(+, -, *, /) 및
            괄호 사용 가능
          </p>

          <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-600">
            예시 1: (통합 교과 반영점수 * 1.0) + 출결 반영점수
            <br />
            예시 2: ({`{공통/일반선택 반영점수}`} * 0.6) + ({`{진로선택/전문교과 반영점수}`} * 0.4)
            <br />
            예시 3: 공통교과 반영점수 + 진로선택 반영점수 + 출결 반영점수
          </div>

          {!isFormulaValid ? (
            <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              계산식 상세 형식이 올바르지 않습니다. 지원 토큰과 사칙연산만
              사용해 주세요.
            </div>
          ) : null}
        </div>
      </SectionCard>

      {saveMessage ? (
        <div
          className={`rounded-[24px] border px-6 py-4 text-sm font-medium ${
            saveMessage.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {saveMessage.text}
        </div>
      ) : null}

      <footer className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={resetFormInputs}
          disabled={isSaving}
          className={`inline-flex h-11 items-center justify-center rounded-full border px-5 text-sm font-semibold transition ${
            isSaving
              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
              : "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100"
          }`}
        >
          초기화
        </button>

        <button
          type="button"
          onClick={() => void handleSave("draft")}
          disabled={isSaving}
          className={`inline-flex h-11 items-center justify-center rounded-full border px-5 text-sm font-semibold transition ${
            isSaving
              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
              : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
          }`}
        >
          {savingAction === "draft" ? "임시저장 중..." : "임시저장"}
        </button>

        <button
          type="button"
          onClick={() => void handleSave("review")}
          disabled={isSaving}
          className={`inline-flex h-11 items-center justify-center rounded-full border px-5 text-sm font-semibold transition ${
            isSaving
              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
              : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
          }`}
        >
          {savingAction === "review" ? "검수요청 중..." : "검수요청"}
        </button>

        <button
          type="button"
          onClick={() => void handleSave("activate")}
          disabled={!canActivateSave || isSaving}
          className={`inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-white transition ${
            !canActivateSave || isSaving
              ? "cursor-not-allowed bg-slate-300"
              : "bg-slate-900 hover:bg-slate-800"
          }`}
        >
          {savingAction === "activate"
            ? isEditMode
              ? "재활성화 저장 중..."
              : "활성화 저장 중..."
            : isEditMode
            ? "수정 후 다시 활성화"
            : "활성화 저장"}
        </button>
      </footer>
    </PageShell>
  );
}

export default UniversityConversionPageContent;
