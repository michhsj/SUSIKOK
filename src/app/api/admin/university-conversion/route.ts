import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateUniversityConversionSummaryFromTestSet } from "@/lib/university-conversion/calculate-rule-summary";
import {
  Prisma,
  UniversityConversionAttendanceLabelType,
  UniversityConversionRuleAction,
  UniversityConversionRuleMode,
  UniversityConversionRuleStatus,
} from "@prisma/client";

type AttendanceRowType = "fixed" | "range" | "above";
type SocialScienceSelectionMode = "combined_subjects" | "best_group";
type CareerSocialScienceSelectionMode = "separate" | "best_group";
type SubjectCalculationMode = "integrated" | "separate_weighted";
type IntegratedSelectionMode = "count_limit" | "all_selected";
type FinalFormulaValueKey = "commonScore" | "careerScore" | "attendanceScore";

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

type AttendanceRow = {
  id: string;
  labelType: AttendanceRowType;
  label?: string;
  upper?: string;
  lower?: string;
  score: string;
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

type SaveUniversityConversionPayload = {
  mode: "create" | "edit";
  action: SaveAction;
  ruleId: string | null;
  targetValues: TargetValues;

  subjectCalculationMode: SubjectCalculationMode;
  integratedSelectionMode: IntegratedSelectionMode;
  integratedTotalReflectionCount: string;
  integratedMaxCareerReflectionCount: string;

  commonSubjectSelections: Record<string, boolean>;
  commonUseAllSubjects: Record<string, boolean>;
  commonReflectionCounts: Record<string, string>;
  commonWeights: Record<string, string>;

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

type ApiSuccessResponse = {
  success: true;
  message: string;
  data: {
    ruleId: string;
    mode: "create" | "edit";
    action: SaveAction;
    status: "draft" | "review_requested" | "active" | "inactive";
    savedAt: string;
    targetValues: TargetValues;
  };
};

type ApiErrorResponse = {
  success: false;
  message: string;
  fieldErrors?: Record<string, string>;
};

type ApiListItem = {
  ruleId: string;
  ruleGroupKey: string;
  version: number;
  previousRuleId: string | null;
  region: string;
  university: string;
  admissionType: string;
  admissionName: string;
  track: string;
  collegeName: string;
  recruitmentUnit: string;
  mode: "create" | "edit";
  action: SaveAction;
  status: "draft" | "review_requested" | "active" | "inactive";
  isActive: boolean;
  linkedTestSetId: string | null;
  linkedTestSetName: string | null;
  linkedTestRowCount: number;
  attendanceIncluded: boolean;
  calculatedFinalScore: number | null;
  createdAt: string;
  updatedAt: string;
  activatedAt: string | null;
};

type ApiRuleDetail = {
  ruleId: string;
  ruleGroupKey: string;
  version: number;
  previousRuleId: string | null;
  mode: "create" | "edit";
  action: SaveAction;
  status: "draft" | "review_requested" | "active" | "inactive";
  isActive: boolean;

  targetValues: TargetValues;

  subjectCalculationMode: SubjectCalculationMode;
  integratedSelectionMode: IntegratedSelectionMode;
  integratedTotalReflectionCount: string;
  integratedMaxCareerReflectionCount: string;

  commonSubjectSelections: Record<string, boolean>;
  commonUseAllSubjects: Record<string, boolean>;
  commonReflectionCounts: Record<string, string>;
  commonWeights: Record<string, string>;

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

  createdAt: string;
  updatedAt: string;
  draftSavedAt: string | null;
  reviewRequestedAt: string | null;
  activatedAt: string | null;
};

type CalculatedSummaryNumbers = {
  commonScore: number;
  careerContributionScore: number;
  attendanceScore: number;
  finalScore: number;
};

const CAREER_SUBJECT_KEYS: CareerSubjectKey[] = [
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

const DEFAULT_INTEGRATED_TOTAL_REFLECTION_COUNT = "12";
const DEFAULT_INTEGRATED_MAX_CAREER_REFLECTION_COUNT = "0";

const DEFAULT_INCLUDE_COMMON_SUBJECTS = true;
const DEFAULT_INCLUDE_REGULAR_ELECTIVE_SUBJECTS = true;
const DEFAULT_INCLUDE_CAREER_SELECTION_SUBJECTS = true;
const DEFAULT_INCLUDE_SPECIALIZED_SUBJECTS = true;
const DEFAULT_CAREER_SOCIAL_SCIENCE_SELECTION_MODE: CareerSocialScienceSelectionMode =
  "separate";

const DEFAULT_CAREER_SUBJECT_SELECTIONS: CareerSubjectSelections = {
  국어: false,
  수학: false,
  영어: false,
  사회: false,
  과학: false,
  기타과목: false,
};

const DEFAULT_CAREER_USE_ALL_SUBJECTS: CareerUseAllSubjects = {
  국어: false,
  수학: false,
  영어: false,
  사회: false,
  과학: false,
  기타과목: false,
};

const DEFAULT_CAREER_REFLECTION_COUNTS: CareerReflectionCounts = {
  국어: "1",
  수학: "1",
  영어: "1",
  사회: "1",
  과학: "1",
  기타과목: "1",
};

const FINAL_FORMULA_TOKEN_ALIASES: Record<
  FinalFormulaValueKey,
  readonly string[]
> = {
  commonScore: [
    "통합 교과 반영점수",
    "통합교과 반영점수",
    "통합 과목 반영점수",
    "통합과목 반영점수",
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isJsonObject(
  value: Prisma.JsonValue | null | undefined
): value is Prisma.JsonObject {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function toText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toStringValue(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isStringRecord(value: unknown): value is Record<string, string> {
  if (!isRecord(value)) return false;
  return Object.values(value).every((item) => typeof item === "string");
}

function isBooleanRecord(value: unknown): value is Record<string, boolean> {
  if (!isRecord(value)) return false;
  return Object.values(value).every((item) => typeof item === "boolean");
}

function normalizeStringMap(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    return {};
  }

  const next: Record<string, string> = {};

  for (const [key, item] of Object.entries(value)) {
    if (!toText(key)) continue;

    if (typeof item === "string") {
      next[key] = item;
      continue;
    }

    if (typeof item === "number" && Number.isFinite(item)) {
      next[key] = String(item);
    }
  }

  return next;
}

function normalizeBooleanMap(value: unknown): Record<string, boolean> {
  if (!isRecord(value)) {
    return {};
  }

  const next: Record<string, boolean> = {};

  for (const [key, item] of Object.entries(value)) {
    if (!toText(key)) continue;
    if (typeof item === "boolean") {
      next[key] = item;
    }
  }

  return next;
}

function isSubjectCalculationMode(
  value: unknown
): value is SubjectCalculationMode {
  return value === "integrated" || value === "separate_weighted";
}

function isIntegratedSelectionMode(
  value: unknown
): value is IntegratedSelectionMode {
  return value === "count_limit" || value === "all_selected";
}

function isSocialScienceSelectionMode(
  value: unknown
): value is SocialScienceSelectionMode {
  return value === "combined_subjects" || value === "best_group";
}

function isCareerSocialScienceSelectionMode(
  value: unknown
): value is CareerSocialScienceSelectionMode {
  return value === "separate" || value === "best_group";
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

function createDefaultCareerSubjectSelections(): CareerSubjectSelections {
  return { ...DEFAULT_CAREER_SUBJECT_SELECTIONS };
}

function createDefaultCareerUseAllSubjects(): CareerUseAllSubjects {
  return { ...DEFAULT_CAREER_USE_ALL_SUBJECTS };
}

function createDefaultCareerReflectionCounts(): CareerReflectionCounts {
  return { ...DEFAULT_CAREER_REFLECTION_COUNTS };
}

function hasEnabledCommonInclusionSwitches(switches: {
  includeCommonSubjects: boolean;
  includeRegularElectiveSubjects: boolean;
}) {
  return (
    switches.includeCommonSubjects || switches.includeRegularElectiveSubjects
  );
}

function hasEnabledCareerInclusionSwitches(switches: {
  includeCareerSelectionSubjects: boolean;
  includeSpecializedSubjects: boolean;
}) {
  return (
    switches.includeCareerSelectionSubjects || switches.includeSpecializedSubjects
  );
}

function normalizeCareerSubjectSelections(
  value: unknown,
  fallback?: Partial<CareerSubjectSelections>
): CareerSubjectSelections {
  const next = {
    ...createDefaultCareerSubjectSelections(),
    ...(fallback ?? {}),
  };

  if (!isBooleanRecord(value)) {
    return next;
  }

  for (const key of CAREER_SUBJECT_KEYS) {
    if (typeof value[key] === "boolean") {
      next[key] = value[key];
    }
  }

  return next;
}

function normalizeCareerUseAllSubjects(
  value: unknown,
  fallback?: Partial<CareerUseAllSubjects>
): CareerUseAllSubjects {
  const next = {
    ...createDefaultCareerUseAllSubjects(),
    ...(fallback ?? {}),
  };

  if (!isBooleanRecord(value)) {
    return next;
  }

  for (const key of CAREER_SUBJECT_KEYS) {
    if (typeof value[key] === "boolean") {
      next[key] = value[key];
    }
  }

  return next;
}

function normalizeCareerReflectionCounts(
  value: unknown,
  fallback?: Partial<CareerReflectionCounts>
): CareerReflectionCounts {
  const next = {
    ...createDefaultCareerReflectionCounts(),
    ...(fallback ?? {}),
  };

  if (!isRecord(value)) {
    return next;
  }

  for (const key of CAREER_SUBJECT_KEYS) {
    const item = value[key];
    if (typeof item === "string") {
      next[key] = item;
    } else if (typeof item === "number" && Number.isFinite(item)) {
      next[key] = String(item);
    }
  }

  return next;
}

function normalizeAttendanceRows(value: unknown): AttendanceRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const rows: AttendanceRow[] = [];

  for (const item of value) {
    if (!isRecord(item)) continue;

    const labelType = item.labelType;
    if (
      labelType !== "fixed" &&
      labelType !== "range" &&
      labelType !== "above"
    ) {
      continue;
    }

    const id = toText(item.id);
    const score = toStringValue(item.score);

    if (!id || !score) {
      continue;
    }

    rows.push({
      id,
      labelType,
      label: toText(item.label) || undefined,
      upper: toStringValue(item.upper) || undefined,
      lower: toStringValue(item.lower) || undefined,
      score,
    });
  }

  return rows;
}

function parseNumber(value: string | null | undefined) {
  if (!value) return null;
  const cleaned = value.replace(/,/g, "").trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseFloatOrDefault(value: string | null | undefined, fallback = 0) {
  const parsed = parseNumber(value ?? "");
  return parsed ?? fallback;
}

function parseIntOrDefault(value: string | null | undefined, fallback = 0) {
  const parsed = parseNumber(value ?? "");
  if (parsed == null) return fallback;
  return Math.max(0, Math.floor(parsed));
}

function parseFloatLike(value: unknown, fallback = 0) {
  return parseFloatOrDefault(toStringValue(value), fallback);
}

function parseIntLike(value: unknown, fallback = 0) {
  return parseIntOrDefault(toStringValue(value), fallback);
}

function normalizeOptionalText(value: string | null | undefined) {
  const text = toText(value);
  return text || null;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function toCalculatedSummaryStrings(
  summary: CalculatedSummaryNumbers
): SaveUniversityConversionPayload["calculatedSummary"] {
  return {
    commonScore: String(summary.commonScore),
    careerContributionScore: String(summary.careerContributionScore),
    attendanceScore: String(summary.attendanceScore),
    finalScore: String(summary.finalScore),
  };
}

function readCalculatedSummaryNumbersFromPayload(
  payload: Pick<SaveUniversityConversionPayload, "calculatedSummary">
): CalculatedSummaryNumbers {
  return {
    commonScore: parseFloatOrDefault(payload.calculatedSummary.commonScore, 0),
    careerContributionScore: parseFloatOrDefault(
      payload.calculatedSummary.careerContributionScore,
      0
    ),
    attendanceScore: parseFloatOrDefault(
      payload.calculatedSummary.attendanceScore,
      0
    ),
    finalScore: parseFloatOrDefault(payload.calculatedSummary.finalScore, 0),
  };
}

function readCalculatedSummaryNumbersFromRuleRecord(rule: {
  calculatedCommonScore: number | null;
  calculatedCareerContributionScore: number | null;
  calculatedAttendanceScore: number | null;
  calculatedFinalScore: number | null;
}): CalculatedSummaryNumbers {
  return {
    commonScore: rule.calculatedCommonScore ?? 0,
    careerContributionScore: rule.calculatedCareerContributionScore ?? 0,
    attendanceScore: rule.calculatedAttendanceScore ?? 0,
    finalScore: rule.calculatedFinalScore ?? 0,
  };
}

function isSameCalculatedSummary(
  left: CalculatedSummaryNumbers,
  right: CalculatedSummaryNumbers,
  epsilon = 1e-9
) {
  return (
    Math.abs(left.commonScore - right.commonScore) <= epsilon &&
    Math.abs(
      left.careerContributionScore - right.careerContributionScore
    ) <= epsilon &&
    Math.abs(left.attendanceScore - right.attendanceScore) <= epsilon &&
    Math.abs(left.finalScore - right.finalScore) <= epsilon
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripSupportedFinalFormulaTokens(formula: string) {
  let expression = toText(formula);

  if (!expression) {
    return "";
  }
  for (const aliases of Object.values(FINAL_FORMULA_TOKEN_ALIASES)) {
    const sortedAliases = [...aliases].sort((a, b) => b.length - a.length);

    for (const token of sortedAliases) {
      const escapedToken = escapeRegExp(token);
      expression = expression.replace(
        new RegExp(`\\{\\s*${escapedToken}\\s*\\}`, "g"),
        "1"
      );
    }

    for (const token of sortedAliases) {
      const escapedToken = escapeRegExp(token);
      expression = expression.replace(new RegExp(escapedToken, "g"), "1");
    }
  }

  return expression.replace(/\s+/g, "");
}

function isValidFinalFormulaSyntax(formula: string) {
  const expression = stripSupportedFinalFormulaTokens(formula);

  if (!expression) {
    return true;
  }

  if (/[{}]/.test(expression)) {
    return false;
  }

  if (/[^0-9+\-*/().]/.test(expression)) {
    return false;
  }

  try {
    Function(`"use strict"; return (${expression});`);
    return true;
  } catch {
    return false;
  }
}

function validateCommonSubjectFields(payload: SaveUniversityConversionPayload) {
  const fieldErrors: Record<string, string> = {};
  const effectiveIncludeCommonSubjects = hasEnabledCommonInclusionSwitches({
    includeCommonSubjects: payload.switches.includeCommonSubjects,
    includeRegularElectiveSubjects:
      payload.switches.includeRegularElectiveSubjects,
  });

  if (!effectiveIncludeCommonSubjects) {
    return fieldErrors;
  }

  const selectedSubjects = Object.keys(payload.commonSubjectSelections).filter(
    (subject) =>
      toText(subject) && payload.commonSubjectSelections[subject] === true
  );

  if (selectedSubjects.length === 0) {
    fieldErrors.commonSubjectSelections =
      "공통/일반선택과목은 최소 1개 이상 선택해야 합니다.";
    return fieldErrors;
  }

  if (payload.subjectCalculationMode === "integrated") {
    if (payload.integratedSelectionMode === "count_limit") {
      const totalReflectionCount = parseIntOrDefault(
        payload.integratedTotalReflectionCount,
        0
      );
      const careerMaxReflectionCount = parseIntOrDefault(
        payload.integratedMaxCareerReflectionCount,
        0
      );

      if (totalReflectionCount <= 0) {
        fieldErrors.integratedTotalReflectionCount =
          "통합 선발형에서 과목수 제한 반영을 선택한 경우 전체 반영과목수를 1 이상 입력해 주세요.";
      }

      if (
        totalReflectionCount > 0 &&
        careerMaxReflectionCount > totalReflectionCount
      ) {
        fieldErrors.integratedMaxCareerReflectionCount =
          "진로선택/전문교과 최대 과목수는 전체 반영과목수보다 클 수 없습니다.";
      }
    }

    for (const subject of selectedSubjects) {
      const weight = payload.commonWeights[subject];

      if (payload.switches.applyCommonWeight && parseNumber(weight) == null) {
        fieldErrors[`commonWeights.${subject}`] =
          `${subject}의 가중치(%)를 입력해 주세요.`;
      }
    }

    return fieldErrors;
  }

  for (const subject of selectedSubjects) {
    const useAllSubjects = payload.commonUseAllSubjects[subject] === true;
    const reflectionCount = payload.commonReflectionCounts[subject];
    const weight = payload.commonWeights[subject];

    if (!useAllSubjects && parseIntOrDefault(reflectionCount, 0) <= 0) {
      fieldErrors[`commonReflectionCounts.${subject}`] =
        `${subject}의 반영 과목 수를 입력해 주세요.`;
    }

    if (payload.switches.applyCommonWeight && parseNumber(weight) == null) {
      fieldErrors[`commonWeights.${subject}`] =
        `${subject}의 가중치(%)를 입력해 주세요.`;
    }
  }

  return fieldErrors;
}

function validateCareerSubjectFields(payload: SaveUniversityConversionPayload) {
  const fieldErrors: Record<string, string> = {};
  const effectiveIncludeCareerSubjects =
    payload.switches.includeCareerSubjects &&
    hasEnabledCareerInclusionSwitches({
      includeCareerSelectionSubjects:
        payload.switches.includeCareerSelectionSubjects,
      includeSpecializedSubjects: payload.switches.includeSpecializedSubjects,
    });

  if (!effectiveIncludeCareerSubjects) {
    return fieldErrors;
  }

  const selectedCareerSubjects = CAREER_SUBJECT_KEYS.filter(
    (subject) => payload.careerSubjectSelections[subject] === true
  );

  if (selectedCareerSubjects.length === 0) {
    fieldErrors.careerSubjectSelections =
      "진로선택/전문교과는 최소 1개 이상 선택해야 합니다.";
    return fieldErrors;
  }

  if (payload.subjectCalculationMode === "integrated") {
    if (payload.integratedSelectionMode === "count_limit") {
      const totalReflectionCount = parseIntOrDefault(
        payload.integratedTotalReflectionCount,
        0
      );
      const careerMaxReflectionCount = parseIntOrDefault(
        payload.integratedMaxCareerReflectionCount,
        0
      );

      if (careerMaxReflectionCount > totalReflectionCount) {
        fieldErrors.integratedMaxCareerReflectionCount =
          "진로선택/전문교과 최대 과목수는 전체 반영과목수보다 클 수 없습니다.";
      }
    }

    return fieldErrors;
  }

  for (const subject of selectedCareerSubjects) {
    const useAllSubjects = payload.careerUseAllSubjects[subject] === true;
    const reflectionCount = payload.careerReflectionCounts[subject];

    if (!useAllSubjects && parseIntOrDefault(reflectionCount, 0) <= 0) {
      fieldErrors[`careerReflectionCounts.${subject}`] =
        `${subject}의 반영 과목 수를 입력해 주세요.`;
    }
  }

  return fieldErrors;
}

function validatePayload(payload: SaveUniversityConversionPayload) {
  const fieldErrors: Record<string, string> = {};
  const effectiveIncludeCommonSubjects = hasEnabledCommonInclusionSwitches({
    includeCommonSubjects: payload.switches.includeCommonSubjects,
    includeRegularElectiveSubjects:
      payload.switches.includeRegularElectiveSubjects,
  });
  const effectiveIncludeCareerSubjects =
    payload.switches.includeCareerSubjects &&
    hasEnabledCareerInclusionSwitches({
      includeCareerSelectionSubjects:
        payload.switches.includeCareerSelectionSubjects,
      includeSpecializedSubjects: payload.switches.includeSpecializedSubjects,
    });

  if (payload.mode === "edit" && !toText(payload.ruleId)) {
    fieldErrors.ruleId = "수정 모드에서는 ruleId가 필요합니다.";
  }

  if (payload.action === "review" || payload.action === "activate") {
    if (!toText(payload.targetValues.region)) {
      fieldErrors["targetValues.region"] = "지역은 필수입니다.";
    }
    if (!toText(payload.targetValues.university)) {
      fieldErrors["targetValues.university"] = "대학은 필수입니다.";
    }
    if (!toText(payload.targetValues.admissionType)) {
      fieldErrors["targetValues.admissionType"] = "전형유형은 필수입니다.";
    }

    Object.assign(fieldErrors, validateCommonSubjectFields(payload));
    Object.assign(fieldErrors, validateCareerSubjectFields(payload));
  }

  if (payload.switches.includeAttendance && payload.attendanceRows.length === 0) {
    fieldErrors.attendanceRows = "출결 반영 사용 시 출결 기준표가 필요합니다.";
  }

  if (
    effectiveIncludeCareerSubjects &&
    !toText(payload.careerAchievementFormulaName)
  ) {
    fieldErrors.careerAchievementFormulaName =
      "진로선택/전문교과 반영 사용 시 성취도 환산식 이름이 필요합니다.";
  }

  if (
    payload.applyCustomCommonFormula &&
    effectiveIncludeCommonSubjects &&
    !toText(payload.commonCustomFormulaBody)
  ) {
    fieldErrors.commonCustomFormulaBody =
      "공통/일반선택과목 계산식 직접 입력 적용 시 계산식 상세를 입력해 주세요.";
  }

  if (
    payload.subjectCalculationMode === "integrated" &&
    payload.socialScienceSelectionMode === "best_group" &&
    payload.careerSocialScienceSelectionMode !== "best_group"
  ) {
    fieldErrors.careerSocialScienceSelectionMode =
      "통합 선발형에서 사회/과학 반영 방식이 우수 교과 방식이면 진로선택/전문교과 성취도 환산 설정도 우수 교과 방식이어야 합니다.";
  }

  if (!isValidFinalFormulaSyntax(payload.formulaBody)) {
    fieldErrors.formulaBody =
      "환산 계산식 형식이 올바르지 않습니다. 통합 교과 반영점수, 공통/일반선택 반영점수, 공통교과 반영점수, 공통과목 반영점수, 진로선택/전문교과 반영점수, 진로/전문교과 반영점수, 진로선택 반영점수, 전문교과 반영점수, 출결 반영점수를 일반 표기 또는 {토큰} 표기로 사용할 수 있습니다.";
  }

  return {
    valid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
  };
}

function normalizeLegacyCareerPayloadFromRaw(
  rawRecord: Record<string, unknown> | null
) {
  const nextSelections = createDefaultCareerSubjectSelections();
  const nextUseAll = createDefaultCareerUseAllSubjects();
  const nextCounts = createDefaultCareerReflectionCounts();

  if (!rawRecord) {
    return {
      careerSubjectSelections: nextSelections,
      careerUseAllSubjects: nextUseAll,
      careerReflectionCounts: nextCounts,
    };
  }

  const legacySelections = isBooleanRecord(rawRecord.careerSubjectSelections)
    ? rawRecord.careerSubjectSelections
    : null;

  const legacyUseAll = isBooleanRecord(rawRecord.careerUseAllSubjects)
    ? rawRecord.careerUseAllSubjects
    : null;

  const legacyCounts = isStringRecord(rawRecord.careerReflectionCounts)
    ? rawRecord.careerReflectionCounts
    : null;

  for (const key of CAREER_SUBJECT_KEYS) {
    if (legacySelections && typeof legacySelections[key] === "boolean") {
      nextSelections[key] = legacySelections[key];
    }
    if (legacyUseAll && typeof legacyUseAll[key] === "boolean") {
      nextUseAll[key] = legacyUseAll[key];
    }
    if (legacyCounts && typeof legacyCounts[key] === "string") {
      nextCounts[key] = legacyCounts[key];
    }
  }

  if (legacySelections && typeof legacySelections["전문교과"] === "boolean") {
    nextSelections["기타과목"] =
      nextSelections["기타과목"] || legacySelections["전문교과"];
  }

  if (legacyUseAll && typeof legacyUseAll["전문교과"] === "boolean") {
    nextUseAll["기타과목"] =
      nextUseAll["기타과목"] || legacyUseAll["전문교과"];
  }

  if (legacyCounts && typeof legacyCounts["전문교과"] === "string") {
    if (!toText(nextCounts["기타과목"])) {
      nextCounts["기타과목"] = legacyCounts["전문교과"];
    }
  }

  const totalSelected =
    legacySelections && typeof legacySelections["전체"] === "boolean"
      ? legacySelections["전체"]
      : false;

  const totalUseAll =
    legacyUseAll && typeof legacyUseAll["전체"] === "boolean"
      ? legacyUseAll["전체"]
      : false;

  const totalCount =
    legacyCounts && typeof legacyCounts["전체"] === "string"
      ? legacyCounts["전체"]
      : "1";

  if (totalSelected) {
    const hasSpecificSelection = CAREER_SUBJECT_KEYS.some(
      (key) => nextSelections[key]
    );

    if (!hasSpecificSelection) {
      for (const key of CAREER_SUBJECT_KEYS) {
        nextSelections[key] = true;
        nextUseAll[key] = totalUseAll;
        nextCounts[key] = totalUseAll ? "" : totalCount;
      }
    }
  }

  return {
    careerSubjectSelections: nextSelections,
    careerUseAllSubjects: nextUseAll,
    careerReflectionCounts: nextCounts,
  };
}

function readOptionalIncludeCommonSubjectsFromRawPayload(
  rawPayload: Prisma.JsonValue | null | undefined
) {
  const rawRecord = isRecord(rawPayload) ? rawPayload : null;
  const rawSwitches = isRecord(rawRecord?.switches) ? rawRecord.switches : null;

  return isBoolean(rawSwitches?.includeCommonSubjects)
    ? rawSwitches.includeCommonSubjects
    : null;
}

function readOptionalIncludeRegularElectiveSubjectsFromRawPayload(
  rawPayload: Prisma.JsonValue | null | undefined
) {
  const rawRecord = isRecord(rawPayload) ? rawPayload : null;
  const rawSwitches = isRecord(rawRecord?.switches) ? rawRecord.switches : null;

  if (isBoolean(rawSwitches?.includeRegularElectiveSubjects)) {
    return rawSwitches.includeRegularElectiveSubjects;
  }

  return isBoolean(rawSwitches?.includeGeneralSelectionSubjects)
    ? rawSwitches.includeGeneralSelectionSubjects
    : null;
}

function readOptionalIncludeCommonSubjectsFromRuleRecord(
  rule: unknown
): boolean | null {
  if (!isRecord(rule)) {
    return null;
  }

  const value = rule["includeCommonSubjects"];
  return isBoolean(value) ? value : null;
}

function readExtendedOptionsFromRawPayload(
  rawPayload: Prisma.JsonValue | null | undefined
) {
  const rawRecord = isRecord(rawPayload) ? rawPayload : null;
  const rawSwitches = isRecord(rawRecord?.switches) ? rawRecord.switches : null;
  const legacyCareer = normalizeLegacyCareerPayloadFromRaw(rawRecord);

  return {
    subjectCalculationMode: isSubjectCalculationMode(
      rawRecord?.subjectCalculationMode
    )
      ? rawRecord.subjectCalculationMode
      : isBoolean(rawRecord?.useMixedSelectionMode) &&
        rawRecord.useMixedSelectionMode
      ? "integrated"
      : DEFAULT_SUBJECT_CALCULATION_MODE,

    integratedSelectionMode: isIntegratedSelectionMode(
      rawRecord?.integratedSelectionMode
    )
      ? rawRecord.integratedSelectionMode
      : DEFAULT_INTEGRATED_SELECTION_MODE,

    integratedTotalReflectionCount:
      typeof rawRecord?.integratedTotalReflectionCount === "string"
        ? rawRecord.integratedTotalReflectionCount
        : typeof rawRecord?.mixedTotalReflectionCount === "string"
        ? rawRecord.mixedTotalReflectionCount
        : DEFAULT_INTEGRATED_TOTAL_REFLECTION_COUNT,

    integratedMaxCareerReflectionCount:
      typeof rawRecord?.integratedMaxCareerReflectionCount === "string"
        ? rawRecord.integratedMaxCareerReflectionCount
        : typeof rawRecord?.integratedCareerMaxReflectionCount === "string"
        ? rawRecord.integratedCareerMaxReflectionCount
        : typeof rawRecord?.mixedMaxCareerSpecializedCount === "string"
        ? rawRecord.mixedMaxCareerSpecializedCount
        : typeof rawRecord?.mixedCareerMaxReflectionCount === "string"
        ? rawRecord.mixedCareerMaxReflectionCount
        : DEFAULT_INTEGRATED_MAX_CAREER_REFLECTION_COUNT,

    applyCustomCommonFormula: isBoolean(rawRecord?.applyCustomCommonFormula)
      ? rawRecord.applyCustomCommonFormula
      : false,

    commonCustomFormulaBody:
      typeof rawRecord?.commonCustomFormulaBody === "string"
        ? rawRecord.commonCustomFormulaBody
        : "",

    socialScienceSelectionMode: isSocialScienceSelectionMode(
      rawRecord?.socialScienceSelectionMode
    )
      ? rawRecord.socialScienceSelectionMode
      : "combined_subjects",

    careerSocialScienceSelectionMode: resolveEffectiveCareerSocialScienceSelectionMode({
      subjectCalculationMode: isSubjectCalculationMode(rawRecord?.subjectCalculationMode)
        ? rawRecord.subjectCalculationMode
        : isBoolean(rawRecord?.useMixedSelectionMode) &&
          rawRecord.useMixedSelectionMode
        ? "integrated"
        : DEFAULT_SUBJECT_CALCULATION_MODE,
      socialScienceSelectionMode: isSocialScienceSelectionMode(
        rawRecord?.socialScienceSelectionMode
      )
        ? rawRecord.socialScienceSelectionMode
        : "combined_subjects",
      careerSocialScienceSelectionMode: isCareerSocialScienceSelectionMode(
        rawRecord?.careerSocialScienceSelectionMode
      )
        ? rawRecord.careerSocialScienceSelectionMode
        : DEFAULT_CAREER_SOCIAL_SCIENCE_SELECTION_MODE,
    }),

    includeSecondForeignLanguageInEnglish: isBoolean(
      rawRecord?.includeSecondForeignLanguageInEnglish
    )
      ? rawRecord.includeSecondForeignLanguageInEnglish
      : false,

    includeKoreanHistoryInSocial: isBoolean(rawRecord?.includeKoreanHistoryInSocial)
      ? rawRecord.includeKoreanHistoryInSocial
      : false,

    includeKoreanHistoryInSocialScience: isBoolean(
      rawRecord?.includeKoreanHistoryInSocialScience
    )
      ? rawRecord.includeKoreanHistoryInSocialScience
      : false,

    includeKoreanHistoryInSocialWhenBestGroup: isBoolean(
      rawRecord?.includeKoreanHistoryInSocialWhenBestGroup
    )
      ? rawRecord.includeKoreanHistoryInSocialWhenBestGroup
      : false,

    includeRegularElectiveSubjects: isBoolean(
      rawSwitches?.includeRegularElectiveSubjects
    )
      ? rawSwitches.includeRegularElectiveSubjects
      : isBoolean(rawSwitches?.includeGeneralSelectionSubjects)
      ? rawSwitches.includeGeneralSelectionSubjects
      : DEFAULT_INCLUDE_REGULAR_ELECTIVE_SUBJECTS,

    includeCareerSelectionSubjects: isBoolean(
      rawSwitches?.includeCareerSelectionSubjects
    )
      ? rawSwitches.includeCareerSelectionSubjects
      : DEFAULT_INCLUDE_CAREER_SELECTION_SUBJECTS,

    includeSpecializedSubjects: isBoolean(
      rawSwitches?.includeSpecializedSubjects
    )
      ? rawSwitches.includeSpecializedSubjects
      : DEFAULT_INCLUDE_SPECIALIZED_SUBJECTS,

    careerAchievementScoreMode:
      (rawRecord?.careerAchievementScoreMode === "ratio_grade"
        ? "ratio_grade"
        : "direct_score") as CareerAchievementScoreMode,

    achievementRatioScoreRows: Array.isArray(rawRecord?.achievementRatioScoreRows)
      ? rawRecord.achievementRatioScoreRows
          .filter(isJsonObject)
          .map((row) => ({
            grade: toStringValue(row["grade"]),
            ratio: toStringValue(row["ratio"]),
            score: toStringValue(row["score"]),
          }))
      : [],

    careerSubjectSelections: normalizeCareerSubjectSelections(
      rawRecord?.careerSubjectSelections,
      legacyCareer.careerSubjectSelections
    ),

    careerUseAllSubjects: normalizeCareerUseAllSubjects(
      rawRecord?.careerUseAllSubjects,
      legacyCareer.careerUseAllSubjects
    ),

    careerReflectionCounts: normalizeCareerReflectionCounts(
      rawRecord?.careerReflectionCounts,
      legacyCareer.careerReflectionCounts
    ),
  };
}

function buildRuleGroupKey(targetValues: TargetValues) {
  return [
    toText(targetValues.region),
    toText(targetValues.university),
    toText(targetValues.admissionType),
    toText(targetValues.admissionName),
    toText(targetValues.track),
    toText(targetValues.collegeName),
    toText(targetValues.recruitmentUnit),
  ].join("||");
}

const RESOLVED_SCOPE_OPTIONAL_KEYS = [
  "track",
  "admissionName",
  "collegeName",
  "recruitmentUnit",
] as const;

const RULE_SPECIFICITY_PRIORITY_KEYS = [
  "recruitmentUnit",
  "collegeName",
  "admissionName",
  "track",
] as const;

type ResolvedTargetScope = Pick<
  TargetValues,
  | "region"
  | "university"
  | "admissionType"
  | "admissionName"
  | "track"
  | "collegeName"
  | "recruitmentUnit"
>;

type RuleScopeSortable = ResolvedTargetScope & {
  updatedAt: Date;
  version: number;
};

function hasResolvedScopeTarget(target: ResolvedTargetScope) {
  return RESOLVED_SCOPE_OPTIONAL_KEYS.some((key) => Boolean(toText(target[key])));
}

function matchesRuleToResolvedTarget(
  rule: ResolvedTargetScope,
  target: ResolvedTargetScope
) {
  if (toText(rule.region) !== toText(target.region)) return false;
  if (toText(rule.university) !== toText(target.university)) return false;
  if (toText(rule.admissionType) !== toText(target.admissionType)) return false;

  for (const key of RESOLVED_SCOPE_OPTIONAL_KEYS) {
    const targetValue = toText(target[key]);
    const ruleValue = toText(rule[key]);

    if (targetValue) {
      if (ruleValue && ruleValue !== targetValue) {
        return false;
      }
      continue;
    }

    if (ruleValue) {
      return false;
    }
  }

  return true;
}

function getRuleSpecificityTuple(rule: ResolvedTargetScope) {
  return RULE_SPECIFICITY_PRIORITY_KEYS.map((key) =>
    toText(rule[key]) ? 1 : 0
  );
}

function compareRulesBySpecificity(
  a: RuleScopeSortable,
  b: RuleScopeSortable
) {
  const aTuple = getRuleSpecificityTuple(a);
  const bTuple = getRuleSpecificityTuple(b);

  for (let index = 0; index < RULE_SPECIFICITY_PRIORITY_KEYS.length; index += 1) {
    if (aTuple[index] !== bTuple[index]) {
      return bTuple[index] - aTuple[index];
    }
  }

  const updatedAtDiff = b.updatedAt.getTime() - a.updatedAt.getTime();
  if (updatedAtDiff !== 0) {
    return updatedAtDiff;
  }

  return b.version - a.version;
}

function mapDbMode(mode: UniversityConversionRuleMode): "create" | "edit" {
  return mode === UniversityConversionRuleMode.EDIT ? "edit" : "create";
}

function mapDbAction(action: UniversityConversionRuleAction): SaveAction {
  return action === UniversityConversionRuleAction.REVIEW
    ? "review"
    : action === UniversityConversionRuleAction.ACTIVATE
    ? "activate"
    : "draft";
}

function mapDbStatus(
  status: UniversityConversionRuleStatus
): "draft" | "review_requested" | "active" | "inactive" {
  if (status === UniversityConversionRuleStatus.REVIEW_REQUESTED) {
    return "review_requested";
  }

  if (status === UniversityConversionRuleStatus.ACTIVE) {
    return "active";
  }

  if (status === UniversityConversionRuleStatus.INACTIVE) {
    return "inactive";
  }

  return "draft";
}

function resolveCalculatedCareerContributionScore(
  calculatedSummary: Record<string, unknown>
) {
  const direct = calculatedSummary.careerContributionScore;
  if (typeof direct === "string") return direct;
  if (typeof direct === "number" && Number.isFinite(direct)) {
    return String(direct);
  }

  const legacy = calculatedSummary.careerScore;
  if (typeof legacy === "string") return legacy;
  if (typeof legacy === "number" && Number.isFinite(legacy)) {
    return String(legacy);
  }

  return "";
}

const linkedTestSetInclude = {
  scoreRows: {
    orderBy: {
      sortOrder: "asc" as const,
    },
  },
  attendance: true,
} satisfies Prisma.ConversionRuleTestSetInclude;

const ruleDetailInclude = {
  commonSubjectRules: {
    orderBy: {
      sortOrder: "asc" as const,
    },
  },
  gradeScoreRules: {
    orderBy: {
      grade: "asc" as const,
    },
  },
  careerReflectionRules: {
    orderBy: {
      sortOrder: "asc" as const,
    },
  },
  careerAchievementScoreRules: {
    orderBy: {
      achievementLevel: "asc" as const,
    },
  },
  attendanceScoreRules: {
    orderBy: {
      sortOrder: "asc" as const,
    },
  },
} satisfies Prisma.UniversityConversionRuleInclude;

const ruleRecalculationInclude = {
  ...ruleDetailInclude,
  linkedTestSet: {
    include: linkedTestSetInclude,
  },
} satisfies Prisma.UniversityConversionRuleInclude;

type UniversityConversionRuleDetailRecord =
  Prisma.UniversityConversionRuleGetPayload<{
    include: typeof ruleDetailInclude;
  }>;

type UniversityConversionRuleRecalculationRecord =
  Prisma.UniversityConversionRuleGetPayload<{
    include: typeof ruleRecalculationInclude;
  }>;

type LinkedTestSetRecord = Prisma.ConversionRuleTestSetGetPayload<{
  include: typeof linkedTestSetInclude;
}>;

function mapRuleListItem(
  rule: {
    id: string;
    ruleGroupKey: string;
    version: number;
    previousRuleId: string | null;
    region: string;
    university: string;
    admissionType: string;
    admissionName: string;
    track: string;
    collegeName: string;
    recruitmentUnit: string;
    mode: UniversityConversionRuleMode;
    action: UniversityConversionRuleAction;
    status: UniversityConversionRuleStatus;
    isActive: boolean;
    linkedTestSetId: string | null;
    linkedTestSetName: string | null;
    linkedTestRowCount: number;
    attendanceIncluded: boolean;
    calculatedFinalScore: number | null;
    createdAt: Date;
    updatedAt: Date;
    activatedAt: Date | null;
  }
): ApiListItem {
  return {
    ruleId: rule.id,
    ruleGroupKey: rule.ruleGroupKey,
    version: rule.version,
    previousRuleId: rule.previousRuleId,
    region: rule.region,
    university: rule.university,
    admissionType: rule.admissionType,
    admissionName: rule.admissionName,
    track: rule.track,
    collegeName: rule.collegeName,
    recruitmentUnit: rule.recruitmentUnit,
    mode: mapDbMode(rule.mode),
    action: mapDbAction(rule.action),
    status: mapDbStatus(rule.status),
    isActive: rule.isActive,
    linkedTestSetId: rule.linkedTestSetId,
    linkedTestSetName: rule.linkedTestSetName,
    linkedTestRowCount: rule.linkedTestRowCount,
    attendanceIncluded: rule.attendanceIncluded,
    calculatedFinalScore: rule.calculatedFinalScore,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
    activatedAt: rule.activatedAt ? rule.activatedAt.toISOString() : null,
  };
}

function mapRuleDetail(rule: UniversityConversionRuleDetailRecord): ApiRuleDetail {
  const commonSubjectSelections: Record<string, boolean> = {};
  const commonUseAllSubjects: Record<string, boolean> = {};
  const commonReflectionCounts: Record<string, string> = {};
  const commonWeights: Record<string, string> = {};
  const gradeScoreMap: Record<string, string> = {};
  const careerAchievementScores: Record<string, string> = {};

  const dbCareerSelections = createDefaultCareerSubjectSelections();
  const dbCareerUseAll = createDefaultCareerUseAllSubjects();
  const dbCareerCounts = createDefaultCareerReflectionCounts();

  for (const row of rule.commonSubjectRules) {
    commonSubjectSelections[row.subjectLabel] = true;
    commonUseAllSubjects[row.subjectLabel] = row.useAllSubjects === true;
    commonReflectionCounts[row.subjectLabel] =
      row.useAllSubjects === true ? "" : String(row.reflectionCount);
    commonWeights[row.subjectLabel] = String(row.weightPercent);
  }

  for (const row of rule.gradeScoreRules) {
    gradeScoreMap[String(row.grade)] = String(row.score);
  }

  for (const row of rule.careerReflectionRules) {
    if ((CAREER_SUBJECT_KEYS as readonly string[]).includes(row.subjectLabel)) {
      const key = row.subjectLabel as CareerSubjectKey;
      dbCareerSelections[key] = true;
      dbCareerCounts[key] = String(row.reflectionCount);
      dbCareerUseAll[key] = row.reflectionCount === 0;
    }
  }

  for (const row of rule.careerAchievementScoreRules) {
    careerAchievementScores[row.achievementLevel] = String(row.score);
  }

  const attendanceRows: AttendanceRow[] = rule.attendanceScoreRules.map(
    (row) => ({
      id: row.id,
      labelType:
        row.labelType === UniversityConversionAttendanceLabelType.FIXED
          ? "fixed"
          : row.labelType === UniversityConversionAttendanceLabelType.RANGE
          ? "range"
          : "above",
      label: row.label ?? undefined,
      upper: row.upper != null ? String(row.upper) : undefined,
      lower: row.lower != null ? String(row.lower) : undefined,
      score: String(row.score),
    })
  );

  const extendedOptions = readExtendedOptionsFromRawPayload(rule.rawPayload);
  const rawIncludeCommonSubjects =
    readOptionalIncludeCommonSubjectsFromRawPayload(rule.rawPayload);
  const rawIncludeRegularElectiveSubjects =
    readOptionalIncludeRegularElectiveSubjectsFromRawPayload(rule.rawPayload);
  const legacyIncludeCommonSubjects =
    readOptionalIncludeCommonSubjectsFromRuleRecord(rule);

  const effectiveIncludeCareerSubjects =
    rule.includeCareerSubjects &&
    hasEnabledCareerInclusionSwitches({
      includeCareerSelectionSubjects:
        extendedOptions.includeCareerSelectionSubjects,
      includeSpecializedSubjects: extendedOptions.includeSpecializedSubjects,
    });

  return {
    ruleId: rule.id,
    ruleGroupKey: rule.ruleGroupKey,
    version: rule.version,
    previousRuleId: rule.previousRuleId,
    mode: mapDbMode(rule.mode),
    action: mapDbAction(rule.action),
    status: mapDbStatus(rule.status),
    isActive: rule.isActive,

    targetValues: {
      region: rule.region,
      university: rule.university,
      admissionType: rule.admissionType,
      admissionName: rule.admissionName,
      track: rule.track,
      collegeName: rule.collegeName,
      recruitmentUnit: rule.recruitmentUnit,
    },

    subjectCalculationMode: extendedOptions.subjectCalculationMode,
    integratedSelectionMode: extendedOptions.integratedSelectionMode,
    integratedTotalReflectionCount:
      extendedOptions.integratedTotalReflectionCount,
    integratedMaxCareerReflectionCount:
      extendedOptions.integratedMaxCareerReflectionCount,

    commonSubjectSelections,
    commonUseAllSubjects,
    commonReflectionCounts,
    commonWeights,

    gradeScoreMap,

    careerSubjectSelections: normalizeCareerSubjectSelections(
      extendedOptions.careerSubjectSelections,
      dbCareerSelections
    ),
    careerUseAllSubjects: normalizeCareerUseAllSubjects(
      extendedOptions.careerUseAllSubjects,
      dbCareerUseAll
    ),
    careerReflectionCounts: normalizeCareerReflectionCounts(
      extendedOptions.careerReflectionCounts,
      dbCareerCounts
    ),
    careerAchievementScores,
    careerAchievementFormulaName: rule.careerAchievementFormulaName ?? "",
    careerAchievementFormulaBody: rule.careerAchievementFormulaBody ?? "",
    careerAchievementScoreMode: extendedOptions.careerAchievementScoreMode,
    achievementRatioScoreRows: extendedOptions.achievementRatioScoreRows,

    attendanceRows,

    formulaName: rule.formulaName ?? "",
    formulaBody: rule.formulaBody ?? "",
    formulaMemo: rule.formulaMemo ?? "",

    applyCustomCommonFormula: extendedOptions.applyCustomCommonFormula,
    commonCustomFormulaBody: extendedOptions.commonCustomFormulaBody,

    socialScienceSelectionMode: extendedOptions.socialScienceSelectionMode,
    careerSocialScienceSelectionMode:
      extendedOptions.careerSocialScienceSelectionMode,
    includeSecondForeignLanguageInEnglish:
      extendedOptions.includeSecondForeignLanguageInEnglish,
    includeKoreanHistoryInSocial: extendedOptions.includeKoreanHistoryInSocial,
    includeKoreanHistoryInSocialScience:
      extendedOptions.includeKoreanHistoryInSocialScience,
    includeKoreanHistoryInSocialWhenBestGroup:
      extendedOptions.includeKoreanHistoryInSocialWhenBestGroup,

    switches: {
      applyUnitWeight: rule.applyUnitWeight,
      applyCommonWeight: rule.applyCommonWeight,
      applyConvertedScore: rule.applyConvertedScore,
      includeCommonSubjects:
        rawIncludeCommonSubjects ??
        legacyIncludeCommonSubjects ??
        DEFAULT_INCLUDE_COMMON_SUBJECTS,
      includeRegularElectiveSubjects:
        rawIncludeRegularElectiveSubjects ??
        DEFAULT_INCLUDE_REGULAR_ELECTIVE_SUBJECTS,
      includeCareerSubjects: effectiveIncludeCareerSubjects,
      includeCareerSelectionSubjects:
        extendedOptions.includeCareerSelectionSubjects,
      includeSpecializedSubjects: extendedOptions.includeSpecializedSubjects,
      applyCareerBonus: rule.applyCareerBonus,
      includeAttendance: rule.includeAttendance,
    },

    testScoreLink: {
      testSetId: rule.linkedTestSetId,
      testSetName: rule.linkedTestSetName ?? "",
      rowCount: rule.linkedTestRowCount,
      attendanceIncluded: rule.attendanceIncluded,
    },

    calculatedSummary: {
      commonScore: String(rule.calculatedCommonScore ?? 0),
      careerContributionScore: String(
        rule.calculatedCareerContributionScore ?? 0
      ),
      attendanceScore: String(rule.calculatedAttendanceScore ?? 0),
      finalScore: String(rule.calculatedFinalScore ?? 0),
    },

    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
    draftSavedAt: rule.draftSavedAt ? rule.draftSavedAt.toISOString() : null,
    reviewRequestedAt: rule.reviewRequestedAt
      ? rule.reviewRequestedAt.toISOString()
      : null,
    activatedAt: rule.activatedAt ? rule.activatedAt.toISOString() : null,
  };
}

function normalizeIncomingPayload(
  raw: unknown
): SaveUniversityConversionPayload | null {
  if (!isRecord(raw)) {
    return null;
  }

  const targetValues = isRecord(raw.targetValues) ? raw.targetValues : {};
  const switches = isRecord(raw.switches) ? raw.switches : {};
  const testScoreLink = isRecord(raw.testScoreLink) ? raw.testScoreLink : {};
  const calculatedSummary = isRecord(raw.calculatedSummary)
    ? raw.calculatedSummary
    : {};

  const includeCareerSelectionSubjects = isBoolean(
    switches.includeCareerSelectionSubjects
  )
    ? switches.includeCareerSelectionSubjects
    : DEFAULT_INCLUDE_CAREER_SELECTION_SUBJECTS;

  const includeSpecializedSubjects = isBoolean(switches.includeSpecializedSubjects)
    ? switches.includeSpecializedSubjects
    : DEFAULT_INCLUDE_SPECIALIZED_SUBJECTS;

  const includeCareerSubjects = isBoolean(switches.includeCareerSubjects)
    ? switches.includeCareerSubjects
    : includeCareerSelectionSubjects || includeSpecializedSubjects;

  const subjectCalculationMode = isSubjectCalculationMode(raw.subjectCalculationMode)
    ? raw.subjectCalculationMode
    : DEFAULT_SUBJECT_CALCULATION_MODE;

  const socialScienceSelectionMode = isSocialScienceSelectionMode(
    raw.socialScienceSelectionMode
  )
    ? raw.socialScienceSelectionMode
    : "combined_subjects";

  const careerSocialScienceSelectionMode = resolveEffectiveCareerSocialScienceSelectionMode({
    subjectCalculationMode,
    socialScienceSelectionMode,
    careerSocialScienceSelectionMode: isCareerSocialScienceSelectionMode(
      raw.careerSocialScienceSelectionMode
    )
      ? raw.careerSocialScienceSelectionMode
      : DEFAULT_CAREER_SOCIAL_SCIENCE_SELECTION_MODE,
  });

  return {
    mode: raw.mode === "edit" ? "edit" : "create",
    action:
      raw.action === "review" || raw.action === "activate"
        ? raw.action
        : "draft",
    ruleId: typeof raw.ruleId === "string" ? raw.ruleId : null,

    targetValues: {
      region: toText(targetValues.region),
      university: toText(targetValues.university),
      admissionType: toText(targetValues.admissionType),
      admissionName: toText(targetValues.admissionName),
      track: toText(targetValues.track),
      collegeName: toText(targetValues.collegeName),
      recruitmentUnit: toText(targetValues.recruitmentUnit),
    },

    subjectCalculationMode,

    integratedSelectionMode: isIntegratedSelectionMode(
      raw.integratedSelectionMode
    )
      ? raw.integratedSelectionMode
      : DEFAULT_INTEGRATED_SELECTION_MODE,

    integratedTotalReflectionCount:
      toStringValue(raw.integratedTotalReflectionCount) ||
      DEFAULT_INTEGRATED_TOTAL_REFLECTION_COUNT,

    integratedMaxCareerReflectionCount:
      toStringValue(raw.integratedMaxCareerReflectionCount) ||
      toStringValue(raw.integratedCareerMaxReflectionCount) ||
      DEFAULT_INTEGRATED_MAX_CAREER_REFLECTION_COUNT,

    commonSubjectSelections: normalizeBooleanMap(raw.commonSubjectSelections),
    commonUseAllSubjects: normalizeBooleanMap(raw.commonUseAllSubjects),
    commonReflectionCounts: normalizeStringMap(raw.commonReflectionCounts),
    commonWeights: normalizeStringMap(raw.commonWeights),

    gradeScoreMap: normalizeStringMap(raw.gradeScoreMap),

    careerSubjectSelections: normalizeCareerSubjectSelections(
      raw.careerSubjectSelections
    ),
    careerUseAllSubjects: normalizeCareerUseAllSubjects(
      raw.careerUseAllSubjects
    ),
    careerReflectionCounts: normalizeCareerReflectionCounts(
      raw.careerReflectionCounts
    ),
    careerAchievementScores: normalizeStringMap(raw.careerAchievementScores),

    careerAchievementFormulaName: toStringValue(raw.careerAchievementFormulaName),
    careerAchievementFormulaBody: toStringValue(raw.careerAchievementFormulaBody),
    careerAchievementScoreMode:
      (raw.careerAchievementScoreMode === "ratio_grade"
        ? "ratio_grade"
        : "direct_score") as CareerAchievementScoreMode,
    achievementRatioScoreRows: Array.isArray(raw.achievementRatioScoreRows)
      ? raw.achievementRatioScoreRows
          .filter(isJsonObject)
          .map((row) => ({
            grade: toStringValue(row["grade"]),
            ratio: toStringValue(row["ratio"]),
            score: toStringValue(row["score"]),
          }))
      : [],

    attendanceRows: normalizeAttendanceRows(raw.attendanceRows),

    formulaName: toStringValue(raw.formulaName),
    formulaBody: toStringValue(raw.formulaBody),
    formulaMemo: toStringValue(raw.formulaMemo),

    applyCustomCommonFormula: isBoolean(raw.applyCustomCommonFormula)
      ? raw.applyCustomCommonFormula
      : false,

    commonCustomFormulaBody: toStringValue(raw.commonCustomFormulaBody),

    socialScienceSelectionMode,

    careerSocialScienceSelectionMode,

    includeSecondForeignLanguageInEnglish: isBoolean(
      raw.includeSecondForeignLanguageInEnglish
    )
      ? raw.includeSecondForeignLanguageInEnglish
      : false,

    includeKoreanHistoryInSocial: isBoolean(raw.includeKoreanHistoryInSocial)
      ? raw.includeKoreanHistoryInSocial
      : false,

    includeKoreanHistoryInSocialScience: isBoolean(
      raw.includeKoreanHistoryInSocialScience
    )
      ? raw.includeKoreanHistoryInSocialScience
      : false,

    includeKoreanHistoryInSocialWhenBestGroup: isBoolean(
      raw.includeKoreanHistoryInSocialWhenBestGroup
    )
      ? raw.includeKoreanHistoryInSocialWhenBestGroup
      : false,

    switches: {
      applyUnitWeight: isBoolean(switches.applyUnitWeight)
        ? switches.applyUnitWeight
        : false,
      applyCommonWeight: isBoolean(switches.applyCommonWeight)
        ? switches.applyCommonWeight
        : false,
      applyConvertedScore: isBoolean(switches.applyConvertedScore)
        ? switches.applyConvertedScore
        : false,
      includeCommonSubjects: isBoolean(switches.includeCommonSubjects)
        ? switches.includeCommonSubjects
        : DEFAULT_INCLUDE_COMMON_SUBJECTS,
      includeRegularElectiveSubjects: isBoolean(
        switches.includeRegularElectiveSubjects
      )
        ? switches.includeRegularElectiveSubjects
        : isBoolean(switches.includeGeneralSelectionSubjects)
        ? switches.includeGeneralSelectionSubjects
        : DEFAULT_INCLUDE_REGULAR_ELECTIVE_SUBJECTS,
      includeCareerSubjects,
      includeCareerSelectionSubjects,
      includeSpecializedSubjects,
      applyCareerBonus: isBoolean(switches.applyCareerBonus)
        ? switches.applyCareerBonus
        : false,
      includeAttendance: isBoolean(switches.includeAttendance)
        ? switches.includeAttendance
        : false,
    },
    testScoreLink: {
      testSetId:
        typeof testScoreLink.testSetId === "string"
          ? testScoreLink.testSetId
          : null,
      testSetName: toText(testScoreLink.testSetName),
      rowCount: parseIntLike(testScoreLink.rowCount, 0),
      attendanceIncluded: isBoolean(testScoreLink.attendanceIncluded)
        ? testScoreLink.attendanceIncluded
        : false,
    },

    calculatedSummary: {
      commonScore: toStringValue(calculatedSummary.commonScore),
      careerContributionScore:
        resolveCalculatedCareerContributionScore(calculatedSummary),
      attendanceScore: toStringValue(calculatedSummary.attendanceScore),
      finalScore: toStringValue(calculatedSummary.finalScore),
    },
  };
}
function buildPayloadFromRuleDetail(
  detail: ApiRuleDetail
): SaveUniversityConversionPayload {
  return {
    mode: detail.mode,
    action: detail.action,
    ruleId: detail.ruleId,
    targetValues: { ...detail.targetValues },

    subjectCalculationMode: detail.subjectCalculationMode,
    integratedSelectionMode: detail.integratedSelectionMode,
    integratedTotalReflectionCount: detail.integratedTotalReflectionCount,
    integratedMaxCareerReflectionCount:
      detail.integratedMaxCareerReflectionCount,

    commonSubjectSelections: { ...detail.commonSubjectSelections },
    commonUseAllSubjects: { ...detail.commonUseAllSubjects },
    commonReflectionCounts: { ...detail.commonReflectionCounts },
    commonWeights: { ...detail.commonWeights },

    gradeScoreMap: { ...detail.gradeScoreMap },

    careerSubjectSelections: { ...detail.careerSubjectSelections },
    careerUseAllSubjects: { ...detail.careerUseAllSubjects },
    careerReflectionCounts: { ...detail.careerReflectionCounts },
    careerAchievementScores: { ...detail.careerAchievementScores },
    careerAchievementFormulaName: detail.careerAchievementFormulaName,
    careerAchievementFormulaBody: detail.careerAchievementFormulaBody,
    careerAchievementScoreMode: detail.careerAchievementScoreMode,
    achievementRatioScoreRows: detail.achievementRatioScoreRows.map((row) => ({
      ...row,
    })),

    attendanceRows: detail.attendanceRows.map((row) => ({ ...row })),

    formulaName: detail.formulaName,
    formulaBody: detail.formulaBody,
    formulaMemo: detail.formulaMemo,

    applyCustomCommonFormula: detail.applyCustomCommonFormula,
    commonCustomFormulaBody: detail.commonCustomFormulaBody,

    socialScienceSelectionMode: detail.socialScienceSelectionMode,
    careerSocialScienceSelectionMode:
      detail.careerSocialScienceSelectionMode,
    includeSecondForeignLanguageInEnglish:
      detail.includeSecondForeignLanguageInEnglish,
    includeKoreanHistoryInSocial: detail.includeKoreanHistoryInSocial,
    includeKoreanHistoryInSocialScience:
      detail.includeKoreanHistoryInSocialScience,
    includeKoreanHistoryInSocialWhenBestGroup:
      detail.includeKoreanHistoryInSocialWhenBestGroup,

    switches: {
      ...detail.switches,
    },

    testScoreLink: {
      ...detail.testScoreLink,
    },

    calculatedSummary: {
      ...detail.calculatedSummary,
    },
  };
}

async function resolveLinkedTestSetRecord(
  tx: Prisma.TransactionClient,
  testSetId: string | null
): Promise<LinkedTestSetRecord | null> {
  const normalizedTestSetId = normalizeOptionalText(testSetId);

  if (!normalizedTestSetId) {
    return null;
  }

  const linkedTestSet = await tx.conversionRuleTestSet.findUnique({
    where: {
      id: normalizedTestSetId,
    },
    include: linkedTestSetInclude,
  });

  if (!linkedTestSet) {
    throw new Error("연결된 성적 데이터 세트를 찾을 수 없습니다.");
  }

  return linkedTestSet;
}

function buildNormalizedPayloadWithCalculatedSummary(
  payload: SaveUniversityConversionPayload,
  calculatedSummaryNumbers: CalculatedSummaryNumbers,
  linkedTestSet: LinkedTestSetRecord | null
): SaveUniversityConversionPayload {
  return {
    ...payload,
    testScoreLink: {
      ...payload.testScoreLink,
      rowCount: linkedTestSet
        ? linkedTestSet.scoreRows.length
        : payload.testScoreLink.rowCount,
      attendanceIncluded: linkedTestSet
        ? Boolean(linkedTestSet.attendance)
        : payload.testScoreLink.attendanceIncluded,
    },
    calculatedSummary: toCalculatedSummaryStrings(calculatedSummaryNumbers),
  };
}

async function resolveCalculatedSummaryForPayload(
  tx: Prisma.TransactionClient,
  payload: SaveUniversityConversionPayload
) {
  const linkedTestSet = await resolveLinkedTestSetRecord(
    tx,
    payload.testScoreLink.testSetId
  );

  if (!linkedTestSet) {
    return {
      linkedTestSet,
      calculatedSummaryNumbers: readCalculatedSummaryNumbersFromPayload(payload),
    };
  }

const calculatedSummaryNumbers =
  calculateUniversityConversionSummaryFromTestSet({
    payload,
    scoreRows: linkedTestSet.scoreRows,
    attendance: linkedTestSet.attendance,
  });

  return {
    linkedTestSet,
    calculatedSummaryNumbers,
  };
}

async function ensureActiveRuleCalculatedSummaryUpToDate(
  tx: Prisma.TransactionClient,
  rule: UniversityConversionRuleRecalculationRecord
): Promise<UniversityConversionRuleRecalculationRecord> {
  if (!rule.isActive || !rule.linkedTestSetId || !rule.linkedTestSet) {
    return rule;
  }

  const detail = mapRuleDetail(rule);
  const payload = buildPayloadFromRuleDetail(detail);

  const calculatedSummaryNumbers =
    calculateUniversityConversionSummaryFromTestSet({
      payload,
      scoreRows: rule.linkedTestSet.scoreRows,
      attendance: rule.linkedTestSet.attendance,
    });

  const currentSummaryNumbers = readCalculatedSummaryNumbersFromRuleRecord(rule);
  const nextPayload = buildNormalizedPayloadWithCalculatedSummary(
    payload,
    calculatedSummaryNumbers,
    rule.linkedTestSet
  );

  const shouldUpdate =
    !isSameCalculatedSummary(currentSummaryNumbers, calculatedSummaryNumbers) ||
    rule.linkedTestRowCount !== nextPayload.testScoreLink.rowCount ||
    rule.attendanceIncluded !== nextPayload.testScoreLink.attendanceIncluded;

  if (!shouldUpdate) {
    return rule;
  }

  const updatedAt = new Date();

  await tx.universityConversionRule.update({
    where: {
      id: rule.id,
    },
    data: {
      linkedTestRowCount: nextPayload.testScoreLink.rowCount,
      attendanceIncluded: nextPayload.testScoreLink.attendanceIncluded,
      calculatedCommonScore: calculatedSummaryNumbers.commonScore,
      calculatedCareerContributionScore:
        calculatedSummaryNumbers.careerContributionScore,
      calculatedAttendanceScore: calculatedSummaryNumbers.attendanceScore,
      calculatedFinalScore: calculatedSummaryNumbers.finalScore,
      rawPayload: cloneJson(nextPayload),
    },
  });

  return {
    ...rule,
    linkedTestRowCount: nextPayload.testScoreLink.rowCount,
    attendanceIncluded: nextPayload.testScoreLink.attendanceIncluded,
    calculatedCommonScore: calculatedSummaryNumbers.commonScore,
    calculatedCareerContributionScore:
      calculatedSummaryNumbers.careerContributionScore,
    calculatedAttendanceScore: calculatedSummaryNumbers.attendanceScore,
    calculatedFinalScore: calculatedSummaryNumbers.finalScore,
    rawPayload: cloneJson(nextPayload),
    updatedAt,
  };
}

async function refreshActiveRuleCalculatedSummaryById(ruleId: string) {
  return prisma.$transaction(async (tx) => {
    const rule = await tx.universityConversionRule.findUnique({
      where: {
        id: ruleId,
      },
      include: ruleRecalculationInclude,
    });

    if (!rule) {
      return null;
    }

    return ensureActiveRuleCalculatedSummaryUpToDate(tx, rule);
  });
}

async function refreshActiveRuleCalculatedSummariesForList(ruleIds: string[]) {
  const result = new Map<
    string,
    {
      linkedTestRowCount: number;
      attendanceIncluded: boolean;
      calculatedFinalScore: number | null;
      updatedAt: Date;
    }
  >();

  if (ruleIds.length === 0) {
    return result;
  }

  await prisma.$transaction(async (tx) => {
    const rules = await tx.universityConversionRule.findMany({
      where: {
        id: {
          in: ruleIds,
        },
      },
      include: ruleRecalculationInclude,
    });

    for (const rule of rules) {
      const refreshed = await ensureActiveRuleCalculatedSummaryUpToDate(tx, rule);
      result.set(refreshed.id, {
        linkedTestRowCount: refreshed.linkedTestRowCount,
        attendanceIncluded: refreshed.attendanceIncluded,
        calculatedFinalScore: refreshed.calculatedFinalScore,
        updatedAt: refreshed.updatedAt,
      });
    }
  });

  return result;
}

async function persistUniversityConversionRule(
  payload: SaveUniversityConversionPayload
) {
  const ruleGroupKey = buildRuleGroupKey(payload.targetValues);

  const modeValue =
    payload.mode === "edit"
      ? UniversityConversionRuleMode.EDIT
      : UniversityConversionRuleMode.CREATE;

  const actionValue =
    payload.action === "draft"
      ? UniversityConversionRuleAction.DRAFT
      : payload.action === "review"
      ? UniversityConversionRuleAction.REVIEW
      : UniversityConversionRuleAction.ACTIVATE;

  const statusValue =
    payload.action === "draft"
      ? UniversityConversionRuleStatus.DRAFT
      : payload.action === "review"
      ? UniversityConversionRuleStatus.REVIEW_REQUESTED
      : UniversityConversionRuleStatus.ACTIVE;

  const now = new Date();

  const selectedCommonSubjects = Object.keys(
    payload.commonSubjectSelections ?? {}
  ).filter(
    (subject) =>
      toText(subject) && payload.commonSubjectSelections[subject] === true
  );

  const selectedCareerSubjects = CAREER_SUBJECT_KEYS.filter(
    (subject) => payload.careerSubjectSelections[subject] === true
  );

  const effectiveIncludeCommonSubjects = hasEnabledCommonInclusionSwitches({
    includeCommonSubjects: payload.switches.includeCommonSubjects,
    includeRegularElectiveSubjects:
      payload.switches.includeRegularElectiveSubjects,
  });

  const effectiveIncludeCareerSubjects =
    payload.switches.includeCareerSubjects &&
    hasEnabledCareerInclusionSwitches({
      includeCareerSelectionSubjects:
        payload.switches.includeCareerSelectionSubjects,
      includeSpecializedSubjects: payload.switches.includeSpecializedSubjects,
    });

  const saved = await prisma.$transaction(async (tx) => {
    const { linkedTestSet, calculatedSummaryNumbers } =
      await resolveCalculatedSummaryForPayload(tx, payload);

    const normalizedPayload = buildNormalizedPayloadWithCalculatedSummary(
      payload,
      calculatedSummaryNumbers,
      linkedTestSet
    );

    const commonSubjectRuleCreateData = selectedCommonSubjects.map(
      (subjectLabel, index) => {
        const useAllSubjects =
          payload.subjectCalculationMode === "integrated"
            ? false
            : payload.commonUseAllSubjects?.[subjectLabel] === true;

        return {
          sortOrder: index,
          subjectLabel: toText(subjectLabel),
          useAllSubjects,
          reflectionCount: useAllSubjects
            ? 0
            : parseIntOrDefault(
                payload.commonReflectionCounts?.[subjectLabel],
                0
              ),
          weightPercent: parseFloatOrDefault(
            payload.commonWeights?.[subjectLabel],
            100
          ),
        };
      }
    );

    const gradeScoreRuleCreateData = Object.entries(payload.gradeScoreMap)
      .filter(([grade]) => Number.isFinite(Number(grade)))
      .map(([grade, score]) => ({
        grade: Number(grade),
        score: parseFloatOrDefault(score, 0),
      }))
      .sort((a, b) => a.grade - b.grade);

    const careerReflectionRuleCreateData = selectedCareerSubjects.map(
      (subjectLabel, index) => {
        const useAllSubjects =
          payload.careerUseAllSubjects?.[subjectLabel] === true;

        return {
          sortOrder: index,
          subjectLabel,
          reflectionCount: useAllSubjects
            ? 0
            : parseIntOrDefault(
                payload.careerReflectionCounts?.[subjectLabel],
                0
              ),
        };
      }
    );

    const careerAchievementScoreRuleCreateData = Object.entries(
      payload.careerAchievementScores
    ).map(([achievementLevel, score]) => ({
      achievementLevel: toText(achievementLevel),
      score: parseFloatOrDefault(score, 0),
    }));

    const attendanceScoreRuleCreateData = payload.attendanceRows.map(
      (row, index) => ({
        sortOrder: index,
        labelType:
          row.labelType === "fixed"
            ? UniversityConversionAttendanceLabelType.FIXED
            : row.labelType === "range"
            ? UniversityConversionAttendanceLabelType.RANGE
            : UniversityConversionAttendanceLabelType.ABOVE,
        label: normalizeOptionalText(row.label),
        upper:
          row.labelType === "range" ? parseIntOrDefault(row.upper, 0) : null,
        lower:
          row.labelType === "above" ? parseIntOrDefault(row.lower, 0) : null,
        score: parseFloatOrDefault(row.score, 0),
      })
    );

    if (payload.mode === "edit") {
      const targetRuleId = toText(payload.ruleId);

      const sourceRule = await tx.universityConversionRule.findUnique({
        where: {
          id: targetRuleId,
        },
        select: {
          id: true,
          previousRuleId: true,
        },
      });

      if (!sourceRule) {
        throw new Error("수정 대상 환산규칙을 찾을 수 없습니다.");
      }

      if (payload.action === "activate") {
        await tx.universityConversionRule.updateMany({
          where: {
            ruleGroupKey,
            isActive: true,
            NOT: {
              id: sourceRule.id,
            },
          },
          data: {
            isActive: false,
            status: UniversityConversionRuleStatus.INACTIVE,
          },
        });
      }

      const updatedRule = await tx.universityConversionRule.update({
        where: {
          id: sourceRule.id,
        },
        data: {
          ruleGroupKey,
          previousRuleId: sourceRule.previousRuleId,

          region: toText(payload.targetValues.region),
          university: toText(payload.targetValues.university),
          admissionType: toText(payload.targetValues.admissionType),
          admissionName: toText(payload.targetValues.admissionName),
          track: toText(payload.targetValues.track),
          collegeName: toText(payload.targetValues.collegeName),
          recruitmentUnit: toText(payload.targetValues.recruitmentUnit),

          mode: modeValue,
          action: actionValue,
          status: statusValue,
          isActive: payload.action === "activate",

          applyUnitWeight: payload.switches.applyUnitWeight,
          applyCommonWeight: payload.switches.applyCommonWeight,
          applyConvertedScore: payload.switches.applyConvertedScore,
          includeCommonSubjects: effectiveIncludeCommonSubjects,
          includeCareerSubjects: effectiveIncludeCareerSubjects,
          applyCareerBonus: payload.switches.applyCareerBonus,
          includeAttendance: payload.switches.includeAttendance,

          formulaName: normalizeOptionalText(payload.formulaName),
          formulaBody: normalizeOptionalText(payload.formulaBody),
          formulaMemo: normalizeOptionalText(payload.formulaMemo),

          careerAchievementFormulaName: normalizeOptionalText(
            payload.careerAchievementFormulaName
          ),
          careerAchievementFormulaBody: normalizeOptionalText(
            payload.careerAchievementFormulaBody
          ),

          linkedTestSetId: normalizeOptionalText(payload.testScoreLink.testSetId),
          linkedTestSetName: normalizeOptionalText(
            payload.testScoreLink.testSetName
          ),
          linkedTestRowCount: normalizedPayload.testScoreLink.rowCount,
          attendanceIncluded: normalizedPayload.testScoreLink.attendanceIncluded,

          calculatedCommonScore: calculatedSummaryNumbers.commonScore,
          calculatedCareerContributionScore:
            calculatedSummaryNumbers.careerContributionScore,
          calculatedAttendanceScore: calculatedSummaryNumbers.attendanceScore,
          calculatedFinalScore: calculatedSummaryNumbers.finalScore,

          rawPayload: cloneJson(normalizedPayload),

          draftSavedAt: payload.action === "draft" ? now : null,
          reviewRequestedAt: payload.action === "review" ? now : null,
          activatedAt: payload.action === "activate" ? now : null,

          commonSubjectRules: {
            deleteMany: {},
            create: commonSubjectRuleCreateData,
          },
          gradeScoreRules: {
            deleteMany: {},
            create: gradeScoreRuleCreateData,
          },
          careerReflectionRules: {
            deleteMany: {},
            create: careerReflectionRuleCreateData,
          },
          careerAchievementScoreRules: {
            deleteMany: {},
            create: careerAchievementScoreRuleCreateData,
          },
          attendanceScoreRules: {
            deleteMany: {},
            create: attendanceScoreRuleCreateData,
          },
        },
        select: {
          id: true,
          mode: true,
          action: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          region: true,
          university: true,
          admissionType: true,
          admissionName: true,
          track: true,
          collegeName: true,
          recruitmentUnit: true,
        },
      });

      return updatedRule;
    }

    const versionAggregate = await tx.universityConversionRule.aggregate({
      where: {
        ruleGroupKey,
      },
      _max: {
        version: true,
      },
    });

    const nextVersion = (versionAggregate._max.version ?? 0) + 1;

    if (payload.action === "activate") {
      await tx.universityConversionRule.updateMany({
        where: {
          ruleGroupKey,
          isActive: true,
        },
        data: {
          isActive: false,
          status: UniversityConversionRuleStatus.INACTIVE,
        },
      });
    }

    const createdRule = await tx.universityConversionRule.create({
      data: {
        ruleGroupKey,
        version: nextVersion,
        previousRuleId: null,

        region: toText(payload.targetValues.region),
        university: toText(payload.targetValues.university),
        admissionType: toText(payload.targetValues.admissionType),
        admissionName: toText(payload.targetValues.admissionName),
        track: toText(payload.targetValues.track),
        collegeName: toText(payload.targetValues.collegeName),
        recruitmentUnit: toText(payload.targetValues.recruitmentUnit),

        mode: modeValue,
        action: actionValue,
        status: statusValue,
        isActive: payload.action === "activate",

        applyUnitWeight: payload.switches.applyUnitWeight,
        applyCommonWeight: payload.switches.applyCommonWeight,
        applyConvertedScore: payload.switches.applyConvertedScore,
        includeCommonSubjects: effectiveIncludeCommonSubjects,
        includeCareerSubjects: effectiveIncludeCareerSubjects,
        applyCareerBonus: payload.switches.applyCareerBonus,
        includeAttendance: payload.switches.includeAttendance,

        formulaName: normalizeOptionalText(payload.formulaName),
        formulaBody: normalizeOptionalText(payload.formulaBody),
        formulaMemo: normalizeOptionalText(payload.formulaMemo),

        careerAchievementFormulaName: normalizeOptionalText(
          payload.careerAchievementFormulaName
        ),
        careerAchievementFormulaBody: normalizeOptionalText(
          payload.careerAchievementFormulaBody
        ),

        linkedTestSetId: normalizeOptionalText(payload.testScoreLink.testSetId),
        linkedTestSetName: normalizeOptionalText(payload.testScoreLink.testSetName),
        linkedTestRowCount: normalizedPayload.testScoreLink.rowCount,
        attendanceIncluded: normalizedPayload.testScoreLink.attendanceIncluded,

        calculatedCommonScore: calculatedSummaryNumbers.commonScore,
        calculatedCareerContributionScore:
          calculatedSummaryNumbers.careerContributionScore,
        calculatedAttendanceScore: calculatedSummaryNumbers.attendanceScore,
        calculatedFinalScore: calculatedSummaryNumbers.finalScore,

        rawPayload: cloneJson(normalizedPayload),

        draftSavedAt: payload.action === "draft" ? now : null,
        reviewRequestedAt: payload.action === "review" ? now : null,
        activatedAt: payload.action === "activate" ? now : null,

        commonSubjectRules: {
          create: commonSubjectRuleCreateData,
        },

        gradeScoreRules: {
          create: gradeScoreRuleCreateData,
        },

        careerReflectionRules: {
          create: careerReflectionRuleCreateData,
        },

        careerAchievementScoreRules: {
          create: careerAchievementScoreRuleCreateData,
        },

        attendanceScoreRules: {
          create: attendanceScoreRuleCreateData,
        },
      },
      select: {
        id: true,
        mode: true,
        action: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        region: true,
        university: true,
        admissionType: true,
        admissionName: true,
        track: true,
        collegeName: true,
        recruitmentUnit: true,
      },
    });

    return createdRule;
  });

  return {
    ruleId: saved.id,
    mode: payload.mode,
    action: payload.action,
    status:
      payload.action === "draft"
        ? "draft"
        : payload.action === "review"
        ? "review_requested"
        : "active",
    savedAt: saved.updatedAt.toISOString(),
    targetValues: {
      region: saved.region,
      university: saved.university,
      admissionType: saved.admissionType,
      admissionName: saved.admissionName,
      track: saved.track,
      collegeName: saved.collegeName,
      recruitmentUnit: saved.recruitmentUnit,
    },
  } as ApiSuccessResponse["data"];
}

function getSuccessMessage(action: SaveAction, mode: "create" | "edit") {
  if (action === "draft") {
    return "임시저장되었습니다.";
  }

  if (action === "review") {
    return "검수요청이 저장되었습니다.";
  }

  if (mode === "edit") {
    return "수정 후 다시 활성화되었습니다.";
  }

  return "활성화 되었습니다.";
}

function jsonError(
  message: string,
  status = 400,
  fieldErrors?: Record<string, string>
) {
  const body: ApiErrorResponse = {
    success: false,
    message,
    ...(fieldErrors ? { fieldErrors } : {}),
  };

  return NextResponse.json(body, { status });
}

function resolveStatusFilter(
  value: string
): UniversityConversionRuleStatus | null {
  switch (value) {
    case "DRAFT":
      return UniversityConversionRuleStatus.DRAFT;
    case "REVIEW_REQUESTED":
      return UniversityConversionRuleStatus.REVIEW_REQUESTED;
    case "ACTIVE":
      return UniversityConversionRuleStatus.ACTIVE;
    case "INACTIVE":
      return UniversityConversionRuleStatus.INACTIVE;
    default:
      return null;
  }
}

async function handleDelete(request: NextRequest) {
  const ruleId = toText(request.nextUrl.searchParams.get("ruleId"));

  if (!ruleId) {
    return jsonError("삭제할 ruleId가 필요합니다.", 400);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existingRule = await tx.universityConversionRule.findUnique({
        where: { id: ruleId },
        select: {
          id: true,
          isActive: true,
        },
      });

      if (!existingRule) {
        return {
          ok: false as const,
          status: 404,
          message: "삭제할 환산규칙을 찾을 수 없습니다.",
        };
      }

      if (!existingRule.isActive) {
        return {
          ok: false as const,
          status: 400,
          message: "활성 규칙만 이 페이지에서 삭제할 수 있습니다.",
        };
      }

      await tx.universityConversionRule.updateMany({
        where: {
          previousRuleId: ruleId,
        },
        data: {
          previousRuleId: null,
        },
      });

      await tx.universityConversionRule.update({
        where: { id: ruleId },
        data: {
          commonSubjectRules: { deleteMany: {} },
          gradeScoreRules: { deleteMany: {} },
          careerReflectionRules: { deleteMany: {} },
          careerAchievementScoreRules: { deleteMany: {} },
          attendanceScoreRules: { deleteMany: {} },
        },
      });

      await tx.universityConversionRule.delete({
        where: { id: ruleId },
      });

      return {
        ok: true as const,
        status: 200,
        message: "활성 규칙이 완전히 삭제되었습니다.",
      };
    });

    if (!result.ok) {
      return jsonError(result.message, result.status);
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[DELETE /api/admin/university-conversion] error:", error);

    return jsonError(
      error instanceof Error
        ? error.message
        : "환산규칙 삭제 중 서버 오류가 발생했습니다.",
      500
    );
  }
}

async function handleMutation(
  request: NextRequest,
  method: "POST" | "PUT"
) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("요청 본문(JSON)을 읽을 수 없습니다.", 400);
  }

  const payload = normalizeIncomingPayload(body);

  if (!payload) {
    return jsonError("요청 본문 형식이 올바르지 않습니다.", 400);
  }

  if (method === "POST" && payload.mode !== "create") {
    return jsonError("POST 요청의 mode는 create 여야 합니다.", 400);
  }

  if (method === "PUT" && payload.mode !== "edit") {
    return jsonError("PUT 요청의 mode는 edit 여야 합니다.", 400);
  }

  const validation = validatePayload(payload);

  if (!validation.valid) {
    return jsonError("입력값 검증에 실패했습니다.", 400, validation.fieldErrors);
  }

  try {
    const saved = await persistUniversityConversionRule(payload);

    const response: ApiSuccessResponse = {
      success: true,
      message: getSuccessMessage(payload.action, payload.mode),
      data: saved,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error(`[${method} /api/admin/university-conversion] error:`, error);

    return jsonError(
      error instanceof Error
        ? error.message
        : "환산규칙 저장 중 서버 오류가 발생했습니다.",
      500
    );
  }
}

async function handleGet(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const ruleId = toText(searchParams.get("ruleId"));
  const onlyActive =
    searchParams.get("onlyActive") === "true" ||
    searchParams.get("view") === "active";

  const keyword = toText(searchParams.get("keyword") ?? searchParams.get("q"));
  const region = toText(searchParams.get("region"));
  const university = toText(searchParams.get("university"));
  const admissionType = toText(searchParams.get("admissionType"));
  const admissionName = toText(searchParams.get("admissionName"));
  const track = toText(searchParams.get("track"));
  const collegeName = toText(searchParams.get("collegeName"));
  const recruitmentUnit = toText(searchParams.get("recruitmentUnit"));
  const statusFilter = resolveStatusFilter(
    toText(searchParams.get("status")).toUpperCase()
  );

  try {
    if (ruleId) {
      const rule = await refreshActiveRuleCalculatedSummaryById(ruleId);

      if (!rule) {
        return jsonError("환산규칙을 찾을 수 없습니다.", 404);
      }

      return NextResponse.json(
        {
          success: true,
          data: mapRuleDetail(rule),
        },
        { status: 200 }
      );
    }

    const resolvedTargetScope: ResolvedTargetScope = {
      region,
      university,
      admissionType,
      admissionName,
      track,
      collegeName,
      recruitmentUnit,
    };

    const shouldResolveBySpecificity =
      Boolean(region && university && admissionType) &&
      hasResolvedScopeTarget(resolvedTargetScope);

    const andFilters: Prisma.UniversityConversionRuleWhereInput[] = [];

    if (onlyActive) {
      andFilters.push({ isActive: true });
    }

    if (statusFilter) {
      andFilters.push({ status: statusFilter });
    }

    if (region) {
      andFilters.push({ region });
    }

    if (university) {
      andFilters.push({ university });
    }

    if (admissionType) {
      andFilters.push({ admissionType });
    }

    if (!shouldResolveBySpecificity) {
      if (admissionName) {
        andFilters.push({ admissionName });
      }

      if (track) {
        andFilters.push({ track });
      }

      if (collegeName) {
        andFilters.push({ collegeName });
      }

      if (recruitmentUnit) {
        andFilters.push({ recruitmentUnit });
      }
    }

    if (keyword) {
      andFilters.push({
        OR: [
          { region: { contains: keyword } },
          { university: { contains: keyword } },
          { admissionType: { contains: keyword } },
          { admissionName: { contains: keyword } },
          { track: { contains: keyword } },
          { collegeName: { contains: keyword } },
          { recruitmentUnit: { contains: keyword } },
        ],
      });
    }

    const where: Prisma.UniversityConversionRuleWhereInput =
      andFilters.length > 0 ? { AND: andFilters } : {};

    const rules = await prisma.universityConversionRule.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { version: "desc" }],
      select: {
        id: true,
        ruleGroupKey: true,
        version: true,
        previousRuleId: true,
        region: true,
        university: true,
        admissionType: true,
        admissionName: true,
        track: true,
        collegeName: true,
        recruitmentUnit: true,
        mode: true,
        action: true,
        status: true,
        isActive: true,
        linkedTestSetId: true,
        linkedTestSetName: true,
        linkedTestRowCount: true,
        attendanceIncluded: true,
        calculatedFinalScore: true,
        createdAt: true,
        updatedAt: true,
        activatedAt: true,
      },
    });

    const matchedRules = shouldResolveBySpecificity
      ? [...rules]
          .filter((rule) =>
            matchesRuleToResolvedTarget(
              {
                region: rule.region,
                university: rule.university,
                admissionType: rule.admissionType,
                admissionName: rule.admissionName,
                track: rule.track,
                collegeName: rule.collegeName,
                recruitmentUnit: rule.recruitmentUnit,
              },
              resolvedTargetScope
            )
          )
          .sort(compareRulesBySpecificity)
      : rules;

    const activeRuleIds = matchedRules
      .filter((rule) => rule.isActive && Boolean(rule.linkedTestSetId))
      .map((rule) => rule.id);

    const refreshedActiveMap =
      await refreshActiveRuleCalculatedSummariesForList(activeRuleIds);

    return NextResponse.json(
      {
        success: true,
        data: {
          total: matchedRules.length,
          rows: matchedRules.map((rule) => {
            const refreshed = refreshedActiveMap.get(rule.id);

            return mapRuleListItem({
              ...rule,
              linkedTestRowCount:
                refreshed?.linkedTestRowCount ?? rule.linkedTestRowCount,
              attendanceIncluded:
                refreshed?.attendanceIncluded ?? rule.attendanceIncluded,
              calculatedFinalScore:
                refreshed?.calculatedFinalScore ?? rule.calculatedFinalScore,
              updatedAt: refreshed?.updatedAt ?? rule.updatedAt,
            });
          }),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/admin/university-conversion] error:", error);

    return jsonError(
      error instanceof Error
        ? error.message
        : "환산규칙 조회 중 서버 오류가 발생했습니다.",
      500
    );
  }
}

export async function GET(request: NextRequest) {
  return handleGet(request);
}

export async function POST(request: NextRequest) {
  return handleMutation(request, "POST");
}

export async function PUT(request: NextRequest) {
  return handleMutation(request, "PUT");
}

export async function DELETE(request: NextRequest) {
  return handleDelete(request);
}
