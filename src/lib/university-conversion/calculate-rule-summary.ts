type AttendanceRowType = "fixed" | "range" | "above";
type SocialScienceSelectionMode = "combined_subjects" | "best_group";
type CareerSocialScienceSelectionMode = "separate" | "best_group";
type SubjectCalculationMode = "integrated" | "separate_weighted";
type IntegratedSelectionMode = "count_limit" | "all_selected";
type FinalFormulaValueKey = "commonScore" | "careerScore" | "attendanceScore";

const commonSubjectKeys = [
  "국어",
  "수학",
  "영어",
  "사회",
  "과학",
  "사회/과학",
  "한국사",
  "기타과목",
] as const;

type CommonSubjectKey = (typeof commonSubjectKeys)[number];

type CommonSubjectSelections = Record<CommonSubjectKey, boolean>;
type CommonUseAllSubjects = Record<CommonSubjectKey, boolean>;
type CommonReflectionCounts = Record<CommonSubjectKey, string>;
type CommonWeights = Record<CommonSubjectKey, string>;

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

type SaveUniversityConversionPayloadLike = {
  subjectCalculationMode?: SubjectCalculationMode;
  integratedSelectionMode?: IntegratedSelectionMode;
  integratedTotalReflectionCount?: string;
  integratedMaxCareerReflectionCount?: string;
  integratedCareerMaxReflectionCount?: string;

  commonSubjectSelections?: Record<string, boolean>;
  commonUseAllSubjects?: Record<string, boolean>;
  commonReflectionCounts?: Record<string, string>;
  commonWeights?: Record<string, string>;
  gradeScoreMap?: Record<string | number, string>;

  careerSubjectSelections?: Partial<CareerSubjectSelections>;
  careerUseAllSubjects?: Partial<CareerUseAllSubjects>;
  careerReflectionCounts?: Partial<CareerReflectionCounts>;
  careerAchievementScores?: Record<string, string>;
  careerAchievementFormulaName?: string;
  careerAchievementFormulaBody?: string;
  careerAchievementScoreMode?: CareerAchievementScoreMode;
  achievementRatioScoreRows?: AchievementRatioScoreRow[];

  attendanceRows?: AttendanceRow[];

  formulaName?: string;
  formulaBody?: string;
  formulaMemo?: string;

  applyCustomCommonFormula?: boolean;
  commonCustomFormulaBody?: string;

  socialScienceSelectionMode?: SocialScienceSelectionMode;
  careerSocialScienceSelectionMode?: CareerSocialScienceSelectionMode;
  includeSecondForeignLanguageInEnglish?: boolean;
  includeKoreanHistoryInSocial?: boolean;
  includeKoreanHistoryInSocialScience?: boolean;
  includeKoreanHistoryInSocialWhenBestGroup?: boolean;

  switches?: {
    applyUnitWeight?: boolean;
    applyCommonWeight?: boolean;
    applyConvertedScore?: boolean;
    includeCommonSubjects?: boolean;
    includeRegularElectiveSubjects?: boolean;
    includeGeneralSelectionSubjects?: boolean;
    includeCareerSubjects?: boolean;
    includeCareerSelectionSubjects?: boolean;
    includeSpecializedSubjects?: boolean;
    applyCareerBonus?: boolean;
    includeAttendance?: boolean;
  };

  calculatedSummary?: {
    commonScore?: string;
    careerContributionScore?: string;
    attendanceScore?: string;
    finalScore?: string;
  };
};

export type CalculatedSummaryResult = {
  commonScore: number;
  careerContributionScore: number;
  attendanceScore: number;
  finalScore: number;
};

export type ConversionRuleTestScoreRowLike = {
  academicTermLabel?: string | null;
  subjectGroupSnapshot?: string | null;
  completionTypeSnapshot?: string | null;
  subjectName?: string | null;
  credits?: number | string | null;
  rawScore?: number | string | null;
  averageScore?: number | string | null;
  standardDeviation?: number | string | null;
  achievement?: string | null;
  grade?: number | string | null;
  schoolYear?: number | null;
  semester?: number | null;
};

export type ConversionRuleTestAttendanceLike =
  | {
      absenceDays?: number | string | null;
      lateness?: number | string | null;
      earlyLeave?: number | string | null;
      outing?: number | string | null;
    }
  | null
  | undefined;

export type CalculateUniversityConversionSummaryFromTestSetInput = {
  payload: SaveUniversityConversionPayloadLike;
  scoreRows: ConversionRuleTestScoreRowLike[];
  attendance: ConversionRuleTestAttendanceLike;
};

type BestGroupBucket = "social" | "science";

type IntegratedCandidate =
  | {
      row: TestScoreRow;
      kind: "career";
      commonSubject: CommonSubjectKey;
      careerSubject: CareerSubjectKey;
      bestGroupBucket: BestGroupBucket | null;
    }
  | {
      row: TestScoreRow;
      kind: "common";
      commonSubject: CommonSubjectKey;
      careerSubject: null;
      bestGroupBucket: BestGroupBucket | null;
    };

const commonSubjectProcessingOrder: readonly CommonSubjectKey[] = [
  "국어",
  "수학",
  "영어",
  "한국사",
  "사회",
  "과학",
  "사회/과학",
  "기타과목",
] as const;

const careerSubjectKeys: readonly CareerSubjectKey[] = [
  "국어",
  "수학",
  "영어",
  "사회",
  "과학",
  "기타과목",
] as const;

const careerSubjectProcessingOrder: readonly CareerSubjectKey[] = [
  "국어",
  "수학",
  "영어",
  "사회",
  "과학",
  "기타과목",
] as const;

const SECOND_FOREIGN_LANGUAGE_GROUPS: readonly string[] = [
  "제2외국어",
  "외국어",
];

const SECOND_FOREIGN_LANGUAGE_AMBIGUOUS_GROUPS: readonly string[] = [
  "제2외국어/한문",
];

const SECOND_FOREIGN_LANGUAGE_KEYWORDS: readonly string[] = [
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

const DEFAULT_SUBJECT_CALCULATION_MODE: SubjectCalculationMode =
  "separate_weighted";
const DEFAULT_INTEGRATED_SELECTION_MODE: IntegratedSelectionMode =
  "count_limit";
const DEFAULT_CAREER_SOCIAL_SCIENCE_SELECTION_MODE: CareerSocialScienceSelectionMode =
  "separate";

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

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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
    ["반영 과목별 환산점수 × 학점 합", values.scoreUnitSum],
    ["반영과목별환산점수×학점합", values.scoreUnitSum],
    ["반영과목별환산점수x학점합", values.scoreUnitSum],
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
  subjectLabel: CommonSubjectKey,
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
  selectedSubjectLabels: CommonSubjectKey[],
  options?: {
    includeSecondForeignLanguageInEnglish?: boolean;
    includeKoreanHistoryInSocial?: boolean;
    includeKoreanHistoryInSocialScience?: boolean;
    socialScienceSelectionMode?: SocialScienceSelectionMode;
  }
): CommonSubjectKey | null {
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
    return isSocialRow(row);
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

function getCalculatedAttendanceAbsenceDays(
  attendance: TestScoreAttendance
): number | null {
  const rawAbsence = parseNumber(attendance?.absenceDays ?? "");
  const rawLateness = parseNumber(attendance?.lateness ?? "");
  const rawEarlyLeave = parseNumber(attendance?.earlyLeave ?? "");
  const rawOuting = parseNumber(attendance?.outing ?? "");

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

function getCommonBestGroupBucketForRow(
  row: TestScoreRow,
  includeKoreanHistoryInSocialWhenBestGroup: boolean
): BestGroupBucket | null {
  if (isSocialRow(row)) {
    return "social";
  }

  if (
    includeKoreanHistoryInSocialWhenBestGroup &&
    isKoreanHistoryRow(row)
  ) {
    return "social";
  }

  if (isScienceRow(row)) {
    return "science";
  }

  return null;
}

function splitCommonSocialScienceRowsByBestGroup(
  rows: TestScoreRow[],
  includeKoreanHistoryInSocialWhenBestGroup: boolean
) {
  const socialRows: TestScoreRow[] = [];
  const scienceRows: TestScoreRow[] = [];

  for (const row of rows) {
    const bucket = getCommonBestGroupBucketForRow(
      row,
      includeKoreanHistoryInSocialWhenBestGroup
    );

    if (bucket === "social") {
      socialRows.push(row);
      continue;
    }

    if (bucket === "science") {
      scienceRows.push(row);
    }
  }

  return {
    socialRows,
    scienceRows,
  };
}

function resolveBestGroupBucketFromRowSets(options: {
  socialRows: TestScoreRow[];
  scienceRows: TestScoreRow[];
  gradeScoreMap: Record<number, string>;
  applyConvertedScore: boolean;
  applyUnitWeight: boolean;
  careerAchievementScores: Record<string, string>;
}): BestGroupBucket | null {
  const socialAverage = calculateSubjectAverageForRows(
    options.socialRows,
    options.gradeScoreMap,
    options.applyConvertedScore,
    options.applyUnitWeight,
    options.careerAchievementScores
  );

  const scienceAverage = calculateSubjectAverageForRows(
    options.scienceRows,
    options.gradeScoreMap,
    options.applyConvertedScore,
    options.applyUnitWeight,
    options.careerAchievementScores
  );

  if (socialAverage == null && scienceAverage == null) {
    return null;
  }

  if (socialAverage == null) {
    return "science";
  }

  if (scienceAverage == null) {
    return "social";
  }

  return socialAverage <= scienceAverage ? "social" : "science";
}

function applyBestGroupBucketToCommonGrouped(
  grouped: Record<CommonSubjectKey, TestScoreRow[]>,
  pickedBucket: BestGroupBucket | null,
  includeKoreanHistoryInSocialWhenBestGroup: boolean
) {
  const next = createRowMap(commonSubjectKeys);

  for (const key of commonSubjectKeys) {
    next[key] = [...(grouped[key] ?? [])];
  }

  if (pickedBucket == null) {
    next["사회/과학"] = [];
    return next;
  }

  next["사회/과학"] = next["사회/과학"].filter(
    (row) =>
      getCommonBestGroupBucketForRow(
        row,
        includeKoreanHistoryInSocialWhenBestGroup
      ) === pickedBucket
  );

  return next;
}

function applyBestGroupBucketToCareerGrouped(
  grouped: Record<CareerSubjectKey, TestScoreRow[]>,
  pickedBucket: BestGroupBucket | null
) {
  const next = createRowMap(careerSubjectKeys);

  for (const key of careerSubjectKeys) {
    next[key] = [...(grouped[key] ?? [])];
  }

  if (pickedBucket == null) {
    next["사회"] = [];
    next["과학"] = [];
    return next;
  }

  if (pickedBucket === "social") {
    next["과학"] = [];
  } else {
    next["사회"] = [];
  }

  return next;
}

function toClientRow(row: ConversionRuleTestScoreRowLike): TestScoreRow {
  const schoolYear =
    row.schoolYear != null && Number.isFinite(row.schoolYear)
      ? String(row.schoolYear)
      : "";
  const semester =
    row.semester != null && Number.isFinite(row.semester)
      ? String(row.semester)
      : "";

  const academicTerm =
    normalizeText(row.academicTermLabel) ||
    [schoolYear, semester ? `${semester}학기` : ""].filter(Boolean).join(" ");

  return {
    academicTerm,
    subjectGroup: normalizeText(row.subjectGroupSnapshot),
    completionType: normalizeText(row.completionTypeSnapshot),
    subjectName: normalizeText(row.subjectName),
    credits: row.credits != null ? String(row.credits) : "",
    rawScore: row.rawScore != null ? String(row.rawScore) : "",
    averageScore: row.averageScore != null ? String(row.averageScore) : "",
    standardDeviation:
      row.standardDeviation != null ? String(row.standardDeviation) : "",
    achievement: normalizeText(row.achievement),
    grade: row.grade != null ? String(row.grade) : "",
  };
}

function toClientAttendance(
  attendance: ConversionRuleTestAttendanceLike
): TestScoreAttendance {
  if (!attendance) {
    return null;
  }

  return {
    absenceDays:
      attendance.absenceDays != null ? String(attendance.absenceDays) : "",
    lateness: attendance.lateness != null ? String(attendance.lateness) : "",
    earlyLeave:
      attendance.earlyLeave != null ? String(attendance.earlyLeave) : "",
    outing: attendance.outing != null ? String(attendance.outing) : "",
  };
}

function normalizeCommonSubjectSelections(
  incoming?: Record<string, boolean>
): CommonSubjectSelections {
  const next = createBooleanMap(commonSubjectKeys, false);
  for (const key of commonSubjectKeys) {
    next[key] = incoming?.[key] === true;
  }
  return next;
}

function normalizeCommonUseAllSubjects(
  incoming?: Record<string, boolean>
): CommonUseAllSubjects {
  const next = createBooleanMap(commonSubjectKeys, false);
  for (const key of commonSubjectKeys) {
    next[key] = incoming?.[key] === true;
  }
  return next;
}

function normalizeCommonReflectionCounts(
  incoming?: Record<string, string>
): CommonReflectionCounts {
  const next = createStringMap(commonSubjectKeys, "");
  for (const key of commonSubjectKeys) {
    next[key] = incoming?.[key] ?? "";
  }
  return next;
}

function normalizeCommonWeights(
  incoming?: Record<string, string>
): CommonWeights {
  const next = createStringMap(commonSubjectKeys, "");
  for (const key of commonSubjectKeys) {
    next[key] = incoming?.[key] ?? "";
  }
  return next;
}

function normalizeCareerSubjectSelections(
  incoming?: Partial<CareerSubjectSelections>
): CareerSubjectSelections {
  const next = createBooleanMap(careerSubjectKeys, false);
  for (const key of careerSubjectKeys) {
    next[key] = incoming?.[key] === true;
  }
  return next;
}

function normalizeCareerUseAllSubjects(
  incoming?: Partial<CareerUseAllSubjects>
): CareerUseAllSubjects {
  const next = createBooleanMap(careerSubjectKeys, false);
  for (const key of careerSubjectKeys) {
    next[key] = incoming?.[key] === true;
  }
  return next;
}

function normalizeCareerReflectionCounts(
  incoming?: Partial<CareerReflectionCounts>
): CareerReflectionCounts {
  const next = createStringMap(careerSubjectKeys, "");
  for (const key of careerSubjectKeys) {
    next[key] = incoming?.[key] ?? "";
  }
  return next;
}

function normalizeGradeScoreMap(
  incoming?: Record<string | number, string>
): Record<number, string> {
  const source = incoming ?? {};
  return {
    1: String(source[1] ?? source["1"] ?? "100"),
    2: String(source[2] ?? source["2"] ?? "98"),
    3: String(source[3] ?? source["3"] ?? "96"),
    4: String(source[4] ?? source["4"] ?? "94"),
    5: String(source[5] ?? source["5"] ?? "90"),
    6: String(source[6] ?? source["6"] ?? "85"),
    7: String(source[7] ?? source["7"] ?? "80"),
    8: String(source[8] ?? source["8"] ?? "75"),
    9: String(source[9] ?? source["9"] ?? "70"),
  };
}

function normalizeAchievementRatioScoreRows(
  incoming: AchievementRatioScoreRow[] | undefined,
  gradeScoreMap: Record<number, string>
): AchievementRatioScoreRow[] {
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

  return Array.from({ length: 9 }, (_, index) => {
    const grade = index + 1;
    const matched = rowMap.get(grade);
    return {
      grade: String(grade),
      ratio: matched?.ratio ?? "",
      score: matched?.score || gradeScoreMap[grade] || "",
    };
  });
}

function resolveAchievementRatioConvertedScore(
  gradeInput: string,
  rows: AchievementRatioScoreRow[],
  gradeScoreMap: Record<number, string>
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

  return parseNumber(gradeScoreMap[normalizedGrade]);
}

function resolveCareerAchievementScoreInputs(
  scoreMode: CareerAchievementScoreMode,
  inputScores: Record<string, string>,
  ratioRows: AchievementRatioScoreRow[],
  gradeScoreMap: Record<number, string>
) {
  if (scoreMode === "ratio_grade") {
    return {
      A:
        resolveAchievementRatioConvertedScore(
          inputScores.A ?? "",
          ratioRows,
          gradeScoreMap
        )?.toString() ?? "",
      B:
        resolveAchievementRatioConvertedScore(
          inputScores.B ?? "",
          ratioRows,
          gradeScoreMap
        )?.toString() ?? "",
      C:
        resolveAchievementRatioConvertedScore(
          inputScores.C ?? "",
          ratioRows,
          gradeScoreMap
        )?.toString() ?? "",
    };
  }

  return {
    A: String(inputScores.A ?? "100"),
    B: String(inputScores.B ?? "85"),
    C: String(inputScores.C ?? "70"),
  };
}

function normalizePayload(payload: SaveUniversityConversionPayloadLike) {
  const includeRegularElectiveSubjects =
    payload.switches?.includeRegularElectiveSubjects ??
    payload.switches?.includeGeneralSelectionSubjects ??
    true;

  const integratedMaxCareerReflectionCount =
    payload.integratedMaxCareerReflectionCount ??
    payload.integratedCareerMaxReflectionCount ??
    "0";

  const subjectCalculationMode =
    payload.subjectCalculationMode ?? DEFAULT_SUBJECT_CALCULATION_MODE;

  const socialScienceSelectionMode =
    payload.socialScienceSelectionMode ?? "combined_subjects";

  const careerSocialScienceSelectionMode =
    resolveEffectiveCareerSocialScienceSelectionMode({
      subjectCalculationMode,
      socialScienceSelectionMode,
      careerSocialScienceSelectionMode:
        payload.careerSocialScienceSelectionMode ??
        DEFAULT_CAREER_SOCIAL_SCIENCE_SELECTION_MODE,
    });

  const normalizedGradeScoreMap = normalizeGradeScoreMap(payload.gradeScoreMap);
  const careerAchievementScoreMode =
    payload.careerAchievementScoreMode ?? "direct_score";
  const normalizedAchievementRatioScoreRows =
    normalizeAchievementRatioScoreRows(
      payload.achievementRatioScoreRows,
      normalizedGradeScoreMap
    );
  const effectiveCareerAchievementScores = resolveCareerAchievementScoreInputs(
    careerAchievementScoreMode,
    {
      A: String(payload.careerAchievementScores?.A ?? "100"),
      B: String(payload.careerAchievementScores?.B ?? "85"),
      C: String(payload.careerAchievementScores?.C ?? "70"),
    },
    normalizedAchievementRatioScoreRows,
    normalizedGradeScoreMap
  );

  return {
    subjectCalculationMode,
    integratedSelectionMode:
      payload.integratedSelectionMode ?? DEFAULT_INTEGRATED_SELECTION_MODE,
    integratedTotalReflectionCount:
      payload.integratedTotalReflectionCount ?? "12",
    integratedMaxCareerReflectionCount,

    commonSubjectSelections: normalizeCommonSubjectSelections(
      payload.commonSubjectSelections
    ),
    commonUseAllSubjects: normalizeCommonUseAllSubjects(
      payload.commonUseAllSubjects
    ),
    commonReflectionCounts: normalizeCommonReflectionCounts(
      payload.commonReflectionCounts
    ),
    commonWeights: normalizeCommonWeights(payload.commonWeights),
    gradeScoreMap: normalizedGradeScoreMap,

    careerSubjectSelections: normalizeCareerSubjectSelections(
      payload.careerSubjectSelections
    ),
    careerUseAllSubjects: normalizeCareerUseAllSubjects(
      payload.careerUseAllSubjects
    ),
    careerReflectionCounts: normalizeCareerReflectionCounts(
      payload.careerReflectionCounts
    ),
    careerAchievementScores: effectiveCareerAchievementScores,

    attendanceRows: payload.attendanceRows ?? [],
    formulaBody: payload.formulaBody ?? "",
    applyCustomCommonFormula: payload.applyCustomCommonFormula ?? false,
    commonCustomFormulaBody: payload.commonCustomFormulaBody ?? "",

    socialScienceSelectionMode,
    careerSocialScienceSelectionMode,
    includeSecondForeignLanguageInEnglish:
      payload.includeSecondForeignLanguageInEnglish ?? false,
    includeKoreanHistoryInSocial: payload.includeKoreanHistoryInSocial ?? false,
    includeKoreanHistoryInSocialScience:
      payload.includeKoreanHistoryInSocialScience ?? false,
    includeKoreanHistoryInSocialWhenBestGroup:
      payload.includeKoreanHistoryInSocialWhenBestGroup ?? false,

    applyUnitWeight: payload.switches?.applyUnitWeight ?? true,
    applyCommonWeight: payload.switches?.applyCommonWeight ?? false,
    applyConvertedScore: payload.switches?.applyConvertedScore ?? true,
    includeCommonSubjects: payload.switches?.includeCommonSubjects ?? true,
    includeRegularElectiveSubjects,
    includeCareerSelectionSubjects:
      payload.switches?.includeCareerSelectionSubjects ?? true,
    includeSpecializedSubjects:
      payload.switches?.includeSpecializedSubjects ?? true,
    includeAttendance: payload.switches?.includeAttendance ?? false,
  };
}
export function calculateUniversityConversionSummaryFromTestSet({
  payload,
  scoreRows,
  attendance,
}: CalculateUniversityConversionSummaryFromTestSetInput): CalculatedSummaryResult {
  const p = normalizePayload(payload);

  const filledTestRows = scoreRows
    .map(toClientRow)
    .filter((row) =>
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

  const testAttendance = toClientAttendance(attendance);

  const commonTestRows = filledTestRows.filter(
    (row) =>
      !isCareerOrSpecializedRow(row) &&
      shouldIncludeCommonPoolRow(
        row,
        p.includeCommonSubjects,
        p.includeRegularElectiveSubjects
      )
  );

  const careerTestRows = filledTestRows.filter(
    (row) =>
      isCareerOrSpecializedRow(row) &&
      shouldIncludeCareerPoolRow(
        row,
        p.includeCareerSelectionSubjects,
        p.includeSpecializedSubjects
      )
  );

  const selectedCommonSubjectLabels: CommonSubjectKey[] = commonSubjectKeys.filter(
    (subjectLabel) => p.commonSubjectSelections[subjectLabel] === true
  );

  const selectedCareerSubjectLabels: CareerSubjectKey[] = careerSubjectKeys.filter(
    (subjectLabel) => p.careerSubjectSelections[subjectLabel] === true
  );

  const integratedSelectionResult = (() => {
    const emptyCommonGrouped = createRowMap(commonSubjectKeys);
    const emptyCareerGrouped = createRowMap(careerSubjectKeys);

    if (p.subjectCalculationMode !== "integrated") {
      return {
        commonGrouped: emptyCommonGrouped,
        careerGrouped: emptyCareerGrouped,
        selectedRows: [] as TestScoreRow[],
        selectedCareerRows: [] as TestScoreRow[],
      };
    }

    const isCountLimited = p.integratedSelectionMode === "count_limit";
    const totalLimit = isCountLimited
      ? getReflectionCount(p.integratedTotalReflectionCount)
      : 0;
    const maxCareerLimit = isCountLimited
      ? getReflectionCount(p.integratedMaxCareerReflectionCount)
      : 0;

    if (isCountLimited && totalLimit <= 0) {
      return {
        commonGrouped: emptyCommonGrouped,
        careerGrouped: emptyCareerGrouped,
        selectedRows: [] as TestScoreRow[],
        selectedCareerRows: [] as TestScoreRow[],
      };
    }

    const rawCandidates: Array<IntegratedCandidate | null> = filledTestRows.map(
      (row) => {
        if (isCareerOrSpecializedRow(row)) {
          if (
            !shouldIncludeCareerPoolRow(
              row,
              p.includeCareerSelectionSubjects,
              p.includeSpecializedSubjects
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
            bestGroupBucket:
              assignedCareerSubject === "사회"
                ? "social"
                : assignedCareerSubject === "과학"
                ? "science"
                : null,
          };
        }

        if (
          !shouldIncludeCommonPoolRow(
            row,
            p.includeCommonSubjects,
            p.includeRegularElectiveSubjects
          )
        ) {
          return null;
        }

        const useIntegratedBestGroupForCommon =
          p.socialScienceSelectionMode === "best_group" &&
          selectedCommonSubjectLabels.includes("사회/과학");

        if (useIntegratedBestGroupForCommon) {
          const bestGroupBucket = isSocialRow(row) ||
            (p.includeKoreanHistoryInSocialWhenBestGroup &&
              isKoreanHistoryRow(row))
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
            includeSecondForeignLanguageInEnglish:
              p.includeSecondForeignLanguageInEnglish,
            includeKoreanHistoryInSocial: p.includeKoreanHistoryInSocial,
            includeKoreanHistoryInSocialScience:
              p.includeKoreanHistoryInSocialScience,
            socialScienceSelectionMode: p.socialScienceSelectionMode,
          }
        );

        if (!assignedCommonSubject) {
          return null;
        }

        const commonBestGroupBucket =
          assignedCommonSubject === "사회"
            ? "social"
            : assignedCommonSubject === "과학"
            ? "science"
            : assignedCommonSubject === "사회/과학"
            ? getCommonBestGroupBucketForRow(
                row,
                p.includeKoreanHistoryInSocialWhenBestGroup
              )
            : null;

        return {
          row,
          kind: "common",
          commonSubject: assignedCommonSubject,
          careerSubject: null,
          bestGroupBucket: commonBestGroupBucket,
        };
      }
    );

    const candidates: IntegratedCandidate[] = (() => {
      const sortedCandidates = rawCandidates
        .filter((item): item is IntegratedCandidate => item !== null)
        .sort((a, b) => compareRowsForSelection(a.row, b.row));

      const shouldUseUnifiedBestGroupComparison =
        p.socialScienceSelectionMode === "best_group" ||
        p.careerSocialScienceSelectionMode === "best_group";

      if (!shouldUseUnifiedBestGroupComparison) {
        return sortedCandidates;
      }

      const socialRows = sortedCandidates
        .filter((candidate) => candidate.bestGroupBucket === "social")
        .map((candidate) => candidate.row);

      const scienceRows = sortedCandidates
        .filter((candidate) => candidate.bestGroupBucket === "science")
        .map((candidate) => candidate.row);

      const pickedBucket = resolveBestGroupBucketFromRowSets({
        socialRows,
        scienceRows,
        gradeScoreMap: p.gradeScoreMap,
        applyConvertedScore: p.applyConvertedScore,
        applyUnitWeight: p.applyUnitWeight,
        careerAchievementScores: p.careerAchievementScores,
      });

      return sortedCandidates.filter((candidate) => {
        if (candidate.bestGroupBucket == null) {
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
  })();

  const selectedCommonRowsBySubject = (() => {
    if (p.subjectCalculationMode === "integrated") {
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
      const isSelected = p.commonSubjectSelections[subjectLabel] === true;
      if (!isSelected) continue;

      const useAllSubjects = p.commonUseAllSubjects[subjectLabel] === true;
      const reflectionCount = getReflectionCount(
        p.commonReflectionCounts[subjectLabel]
      );

      if (subjectLabel === "사회/과학") {
        if (p.socialScienceSelectionMode === "best_group") {
          const socialCandidates = commonTestRows
            .map((row, index) => ({ row, index }))
            .filter(({ row, index }) => {
              if (usedIndexes.has(index)) return false;
              if (isSocialRow(row)) return true;
              if (
                p.includeKoreanHistoryInSocialWhenBestGroup &&
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

          for (const item of [...pickedSocial, ...pickedScience]) {
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
                includeSecondForeignLanguageInEnglish:
                  p.includeSecondForeignLanguageInEnglish,
                includeKoreanHistoryInSocial: p.includeKoreanHistoryInSocial,
                includeKoreanHistoryInSocialScience:
                  p.includeKoreanHistoryInSocialScience,
                socialScienceSelectionMode: p.socialScienceSelectionMode,
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
              includeSecondForeignLanguageInEnglish:
                p.includeSecondForeignLanguageInEnglish,
              includeKoreanHistoryInSocial: p.includeKoreanHistoryInSocial,
              includeKoreanHistoryInSocialScience:
                p.includeKoreanHistoryInSocialScience,
              socialScienceSelectionMode: p.socialScienceSelectionMode,
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
  })();

  const selectedCareerRowsBySubject = (() => {
    if (p.subjectCalculationMode === "integrated") {
      return integratedSelectionResult.careerGrouped;
    }

    const grouped = createRowMap(careerSubjectKeys);
    const usedIndexes = new Set<number>();

    for (const subjectLabel of careerSubjectProcessingOrder) {
      const isSelected = p.careerSubjectSelections[subjectLabel] === true;
      if (!isSelected) continue;

      const useAllSubjects = p.careerUseAllSubjects[subjectLabel] === true;
      const reflectionCount = getReflectionCount(
        p.careerReflectionCounts[subjectLabel]
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
  })();
  const effectiveCareerSocialScienceSelectionMode =
    resolveEffectiveCareerSocialScienceSelectionMode({
      subjectCalculationMode: p.subjectCalculationMode,
      socialScienceSelectionMode: p.socialScienceSelectionMode,
      careerSocialScienceSelectionMode: p.careerSocialScienceSelectionMode,
    });

  const shouldUseUnifiedBestGroupComparison =
    p.socialScienceSelectionMode === "best_group" ||
    effectiveCareerSocialScienceSelectionMode === "best_group";

  const {
    socialRows: commonSocialScienceBucketRows,
    scienceRows: commonScienceBucketRows,
  } = splitCommonSocialScienceRowsByBestGroup(
    selectedCommonRowsBySubject["사회/과학"] ?? [],
    p.includeKoreanHistoryInSocialWhenBestGroup
  );

  const unifiedBestGroupBucket = shouldUseUnifiedBestGroupComparison
    ? resolveBestGroupBucketFromRowSets({
        socialRows: [
          ...(selectedCommonRowsBySubject["사회"] ?? []),
          ...commonSocialScienceBucketRows,
          ...(selectedCareerRowsBySubject["사회"] ?? []),
        ],
        scienceRows: [
          ...(selectedCommonRowsBySubject["과학"] ?? []),
          ...commonScienceBucketRows,
          ...(selectedCareerRowsBySubject["과학"] ?? []),
        ],
        gradeScoreMap: p.gradeScoreMap,
        applyConvertedScore: p.applyConvertedScore,
        applyUnitWeight: p.applyUnitWeight,
        careerAchievementScores: p.careerAchievementScores,
      })
    : null;

  const effectiveSelectedCommonRowsBySubject =
    p.socialScienceSelectionMode === "best_group"
      ? applyBestGroupBucketToCommonGrouped(
          selectedCommonRowsBySubject,
          unifiedBestGroupBucket,
          p.includeKoreanHistoryInSocialWhenBestGroup
        )
      : selectedCommonRowsBySubject;

  const effectiveSelectedCareerRowsBySubject =
    effectiveCareerSocialScienceSelectionMode === "best_group"
      ? applyBestGroupBucketToCareerGrouped(
          selectedCareerRowsBySubject,
          unifiedBestGroupBucket
        )
      : selectedCareerRowsBySubject;

  const selectedCommonRows = commonSubjectKeys.flatMap(
    (subjectLabel) => effectiveSelectedCommonRowsBySubject[subjectLabel] ?? []
  );

  const selectedCareerRows = careerSubjectKeys.flatMap(
    (subjectLabel) => effectiveSelectedCareerRowsBySubject[subjectLabel] ?? []
  );

  const commonScoreStats = (() => {
    let scoreSum = 0;
    let subjectCount = 0;
    let unitSum = 0;
    let scoreUnitSum = 0;
    let weightedSubjectSum = 0;
    let weightedUnitSubjectSum = 0;

    for (const row of selectedCommonRows) {
      const baseValue = getResolvedSubjectBaseValue(
        row,
        p.gradeScoreMap,
        p.applyConvertedScore,
        p.careerAchievementScores
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
      const subjectRows =
        effectiveSelectedCommonRowsBySubject[subjectLabel] ?? [];
      if (subjectRows.length === 0) continue;

      const weightFactor = getPercentWeight(p.commonWeights[subjectLabel]);

      const simpleAverage = calculateSubjectAverageForRows(
        subjectRows,
        p.gradeScoreMap,
        p.applyConvertedScore,
        false,
        p.careerAchievementScores
      );

      if (simpleAverage != null) {
        weightedSubjectSum += simpleAverage * weightFactor;
      }

      const creditAverage = calculateSubjectAverageForRows(
        subjectRows,
        p.gradeScoreMap,
        p.applyConvertedScore,
        true,
        p.careerAchievementScores
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
  })();

  const defaultCommonScore = (() => {
    if (selectedCommonRows.length === 0) {
      return 0;
    }

    if (!p.applyCommonWeight) {
      return p.applyUnitWeight
        ? commonScoreStats.unitAverage
        : commonScoreStats.simpleAverage;
    }

    return p.applyUnitWeight
      ? commonScoreStats.weightedUnitSubjectSum
      : commonScoreStats.weightedSubjectSum;
  })();

  const customCommonFormulaScore = (() => {
    if (!p.applyCustomCommonFormula) {
      return null;
    }

    return evaluateCommonCustomFormula(p.commonCustomFormulaBody, {
      defaultCommonScore,
      scoreSum: commonScoreStats.scoreSum,
      subjectCount: commonScoreStats.subjectCount,
      unitSum: commonScoreStats.unitSum,
      scoreUnitSum: commonScoreStats.scoreUnitSum,
      weightedSubjectSum: commonScoreStats.weightedSubjectSum,
      weightedUnitSubjectSum: commonScoreStats.weightedUnitSubjectSum,
    });
  })();

  const commonScore = (() => {
    if (!p.applyCustomCommonFormula) {
      return defaultCommonScore;
    }

    if (customCommonFormulaScore == null) {
      return defaultCommonScore;
    }

    return customCommonFormulaScore;
  })();

  const careerScore = (() => {
    const effectiveIncludeCareerSubjects =
      p.includeCareerSelectionSubjects || p.includeSpecializedSubjects;

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
          p.careerAchievementScores
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

    if (p.applyUnitWeight) {
      const totalCredits = resolvedRows.reduce(
        (sum, item) => sum + item.credit,
        0
      );

      if (totalCredits > 0) {
        const weightedTotal = resolvedRows.reduce(
          (sum, item) => sum + item.achievementScore * item.credit,
          0
        );

        return weightedTotal / totalCredits;
      }
    }

    return (
      resolvedRows.reduce((sum, item) => sum + item.achievementScore, 0) /
      resolvedRows.length
    );
  })();

const attendanceScore = (() => {
  if (!p.includeAttendance) {
    return 0;
  }

  const calculatedAbsenceDays =
    getCalculatedAttendanceAbsenceDays(testAttendance);

  const baseScore = getAttendanceBaseScore(
    calculatedAbsenceDays,
    p.attendanceRows
  );

  if (baseScore == null) {
    return 0;
  }

  return clamp((baseScore / 100) * 4.1, 0, 4.1);
})();

  const customFormulaScore = evaluateFinalFormula(p.formulaBody, {
    commonScore,
    careerScore,
    attendanceScore,
  });

  const finalScore =
    customFormulaScore == null
      ? commonScore + careerScore + attendanceScore
      : customFormulaScore;

  return {
    commonScore,
    careerContributionScore: careerScore,
    attendanceScore,
    finalScore,
  };
}
