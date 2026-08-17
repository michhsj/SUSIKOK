"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";


type CommonSubjectItem = {
  label: string;
  subTag?: string;
};

type CommonSubjectSelections = Record<string, boolean>;
type CommonUseAllSubjects = Record<string, boolean>;
type CommonReflectionCounts = Record<string, string>;
type CommonWeights = Record<string, string>;

type AttendanceRowType = "fixed" | "range" | "above";

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
  commonSubjectSelections: CommonSubjectSelections;
  commonUseAllSubjects: CommonUseAllSubjects;
  commonReflectionCounts: CommonReflectionCounts;
  commonWeights: CommonWeights;
  gradeScoreMap: Record<string, string>;
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
    commonSubjectSelections?: Record<string, boolean>;
    commonUseAllSubjects?: Record<string, boolean>;
    commonReflectionCounts: Record<string, string>;
    commonWeights: Record<string, string>;
    gradeScoreMap: Record<string, string>;
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
};

const commonSubjects: CommonSubjectItem[] = [
  { label: "국어" },
  { label: "수학" },
  { label: "영어", subTag: "제2외국어 포함" },
  { label: "사회", subTag: "한국사 포함" },
  { label: "과학" },
  { label: "사회/과학", subTag: "한국사 포함" },
  { label: "기타과목" },
];

const careerSubjects = [
  "국어",
  "수학",
  "영어",
  "사회",
  "과학",
  "사회/과학",
  "전체",
] as const;

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

function createBooleanMap(
  keys: string[],
  defaultValue = false
): Record<string, boolean> {
  return Object.fromEntries(keys.map((key) => [key, defaultValue]));
}

function createStringMap(
  keys: string[],
  defaultValue = ""
): Record<string, string> {
  return Object.fromEntries(keys.map((key) => [key, defaultValue]));
}

function mergeBooleanMap(
  base: Record<string, boolean>,
  incoming?: Record<string, boolean> | null
) {
  return {
    ...base,
    ...(incoming ?? {}),
  };
}

function mergeStringMap(
  base: Record<string, string>,
  incoming?: Record<string, string> | null
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
  기타과목: "0",
};

const initialCommonWeights: CommonWeights = {
  국어: "100",
  수학: "100",
  영어: "100",
  사회: "100",
  과학: "100",
  "사회/과학": "100",
  기타과목: "100",
};

const initialCommonSubjectSelections: CommonSubjectSelections = {
  국어: true,
  수학: true,
  영어: true,
  사회: true,
  과학: true,
  "사회/과학": true,
  기타과목: false,
};

const initialCommonUseAllSubjects: CommonUseAllSubjects =
  createBooleanMap(commonSubjectKeys, false);

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
    !normalized.admissionType ||
    !normalized.admissionName ||
    !normalized.track
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

function getGradeRatio(grade: number | null, rawScore: number | null) {
  if (grade != null) {
    const normalized = (10 - clamp(grade, 1, 9)) / 9;
    return clamp(normalized, 0, 1);
  }

  if (rawScore != null) {
    return clamp(rawScore / 100, 0, 1);
  }

  return null;
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

function getReflectionCount(value: string | null | undefined) {
  const parsed = parseNumber(value ?? "");
  if (parsed == null) return 0;
  return Math.max(0, Math.floor(parsed));
}

function resolveCommonWeightKey(subjectGroup: string) {
  const normalized = normalizeSubjectGroupLabel(subjectGroup);

  const matched = commonSubjects.find(
    (subject) => normalizeSubjectGroupLabel(subject.label) === normalized
  );

  return matched?.label ?? "기타과목";
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
    .localeCompare([b.subjectGroup, b.subjectName, b.academicTerm].join(" "), "ko");
}

function matchesCommonSubjectGroup(row: TestScoreRow, subjectLabel: string) {
  const rowGroup = normalizeSubjectGroupLabel(row.subjectGroup);
  const target = normalizeSubjectGroupLabel(subjectLabel);

  if (!rowGroup) return false;

  if (target === "기타과목") {
    return !["국어", "수학", "영어", "사회", "과학", "사회/과학"].includes(
      rowGroup
    );
  }

  return rowGroup === target;
}

function matchesCareerSubjectGroup(row: TestScoreRow, subjectLabel: string) {
  const rowGroup = normalizeSubjectGroupLabel(row.subjectGroup);
  const target = normalizeSubjectGroupLabel(subjectLabel);

  if (!rowGroup) return false;
  if (target === "전체") return true;

  return rowGroup === target;
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
const router = useRouter();
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

  const [commonSubjectSelections, setCommonSubjectSelections] =
    useState<CommonSubjectSelections>(initialCommonSubjectSelections);

  const [commonUseAllSubjects, setCommonUseAllSubjects] =
    useState<CommonUseAllSubjects>(initialCommonUseAllSubjects);

  const [commonReflectionCounts, setCommonReflectionCounts] =
    useState<CommonReflectionCounts>(initialCommonReflectionCounts);

  const [commonWeights, setCommonWeights] =
    useState<CommonWeights>(initialCommonWeights);

  const [gradeScoreMap, setGradeScoreMap] = useState<Record<number, string>>({
    1: "100",
    2: "98",
    3: "96",
    4: "94",
    5: "90",
    6: "85",
    7: "80",
    8: "75",
    9: "70",
  });

  const [careerReflectionCounts, setCareerReflectionCounts] = useState<
    Record<string, string>
  >({
    국어: "1",
    수학: "1",
    영어: "1",
    사회: "1",
    과학: "1",
    "사회/과학": "1",
    전체: "2",
  });

  const [careerAchievementScores, setCareerAchievementScores] = useState<
    Record<string, string>
  >({
    A: "100",
    B: "85",
    C: "70",
  });

  const [careerAchievementFormulaName, setCareerAchievementFormulaName] =
    useState("성취도 환산식");
  const [careerAchievementFormulaBody, setCareerAchievementFormulaBody] =
    useState("");

  const [attendanceRows, setAttendanceRows] =
    useState<AttendanceRow[]>(defaultAttendanceRows);

  const [formulaName, setFormulaName] = useState("기본 환산 계산식");
  const [formulaBody, setFormulaBody] = useState(
    "공통교과 반영점수 + 진로선택 반영점수 + 출결 반영점수"
  );
  const [formulaMemo, setFormulaMemo] = useState("");

  const [applyUnitWeight, setApplyUnitWeight] = useState(true);
  const [applyCommonWeight, setApplyCommonWeight] = useState(false);
  const [applyConvertedScore, setApplyConvertedScore] = useState(true);
  const [includeCareerSubjects, setIncludeCareerSubjects] = useState(true);
  const [applyCareerBonus, setApplyCareerBonus] = useState(false);
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

        setTargetValues(data.targetValues);
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

        setCareerReflectionCounts((prev) => ({
          ...prev,
          ...data.careerReflectionCounts,
        }));

        setCareerAchievementScores((prev) => ({
          ...prev,
          ...data.careerAchievementScores,
        }));

        setCareerAchievementFormulaName(data.careerAchievementFormulaName ?? "");
        setCareerAchievementFormulaBody(data.careerAchievementFormulaBody ?? "");

        setAttendanceRows(
          Array.isArray(data.attendanceRows) && data.attendanceRows.length > 0
            ? data.attendanceRows
            : defaultAttendanceRows
        );

        setFormulaName(data.formulaName ?? "");
        setFormulaBody(data.formulaBody ?? "");
        setFormulaMemo(data.formulaMemo ?? "");

        setApplyUnitWeight(data.switches.applyUnitWeight);
        setApplyCommonWeight(data.switches.applyCommonWeight);
        setApplyConvertedScore(data.switches.applyConvertedScore);
        setIncludeCareerSubjects(data.switches.includeCareerSubjects);
        setApplyCareerBonus(data.switches.applyCareerBonus);
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

  const admissionNameOptions = useMemo(() => {
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
        .map((row) => row.admissionName)
    );
  }, [
    admissionTargetCatalogRows,
    targetValues.admissionType,
    targetValues.region,
    targetValues.university,
  ]);

  const trackOptions = useMemo(() => {
    if (
      !targetValues.region ||
      !targetValues.university ||
      !targetValues.admissionType ||
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
            row.admissionName === targetValues.admissionName
        )
        .map((row) => row.track)
    );
  }, [
    admissionTargetCatalogRows,
    targetValues.admissionName,
    targetValues.admissionType,
    targetValues.region,
    targetValues.university,
  ]);

  const collegeNameOptions = useMemo(() => {
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
        .filter(
          (row) =>
            row.region === targetValues.region &&
            row.university === targetValues.university &&
            row.admissionType === targetValues.admissionType &&
            row.admissionName === targetValues.admissionName &&
            row.track === targetValues.track
        )
        .map((row) => row.collegeName)
    );
  }, [
    admissionTargetCatalogRows,
    targetValues.admissionName,
    targetValues.admissionType,
    targetValues.region,
    targetValues.track,
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
      !!targetValues.admissionType &&
      !!targetValues.admissionName &&
      !!targetValues.track
    );
  }, [targetValues]);

  const canActivateSave =
    requiredTargetReady && !loadingAdmissionTargets && !loadingTestScore;

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

      if (key === "admissionName") {
        return {
          ...prev,
          admissionName: value,
          track: "",
          collegeName: "",
          recruitmentUnit: "",
        };
      }

      if (key === "track") {
        return {
          ...prev,
          track: value,
          collegeName: "",
          recruitmentUnit: "",
        };
      }

      if (key === "collegeName") {
        return {
          ...prev,
          collegeName: value,
          recruitmentUnit: "",
        };
      }

      return {
        ...prev,
        [key]: value,
      };
    });
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
    if (!commonSubjectSelections[subjectLabel]) {
      return;
    }

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
    if (!commonSubjectSelections[subjectLabel]) {
      return;
    }

    if (commonUseAllSubjects[subjectLabel]) {
      return;
    }

    setCommonReflectionCounts((prev) => ({
      ...prev,
      [subjectLabel]: value,
    }));
  }

  function handleChangeCommonWeight(subjectLabel: string, value: string) {
    if (!commonSubjectSelections[subjectLabel]) {
      return;
    }

    setCommonWeights((prev) => ({
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

      const useAllSubjects = commonUseAllSubjects[subjectLabel] === true;

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

  function validateCommonSubjectInputs() {
    const selectedSubjects = commonSubjectKeys.filter(
      (subjectLabel) => commonSubjectSelections[subjectLabel] === true
    );

    if (selectedSubjects.length === 0) {
      return "공통과목 반영 교과를 최소 1개 이상 선택해 주세요.";
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
      (row) => row.completionType.trim() !== "진로선택"
    );
  }, [filledTestRows]);

  const careerTestRows = useMemo(() => {
    return filledTestRows.filter(
      (row) => row.completionType.trim() === "진로선택"
    );
  }, [filledTestRows]);

  const selectedCommonRows = useMemo(() => {
    const selected: TestScoreRow[] = [];
    const usedIndexes = new Set<number>();

    for (const subject of commonSubjects) {
      const isSelected = commonSubjectSelections[subject.label] === true;

      if (!isSelected) continue;

      const useAllSubjects = commonUseAllSubjects[subject.label] === true;

      const candidates = commonTestRows
        .map((row, index) => ({ row, index }))
        .filter(
          ({ row, index }) =>
            !usedIndexes.has(index) &&
            matchesCommonSubjectGroup(row, subject.label)
        )
        .sort((a, b) => compareRowsForSelection(a.row, b.row));

      const pickedItems = useAllSubjects
        ? candidates
        : candidates.slice(
            0,
            getReflectionCount(commonReflectionCounts[subject.label])
          );

      for (const item of pickedItems) {
        usedIndexes.add(item.index);
        selected.push(item.row);
      }
    }

    return selected;
  }, [
    commonReflectionCounts,
    commonSubjectSelections,
    commonTestRows,
    commonUseAllSubjects,
  ]);

  const selectedCareerRows = useMemo(() => {
    if (!includeCareerSubjects) {
      return [];
    }

    const totalCount = getReflectionCount(careerReflectionCounts["전체"]);

    if (totalCount > 0) {
      return [...careerTestRows].sort(compareRowsForSelection).slice(0, totalCount);
    }

    const selected: TestScoreRow[] = [];
    const usedIndexes = new Set<number>();

    for (const subject of careerSubjects) {
      if (subject === "전체") continue;

      const count = getReflectionCount(careerReflectionCounts[subject]);

      if (count <= 0) continue;

      const candidates = careerTestRows
        .map((row, index) => ({ row, index }))
        .filter(
          ({ row, index }) =>
            !usedIndexes.has(index) &&
            matchesCareerSubjectGroup(row, subject)
        )
        .sort((a, b) => compareRowsForSelection(a.row, b.row));

      for (const item of candidates.slice(0, count)) {
        usedIndexes.add(item.index);
        selected.push(item.row);
      }
    }

    return selected;
  }, [careerReflectionCounts, careerTestRows, includeCareerSubjects]);

  const commonScore = useMemo(() => {
    if (selectedCommonRows.length === 0) {
      return 0;
    }

    const resolvedRows = selectedCommonRows
      .map((row) => {
        const credits = parseNumber(row.credits) ?? 1;
        const grade = parseNumber(row.grade);
        const rawScore = parseNumber(row.rawScore);

        let resolvedScore: number | null = null;

        if (applyConvertedScore) {
          resolvedScore = getConvertedScoreFromGrade(grade, gradeScoreMap);
        }

        if (resolvedScore == null) {
          const ratio = getGradeRatio(grade, rawScore);
          resolvedScore = ratio == null ? null : ratio * 100;
        }

        if (resolvedScore == null) {
          return null;
        }

        const unitWeight = applyUnitWeight ? Math.max(credits, 0) : 1;
        const commonWeightKey = resolveCommonWeightKey(row.subjectGroup);
        const commonWeightFactor = applyCommonWeight
          ? getPercentWeight(commonWeights[commonWeightKey])
          : 1;

        return {
          resolvedScore,
          unitWeight,
          commonWeightFactor,
        };
      })
      .filter(
        (
          item
        ): item is {
          resolvedScore: number;
          unitWeight: number;
          commonWeightFactor: number;
        } => item !== null
      );

    if (resolvedRows.length === 0) {
      return 0;
    }

    const totalUnitWeight = resolvedRows.reduce(
      (sum, item) => sum + item.unitWeight,
      0
    );

    if (totalUnitWeight === 0) {
      return 0;
    }

    const weightedScoreSum = resolvedRows.reduce((sum, item) => {
      return (
        sum +
        ((item.resolvedScore * item.unitWeight) / totalUnitWeight) *
          item.commonWeightFactor
      );
    }, 0);

    return clamp(weightedScoreSum / 100, 0, 1) * 87.4;
  }, [
    applyCommonWeight,
    applyConvertedScore,
    applyUnitWeight,
    commonWeights,
    gradeScoreMap,
    selectedCommonRows,
  ]);

  const careerRegularScore = useMemo(() => {
    if (!includeCareerSubjects || selectedCareerRows.length === 0) {
      return 0;
    }

    let weightSum = 0;
    let scoreSum = 0;

    for (const row of selectedCareerRows) {
      const credits = parseNumber(row.credits) ?? 1;
      const achievementScore =
        parseNumber(
          careerAchievementScores[row.achievement.trim().toUpperCase()]
        ) ??
        (() => {
          const ratio = getAchievementRatio(row.achievement);
          return ratio == null ? null : ratio * 100;
        })();

      if (achievementScore == null) continue;

      const weight = applyUnitWeight ? credits : 1;
      weightSum += weight;
      scoreSum += achievementScore * weight;
    }

    if (weightSum === 0) {
      return 0;
    }

    const averageScore = scoreSum / weightSum;
    return clamp(averageScore / 100, 0, 1) * 8.5;
  }, [
    applyUnitWeight,
    careerAchievementScores,
    includeCareerSubjects,
    selectedCareerRows,
  ]);

  const careerBonusScore = useMemo(() => {
    if (!includeCareerSubjects || !applyCareerBonus) {
      return 0;
    }

    return careerRegularScore;
  }, [applyCareerBonus, careerRegularScore, includeCareerSubjects]);

  const careerContributionScore = useMemo(() => {
    if (!includeCareerSubjects) {
      return 0;
    }

    return applyCareerBonus ? careerBonusScore : careerRegularScore;
  }, [
    applyCareerBonus,
    careerBonusScore,
    careerRegularScore,
    includeCareerSubjects,
  ]);

  const attendanceScore = useMemo(() => {
    if (!includeAttendance) {
      return 0;
    }

    const absenceDays = parseNumber(testAttendance?.absenceDays ?? "");
    const baseScore = getAttendanceBaseScore(absenceDays, attendanceRows);

    if (baseScore == null) {
      return 0;
    }

    return clamp((baseScore / 100) * 4.1, 0, 4.1);
  }, [attendanceRows, includeAttendance, testAttendance]);

  const finalScore = useMemo(() => {
    return commonScore + careerContributionScore + attendanceScore;
  }, [attendanceScore, careerContributionScore, commonScore]);

  const conversionScoreSummary: ConversionSummaryItem[] = useMemo(
    () => [
      {
        label: "공통과목 반영점수",
        value: formatScore(commonScore),
        tone: "slate",
        helper: applyConvertedScore
          ? applyCommonWeight
            ? "등급별 환산점수표 + 이수단위/과목 가중치 반영"
            : "등급별 환산점수표 + 이수단위 기준 계산"
          : applyCommonWeight
          ? "등급/원점수 기본 계산 + 이수단위/과목 가중치 반영"
          : "등급/원점수 기본 계산",
      },
      {
        label: "진로선택 반영점수",
        value: formatScore(careerContributionScore),
        tone: "slate",
        helper: includeCareerSubjects
          ? applyCareerBonus
            ? "총점 가산점 방식"
            : "일반교과형 반영 방식"
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
      },
    ],
    [
      applyCareerBonus,
      applyCommonWeight,
      applyConvertedScore,
      attendanceScore,
      careerContributionScore,
      commonScore,
      finalScore,
      includeAttendance,
      includeCareerSubjects,
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
      ...normalizedCommonSubjectPayload,
      gradeScoreMap: Object.fromEntries(
        Object.entries(gradeScoreMap).map(([grade, score]) => [
          String(grade),
          score,
        ])
      ),
      careerReflectionCounts: { ...careerReflectionCounts },
      careerAchievementScores: { ...careerAchievementScores },
      careerAchievementFormulaName,
      careerAchievementFormulaBody,
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
      switches: {
        applyUnitWeight,
        applyCommonWeight,
        applyConvertedScore,
        includeCareerSubjects,
        applyCareerBonus,
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
        careerContributionScore: formatScore(careerContributionScore),
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
        text: "지역, 대학, 전형유형, 전형명, 계열 필수값을 먼저 선택해 주세요.",
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

      if (action === "activate" && isEditMode) {
        router.push("/admin/university-conversion/active-rules");
      }
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

      <SectionCard
        title="환산 규칙 대상 설정"
        description="AdmissionResult 기준으로 지역 → 대학 → 전형유형 → 전형명 → 계열 → 단과대학 → 모집단위를 단계적으로 선택합니다."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <ActionChip tone={requiredTargetReady ? "emerald" : "amber"}>
              {requiredTargetReady ? "필수값 입력 완료" : "필수값 입력 필요"}
            </ActionChip>
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

          <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            필수 선택값은{" "}
            <span className="font-semibold text-slate-800">
              지역, 대학, 전형유형, 전형명, 계열
            </span>
            입니다. 단과대학과 모집단위는 선택값이며, 상위 선택을 변경하면
            하위 선택값은 자동 초기화됩니다.
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <FieldLabel label="지역" required />
              <SelectField
                value={targetValues.region}
                onChange={(value) => updateTargetValue("region", value)}
                placeholder={loadingAdmissionTargets ? "불러오는 중" : "지역 선택"}
                options={regionOptions}
                disabled={loadingAdmissionTargets || regionOptions.length === 0}
              />
            </div>

            <div className="space-y-2">
              <FieldLabel label="대학" required />
              <SelectField
                value={targetValues.university}
                onChange={(value) => updateTargetValue("university", value)}
                placeholder={!targetValues.region ? "먼저 지역 선택" : "대학 선택"}
                options={universityOptions}
                disabled={!targetValues.region || universityOptions.length === 0}
              />
            </div>

            <div className="space-y-2">
              <FieldLabel label="전형유형" required />
              <SelectField
                value={targetValues.admissionType}
                onChange={(value) => updateTargetValue("admissionType", value)}
                placeholder={
                  !targetValues.university ? "먼저 대학 선택" : "전형유형 선택"
                }
                options={admissionTypeOptions}
                disabled={
                  !targetValues.university || admissionTypeOptions.length === 0
                }
              />
            </div>

            <div className="space-y-2">
              <FieldLabel label="전형명" required />
              <SelectField
                value={targetValues.admissionName}
                onChange={(value) => updateTargetValue("admissionName", value)}
                placeholder={
                  !targetValues.admissionType
                    ? "먼저 전형유형 선택"
                    : "전형명 선택"
                }
                options={admissionNameOptions}
                disabled={
                  !targetValues.admissionType ||
                  admissionNameOptions.length === 0
                }
              />
            </div>

            <div className="space-y-2">
              <FieldLabel label="계열" required />
              <SelectField
                value={targetValues.track}
                onChange={(value) => updateTargetValue("track", value)}
                placeholder={
                  !targetValues.admissionName ? "먼저 전형명 선택" : "계열 선택"
                }
                options={trackOptions}
                disabled={!targetValues.admissionName || trackOptions.length === 0}
              />
            </div>

            <div className="space-y-2">
              <FieldLabel label="단과대학" />
              <SelectField
                value={targetValues.collegeName}
                onChange={(value) => updateTargetValue("collegeName", value)}
                placeholder={!targetValues.track ? "먼저 계열 선택" : "단과대학 선택"}
                options={collegeNameOptions}
                disabled={!targetValues.track || collegeNameOptions.length === 0}
              />
            </div>

            <div className="space-y-2">
              <FieldLabel label="모집단위" />
              <SelectField
                value={targetValues.recruitmentUnit}
                onChange={(value) => updateTargetValue("recruitmentUnit", value)}
                placeholder={!targetValues.track ? "먼저 계열 선택" : "모집단위 선택"}
                options={recruitmentUnitOptions}
                disabled={
                  !targetValues.track || recruitmentUnitOptions.length === 0
                }
              />
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <div className="space-y-5">
          <SectionCard
            title="공통/일반선택과목 반영 설정"
            description="반영할 교과를 먼저 선택하고, 전과목 ON이면 해당 교과 전체 과목을 반영합니다. 전과목 OFF일 때만 반영 과목 수를 입력합니다."
            right={
              <div className="flex flex-wrap items-center gap-4">
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
                    이수단위반영
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
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                공통과목 반영점수는 선택된 과목에 대해{" "}
                <span className="font-semibold text-slate-800">
                  Σ(((과목별 환산점수 × 과목별 이수단위) / 과목별 이수단위 합) ×
                  (과목별 가중치 / 100))
                </span>
                를 계산한 뒤, 결과를 100점 만점 기준으로 환산하여 최종
                공통과목 반영점수로 적용합니다. 가중치 적용이 OFF이면 각 과목
                가중치는 100으로 간주되어
                <span className="font-semibold text-slate-800">
                  {" "}
                  (가중치 / 100) = 1
                </span>
                로 처리됩니다.
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[1100px]">
                  <div className="grid grid-cols-[180px_repeat(7,minmax(110px,1fr))] gap-3">
                    <div className="flex items-center text-sm font-semibold text-slate-700">
                      구분
                    </div>

                    {commonSubjects.map((subject) => (
                      <div
                        key={`${subject.label}-header`}
                        className="flex min-h-[64px] items-center justify-center rounded-[20px] border border-slate-200 bg-slate-50 px-3 py-3"
                      >
                        <SubjectHeader
                          label={subject.label}
                          subTag={subject.subTag}
                        />
                      </div>
                    ))}

                    <div className="flex items-center text-sm font-semibold text-slate-700">
                      반영여부
                    </div>

                    {commonSubjects.map((subject) => {
                      const selected =
                        commonSubjectSelections[subject.label] === true;

                      return (
                        <div
                          key={`${subject.label}-selected`}
                          className="flex h-14 items-center justify-center rounded-[20px] border border-slate-200 bg-white px-3"
                        >
                          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(event) =>
                                handleChangeCommonSubjectSelection(
                                  subject.label,
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

                    {commonSubjects.map((subject) => {
                      const selected =
                        commonSubjectSelections[subject.label] === true;
                      const useAllSubjects =
                        commonUseAllSubjects[subject.label] === true;

                      return (
                        <div
                          key={`${subject.label}-all`}
                          className="flex h-14 items-center justify-center rounded-[20px] border border-slate-200 bg-white px-3"
                        >
                          <ToggleSwitch
                            checked={useAllSubjects}
                            onChange={(next) =>
                              handleChangeCommonUseAllSubjects(
                                subject.label,
                                next
                              )
                            }
                            disabled={!selected}
                          />
                        </div>
                      );
                    })}

                    <div className="flex items-center text-sm font-semibold text-slate-700">
                      반영 과목 수
                    </div>

                    {commonSubjects.map((subject) => {
                      const selected =
                        commonSubjectSelections[subject.label] === true;
                      const useAllSubjects =
                        commonUseAllSubjects[subject.label] === true;

                      return (
                        <NumberField
                          key={`${subject.label}-count`}
                          value={commonReflectionCounts[subject.label] ?? ""}
                          onChange={(value) =>
                            handleChangeCommonReflectionCount(
                              subject.label,
                              value
                            )
                          }
                          placeholder="반영 수"
                          disabled={!selected || useAllSubjects}
                        />
                      );
                    })}

                    <div className="flex items-center text-sm font-semibold text-slate-700">
                      가중치(%)
                    </div>

                    {commonSubjects.map((subject) => {
                      const selected =
                        commonSubjectSelections[subject.label] === true;

                      return (
                        <NumberField
                          key={`${subject.label}-weight`}
                          value={commonWeights[subject.label] ?? ""}
                          onChange={(value) =>
                            handleChangeCommonWeight(subject.label, value)
                          }
                          placeholder="100"
                          disabled={!selected || !applyCommonWeight}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="등급별 환산점수 설정"
            description="환산점수 적용 ON일 때, 등급 대신 사용할 대학별 환산점수표입니다."
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
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
              {gradeLevels.map((grade) => (
                <div key={grade} className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    {grade}등급
                  </label>
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
            title="진로선택 반영 설정"
            description="진로선택 과목을 일반 반영 방식으로 포함할지, 가산점 방식으로 합산할지 설정합니다. 성취도 점수와 성취도 환산식 계산 입력을 함께 관리하며, OFF일 때는 관련 입력이 비활성화됩니다."
            right={
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-600">
                    진로선택 반영여부
                  </span>
                  <ToggleSwitch
                    checked={includeCareerSubjects}
                    onChange={setIncludeCareerSubjects}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-600">
                    진로선택 가산점 계산
                  </span>
                  <ToggleSwitch
                    checked={applyCareerBonus}
                    onChange={setApplyCareerBonus}
                    disabled={!includeCareerSubjects}
                  />
                </div>
              </div>
            }
          >
            <div className="space-y-5">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {includeCareerSubjects ? (
                  applyCareerBonus ? (
                    <>현재 모드: 진로선택 점수를 일반 반영점수와 별도로 총점에 가산합니다.</>
                  ) : (
                    <>현재 모드: 진로선택 과목을 일반교과처럼 성취도 점수 기반으로 반영합니다.</>
                  )
                ) : (
                  <>현재 모드: 진로선택 과목은 최종 계산에서 제외됩니다.</>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
                {careerSubjects.map((subject) => (
                  <div key={subject} className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      {subject}
                    </label>
                    <NumberField
                      value={careerReflectionCounts[subject] ?? ""}
                      onChange={(value) =>
                        setCareerReflectionCounts((prev) => ({
                          ...prev,
                          [subject]: value,
                        }))
                      }
                      placeholder="반영 수"
                      disabled={!includeCareerSubjects}
                    />
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {(["A", "B", "C"] as const).map((level) => (
                  <div key={level} className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      성취도 {level}
                    </label>
                    <NumberField
                      value={careerAchievementScores[level] ?? ""}
                      onChange={(value) =>
                        setCareerAchievementScores((prev) => ({
                          ...prev,
                          [level]: value,
                        }))
                      }
                      placeholder="점수"
                      disabled={!includeCareerSubjects}
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
                    placeholder="예: 진로선택 성취도 등급 환산식"
                    disabled={!includeCareerSubjects}
                  />
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  성취도만으로 등급을 산정하거나, A/B/C를 별도 방식으로 환산하는
                  대학의 기준을 기록하는 입력 영역입니다.
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
                  disabled={!includeCareerSubjects}
                  className={`w-full rounded-[24px] border px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 ${
                    !includeCareerSubjects
                      ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                      : "border-slate-200 bg-white text-slate-700 focus:border-slate-400 focus:ring-slate-200"
                  }`}
                  placeholder="예: A=1등급, B=3등급, C=5등급 / 또는 대학이 제시한 성취도 환산식 계산 기준을 입력"
                />
                <p className="text-xs leading-6 text-slate-500">
                  진로선택 반영여부가 OFF이면 입력할 수 없습니다. 현재 자동
                  계산은 A/B/C 점수 입력값을 기준으로 동작하며, 이 영역은
                  대학별 환산식 메모 및 저장용 입력창으로 사용됩니다.
                </p>
              </div>
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
                    진로 선별 과목 수
                  </span>
                  <span className="text-sm font-semibold text-slate-800">
                    {selectedCareerRows.length}건
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
            title="출결 반영 설정"
            description="출결을 반영하는 대학에만 ON으로 전환합니다. OFF일 때는 출결 점수 입력이 비활성화됩니다."
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
              <div className="grid grid-cols-[1.4fr_1fr] gap-3 border-b border-slate-200 pb-2 text-sm font-semibold text-slate-700">
                <div>결석일수</div>
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
            title="환산 성적 요약"
            description="확정된 스위치 규정에 따라 test-score 데이터를 계산한 결과입니다."
            right={
              <div className="flex flex-wrap items-center gap-2">
                <ActionChip tone="blue">
                  {testSetName ? `기준: ${testSetName}` : "기준 데이터 없음"}
                </ActionChip>
                {applyCareerBonus ? (
                  <ActionChip tone="amber">진로선택: 가산점 방식</ActionChip>
                ) : (
                  <ActionChip tone="slate">진로선택: 일반 반영 방식</ActionChip>
                )}
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
        description="현재 스위치 규정에 대한 계산 메모와 설명을 관리합니다. 이 영역의 입력값은 자동 계산 엔진에 직접 파싱되지 않고 저장용 설명 데이터로만 사용됩니다."
      >
        <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-4">
            <div className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <span className="font-semibold">적용 방식 안내:</span> 아래{" "}
              <span className="font-semibold">
                계산식 이름 / 계산식 요약 / 계산식 상세 / 보조 메모
              </span>
              는 저장 시 payload에 함께 저장되지만, 현재 페이지의{" "}
              <span className="font-semibold">
                commonScore / careerContributionScore / attendanceScore /
                finalScore
              </span>
              계산 로직에서 직접 해석되거나 실행되지는 않습니다.
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  계산식 이름
                </label>
                <TextField
                  value={formulaName}
                  onChange={setFormulaName}
                  placeholder="계산식 이름 입력"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  계산식 요약
                </label>
                <TextField
                  value={formulaBody}
                  onChange={setFormulaBody}
                  placeholder="예: 공통 + 진로 + 출결"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                계산식 상세
              </label>
              <textarea
                value={formulaBody}
                onChange={(event) => setFormulaBody(event.target.value)}
                rows={5}
                className="w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                placeholder="환산식 설명 또는 수식 메모를 입력하세요."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                보조 메모
              </label>
              <textarea
                value={formulaMemo}
                onChange={(event) => setFormulaMemo(event.target.value)}
                rows={4}
                className="w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                placeholder=""
              />
            </div>
          </div>

          <div className="h-full">
            <div className="flex min-h-full flex-col rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-sm font-semibold text-slate-700">
                계산 가이드
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>
                  • 환산점수 적용 ON이면 공통교과는 등급 대신 환산점수표를
                  사용합니다.
                </li>
                <li>
                  • 공통과목 반영점수는 Σ(((환산점수 × 이수단위) / 이수단위 합) ×
                  (가중치 / 100)) 기준으로 계산합니다.
                </li>
                <li>
                  • 이수단위반영 OFF이면 각 과목의 이수단위를 1로 간주합니다.
                </li>
                <li>
                  • 공통과목 가중치 적용 OFF이면 각 과목의 가중치를 100으로
                  간주합니다.
                </li>
                <li>
                  • 공통과목은 반영 여부가 체크된 교과만 계산에 포함합니다.
                </li>
                <li>
                  • 전과목 ON이면 해당 교과의 선택 가능한 과목 전체를 반영합니다.
                </li>
                <li>
                  • 공통/진로 과목 선별 시 성적이 같으면 이수단위가 높은 과목을
                  우선 반영합니다.
                </li>
                <li>
                  • 진로선택 가산점 계산 OFF이면 진로선택 과목도 일반 반영점수처럼
                  계산합니다.
                </li>
                <li>
                  • 진로선택 가산점 계산 ON이면 진로선택 점수를 총점 가산 항목으로
                  해석합니다.
                </li>
                <li>
                  • 출결 반영여부 OFF이면 출결 데이터가 있어도 계산에 포함하지
                  않습니다.
                </li>
                <li>
                  • 환산 계산식 입력 영역은 현재 계산 엔진이 직접 읽지 않으며
                  저장/설명용 메모로만 사용됩니다.
                </li>
              </ul>
            </div>
          </div>
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

