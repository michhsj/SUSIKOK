//src\app\api\admin\university-conversion\route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  Prisma,
  UniversityConversionAttendanceLabelType,
  UniversityConversionRuleAction,
  UniversityConversionRuleMode,
  UniversityConversionRuleStatus,
} from "@prisma/client";

type AttendanceRowType = "fixed" | "range" | "above";

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
  commonSubjectSelections: Record<string, boolean>;
  commonUseAllSubjects: Record<string, boolean>;
  commonReflectionCounts: Record<string, string>;
  commonWeights: Record<string, string>;
  gradeScoreMap: Record<number, string>;
  careerReflectionCounts: Record<string, string>;
  careerAchievementScores: Record<string, string>;
  careerAchievementFormulaName: string;
  careerAchievementFormulaBody: string;
  attendanceRows: AttendanceRow[];
  formulaName: string;
  formulaBody: string;
  formulaMemo: string;
  switches: {
    applyUnitWeight: boolean;
    applyCommonWeight: boolean;
    applyConvertedScore: boolean;
    includeCareerSubjects: boolean;
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
    status: "draft" | "review_requested" | "active";
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
  commonSubjectSelections: Record<string, boolean>;
  commonUseAllSubjects: Record<string, boolean>;
  commonReflectionCounts: Record<string, string>;
  commonWeights: Record<string, string>;
  gradeScoreMap: Record<number, string>;
  careerReflectionCounts: Record<string, string>;
  careerAchievementScores: Record<string, string>;
  careerAchievementFormulaName: string;
  careerAchievementFormulaBody: string;
  attendanceRows: AttendanceRow[];
  formulaName: string;
  formulaBody: string;
  formulaMemo: string;
  switches: {
    applyUnitWeight: boolean;
    applyCommonWeight: boolean;
    applyConvertedScore: boolean;
    includeCareerSubjects: boolean;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function toText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

function isAttendanceRow(value: unknown): value is AttendanceRow {
  if (!isRecord(value)) return false;

  const labelType = value.labelType;
  if (labelType !== "fixed" && labelType !== "range" && labelType !== "above") {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.score === "string" &&
    (value.label === undefined || typeof value.label === "string") &&
    (value.upper === undefined || typeof value.upper === "string") &&
    (value.lower === undefined || typeof value.lower === "string")
  );
}

function isTargetValues(value: unknown): value is TargetValues {
  if (!isRecord(value)) return false;

  return (
    typeof value.region === "string" &&
    typeof value.university === "string" &&
    typeof value.admissionType === "string" &&
    typeof value.admissionName === "string" &&
    typeof value.track === "string" &&
    typeof value.collegeName === "string" &&
    typeof value.recruitmentUnit === "string"
  );
}

function isPayload(value: unknown): value is SaveUniversityConversionPayload {
  if (!isRecord(value)) return false;

  const mode = value.mode;
  const action = value.action;

  if (mode !== "create" && mode !== "edit") return false;
  if (action !== "draft" && action !== "review" && action !== "activate") {
    return false;
  }

  if (!(value.ruleId === null || typeof value.ruleId === "string")) {
    return false;
  }

  if (!isTargetValues(value.targetValues)) return false;
  if (!isBooleanRecord(value.commonSubjectSelections)) return false;
  if (!isBooleanRecord(value.commonUseAllSubjects)) return false;
  if (!isStringRecord(value.commonReflectionCounts)) return false;
  if (!isStringRecord(value.commonWeights)) return false;
  if (!isStringRecord(value.gradeScoreMap)) return false;
  if (!isStringRecord(value.careerReflectionCounts)) return false;
  if (!isStringRecord(value.careerAchievementScores)) return false;
  if (typeof value.careerAchievementFormulaName !== "string") return false;
  if (typeof value.careerAchievementFormulaBody !== "string") return false;

  if (
    !Array.isArray(value.attendanceRows) ||
    !value.attendanceRows.every(isAttendanceRow)
  ) {
    return false;
  }

  if (typeof value.formulaName !== "string") return false;
  if (typeof value.formulaBody !== "string") return false;
  if (typeof value.formulaMemo !== "string") return false;

  if (!isRecord(value.switches)) return false;
  if (!isBoolean(value.switches.applyUnitWeight)) return false;
  if (!isBoolean(value.switches.applyCommonWeight)) return false;
  if (!isBoolean(value.switches.applyConvertedScore)) return false;
  if (!isBoolean(value.switches.includeCareerSubjects)) return false;
  if (!isBoolean(value.switches.applyCareerBonus)) return false;
  if (!isBoolean(value.switches.includeAttendance)) return false;

  if (!isRecord(value.testScoreLink)) return false;
  if (
    !(
      value.testScoreLink.testSetId === null ||
      typeof value.testScoreLink.testSetId === "string"
    )
  ) {
    return false;
  }
  if (typeof value.testScoreLink.testSetName !== "string") return false;
  if (typeof value.testScoreLink.rowCount !== "number") return false;
  if (typeof value.testScoreLink.attendanceIncluded !== "boolean") return false;

  if (!isRecord(value.calculatedSummary)) return false;
  if (typeof value.calculatedSummary.commonScore !== "string") return false;
  if (typeof value.calculatedSummary.careerContributionScore !== "string") {
    return false;
  }
  if (typeof value.calculatedSummary.attendanceScore !== "string") return false;
  if (typeof value.calculatedSummary.finalScore !== "string") return false;

  return true;
}

function validateCommonSubjectFields(payload: SaveUniversityConversionPayload) {
  const fieldErrors: Record<string, string> = {};

  const selectedSubjects = Object.keys(payload.commonSubjectSelections).filter(
    (subject) =>
      toText(subject) && payload.commonSubjectSelections[subject] === true
  );

  if (selectedSubjects.length === 0) {
    fieldErrors.commonSubjectSelections =
      "공통/일반선택과목은 최소 1개 이상 선택해야 합니다.";
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

    if (parseNumber(weight) == null) {
      fieldErrors[`commonWeights.${subject}`] =
        `${subject}의 가중치(%)를 입력해 주세요.`;
    }
  }

  return fieldErrors;
}

function validatePayload(payload: SaveUniversityConversionPayload) {
  const fieldErrors: Record<string, string> = {};

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
    if (!toText(payload.targetValues.admissionName)) {
      fieldErrors["targetValues.admissionName"] = "전형명은 필수입니다.";
    }
    if (!toText(payload.targetValues.track)) {
      fieldErrors["targetValues.track"] = "계열은 필수입니다.";
    }

    Object.assign(fieldErrors, validateCommonSubjectFields(payload));
  }

  if (payload.switches.includeAttendance && payload.attendanceRows.length === 0) {
    fieldErrors.attendanceRows = "출결 반영 사용 시 출결 기준표가 필요합니다.";
  }

  if (
    payload.switches.includeCareerSubjects &&
    !toText(payload.careerAchievementFormulaName)
  ) {
    fieldErrors.careerAchievementFormulaName =
      "진로선택 반영 사용 시 성취도 환산식 이름이 필요합니다.";
  }

  return {
    valid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
  };
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

function normalizeOptionalText(value: string | null | undefined) {
  const text = toText(value);
  return text || null;
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

type UniversityConversionRuleDetailRecord =
  Prisma.UniversityConversionRuleGetPayload<{
    include: typeof ruleDetailInclude;
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
  const gradeScoreMap: Record<number, string> = {};
  const careerReflectionCounts: Record<string, string> = {};
  const careerAchievementScores: Record<string, string> = {};

  for (const row of rule.commonSubjectRules) {
    commonSubjectSelections[row.subjectLabel] = true;
    commonUseAllSubjects[row.subjectLabel] = row.useAllSubjects === true;
    commonReflectionCounts[row.subjectLabel] =
      row.useAllSubjects === true ? "" : String(row.reflectionCount);
    commonWeights[row.subjectLabel] = String(row.weightPercent);
  }

  for (const row of rule.gradeScoreRules) {
    gradeScoreMap[row.grade] = String(row.score);
  }

  for (const row of rule.careerReflectionRules) {
    careerReflectionCounts[row.subjectLabel] = String(row.reflectionCount);
  }

  for (const row of rule.careerAchievementScoreRules) {
    careerAchievementScores[row.achievementLevel] = String(row.score);
  }

  const attendanceRows: AttendanceRow[] = rule.attendanceScoreRules.map((row) => ({
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
  }));

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
    commonSubjectSelections,
    commonUseAllSubjects,
    commonReflectionCounts,
    commonWeights,
    gradeScoreMap,
    careerReflectionCounts,
    careerAchievementScores,
    careerAchievementFormulaName: rule.careerAchievementFormulaName ?? "",
    careerAchievementFormulaBody: rule.careerAchievementFormulaBody ?? "",
    attendanceRows,
    formulaName: rule.formulaName ?? "",
    formulaBody: rule.formulaBody ?? "",
    formulaMemo: rule.formulaMemo ?? "",
    switches: {
      applyUnitWeight: rule.applyUnitWeight,
      applyCommonWeight: rule.applyCommonWeight,
      applyConvertedScore: rule.applyConvertedScore,
      includeCareerSubjects: rule.includeCareerSubjects,
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
      careerContributionScore: String(rule.calculatedCareerContributionScore ?? 0),
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

  const saved = await prisma.$transaction(async (tx) => {
    let previousRuleId: string | null = null;

    if (payload.mode === "edit") {
      const sourceRule = await tx.universityConversionRule.findUnique({
        where: {
          id: toText(payload.ruleId),
        },
        select: {
          id: true,
        },
      });

      if (!sourceRule) {
        throw new Error("수정 대상 환산규칙을 찾을 수 없습니다.");
      }

      previousRuleId = sourceRule.id;
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
        previousRuleId,

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
        includeCareerSubjects: payload.switches.includeCareerSubjects,
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
        linkedTestRowCount: payload.testScoreLink.rowCount,
        attendanceIncluded: payload.testScoreLink.attendanceIncluded,

        calculatedCommonScore: parseFloatOrDefault(
          payload.calculatedSummary.commonScore,
          0
        ),
        calculatedCareerContributionScore: parseFloatOrDefault(
          payload.calculatedSummary.careerContributionScore,
          0
        ),
        calculatedAttendanceScore: parseFloatOrDefault(
          payload.calculatedSummary.attendanceScore,
          0
        ),
        calculatedFinalScore: parseFloatOrDefault(
          payload.calculatedSummary.finalScore,
          0
        ),

        rawPayload: JSON.parse(JSON.stringify(payload)),

        draftSavedAt: payload.action === "draft" ? now : null,
        reviewRequestedAt: payload.action === "review" ? now : null,
        activatedAt: payload.action === "activate" ? now : null,

        commonSubjectRules: {
          create: selectedCommonSubjects.map((subjectLabel, index) => {
            const useAllSubjects =
              payload.commonUseAllSubjects?.[subjectLabel] === true;

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
          }),
        },

        gradeScoreRules: {
          create: Object.entries(payload.gradeScoreMap)
            .map(([grade, score]) => ({
              grade: Number(grade),
              score: parseFloatOrDefault(score, 0),
            }))
            .sort((a, b) => a.grade - b.grade),
        },

        careerReflectionRules: {
          create: Object.entries(payload.careerReflectionCounts).map(
            ([subjectLabel, reflectionCount], index) => ({
              sortOrder: index,
              subjectLabel: toText(subjectLabel),
              reflectionCount: parseIntOrDefault(reflectionCount, 0),
            })
          ),
        },

        careerAchievementScoreRules: {
          create: Object.entries(payload.careerAchievementScores).map(
            ([achievementLevel, score]) => ({
              achievementLevel: toText(achievementLevel),
              score: parseFloatOrDefault(score, 0),
            })
          ),
        },

        attendanceScoreRules: {
          create: payload.attendanceRows.map((row, index) => ({
            sortOrder: index,
            labelType:
              row.labelType === "fixed"
                ? UniversityConversionAttendanceLabelType.FIXED
                : row.labelType === "range"
                ? UniversityConversionAttendanceLabelType.RANGE
                : UniversityConversionAttendanceLabelType.ABOVE,
            label: normalizeOptionalText(row.label),
            upper:
              row.labelType === "range"
                ? parseIntOrDefault(row.upper, 0)
                : null,
            lower:
              row.labelType === "above"
                ? parseIntOrDefault(row.lower, 0)
                : null,
            score: parseFloatOrDefault(row.score, 0),
          })),
        },
      },
      select: {
        id: true,
        mode: true,
        action: true,
        status: true,
        createdAt: true,
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
    savedAt: saved.createdAt.toISOString(),
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

  if (!isPayload(body)) {
    return jsonError("page.tsx payload 구조와 일치하지 않는 요청입니다.", 400);
  }

  const payload = body;

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
      const rule = await prisma.universityConversionRule.findUnique({
        where: {
          id: ruleId,
        },
        include: ruleDetailInclude,
      });

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

    return NextResponse.json(
      {
        success: true,
        data: {
          total: rules.length,
          rows: rules.map(mapRuleListItem),
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
