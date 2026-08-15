"use client";

import { useEffect, useMemo, useState } from "react";

type AdmissionsPageClientProps = {
  premiumUnlocked?: boolean;
};

type OptionGroupKey =
  | "region"
  | "universityName"
  | "admissionType"
  | "admissionName"
  | "collegeName"
  | "track";

type OptionItem = {
  label: string;
  value: string;
};

type OptionGroup = {
  label: string;
  options: OptionItem[];
  count?: number;
  enabled?: boolean;
};

type OptionsResponse = {
  success: boolean;
  message?: string;
  optionGroups?: Partial<Record<OptionGroupKey, OptionGroup>>;
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
    label: string;
    shortLabel: string;
    raw: string | null;
    display: string;
  };
};

type SearchResponse = {
  success: boolean;
  message?: string;
  items?: unknown[];
  meta?: {
    totalCount?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
  };
};

type DetailResponse = {
  success: boolean;
  message?: string;
  item?: unknown;
};

type SaveResponse = {
  success: boolean;
  message?: string;
};

type ChartSeries = {
  name: string;
  data: (number | null)[];
};

type ChartBlock = {
  title: string;
  labels: string[];
  series: ChartSeries[];
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
  summaryFields: {
    label: string;
    value: string;
  }[];
  yearTable: {
    columns: string[];
    rows: {
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
    }[];
  };
  charts: {
    competitionRate: ChartBlock;
    scoreTrend: ChartBlock;
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

type SummaryField = DetailItem["summaryFields"][number];
type YearRow = DetailItem["yearTable"]["rows"][number];

type Filters = {
  region: string;
  universityName: string;
  admissionType: string;
  admissionName: string;
  collegeName: string;
  track: string;
  humanityKeywords: string[];
  scienceKeywords: string[];
};

const INITIAL_FILTERS: Filters = {
  region: "",
  universityName: "",
  admissionType: "",
  admissionName: "",
  collegeName: "",
  track: "",
  humanityKeywords: [],
  scienceKeywords: [],
};

const HUMANITY_KEYWORDS = [
  "경영",
  "경제",
  "교육",
  "관광",
  "국제",
  "무역",
  "무리",
  "미디어",
  "사회",
  "심리",
  "유아",
  "행정",
];

const SCIENCE_KEYWORDS = [
  "간호",
  "건축",
  "기계",
  "생명",
  "식품",
  "약학",
  "의예",
  "전기",
  "전자",
  "컴퓨터",
  "화학",
  "AI",
];

const SUMMARY_FIELD_ORDER = [
  "전형방법",
  "학생부반영",
  "최저학력기준",
  "원서접수",
  "1차합격",
  "논술/면접",
  "실기/면접",
  "최종합격",
  "전형특기사항",
  "특기사항",
];

function collectSelectedKeywords(filters: Filters) {
  return [...filters.humanityKeywords, ...filters.scienceKeywords];
}

function hasKeywordFilters(filters: Filters) {
  return collectSelectedKeywords(filters).length > 0;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function appendIfValue(params: URLSearchParams, key: string, value: string) {
  const normalized = value.trim();
  if (normalized) params.set(key, normalized);
}

function toStringValue(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toDisplayText(value: unknown) {
  const text = toStringValue(value);
  return text || "-";
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  const text = String(value).trim();
  if (!text || text === "-" || text.toLowerCase() === "null") return null;

  const parsed = Number(text.replace(/,/g, "").replace(/[^0-9.\-]/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCount(value: number) {
  return value.toLocaleString("ko-KR");
}

function parseUnknownArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function parseStringArray(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback;
  return value.map((item) => toStringValue(item)).filter(Boolean);
}

function parseNullableNumberArray(value: unknown): (number | null)[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => toNullableNumber(item));
}

function orderSummaryFields(fields: SummaryField[]) {
  return [...fields].sort((a, b) => {
    const aIndex = SUMMARY_FIELD_ORDER.indexOf(a.label);
    const bIndex = SUMMARY_FIELD_ORDER.indexOf(b.label);
    const normalizedA = aIndex === -1 ? 999 : aIndex;
    const normalizedB = bIndex === -1 ? 999 : bIndex;
    return normalizedA - normalizedB;
  });
}

function isSavedDetail(detail?: DetailItem | null) {
  return detail?.premium?.saveAction?.label === "저장됨";
}

function getPremiumItem(detail: DetailItem | undefined, label: string) {
  return detail?.premium.items.find((item) => item.label === label);
}

function getScoreDisplay(detail: DetailItem | undefined, unlocked: boolean) {
  if (!detail) return unlocked ? "-" : "유료";
  if (detail.premium.locked) return "유료";
  return getPremiumItem(detail, "내성적")?.description || "-";
}

function getPossibilityDisplay(detail: DetailItem | undefined, unlocked: boolean) {
  if (!detail) return unlocked ? "-" : "유료";
  if (detail.premium.locked) return "유료";
  return getPremiumItem(detail, "지원가능성")?.description || "-";
}

function supportLevelToneClass(value: string) {
  switch (value) {
    case "도전":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "상향":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "안정":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "적정":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "하향":
      return "border-slate-300 bg-slate-100 text-slate-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text();

  if (!contentType.includes("application/json")) {
    console.error("[Non-JSON response]", {
      url: res.url,
      status: res.status,
      contentType,
      preview: text.slice(0, 300),
    });
    throw new Error(`JSON 응답이 아니라 HTML/텍스트가 반환되었습니다. (${res.status})`);
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    console.error("[JSON parse failed]", {
      url: res.url,
      status: res.status,
      contentType,
      preview: text.slice(0, 300),
    });
    throw error;
  }
}

function normalizeSearchItem(raw: unknown): SearchItem | null {
  if (!raw || typeof raw !== "object") return null;

  const item = raw as Record<string, unknown>;
  const rawIdentity =
    item.identity && typeof item.identity === "object"
      ? (item.identity as Record<string, unknown>)
      : null;

  const rawRecruitment =
    item.recruitmentCount2027 && typeof item.recruitmentCount2027 === "object"
      ? (item.recruitmentCount2027 as Record<string, unknown>)
      : null;

  const rawConverted70 =
    item.converted70_2026 && typeof item.converted70_2026 === "object"
      ? (item.converted70_2026 as Record<string, unknown>)
      : null;

  const id = toStringValue(item.id);
  if (!id) return null;

  const raw2027 =
    rawRecruitment?.raw ??
    item.currentHeadcountRaw ??
    item.recruitmentCount2027Raw ??
    null;

  const rawConverted70Value =
    rawConverted70?.raw ??
    item.converted70_2026_raw ??
    item.converted70 ??
    item.score70_2026 ??
    item.convertedScore70_2026 ??
    null;

  return {
    id,
    identity: {
      region: toStringValue(rawIdentity?.region ?? item.region),
      universityName: toStringValue(rawIdentity?.universityName ?? item.universityName),
      admissionType: toStringValue(rawIdentity?.admissionType ?? item.admissionType),
      admissionName: toStringValue(rawIdentity?.admissionName ?? item.admissionName),
      track: toStringValue(rawIdentity?.track ?? item.track),
      collegeName: toStringValue(rawIdentity?.collegeName ?? item.collegeName),
      recruitmentUnit: toStringValue(rawIdentity?.recruitmentUnit ?? item.recruitmentUnit),
    },
    recruitmentCount2027: {
      label: toStringValue(rawRecruitment?.label) || "2027학년도 모집인원",
      shortLabel: toStringValue(rawRecruitment?.shortLabel) || "27인원",
      raw: raw2027 === null || raw2027 === undefined ? null : String(raw2027),
      display:
        toStringValue(rawRecruitment?.display) ||
        (raw2027 === null || raw2027 === undefined ? "-" : toDisplayText(raw2027)),
    },
    converted70_2026: {
      label: toStringValue(rawConverted70?.label) || "26환산70%",
      shortLabel: toStringValue(rawConverted70?.shortLabel) || "26환산70%",
      raw:
        rawConverted70Value === null || rawConverted70Value === undefined
          ? null
          : String(rawConverted70Value),
      display:
        toStringValue(rawConverted70?.display) ||
        (rawConverted70Value === null || rawConverted70Value === undefined
          ? "-"
          : toDisplayText(rawConverted70Value)),
    },
  };
}

function normalizeDetailItem(raw: unknown): DetailItem | null {
  if (!raw || typeof raw !== "object") return null;

  const item = raw as Record<string, unknown>;
  const rawIdentity =
    item.identity && typeof item.identity === "object"
      ? (item.identity as Record<string, unknown>)
      : null;
  const rawRecruitment =
    item.recruitmentCount2027 && typeof item.recruitmentCount2027 === "object"
      ? (item.recruitmentCount2027 as Record<string, unknown>)
      : null;
  const rawYearTable =
    item.yearTable && typeof item.yearTable === "object"
      ? (item.yearTable as Record<string, unknown>)
      : null;
  const rawCharts =
    item.charts && typeof item.charts === "object"
      ? (item.charts as Record<string, unknown>)
      : null;
  const rawCompetitionRate =
    rawCharts?.competitionRate && typeof rawCharts.competitionRate === "object"
      ? (rawCharts.competitionRate as Record<string, unknown>)
      : null;
  const rawScoreTrend =
    rawCharts?.scoreTrend && typeof rawCharts.scoreTrend === "object"
      ? (rawCharts.scoreTrend as Record<string, unknown>)
      : null;
  const rawPremium =
    item.premium && typeof item.premium === "object"
      ? (item.premium as Record<string, unknown>)
      : null;

  const id = toStringValue(item.id);
  if (!id) return null;

  const rawSummaryFields = parseUnknownArray(item.summaryFields).map((field) => {
    const rawField = typeof field === "object" && field ? (field as Record<string, unknown>) : {};
    return {
      label: toStringValue(rawField.label),
      value: toDisplayText(rawField.value),
    };
  });

  const removedLabels = new Set([
    "개인별 합격 진단",
    "개인합격진단",
    "합격진단",
    "유료 서비스",
    "유료서비스",
    "유료",
  ]);

  const fallbackFinalDate =
    toStringValue(item.finalPassDate) ||
    toStringValue(item.finalAdmissionDate) ||
    toStringValue(item.finalDate) ||
    toStringValue(item.finalAnnouncement);

  const fallbackSpecialNote =
    toStringValue(item.admissionSpecialNotes) ||
    toStringValue(item.specialNotes) ||
    toStringValue(item.specialNote) ||
    toStringValue(item.remarks) ||
    toStringValue(item.remark) ||
    toStringValue(item.note);

  let summaryFields = rawSummaryFields.filter(
    (field) => field.label && !removedLabels.has(field.label),
  );

  summaryFields = summaryFields.map((field) => {
    if (field.label === "최종합격") {
      return {
        ...field,
        value: field.value && field.value !== "-" ? field.value : toDisplayText(fallbackFinalDate),
      };
    }

    if (
      (field.label === "전형특기사항" || field.label === "특기사항") &&
      (!field.value || field.value === "-" || field.value === "테스트 데이터") &&
      fallbackSpecialNote
    ) {
      return {
        ...field,
        label: "전형특기사항",
        value: toDisplayText(fallbackSpecialNote),
      };
    }

    return field;
  });

  if (!summaryFields.some((field) => field.label === "최종합격") && fallbackFinalDate) {
    summaryFields.push({
      label: "최종합격",
      value: toDisplayText(fallbackFinalDate),
    });
  }

  if (
    !summaryFields.some(
      (field) => field.label === "전형특기사항" || field.label === "특기사항",
    ) &&
    fallbackSpecialNote
  ) {
    summaryFields.push({
      label: "전형특기사항",
      value: toDisplayText(fallbackSpecialNote),
    });
  }

  summaryFields = orderSummaryFields(summaryFields);

  return {
    id,
    identity: {
      region: toStringValue(rawIdentity?.region ?? item.region),
      universityName: toStringValue(rawIdentity?.universityName ?? item.universityName),
      admissionType: toStringValue(rawIdentity?.admissionType ?? item.admissionType),
      admissionName: toStringValue(rawIdentity?.admissionName ?? item.admissionName),
      track: toStringValue(rawIdentity?.track ?? item.track),
      collegeName: toStringValue(rawIdentity?.collegeName ?? item.collegeName),
      recruitmentUnit: toStringValue(rawIdentity?.recruitmentUnit ?? item.recruitmentUnit),
    },
    recruitmentCount2027: {
      label: toStringValue(rawRecruitment?.label) || "2027학년도 모집인원",
      shortLabel: toStringValue(rawRecruitment?.shortLabel) || "27인원",
      raw:
        rawRecruitment?.raw === null || rawRecruitment?.raw === undefined
          ? null
          : String(rawRecruitment.raw),
      display:
        toStringValue(rawRecruitment?.display) ||
        toDisplayText(rawRecruitment?.raw ?? item.currentHeadcountRaw),
    },
    summaryFields,
    yearTable: {
      columns: parseStringArray(rawYearTable?.columns, [
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
      ]),
      rows: parseUnknownArray(rawYearTable?.rows).map((row) => {
        const rawRow = typeof row === "object" && row ? (row as Record<string, unknown>) : {};
        return {
          year: toStringValue(rawRow.year),
          recruitmentCount: toDisplayText(rawRow.recruitmentCount),
          applicantCount: toDisplayText(rawRow.applicantCount),
          competitionRate: toDisplayText(rawRow.competitionRate),
          additionalPassCount: toDisplayText(rawRow.additionalPassCount),
          minSatisfiedRate: toDisplayText(rawRow.minSatisfiedRate),
          minSatisfiedCount: toDisplayText(rawRow.minSatisfiedCount),
          actualCompetitionRate: toDisplayText(rawRow.actualCompetitionRate),
          score50: toDisplayText(rawRow.score50),
          score70: toDisplayText(rawRow.score70),
          converted50: toDisplayText(rawRow.converted50),
          converted70: toDisplayText(rawRow.converted70),
        };
      }),
    },
    charts: {
      competitionRate: {
        title: toStringValue(rawCompetitionRate?.title) || "경쟁률 추이",
        labels: parseStringArray(rawCompetitionRate?.labels, ["2024", "2025", "2026", "2027"]),
        series: parseUnknownArray(rawCompetitionRate?.series).map((seriesItem) => {
          const rawSeries =
            typeof seriesItem === "object" && seriesItem
              ? (seriesItem as Record<string, unknown>)
              : {};
          return {
            name: toStringValue(rawSeries.name),
            data: parseNullableNumberArray(rawSeries.data),
          };
        }),
      },
      scoreTrend: {
        title: toStringValue(rawScoreTrend?.title) || "점수 추이",
        labels: parseStringArray(rawScoreTrend?.labels, ["2024", "2025", "2026"]),
        series: parseUnknownArray(rawScoreTrend?.series).map((seriesItem) => {
          const rawSeries =
            typeof seriesItem === "object" && seriesItem
              ? (seriesItem as Record<string, unknown>)
              : {};
          return {
            name: toStringValue(rawSeries.name),
            data: parseNullableNumberArray(rawSeries.data),
          };
        }),
      },
    },
    premium: {
      locked: Boolean(rawPremium?.locked ?? true),
      title: toStringValue(rawPremium?.title) || "유료 서비스",
      items: parseUnknownArray(rawPremium?.items).map((premiumItem) => {
        const rawPremiumItem: Record<string, unknown> =
          typeof premiumItem === "object" && premiumItem
            ? (premiumItem as Record<string, unknown>)
            : {};

        return {
          label: toStringValue(rawPremiumItem.label),
          description: toStringValue(rawPremiumItem.description) || undefined,
          locked: Boolean(rawPremiumItem.locked ?? true),
        };
      }),
      saveAction:
        rawPremium?.saveAction && typeof rawPremium.saveAction === "object"
          ? {
              label:
                toStringValue((rawPremium.saveAction as Record<string, unknown>).label) || "저장",
            }
          : undefined,
    },
  };
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function IconReset() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IconCheckCircle() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <circle cx="12" cy="12" r="10" />
      <path
        d="m8.5 12.1 2.1 2.2 5-5.2"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SaveActionButton({
  label,
  mobile = false,
  unlocked,
  saved = false,
  disabled = false,
  onClick,
}: {
  label: string;
  mobile?: boolean;
  unlocked: boolean;
  saved?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  if (!unlocked) {
    return (
      <div
        title="유료 서비스"
        className={cn(
          "inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-700 text-white shadow-sm",
          mobile ? "h-10 px-3 text-sm" : "px-3 py-2 text-[11px]",
        )}
      >
        <span className="font-semibold">유료</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-xl border shadow-sm transition",
        mobile ? "h-10 px-3 text-sm" : "px-3 py-2 text-[11px]",
        disabled
          ? "cursor-wait border-slate-300 bg-slate-100 text-slate-500"
          : saved
            ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            : "border-blue-300 bg-white text-blue-800 hover:bg-blue-50",
      )}
    >
      <span className="font-semibold">{label}</span>
    </button>
  );
}

function PremiumValueDisplay({
  value,
  type,
  mobile = false,
}: {
  value: string;
  type: "score" | "possibility";
  mobile?: boolean;
}) {
  if (value === "유료") {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-700 text-white shadow-sm",
          mobile ? "h-10 px-3 text-sm" : "px-3 py-2 text-[11px]",
        )}
      >
        <span className="font-semibold">유료</span>
      </div>
    );
  }

  if (type === "possibility") {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-xl border font-semibold shadow-sm",
          mobile ? "h-10 px-3 text-sm" : "px-3 py-2 text-[11px]",
          supportLevelToneClass(value),
        )}
      >
        <span>{value}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50 font-semibold text-blue-900 shadow-sm",
        mobile ? "h-10 px-3 text-sm" : "px-3 py-2 text-[11px]",
      )}
    >
      <span>{value}</span>
    </div>
  );
}

function KeywordGroup({
  title,
  items,
  tone,
  selected,
  onToggle,
}: {
  title: string;
  items: string[];
  tone: "warm" | "green";
  selected: string[];
  onToggle: (keyword: string) => void;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-3",
        tone === "warm"
          ? "border-amber-300 bg-amber-50/80"
          : "border-emerald-300 bg-emerald-50/80",
      )}
    >
      <div
        className={cn(
          "mb-2 text-sm font-bold",
          tone === "warm" ? "text-amber-900" : "text-emerald-900",
        )}
      >
        {title}
      </div>

      <div className="grid grid-cols-6 gap-2">
        {items.map((item) => {
          const active = selected.includes(item);

          return (
            <button
              key={item}
              type="button"
              onClick={() => onToggle(item)}
              className={cn(
                "h-10 w-full rounded-md border text-sm font-semibold shadow-sm transition",
                active
                  ? tone === "warm"
                    ? "border-amber-700 bg-amber-700 text-white"
                    : "border-emerald-700 bg-emerald-700 text-white"
                  : tone === "warm"
                    ? "border-amber-200 bg-white text-amber-900 hover:bg-amber-100"
                    : "border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-100",
              )}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  required = false,
  disabled = false,
  onChange,
}: {
  label: string;
  value: string;
  options: OptionItem[];
  required?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <div className="mb-1.5 text-[12px] font-semibold text-slate-700">
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </div>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition",
          "focus:border-blue-400 focus:ring-2 focus:ring-blue-100",
          disabled && "cursor-not-allowed bg-slate-50 text-slate-400",
        )}
      >
        <option value="">전체</option>
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SummaryTable({ fields }: { fields: DetailItem["summaryFields"] }) {
  const fieldMap = new Map(fields.map((field) => [field.label, field] as const));

  const orderedFields: SummaryField[] = [
    fieldMap.get("전형방법"),
    fieldMap.get("학생부반영"),
    fieldMap.get("최저학력기준"),
    fieldMap.get("원서접수"),
    fieldMap.get("1차합격"),
    fieldMap.get("논술/면접") ?? fieldMap.get("실기/면접"),
    fieldMap.get("최종합격"),
  ].filter((field): field is SummaryField => Boolean(field));

  const specialField = fieldMap.get("전형특기사항") ?? fieldMap.get("특기사항");
  const colCount = Math.max(orderedFields.length, 1);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div
        className="grid border-b border-slate-200 bg-slate-50 text-[12px] font-bold text-slate-700"
        style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
      >
        {orderedFields.map((field, index) => (
          <div
            key={`head-${field.label}-${index}`}
            className={cn(
              "px-3 py-2",
              index < orderedFields.length - 1 && "border-r border-slate-200",
            )}
          >
            {field.label}
          </div>
        ))}
      </div>

      <div
        className="grid bg-white text-[12px] text-slate-800"
        style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
      >
        {orderedFields.map((field, index) => (
          <div
            key={`body-${field.label}-${index}`}
            className={cn(
              "min-h-[42px] px-3 py-1.5 leading-5",
              index < orderedFields.length - 1 && "border-r border-slate-200",
            )}
          >
            {field.value}
          </div>
        ))}
      </div>

      {specialField ? (
        <div className="border-t border-slate-200 bg-white px-3 py-2.5">
          <div className="flex items-start gap-3">
            <div className="w-[96px] shrink-0 text-[12px] font-bold text-slate-700">
              전형특기사항
            </div>
            <div className="min-w-0 flex-1 break-words text-[12px] leading-5 text-slate-800">
              {specialField.value}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function YearDataTable({ rows }: { rows: YearRow[] }) {
  const headers = [
    "학년도",
    "모집인원(명)",
    "지원인원(명)",
    "경쟁률",
    "충원",
    "최저충족률",
    "최저충족인원",
    "실질경쟁률",
    "성적50%(등급)",
    "성적70%(등급)",
    "환산50%",
    "환산70%",
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="grid grid-cols-12 bg-slate-50 text-[11px] font-bold text-slate-700">
        {headers.map((header, index) => (
          <div
            key={header}
            className={cn(
              "px-2 py-2 text-center",
              index < headers.length - 1 && "border-r border-slate-200",
            )}
          >
            {header}
          </div>
        ))}
      </div>

      {rows.map((row) => (
        <div
          key={row.year}
          className="grid grid-cols-12 border-t border-slate-200 bg-white text-[11px] text-slate-800"
        >
          {[
            row.year,
            row.recruitmentCount,
            row.applicantCount,
            row.competitionRate,
            row.additionalPassCount,
            row.minSatisfiedRate,
            row.minSatisfiedCount,
            row.actualCompetitionRate,
            row.score50,
            row.score70,
            row.converted50,
            row.converted70,
          ].map((cell, index) => (
            <div
              key={`${row.year}-${index}`}
              className={cn(
                "px-2 py-2 text-center",
                index < 11 && "border-r border-slate-200",
              )}
            >
              {cell}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function MiniLineChart({
  title,
  labels,
  series,
  colors = ["#2563eb", "#dc2626"],
}: {
  title: string;
  labels: string[];
  series: ChartSeries[];
  colors?: string[];
}) {
  const width = 234;
  const height = 92;
  const paddingX = 18;
  const paddingY = 16;

  const isBarSeries = (name: string) => name.includes("모집인원");
  const lineSeries = series.filter((item) => !isBarSeries(item.name));
  const barSeries = series.filter((item) => isBarSeries(item.name));

  const lineValues = lineSeries.flatMap((s) =>
    s.data.filter((v): v is number => typeof v === "number" && Number.isFinite(v)),
  );
  const barValues = barSeries.flatMap((s) =>
    s.data.filter((v): v is number => typeof v === "number" && Number.isFinite(v)),
  );

  const lineMax = Math.max(...lineValues, 1);
  const lineMin = Math.min(...lineValues, 0);
  const lineRange = Math.max(lineMax - lineMin, 1);
  const barMax = Math.max(...barValues, 1);

  function pointX(index: number) {
    if (labels.length <= 1) return width / 2;
    return paddingX + (index * (width - paddingX * 2)) / (labels.length - 1);
  }

  function linePointY(value: number) {
    return height - paddingY - ((value - lineMin) / lineRange) * (height - paddingY * 2);
  }

  function barTopY(value: number) {
    return height - paddingY - (value / barMax) * (height - paddingY * 2);
  }

  function getSeriesColor(name: string) {
    const index = series.findIndex((item) => item.name === name);
    return colors[index % colors.length] ?? colors[0];
  }

  function buildLineSegments(data: (number | null)[]) {
    const segments: string[] = [];
    let current: string[] = [];

    data.forEach((value, index) => {
      if (typeof value === "number" && Number.isFinite(value)) {
        current.push(`${pointX(index)},${linePointY(value)}`);
      } else {
        if (current.length >= 2) segments.push(current.join(" "));
        current = [];
      }
    });

    if (current.length >= 2) segments.push(current.join(" "));
    return segments;
  }

  const step = labels.length > 1 ? (width - paddingX * 2) / (labels.length - 1) : 40;
  const barWidth = Math.min(24, Math.max(14, step * 0.32));

  return (
    <div className="ml-auto w-full rounded-lg border border-slate-200 bg-white p-2.5 xl:max-w-[286px]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-[11px] font-bold text-slate-800">{title}</div>
        <div className="flex flex-wrap items-center gap-2">
          {series.map((entry) => (
            <div key={entry.name} className="flex items-center gap-1 text-[10px] text-slate-600">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: getSeriesColor(entry.name) }}
              />
              <span>{entry.name}</span>
            </div>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-[92px] w-full">
        {[0, 1, 2, 3].map((tick) => {
          const y = paddingY + (tick * (height - paddingY * 2)) / 3;
          return (
            <line
              key={tick}
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          );
        })}

        {barSeries.map((entry) => {
          const color = getSeriesColor(entry.name);

          return (
            <g key={entry.name}>
              {entry.data.map((value, index) => {
                if (typeof value !== "number" || !Number.isFinite(value)) return null;

                const x = pointX(index) - barWidth / 2;
                const y = barTopY(value);
                const barHeight = height - paddingY - y;
                const safeBarHeight = Math.max(barHeight, 2);

                return (
                  <g key={`${entry.name}-${index}`}>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={safeBarHeight}
                      rx="3"
                      fill={color}
                      opacity="0.9"
                    />
                    <text
                      x={x + barWidth / 2}
                      y={y + safeBarHeight / 2 + 3}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#ffffff"
                      fontWeight="700"
                    >
                      {value}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}

        {lineSeries.map((entry) => {
          const color = getSeriesColor(entry.name);
          const segments = buildLineSegments(entry.data);

          return (
            <g key={entry.name}>
              {segments.map((points, idx) => (
                <polyline
                  key={`${entry.name}-seg-${idx}`}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  points={points}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ))}

              {entry.data.map((value, index) => {
                if (typeof value !== "number" || !Number.isFinite(value)) return null;

                return (
                  <g key={`${entry.name}-${index}`}>
                    <circle cx={pointX(index)} cy={linePointY(value)} r="3" fill={color} />
                    <text
                      x={pointX(index)}
                      y={linePointY(value) - 7}
                      textAnchor="middle"
                      fontSize="9"
                      fill={color}
                      fontWeight="700"
                    >
                      {value}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}

        {labels.map((label, index) => (
          <text
            key={`${label}-${index}`}
            x={pointX(index)}
            y={height - 2}
            textAnchor="middle"
            fontSize="9"
            fill="#475569"
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}

function DetailExpandedPanel({ detail }: { detail: DetailItem }) {
  return (
    <div className="rounded-lg border-[3px] border-blue-900 bg-blue-50 p-3 shadow-[0_0_0_3px_rgba(30,58,138,0.22)]">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_310px]">
        <div className="space-y-3">
          <SummaryTable fields={detail.summaryFields} />
          <YearDataTable rows={detail.yearTable.rows} />
        </div>

        <div className="space-y-3">
          <MiniLineChart
            title={detail.charts.competitionRate.title}
            labels={detail.charts.competitionRate.labels}
            series={detail.charts.competitionRate.series}
            colors={["#2563eb", "#dc2626"]}
          />
          <MiniLineChart
            title={detail.charts.scoreTrend.title}
            labels={detail.charts.scoreTrend.labels}
            series={detail.charts.scoreTrend.series}
            colors={["#2563eb", "#dc2626"]}
          />
        </div>
      </div>
    </div>
  );
}

function MobileResultCard({
  item,
  detail,
  isExpanded,
  isLoading,
  isSaving,
  onToggle,
  unlocked,
  scoreDisplay,
  possibilityDisplay,
  saved,
  onToggleSave,
}: {
  item: SearchItem;
  detail?: DetailItem;
  isExpanded: boolean;
  isLoading: boolean;
  isSaving: boolean;
  onToggle: () => void;
  unlocked: boolean;
  scoreDisplay: string;
  possibilityDisplay: string;
  saved: boolean;
  onToggleSave: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-slate-500">{item.identity.region}</div>
          <div className="mt-1 break-words text-base font-bold text-slate-900">
            {item.identity.universityName}
          </div>
          <div className="mt-1 text-sm text-slate-600">
            {item.identity.admissionType} · {item.identity.admissionName}
          </div>
          <div className="mt-1 break-words text-sm font-medium text-slate-800">
            {item.identity.recruitmentUnit}
          </div>
        </div>

        <div className="shrink-0 rounded-lg bg-blue-50 px-3 py-2 text-center">
          <div className="text-[10px] font-semibold text-blue-700">27인원</div>
          <div className="mt-1 text-sm font-bold text-blue-900">
            {item.recruitmentCount2027.display}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
        <div className="rounded-md bg-slate-50 px-3 py-2 text-slate-700">
          <div className="text-slate-400">계열</div>
          <div className="mt-0.5 font-medium">{item.identity.track || "-"}</div>
        </div>
        <div className="rounded-md bg-slate-50 px-3 py-2 text-slate-700">
          <div className="text-slate-400">단과대학</div>
          <div className="mt-0.5 font-medium">{item.identity.collegeName || "-"}</div>
        </div>
        <div className="rounded-md border border-blue-100 bg-blue-50/70 px-3 py-2 text-slate-700">
          <div className="text-slate-500">내성적</div>
          <div className="mt-2">
            <PremiumValueDisplay value={scoreDisplay} type="score" mobile />
          </div>
        </div>
        <div className="rounded-md border border-pink-100 bg-pink-50/70 px-3 py-2 text-slate-700">
          <div className="text-slate-500">지원가능성</div>
          <div className="mt-2">
            <PremiumValueDisplay value={possibilityDisplay} type="possibility" mobile />
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <SaveActionButton
          label={isSaving ? "처리중..." : saved ? "저장됨" : "저장"}
          mobile
          unlocked={unlocked}
          saved={saved}
          disabled={isSaving}
          onClick={onToggleSave}
        />

        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "inline-flex h-10 items-center justify-center gap-2 rounded-md border text-sm font-bold shadow-sm transition",
            isExpanded
              ? "border-blue-700 bg-blue-100 text-blue-900"
              : "border-slate-500 bg-slate-100 text-slate-900 hover:border-slate-700 hover:bg-slate-200",
          )}
        >
          <span>{isLoading ? "불러오는 중..." : isExpanded ? "닫기" : "상세보기"}</span>
          <IconChevron open={isExpanded} />
        </button>
      </div>

      {isExpanded && detail ? (
        <div className="mt-3">
          <DetailExpandedPanel detail={detail} />
        </div>
      ) : null}
    </div>
  );
}

function DesktopHeader() {
  const headers = [
    "지역",
    "대학명",
    "전형유형",
    "전형명",
    "계열",
    "단과대학",
    "모집단위",
    "27인원",
    "26환산70%",
    "내성적",
    "지원가능성",
    "저장",
    "상세보기",
  ];

  return (
    <div className="grid grid-cols-[0.9fr_1.1fr_0.95fr_1fr_0.7fr_1fr_1.15fr_0.75fr_0.85fr_0.95fr_0.95fr_0.8fr_0.9fr] border-b border-slate-200 bg-slate-50 text-[12px] font-bold text-slate-700">
      {headers.map((header, index) => (
        <div
          key={header}
          className={cn(
            "px-3 py-2.5 text-center",
            index < headers.length - 1 && "border-r border-slate-200",
          )}
        >
          {header}
        </div>
      ))}
    </div>
  );
}

function DesktopRow({
  item,
  detail,
  isExpanded,
  isLoading,
  isSaving,
  onToggle,
  unlocked,
  scoreDisplay,
  possibilityDisplay,
  saved,
  onToggleSave,
}: {
  item: SearchItem;
  detail?: DetailItem;
  isExpanded: boolean;
  isLoading: boolean;
  isSaving: boolean;
  onToggle: () => void;
  unlocked: boolean;
  scoreDisplay: string;
  possibilityDisplay: string;
  saved: boolean;
  onToggleSave: () => void;
}) {
  return (
    <>
      <div
        className={cn(
          "grid grid-cols-[0.9fr_1.1fr_0.95fr_1fr_0.7fr_1fr_1.15fr_0.75fr_0.85fr_0.95fr_0.95fr_0.8fr_0.9fr] items-center bg-white text-[12px] text-slate-800",
          isExpanded && "bg-blue-50/30",
        )}
      >
        <div className="flex items-center justify-center gap-2 border-r border-slate-200 px-3 py-3">
          {isExpanded ? (
            <IconCheckCircle />
          ) : (
            <span className="h-4 w-4 rounded-full border border-slate-300" />
          )}
          <span>{item.identity.region || "-"}</span>
        </div>

        <div className="border-r border-slate-200 px-3 py-3 text-center font-semibold text-slate-900">
          {item.identity.universityName || "-"}
        </div>
        <div className="border-r border-slate-200 px-3 py-3 text-center">
          {item.identity.admissionType || "-"}
        </div>
        <div className="border-r border-slate-200 px-3 py-3 text-center">
          {item.identity.admissionName || "-"}
        </div>
        <div className="border-r border-slate-200 px-3 py-3 text-center">
          {item.identity.track || "-"}
        </div>
        <div className="border-r border-slate-200 px-3 py-3 text-center">
          {item.identity.collegeName || "-"}
        </div>
        <div className="border-r border-slate-200 px-3 py-3 text-center font-medium">
          {item.identity.recruitmentUnit || "-"}
        </div>
        <div className="border-r border-slate-200 px-3 py-3 text-center font-semibold text-blue-800">
          {item.recruitmentCount2027.display}
        </div>
        <div className="border-r border-slate-200 px-3 py-3 text-center font-semibold text-slate-900">
          {item.converted70_2026.display}
        </div>

        <div className="border-r border-slate-200 px-3 py-3 text-center">
          <PremiumValueDisplay value={scoreDisplay} type="score" />
        </div>
        <div className="border-r border-slate-200 px-3 py-3 text-center">
          <PremiumValueDisplay value={possibilityDisplay} type="possibility" />
        </div>
        <div className="border-r border-slate-200 px-3 py-3 text-center">
          <SaveActionButton
            label={isSaving ? "처리중..." : saved ? "저장됨" : "저장"}
            unlocked={unlocked}
            saved={saved}
            disabled={isSaving}
            onClick={onToggleSave}
          />
        </div>

        <div className="px-3 py-3 text-center">
          <button
            type="button"
            onClick={onToggle}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-[12px] font-bold shadow-sm transition",
              isExpanded
                ? "border-blue-700 bg-blue-100 text-blue-900"
                : "border-slate-500 bg-slate-100 text-slate-900 hover:border-slate-700 hover:bg-slate-200",
            )}
          >
            <span>{isLoading ? "로딩" : isExpanded ? "접기" : "상세보기"}</span>
            <IconChevron open={isExpanded} />
          </button>
        </div>
      </div>

      {isExpanded && detail ? (
        <div className="border-t border-slate-200 bg-[#f8fbff] px-3 py-3">
          <DetailExpandedPanel detail={detail} />
        </div>
      ) : null}
    </>
  );
}

export default function AdmissionsPageClient({
  premiumUnlocked = false,
}: AdmissionsPageClientProps) {
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [optionGroups, setOptionGroups] = useState<
    Partial<Record<OptionGroupKey, OptionGroup>>
  >({});
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);
  const [detailMap, setDetailMap] = useState<Record<string, DetailItem>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});

  const hasCoreFilters = useMemo(() => {
    return Boolean(
      filters.region &&
        filters.universityName &&
        filters.admissionType &&
        filters.admissionName,
    );
  }, [filters.region, filters.universityName, filters.admissionType, filters.admissionName]);

  const canSearch = useMemo(() => {
    return hasCoreFilters || hasKeywordFilters(filters);
  }, [hasCoreFilters, filters]);

  const regionOptions = optionGroups.region?.options ?? [];
  const universityOptions = optionGroups.universityName?.options ?? [];
  const admissionTypeOptions = optionGroups.admissionType?.options ?? [];
  const admissionNameOptions = optionGroups.admissionName?.options ?? [];
  const collegeOptions = optionGroups.collegeName?.options ?? [];

  async function fetchOptions(nextFilters: Filters) {
    try {
      setLoadingOptions(true);

      const params = new URLSearchParams();
      appendIfValue(params, "region", nextFilters.region);
      appendIfValue(params, "universityName", nextFilters.universityName);
      appendIfValue(params, "admissionType", nextFilters.admissionType);
      appendIfValue(params, "admissionName", nextFilters.admissionName);
      appendIfValue(params, "collegeName", nextFilters.collegeName);
      appendIfValue(params, "track", nextFilters.track);

      const res = await fetch(`/api/student/admissions/options?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await parseJsonResponse<OptionsResponse>(res);

      if (!res.ok || !data.success) {
        throw new Error(data.message ?? "필터 옵션을 불러오지 못했습니다.");
      }

      setOptionGroups(data.optionGroups ?? {});
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingOptions(false);
    }
  }

  async function fetchSearch(nextPage: number, nextFilters: Filters) {
    try {
      setLoadingSearch(true);
      setErrorMessage("");

      const params = new URLSearchParams();
      appendIfValue(params, "region", nextFilters.region);
      appendIfValue(params, "universityName", nextFilters.universityName);
      appendIfValue(params, "admissionType", nextFilters.admissionType);
      appendIfValue(params, "admissionName", nextFilters.admissionName);
      appendIfValue(params, "collegeName", nextFilters.collegeName);
      appendIfValue(params, "track", nextFilters.track);

      const selectedKeyword = collectSelectedKeywords(nextFilters)[0];
      if (selectedKeyword) {
        params.set("keyword", selectedKeyword);
      }

      params.set("page", String(nextPage));
      params.set("pageSize", "20");

      const res = await fetch(`/api/student/admissions/search?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await parseJsonResponse<SearchResponse>(res);

      if (!res.ok || !data.success) {
        throw new Error(data.message ?? "검색 결과를 불러오지 못했습니다.");
      }

      const normalizedItems = parseUnknownArray(data.items)
        .map(normalizeSearchItem)
        .filter((item): item is SearchItem => item !== null);

      setSearchItems(normalizedItems);
      setTotalCount(data.meta?.totalCount ?? normalizedItems.length);
      setTotalPages(Math.max(data.meta?.totalPages ?? 1, 1));
      setExpandedId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "검색 중 오류가 발생했습니다.";
      setErrorMessage(message);
      setSearchItems([]);
      setTotalCount(0);
      setTotalPages(1);
      console.error(error);
    } finally {
      setLoadingSearch(false);
    }
  }

  async function fetchDetail(id: string) {
    try {
      setLoadingDetailId(id);

      const res = await fetch(`/api/student/admissions/search/${id}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await parseJsonResponse<DetailResponse>(res);

      if (!res.ok || !data.success || !data.item) {
        throw new Error(data.message ?? "상세 데이터를 불러오지 못했습니다.");
      }

      const normalized = normalizeDetailItem(data.item);
      if (!normalized) {
        throw new Error("상세 데이터 형식이 올바르지 않습니다.");
      }

      setDetailMap((prev) => ({
        ...prev,
        [id]: normalized,
      }));

      setSavedMap((prev) => ({
        ...prev,
        [id]: isSavedDetail(normalized),
      }));

      return normalized;
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : "상세 데이터를 불러오는 중 오류가 발생했습니다.",
      );
      return null;
    } finally {
      setLoadingDetailId(null);
    }
  }

  async function ensureDetail(id: string) {
    if (detailMap[id]) return detailMap[id];
    return await fetchDetail(id);
  }

  async function refreshDetailItem(id: string) {
    return await fetchDetail(id);
  }

  function getEffectivePremiumUnlocked(itemId: string) {
    const detail = detailMap[itemId];
    if (detail) return !detail.premium.locked;
    return premiumUnlocked;
  }

  function getEffectiveSaved(itemId: string) {
    const detail = detailMap[itemId];
    if (detail) return isSavedDetail(detail);
    return Boolean(savedMap[itemId]);
  }

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "region"
        ? {
            universityName: "",
            admissionType: "",
            admissionName: "",
            collegeName: "",
            track: "",
          }
        : {}),
      ...(key === "universityName"
        ? {
            admissionType: "",
            admissionName: "",
            collegeName: "",
            track: "",
          }
        : {}),
      ...(key === "admissionType"
        ? {
            admissionName: "",
            collegeName: "",
            track: "",
          }
        : {}),
      ...(key === "admissionName"
        ? {
            collegeName: "",
            track: "",
          }
        : {}),
    }));
  }

  function toggleKeyword(key: "humanityKeywords" | "scienceKeywords", keyword: string) {
    setPage(1);
    setErrorMessage("");

    const alreadySelected = filters[key].includes(keyword);

    const nextFilters: Filters = {
      ...filters,
      humanityKeywords: [],
      scienceKeywords: [],
      [key]: alreadySelected ? [] : [keyword],
    };

    const nextCanSearch =
      Boolean(
        nextFilters.region &&
          nextFilters.universityName &&
          nextFilters.admissionType &&
          nextFilters.admissionName,
      ) || hasKeywordFilters(nextFilters);

    setFilters(nextFilters);

    if (!nextCanSearch) {
      setHasSearched(false);
      setSearchItems([]);
      setDetailMap({});
      setExpandedId(null);
      setTotalCount(0);
      setTotalPages(1);
      return;
    }

    setHasSearched(true);
  }

  function handleReset() {
    setFilters(INITIAL_FILTERS);
    setSearchItems([]);
    setDetailMap({});
    setExpandedId(null);
    setPage(1);
    setTotalCount(0);
    setTotalPages(1);
    setHasSearched(false);
    setErrorMessage("");
    setSavedMap({});
  }

  async function handleSearch() {
    if (!canSearch) {
      setErrorMessage("지역/대학/전형을 선택하거나 키워드를 1개 이상 선택해 주세요.");
      return;
    }

    setPage(1);
    setHasSearched(true);
    await fetchSearch(1, filters);
  }

  async function handleToggleRow(item: SearchItem) {
    const isExpanded = expandedId === item.id;
    if (isExpanded) {
      setExpandedId(null);
      return;
    }

    setExpandedId(item.id);

    if (!detailMap[item.id]) {
      await fetchDetail(item.id);
    }
  }

  async function handleToggleSave(item: SearchItem) {
    const detail = await ensureDetail(item.id);
    if (!detail) return;

    setExpandedId(item.id);

    if (detail.premium.locked) {
      return;
    }

    const alreadySaved = isSavedDetail(detail);

    try {
      setSavingItemId(item.id);
      setErrorMessage("");

      const res = await fetch("/api/student/admissions/save", {
        method: alreadySaved ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          admissionResultId: item.id,
        }),
      });

      const data = await parseJsonResponse<SaveResponse>(res);

      if (!res.ok || !data.success) {
        throw new Error(
          data.message ?? (alreadySaved ? "저장 해제에 실패했습니다." : "저장에 실패했습니다."),
        );
      }

      const refreshed = await refreshDetailItem(item.id);

      if (refreshed) {
        setSavedMap((prev) => ({
          ...prev,
          [item.id]: isSavedDetail(refreshed),
        }));
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "저장 처리 중 오류가 발생했습니다.";
      setErrorMessage(message);
      console.error(error);
    } finally {
      setSavingItemId(null);
    }
  }

  useEffect(() => {
    void fetchOptions(filters);
  }, [
    filters.region,
    filters.universityName,
    filters.admissionType,
    filters.admissionName,
    filters.collegeName,
    filters.track,
  ]);

  useEffect(() => {
    if (!hasSearched) return;
    if (!canSearch) return;
    void fetchSearch(page, filters);
  }, [
    page,
    hasSearched,
    canSearch,
    filters.region,
    filters.universityName,
    filters.admissionType,
    filters.admissionName,
    filters.collegeName,
    filters.track,
    filters.humanityKeywords,
    filters.scienceKeywords,
  ]);

  return (
    <main className="min-h-screen bg-[#f7f9fc] pb-12 text-slate-900">
      <div className="mx-auto w-full max-w-[1280px] px-3 py-4 lg:px-4">
        <div className="space-y-4">
          <section>
            <h1 className="text-[40px] font-black tracking-[-0.04em] text-[#153e8a]">
              수시입결검색
            </h1>
            <p className="mt-1 text-[14px] text-slate-600">
              대학 및 전형유형을 선택하여 수시 입학 결과(입결)를 확인할 수 있습니다.
            </p>
          </section>

          <section className="grid gap-3 lg:grid-cols-2">
            <KeywordGroup
              title="인문계열 키워드"
              items={HUMANITY_KEYWORDS}
              tone="warm"
              selected={filters.humanityKeywords}
              onToggle={(keyword) => toggleKeyword("humanityKeywords", keyword)}
            />
            <KeywordGroup
              title="자연계열 키워드"
              items={SCIENCE_KEYWORDS}
              tone="green"
              selected={filters.scienceKeywords}
              onToggle={(keyword) => toggleKeyword("scienceKeywords", keyword)}
            />
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_110px_110px] xl:items-end">
              <FilterSelect
                label="지역"
                required
                value={filters.region}
                options={regionOptions}
                onChange={(value) => updateFilter("region", value)}
              />
              <FilterSelect
                label="대학명"
                required
                value={filters.universityName}
                options={universityOptions}
                onChange={(value) => updateFilter("universityName", value)}
              />
              <FilterSelect
                label="전형유형"
                required
                value={filters.admissionType}
                options={admissionTypeOptions}
                onChange={(value) => updateFilter("admissionType", value)}
              />
              <FilterSelect
                label="전형명"
                required
                value={filters.admissionName}
                options={admissionNameOptions}
                onChange={(value) => updateFilter("admissionName", value)}
              />
              <FilterSelect
                label="단과대학"
                value={filters.collegeName}
                options={collegeOptions}
                disabled={!filters.admissionName}
                onChange={(value) => updateFilter("collegeName", value)}
              />

              <button
                type="button"
                onClick={() => void handleSearch()}
                disabled={!canSearch || loadingSearch || loadingOptions}
                className={cn(
                  "flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-bold shadow-sm transition",
                  !canSearch || loadingSearch || loadingOptions
                    ? "cursor-not-allowed bg-slate-200 text-slate-500"
                    : "bg-[#1652d8] text-white hover:bg-[#1448bc]",
                )}
              >
                <IconSearch />
                {loadingSearch ? "검색중" : "검색"}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <IconReset />
                초기화
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div className="text-[15px] font-semibold text-slate-700">
                검색결과{" "}
                <span className="font-black text-[#1652d8]">{formatCount(totalCount)}건</span>
              </div>
              <div className="text-[12px] text-slate-500">
                ※ ‘상세보기’를 클릭하면 전형별 상세 정보를 확인할 수 있습니다.
              </div>
            </div>

            {errorMessage ? (
              <div className="mx-4 mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {errorMessage}
              </div>
            ) : null}

            {!hasSearched ? (
              <div className="px-4 py-12 text-center text-sm text-slate-500">
                검색 조건을 선택하거나 키워드를 눌러주세요.
              </div>
            ) : searchItems.length === 0 && !loadingSearch ? (
              <div className="px-4 py-12 text-center text-sm text-slate-500">
                검색 결과가 없습니다.
              </div>
            ) : (
              <>
                <div className="space-y-3 p-3 lg:hidden">
                  {searchItems.map((item) => {
                    const detail = detailMap[item.id];
                    const isExpanded = expandedId === item.id;
                    const isLoading = loadingDetailId === item.id;
                    const isSaving = savingItemId === item.id;
                    const unlocked = getEffectivePremiumUnlocked(item.id);
                    const saved = getEffectiveSaved(item.id);
                    const scoreDisplay = getScoreDisplay(detail, unlocked);
                    const possibilityDisplay = getPossibilityDisplay(detail, unlocked);

                    return (
                      <MobileResultCard
                        key={item.id}
                        item={item}
                        detail={detail}
                        isExpanded={isExpanded}
                        isLoading={isLoading}
                        isSaving={isSaving}
                        onToggle={() => void handleToggleRow(item)}
                        unlocked={unlocked}
                        scoreDisplay={scoreDisplay}
                        possibilityDisplay={possibilityDisplay}
                        saved={saved}
                        onToggleSave={() => void handleToggleSave(item)}
                      />
                    );
                  })}
                </div>

                <div className="hidden lg:block">
                  <DesktopHeader />
                  <div className="divide-y divide-slate-200">
                    {searchItems.map((item) => {
                      const detail = detailMap[item.id];
                      const isExpanded = expandedId === item.id;
                      const isLoading = loadingDetailId === item.id;
                      const isSaving = savingItemId === item.id;
                      const unlocked = getEffectivePremiumUnlocked(item.id);
                      const saved = getEffectiveSaved(item.id);
                      const scoreDisplay = getScoreDisplay(detail, unlocked);
                      const possibilityDisplay = getPossibilityDisplay(detail, unlocked);

                      return (
                        <DesktopRow
                          key={item.id}
                          item={item}
                          detail={detail}
                          isExpanded={isExpanded}
                          isLoading={isLoading}
                          isSaving={isSaving}
                          onToggle={() => void handleToggleRow(item)}
                          unlocked={unlocked}
                          scoreDisplay={scoreDisplay}
                          possibilityDisplay={possibilityDisplay}
                          saved={saved}
                          onToggleSave={() => void handleToggleSave(item)}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-slate-500">
                    총 <span className="font-bold text-slate-900">{formatCount(totalCount)}</span>건 / 페이지{" "}
                    <span className="font-bold text-slate-900">{page}</span> / {totalPages}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1 || loadingSearch}
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                      className={cn(
                        "rounded-md border px-4 py-2 text-sm font-semibold transition",
                        page <= 1 || loadingSearch
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      이전
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages || loadingSearch}
                      onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                      className={cn(
                        "rounded-md border px-4 py-2 text-sm font-semibold transition",
                        page >= totalPages || loadingSearch
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      다음
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
