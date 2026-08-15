"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import Link from "next/link";

type MockExamForm = {
  id: number;
  recordId?: string;
  isSaved: boolean;
  isExpanded: boolean;
  examYear: string;
  examMonth: string;
  gradeLevel: string;

  koreanSubject: string;
  koreanStandardScore: string;
  koreanPercentile: string;
  koreanGrade: string;

  mathSubject: string;
  mathStandardScore: string;
  mathPercentile: string;
  mathGrade: string;

  englishGrade: string;
  koreanHistoryGrade: string;

  inquiry1Subject: string;
  inquiry1StandardScore: string;
  inquiry1Percentile: string;
  inquiry1Grade: string;

  inquiry2Subject: string;
  inquiry2StandardScore: string;
  inquiry2Percentile: string;
  inquiry2Grade: string;

  secondLanguageSubject: string;
  secondLanguageGrade: string;
};

type TrendPoint = {
  label: string;
  grade: number | null;
  percentile: number | null;
};

type InquiryTrendPoint = {
  label: string;
  averagePercentile: number | null;
  topPercentile: number | null;
};

type PageMessage =
  | {
      type: "success" | "error";
      text: string;
    }
  | null;

type SavedMockExamRecord = {
  id: string;
  submissionId: string;
  examYear: number;
  examMonth: number;
  gradeLevel: string;
  koreanSubject: string | null;
  koreanStandardScore: number | null;
  koreanPercentile: number | null;
  koreanGrade: number | null;
  mathSubject: string | null;
  mathStandardScore: number | null;
  mathPercentile: number | null;
  mathGrade: number | null;
  englishGrade: number | null;
  koreanHistoryGrade: number | null;
  inquiry1Subject: string | null;
  inquiry1StandardScore: number | null;
  inquiry1Percentile: number | null;
  inquiry1Grade: number | null;
  inquiry2Subject: string | null;
  inquiry2StandardScore: number | null;
  inquiry2Percentile: number | null;
  inquiry2Grade: number | null;
  secondLanguageSubject: string | null;
  secondLanguageGrade: number | null;
};

const EXAM_MONTHS = ["3", "5", "6", "7", "9", "10", "11"];
const GRADE_LEVELS = ["1", "2", "3", "N"];

const KOREAN_SUBJECTS = ["화법과 작문", "언어와 매체"];
const MATH_SUBJECTS = ["확률과 통계", "미적분", "기하"];

const INQUIRY_SUBJECTS = [
  "생활과 윤리",
  "윤리와 사상",
  "한국지리",
  "세계지리",
  "동아시아사",
  "세계사",
  "정치와 법",
  "경제",
  "사회·문화",
  "물리학Ⅰ",
  "화학Ⅰ",
  "생명과학Ⅰ",
  "지구과학Ⅰ",
  "물리학Ⅱ",
  "화학Ⅱ",
  "생명과학Ⅱ",
  "지구과학Ⅱ",
];

const SECOND_LANGUAGE_SUBJECTS = [
  "독일어Ⅰ",
  "프랑스어Ⅰ",
  "스페인어Ⅰ",
  "중국어Ⅰ",
  "일본어Ⅰ",
  "러시아어Ⅰ",
  "아랍어Ⅰ",
  "베트남어Ⅰ",
  "한문Ⅰ",
];

function createEmptyExam(id: number): MockExamForm {
  return {
    id,
    recordId: undefined,
    isSaved: false,
    isExpanded: true,
    examYear: "2026",
    examMonth: "",
    gradeLevel: "",

    koreanSubject: "",
    koreanStandardScore: "",
    koreanPercentile: "",
    koreanGrade: "",

    mathSubject: "",
    mathStandardScore: "",
    mathPercentile: "",
    mathGrade: "",

    englishGrade: "",
    koreanHistoryGrade: "",

    inquiry1Subject: "",
    inquiry1StandardScore: "",
    inquiry1Percentile: "",
    inquiry1Grade: "",

    inquiry2Subject: "",
    inquiry2StandardScore: "",
    inquiry2Percentile: "",
    inquiry2Grade: "",

    secondLanguageSubject: "",
    secondLanguageGrade: "",
  };
}

function isFilledExam(exam: MockExamForm) {
  return (
    exam.examYear ||
    exam.examMonth ||
    exam.gradeLevel ||
    exam.koreanSubject ||
    exam.koreanStandardScore ||
    exam.koreanPercentile ||
    exam.koreanGrade ||
    exam.mathSubject ||
    exam.mathStandardScore ||
    exam.mathPercentile ||
    exam.mathGrade ||
    exam.englishGrade ||
    exam.koreanHistoryGrade ||
    exam.inquiry1Subject ||
    exam.inquiry1StandardScore ||
    exam.inquiry1Percentile ||
    exam.inquiry1Grade ||
    exam.inquiry2Subject ||
    exam.inquiry2StandardScore ||
    exam.inquiry2Percentile ||
    exam.inquiry2Grade ||
    exam.secondLanguageSubject ||
    exam.secondLanguageGrade
  );
}

function toNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

function average(values: Array<number | null>) {
  const valid = values.filter((value): value is number => value !== null);
  if (valid.length === 0) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function formatGrade(value: number | null) {
  if (value === null) return "-";
  return value.toFixed(1).replace(/\.0$/, "");
}

function formatPercentile(value: number | null) {
  if (value === null) return "-";
  return String(Math.round(value));
}

function compareExam(a: MockExamForm, b: MockExamForm) {
  const yearDiff = Number(a.examYear || 0) - Number(b.examYear || 0);
  if (yearDiff !== 0) return yearDiff;

  const monthDiff = Number(a.examMonth || 0) - Number(b.examMonth || 0);
  if (monthDiff !== 0) return monthDiff;

  return a.id - b.id;
}

function fullExamLabel(exam: MockExamForm) {
  if (exam.examYear && exam.examMonth) {
    return `${exam.examYear}년 ${exam.examMonth}월`;
  }
  if (exam.examYear) {
    return `${exam.examYear}년`;
  }
  if (exam.examMonth) {
    return `${exam.examMonth}월`;
  }
  return `모의고사 ${exam.id}`;
}

function shortExamLabel(exam: MockExamForm) {
  if (exam.examYear && exam.examMonth) {
    return `${exam.examYear}.${exam.examMonth}`;
  }
  if (exam.examYear) {
    return exam.examYear;
  }
  if (exam.examMonth) {
    return `${exam.examMonth}월`;
  }
  return `${exam.id}회`;
}

function latestAverageGrade(exam: MockExamForm) {
  return average([
    toNumber(exam.koreanGrade),
    toNumber(exam.mathGrade),
    toNumber(exam.englishGrade),
    average([toNumber(exam.inquiry1Grade), toNumber(exam.inquiry2Grade)]),
  ]);
}

function latestAveragePercentile(exam: MockExamForm) {
  return average([
    toNumber(exam.koreanPercentile),
    toNumber(exam.mathPercentile),
    toNumber(exam.inquiry1Percentile),
    toNumber(exam.inquiry2Percentile),
  ]);
}

function risingSubject(latest: MockExamForm | null, prev: MockExamForm | null) {
  if (!latest) return "-";

  const candidates = [
    {
      label: "국어",
      latestGrade: toNumber(latest.koreanGrade),
      latestPct: toNumber(latest.koreanPercentile),
      prevGrade: prev ? toNumber(prev.koreanGrade) : null,
      prevPct: prev ? toNumber(prev.koreanPercentile) : null,
    },
    {
      label: "수학",
      latestGrade: toNumber(latest.mathGrade),
      latestPct: toNumber(latest.mathPercentile),
      prevGrade: prev ? toNumber(prev.mathGrade) : null,
      prevPct: prev ? toNumber(prev.mathPercentile) : null,
    },
    {
      label: "영어",
      latestGrade: toNumber(latest.englishGrade),
      latestPct: null,
      prevGrade: prev ? toNumber(prev.englishGrade) : null,
      prevPct: null,
    },
  ];

  if (!prev) {
    return (
      candidates
        .filter((item) => item.latestGrade !== null)
        .sort((a, b) => {
          if ((a.latestGrade ?? 99) !== (b.latestGrade ?? 99)) {
            return (a.latestGrade ?? 99) - (b.latestGrade ?? 99);
          }
          return (b.latestPct ?? 0) - (a.latestPct ?? 0);
        })[0]?.label ?? "-"
    );
  }

  return (
    candidates
      .map((item) => {
        let score = Number.NEGATIVE_INFINITY;
        let usable = false;

        if (item.latestGrade !== null && item.prevGrade !== null) {
          score = 0;
          score += (item.prevGrade - item.latestGrade) * 100;
          usable = true;
        }

        if (item.latestPct !== null && item.prevPct !== null) {
          score = usable ? score : 0;
          score += item.latestPct - item.prevPct;
          usable = true;
        }

        return { label: item.label, score, usable };
      })
      .filter((item) => item.usable)
      .sort((a, b) => b.score - a.score)[0]?.label ?? "-"
  );
}

function makePath(points: Array<{ x: number; y: number }>) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}

function valueToString(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function recordToExam(record: SavedMockExamRecord, localId: number): MockExamForm {
  return {
    id: localId,
    recordId: record.id,
    isSaved: true,
    isExpanded: false,
    examYear: valueToString(record.examYear),
    examMonth: valueToString(record.examMonth),
    gradeLevel: valueToString(record.gradeLevel),

    koreanSubject: valueToString(record.koreanSubject),
    koreanStandardScore: valueToString(record.koreanStandardScore),
    koreanPercentile: valueToString(record.koreanPercentile),
    koreanGrade: valueToString(record.koreanGrade),

    mathSubject: valueToString(record.mathSubject),
    mathStandardScore: valueToString(record.mathStandardScore),
    mathPercentile: valueToString(record.mathPercentile),
    mathGrade: valueToString(record.mathGrade),

    englishGrade: valueToString(record.englishGrade),
    koreanHistoryGrade: valueToString(record.koreanHistoryGrade),

    inquiry1Subject: valueToString(record.inquiry1Subject),
    inquiry1StandardScore: valueToString(record.inquiry1StandardScore),
    inquiry1Percentile: valueToString(record.inquiry1Percentile),
    inquiry1Grade: valueToString(record.inquiry1Grade),

    inquiry2Subject: valueToString(record.inquiry2Subject),
    inquiry2StandardScore: valueToString(record.inquiry2StandardScore),
    inquiry2Percentile: valueToString(record.inquiry2Percentile),
    inquiry2Grade: valueToString(record.inquiry2Grade),

    secondLanguageSubject: valueToString(record.secondLanguageSubject),
    secondLanguageGrade: valueToString(record.secondLanguageGrade),
  };
}

function getAverageGradeLabel(data: TrendPoint[]) {
  return formatGrade(average(data.map((item) => item.grade)));
}

function getAveragePercentileLabel(data: TrendPoint[]) {
  return formatPercentile(average(data.map((item) => item.percentile)));
}

function getInquiryAveragePercentileLabel(data: InquiryTrendPoint[]) {
  return formatPercentile(
    average(data.map((item) => item.averagePercentile))
  );
}

function getInquiryTopPercentileAverageLabel(data: InquiryTrendPoint[]) {
  return formatPercentile(average(data.map((item) => item.topPercentile)));
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: string;
  label: string;
  value: string;
  tone: "indigo" | "blue" | "sky" | "emerald";
}) {
  const toneClass = {
    indigo: "bg-indigo-50 text-indigo-700",
    blue: "bg-blue-50 text-blue-700",
    sky: "bg-sky-50 text-sky-700",
    emerald: "bg-emerald-50 text-emerald-700",
  }[tone];

  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-black ${toneClass}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-extrabold text-slate-950">{value}</p>
        </div>
      </div>
    </div>
  );
}

function TrendCard({
  title,
  data,
  gradeAverageLabel,
  percentileAverageLabel,
}: {
  title: string;
  data: TrendPoint[];
  gradeAverageLabel: string;
  percentileAverageLabel?: string;
}) {
  const width = 320;
  const height = 210;
  const left = 28;
  const right = 28;
  const top = 18;
  const bottom = 34;
  const chartW = width - left - right;
  const chartH = height - top - bottom;

  const gradeValues = data
    .map((item) => item.grade)
    .filter((value): value is number => value !== null);

  const percentileValues = data
    .map((item) => item.percentile)
    .filter((value): value is number => value !== null);

  const gradeMax = Math.max(
    5,
    gradeValues.length ? Math.ceil(Math.max(...gradeValues)) : 5
  );
  const gradeTicks = gradeMax <= 5 ? [1, 2, 3, 4, 5] : [1, 3, 5, 7, 9];
  const hasPercentile = percentileValues.length > 0;

  const x = (index: number) =>
    data.length <= 1 ? left + chartW / 2 : left + (chartW * index) / (data.length - 1);

  const gradeY = (value: number) =>
    top + ((value - 1) / Math.max(1, gradeMax - 1)) * chartH;

  const pctY = (value: number) => top + ((100 - value) / 100) * chartH;

  const gradePoints = data
    .map((item, index) =>
      item.grade === null
        ? null
        : { x: x(index), y: gradeY(item.grade), value: item.grade }
    )
    .filter(
      (item): item is { x: number; y: number; value: number } => item !== null
    );

  const pctPoints = data
    .map((item, index) =>
      item.percentile === null
        ? null
        : { x: x(index), y: pctY(item.percentile), value: item.percentile }
    )
    .filter(
      (item): item is { x: number; y: number; value: number } => item !== null
    );

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-slate-950">{title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-600">
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-700" />
              등급
            </span>
            {hasPercentile && (
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
                백분위
              </span>
            )}
          </div>
        </div>
        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-[11px] font-black text-slate-400">
          i
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/60 px-2 py-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[220px] w-full"
          role="img"
          aria-label={title}
        >
          {gradeTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={left}
                y1={gradeY(tick)}
                x2={width - right}
                y2={gradeY(tick)}
                stroke="#e5e7eb"
                strokeDasharray="3 4"
              />
              <text
                x={10}
                y={gradeY(tick) + 4}
                fontSize="11"
                fill="#64748b"
                fontWeight="700"
              >
                {tick}
              </text>
            </g>
          ))}

          {hasPercentile &&
            [25, 50, 75, 100].map((tick) => (
              <text
                key={tick}
                x={width - 18}
                y={pctY(tick) + 4}
                textAnchor="end"
                fontSize="11"
                fill="#94a3b8"
                fontWeight="700"
              >
                {tick}
              </text>
            ))}

          {gradePoints.length > 1 && (
            <path
              d={makePath(gradePoints)}
              fill="none"
              stroke="#1d4ed8"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {pctPoints.length > 1 && (
            <path
              d={makePath(pctPoints)}
              fill="none"
              stroke="#60a5fa"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {gradePoints.map((point, index) => (
            <g key={`grade-${index}`}>
              <circle cx={point.x} cy={point.y} r="4.5" fill="#1d4ed8" />
              <text
                x={point.x}
                y={point.y - 10}
                textAnchor="middle"
                fontSize="11"
                fill="#0f172a"
                fontWeight="700"
              >
                {formatGrade(point.value)}
              </text>
            </g>
          ))}

          {pctPoints.map((point, index) => (
            <g key={`pct-${index}`}>
              <circle cx={point.x} cy={point.y} r="4.5" fill="#60a5fa" />
              <text
                x={point.x}
                y={point.y + 18}
                textAnchor="middle"
                fontSize="11"
                fill="#475569"
                fontWeight="700"
              >
                {Math.round(point.value)}
              </text>
            </g>
          ))}

          {data.map((item, index) => (
            <text
              key={item.label}
              x={x(index)}
              y={height - 8}
              textAnchor="middle"
              fontSize="10"
              fill="#64748b"
              fontWeight="700"
            >
              {item.label}
            </text>
          ))}
        </svg>
      </div>

      <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-[12px] font-semibold text-blue-800">
        <div className="flex flex-wrap items-center gap-2">
          <span>등급 평균 {gradeAverageLabel}</span>
          {percentileAverageLabel && (
            <>
              <span className="text-blue-300">·</span>
              <span>백분위 평균 {percentileAverageLabel}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InquiryTrendCard({
  title,
  data,
  averagePercentileLabel,
  topPercentileLabel,
}: {
  title: string;
  data: InquiryTrendPoint[];
  averagePercentileLabel: string;
  topPercentileLabel: string;
}) {
  const width = 320;
  const height = 210;
  const left = 28;
  const right = 28;
  const top = 18;
  const bottom = 34;
  const chartW = width - left - right;
  const chartH = height - top - bottom;

  const percentileValues = data
    .flatMap((item) => [item.averagePercentile, item.topPercentile])
    .filter((value): value is number => value !== null);

  const hasPercentile = percentileValues.length > 0;

  const x = (index: number) =>
    data.length <= 1 ? left + chartW / 2 : left + (chartW * index) / (data.length - 1);

  const pctY = (value: number) => top + ((100 - value) / 100) * chartH;

  const averagePoints = data
    .map((item, index) =>
      item.averagePercentile === null
        ? null
        : {
            x: x(index),
            y: pctY(item.averagePercentile),
            value: item.averagePercentile,
          }
    )
    .filter(
      (item): item is { x: number; y: number; value: number } => item !== null
    );

  const topPoints = data
    .map((item, index) =>
      item.topPercentile === null
        ? null
        : {
            x: x(index),
            y: pctY(item.topPercentile),
            value: item.topPercentile,
          }
    )
    .filter(
      (item): item is { x: number; y: number; value: number } => item !== null
    );

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-extrabold leading-5 text-slate-950">
            {title}
          </h3>
          <div className="mt-2 flex items-center gap-3 whitespace-nowrap text-[11px] font-bold text-slate-600">
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              탐구 2과목
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              상위 1과목 백분위
            </span>
          </div>
        </div>
        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-[11px] font-black text-slate-400">
          i
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/60 px-2 py-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[220px] w-full"
          role="img"
          aria-label={title}
        >
          {[25, 50, 75, 100].map((tick) => (
            <g key={tick}>
              <line
                x1={left}
                y1={pctY(tick)}
                x2={width - right}
                y2={pctY(tick)}
                stroke="#e5e7eb"
                strokeDasharray="3 4"
              />
              <text
                x={10}
                y={pctY(tick) + 4}
                fontSize="11"
                fill="#64748b"
                fontWeight="700"
              >
                {tick}
              </text>
              <text
                x={width - 18}
                y={pctY(tick) + 4}
                textAnchor="end"
                fontSize="11"
                fill="#94a3b8"
                fontWeight="700"
              >
                {tick}
              </text>
            </g>
          ))}

          {averagePoints.length > 1 && (
            <path
              d={makePath(averagePoints)}
              fill="none"
              stroke="#2563eb"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {topPoints.length > 1 && (
            <path
              d={makePath(topPoints)}
              fill="none"
              stroke="#22c55e"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {averagePoints.map((point, index) => (
            <g key={`avg-${index}`}>
              <circle cx={point.x} cy={point.y} r="4.5" fill="#2563eb" />
              <text
                x={point.x}
                y={point.y - 10}
                textAnchor="middle"
                fontSize="11"
                fill="#0f172a"
                fontWeight="700"
              >
                {Math.round(point.value)}
              </text>
            </g>
          ))}

          {topPoints.map((point, index) => (
            <g key={`top-${index}`}>
              <circle cx={point.x} cy={point.y} r="4.5" fill="#22c55e" />
              <text
                x={point.x}
                y={point.y + 18}
                textAnchor="middle"
                fontSize="11"
                fill="#166534"
                fontWeight="700"
              >
                {Math.round(point.value)}
              </text>
            </g>
          ))}

          {data.map((item, index) => (
            <text
              key={item.label}
              x={x(index)}
              y={height - 8}
              textAnchor="middle"
              fontSize="10"
              fill="#64748b"
              fontWeight="700"
            >
              {item.label}
            </text>
          ))}

          {!hasPercentile && (
            <text
              x={width / 2}
              y={height / 2}
              textAnchor="middle"
              fontSize="12"
              fill="#94a3b8"
              fontWeight="700"
            >
              표시할 탐구 백분위 데이터가 없습니다
            </text>
          )}
        </svg>
      </div>

      <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[12px] font-semibold text-emerald-800">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span>백분위 평균 {averagePercentileLabel}</span>
          <span className="text-emerald-300">·</span>
          <span>상위 1과목 평균 {topPercentileLabel}</span>
        </div>
      </div>
    </div>
  );
}

export default function StudentMockExamsPage() {
  const [exams, setExams] = useState<MockExamForm[]>([createEmptyExam(1)]);
  const [nextId, setNextId] = useState(2);
  const [isLoading, setIsLoading] = useState(true);
  const [savingExamId, setSavingExamId] = useState<number | null>(null);
  const [pageMessage, setPageMessage] = useState<PageMessage>(null);

  const canAddExam = useMemo(
    () => !isLoading && exams.every((exam) => exam.isSaved),
    [exams, isLoading]
  );

  const savedExams = useMemo(
    () => [...exams].filter((exam) => exam.isSaved).sort(compareExam),
    [exams]
  );

  const latest = savedExams.length > 0 ? savedExams[savedExams.length - 1] : null;
  const previous = savedExams.length > 1 ? savedExams[savedExams.length - 2] : null;

  const koreanTrend = useMemo<TrendPoint[]>(
    () =>
      savedExams.map((exam) => ({
        label: shortExamLabel(exam),
        grade: toNumber(exam.koreanGrade),
        percentile: toNumber(exam.koreanPercentile),
      })),
    [savedExams]
  );

  const mathTrend = useMemo<TrendPoint[]>(
    () =>
      savedExams.map((exam) => ({
        label: shortExamLabel(exam),
        grade: toNumber(exam.mathGrade),
        percentile: toNumber(exam.mathPercentile),
      })),
    [savedExams]
  );

  const englishTrend = useMemo<TrendPoint[]>(
    () =>
      savedExams.map((exam) => ({
        label: shortExamLabel(exam),
        grade: toNumber(exam.englishGrade),
        percentile: null,
      })),
    [savedExams]
  );

  const inquiryTrend = useMemo<InquiryTrendPoint[]>(
    () =>
      savedExams.map((exam) => ({
        label: shortExamLabel(exam),
        averagePercentile: average([
          toNumber(exam.inquiry1Percentile),
          toNumber(exam.inquiry2Percentile),
        ]),
        topPercentile: (() => {
          const values = [
            toNumber(exam.inquiry1Percentile),
            toNumber(exam.inquiry2Percentile),
          ].filter((value): value is number => value !== null);

          return values.length ? Math.max(...values) : null;
        })(),
      })),
    [savedExams]
  );

  useEffect(() => {
    let ignore = false;

    async function loadMockExams() {
      try {
        setIsLoading(true);

        const response = await fetch("/api/student/mock-exams", {
          method: "GET",
          cache: "no-store",
        });

        const result = (await response.json()) as {
          success: boolean;
          message?: string;
          records?: SavedMockExamRecord[];
        };

        if (!response.ok || !result.success) {
          throw new Error(result.message || "모의고사 성적을 불러오지 못했습니다.");
        }

        if (ignore) return;

        const loadedRecords = Array.isArray(result.records) ? result.records : [];
        const mapped = [...loadedRecords]
          .reverse()
          .map((record, index) => recordToExam(record, index + 1));

        if (mapped.length > 0) {
          setExams(mapped);
          setNextId(mapped.length + 1);
        } else {
          setExams([createEmptyExam(1)]);
          setNextId(2);
        }
      } catch (caughtError) {
        if (ignore) return;

        const text =
          caughtError instanceof Error
            ? caughtError.message
            : "모의고사 성적을 불러오는 중 오류가 발생했습니다.";

        setPageMessage({
          type: "error",
          text,
        });
        setExams([createEmptyExam(1)]);
        setNextId(2);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadMockExams();

    return () => {
      ignore = true;
    };
  }, []);

  function handleChange(id: number, field: keyof MockExamForm, value: string) {
    setExams((prev) =>
      prev.map((exam) =>
        exam.id === id && !exam.isSaved ? { ...exam, [field]: value } : exam
      )
    );
  }

  function handleAddExam() {
    if (!canAddExam) return;

    setPageMessage(null);
    setExams((prev) => [...prev, createEmptyExam(nextId)]);
    setNextId((prev) => prev + 1);
  }

  function handleDeleteExam(id: number) {
    if (exams.length === 1) return;
    setExams((prev) => prev.filter((exam) => exam.id !== id));
  }

  async function handleSaveExam(id: number) {
    const targetExam = exams.find((exam) => exam.id === id);

    if (!targetExam || targetExam.isSaved || !isFilledExam(targetExam)) {
      return;
    }

    try {
      setSavingExamId(id);
      setPageMessage(null);

      const response = await fetch("/api/student/mock-exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recordId: targetExam.recordId ?? "",
          examYear: targetExam.examYear,
          examMonth: targetExam.examMonth,
          gradeLevel: targetExam.gradeLevel,

          koreanSubject: targetExam.koreanSubject,
          koreanStandardScore: targetExam.koreanStandardScore,
          koreanPercentile: targetExam.koreanPercentile,
          koreanGrade: targetExam.koreanGrade,

          mathSubject: targetExam.mathSubject,
          mathStandardScore: targetExam.mathStandardScore,
          mathPercentile: targetExam.mathPercentile,
          mathGrade: targetExam.mathGrade,

          englishGrade: targetExam.englishGrade,
          koreanHistoryGrade: targetExam.koreanHistoryGrade,

          inquiry1Subject: targetExam.inquiry1Subject,
          inquiry1StandardScore: targetExam.inquiry1StandardScore,
          inquiry1Percentile: targetExam.inquiry1Percentile,
          inquiry1Grade: targetExam.inquiry1Grade,

          inquiry2Subject: targetExam.inquiry2Subject,
          inquiry2StandardScore: targetExam.inquiry2StandardScore,
          inquiry2Percentile: targetExam.inquiry2Percentile,
          inquiry2Grade: targetExam.inquiry2Grade,

          secondLanguageSubject: targetExam.secondLanguageSubject,
          secondLanguageGrade: targetExam.secondLanguageGrade,
        }),
      });

      const result = (await response.json()) as {
        success: boolean;
        message?: string;
        record?: SavedMockExamRecord;
      };

      if (!response.ok || !result.success || !result.record) {
        throw new Error(result.message || "모의고사 성적 저장에 실패했습니다.");
      }

      setExams((prev) =>
        prev.map((exam) =>
          exam.id === id
            ? {
                ...recordToExam(result.record as SavedMockExamRecord, exam.id),
                id: exam.id,
                isExpanded: false,
              }
            : exam
        )
      );

      setPageMessage({
        type: "success",
        text: result.message || "모의고사 성적이 저장되었습니다.",
      });
    } catch (caughtError) {
      const text =
        caughtError instanceof Error
          ? caughtError.message
          : "모의고사 성적 저장 중 오류가 발생했습니다.";

      setPageMessage({
        type: "error",
        text,
      });
    } finally {
      setSavingExamId(null);
    }
  }

  function handleToggleSavedExam(id: number) {
    setExams((prev) =>
      prev.map((exam) =>
        exam.id === id && exam.isSaved
          ? { ...exam, isExpanded: !exam.isExpanded }
          : exam
      )
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
              >
                ← 뒤로
              </Link>
              <div className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                학력고사 및 모의평가
              </div>
            </div>

            <div className="mt-5">
              <h1 className="text-2xl font-extrabold text-slate-950">모의고사 성적 입력</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                수능성적표 형식으로 모의고사 성적을 입력합니다. 각 모의고사별로 성적 저장 후,
                모의고사 추가 버튼으로 다음 회차를 입력합니다.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="#mock-exam-entry"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              입력 영역으로 이동
            </a>
            <button
              type="button"
              onClick={handleAddExam}
              disabled={!canAddExam}
              className="inline-flex items-center justify-center rounded-xl bg-[linear-gradient(135deg,#1e3a8a_0%,#2563eb_100%)] px-4 py-2 text-sm font-extrabold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              + 성적 입력
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon="🗓"
            label="최근 시험"
            value={latest ? fullExamLabel(latest) : "저장 전"}
            tone="indigo"
          />
          <SummaryCard
            icon="📊"
            label="최근 평균등급"
            value={formatGrade(latest ? latestAverageGrade(latest) : null)}
            tone="blue"
          />
          <SummaryCard
            icon="◔"
            label="백분위 평균"
            value={formatPercentile(latest ? latestAveragePercentile(latest) : null)}
            tone="sky"
          />
          <SummaryCard
            icon="↗"
            label="상승 과목"
            value={risingSubject(latest, previous)}
            tone="emerald"
          />
        </div>

        {savedExams.length === 0 ? (
          <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
            <p className="text-base font-extrabold text-slate-800">
              저장된 모의고사 성적이 아직 없습니다.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              아래 입력 영역에서 성적을 저장하면 상단에 회차별 성적 추이와 요약 카드가 표시됩니다.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 xl:grid-cols-4">
            <TrendCard
              title="국어 성적 추이"
              data={koreanTrend}
              gradeAverageLabel={getAverageGradeLabel(koreanTrend)}
              percentileAverageLabel={getAveragePercentileLabel(koreanTrend)}
            />
            <TrendCard
              title="수학 성적 추이"
              data={mathTrend}
              gradeAverageLabel={getAverageGradeLabel(mathTrend)}
              percentileAverageLabel={getAveragePercentileLabel(mathTrend)}
            />
            <TrendCard
              title="영어 성적 추이"
              data={englishTrend}
              gradeAverageLabel={getAverageGradeLabel(englishTrend)}
            />
            <InquiryTrendCard
              title="탐구 성적 추이"
              data={inquiryTrend}
              averagePercentileLabel={getInquiryAveragePercentileLabel(inquiryTrend)}
              topPercentileLabel={getInquiryTopPercentileAverageLabel(inquiryTrend)}
            />
          </div>
        )}
      </section>

      <section
        id="mock-exam-entry"
        className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm lg:p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-950">모의고사 성적 입력</h2>

          <button
            type="button"
            onClick={handleAddExam}
            disabled={!canAddExam}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-extrabold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            + 모의고사 추가
          </button>
        </div>

        {pageMessage && (
          <div
            className={`mt-4 rounded-2xl px-4 py-3 text-sm font-semibold ${
              pageMessage.type === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {pageMessage.text}
          </div>
        )}

        {isLoading && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
            저장된 모의고사 성적을 불러오는 중입니다.
          </div>
        )}

        {!isLoading && !canAddExam && (
          <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
            현재 입력 중인 모의고사 성적을 먼저 저장한 뒤 다음 모의고사를 추가해 주세요.
          </div>
        )}

        <div className="mt-5 space-y-6">
          {exams.map((exam, index) => {
            const isLocked = exam.isSaved;

            return (
              <section
                key={exam.id}
                className="rounded-[28px] border border-slate-200 bg-slate-50 p-4 lg:p-6"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-extrabold text-indigo-700 shadow-sm">
                      모의고사 {index + 1}
                    </div>

                    {exam.isSaved && (
                      <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-700">
                        저장 완료
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        disabled={isLocked}
                        value={exam.examYear}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleChange(exam.id, "examYear", e.currentTarget.value)
                        }
                        placeholder="연도"
                        min={2020}
                        max={2100}
                        className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                      />

                      <select
                        disabled={isLocked}
                        value={exam.examMonth}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                          handleChange(exam.id, "examMonth", e.currentTarget.value)
                        }
                        className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                      >
                        <option value="">월 선택</option>
                        {EXAM_MONTHS.map((month) => (
                          <option key={month} value={month}>
                            {month}월
                          </option>
                        ))}
                      </select>

                      <select
                        disabled={isLocked}
                        value={exam.gradeLevel}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                          handleChange(exam.id, "gradeLevel", e.currentTarget.value)
                        }
                        className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                      >
                        <option value="">학년</option>
                        {GRADE_LEVELS.map((grade) => (
                          <option key={grade} value={grade}>
                            {grade}학년
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!exam.isSaved && exams.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteExam(exam.id)}
                        className="inline-flex items-center justify-center rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
                      >
                        삭제
                      </button>
                    )}

                    {!exam.isSaved ? (
                      <button
                        type="button"
                        onClick={() => handleSaveExam(exam.id)}
                        disabled={!isFilledExam(exam) || savingExamId === exam.id}
                        className="inline-flex items-center justify-center rounded-xl bg-[linear-gradient(135deg,#312e81_0%,#4f46e5_100%)] px-4 py-2 text-xs font-extrabold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {savingExamId === exam.id ? "저장 중..." : "성적 저장"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleSavedExam(exam.id)}
                        className="inline-flex items-center justify-center rounded-xl border border-emerald-300 bg-emerald-400 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-emerald-500"
                      >
                        {exam.isExpanded ? "접기" : "성적보기"}
                      </button>
                    )}
                  </div>
                </div>

                {(!exam.isSaved || exam.isExpanded) && (
                  <div className="mt-5 overflow-x-auto">
                    <table className="min-w-[1080px] w-full border-collapse border border-slate-300 bg-white text-sm">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="w-[130px] min-w-[130px] border border-slate-300 px-3 py-3 font-extrabold text-slate-700">
                            영역
                          </th>
                          <th className="border border-slate-300 px-3 py-3 font-extrabold text-slate-700">
                            한국사
                          </th>
                          <th className="border border-slate-300 px-3 py-3 font-extrabold text-slate-700">
                            국어
                          </th>
                          <th className="border border-slate-300 px-3 py-3 font-extrabold text-slate-700">
                            수학
                          </th>
                          <th className="border border-slate-300 px-3 py-3 font-extrabold text-slate-700">
                            영어
                          </th>
                          <th
                            colSpan={2}
                            className="border border-slate-300 px-3 py-3 font-extrabold text-slate-700"
                          >
                            <span className="block">탐구</span>
                            <span className="mt-1 block text-[11px] font-semibold text-amber-700">
                              높은 탐구 성적을 탐구1에 적어주세요
                            </span>
                          </th>
                          <th className="w-[120px] min-w-[120px] border border-slate-300 px-3 py-3 font-extrabold text-slate-700">
                            <span className="block">제2외국어</span>
                            <span className="block">한문</span>
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        <tr>
                          <td className="w-[130px] min-w-[130px] border border-slate-300 px-3 py-3 text-center font-bold text-slate-700">
                            선택과목
                          </td>

                          <td className="border border-slate-300 bg-slate-50" rowSpan={3} />

                          <td className="border border-slate-300 px-2 py-2">
                            <select
                              disabled={isLocked}
                              value={exam.koreanSubject}
                              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                                handleChange(exam.id, "koreanSubject", e.currentTarget.value)
                              }
                              className="mx-auto block w-[65%] min-w-[110px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                            >
                              <option value="">국어 선택과목</option>
                              {KOREAN_SUBJECTS.map((subject) => (
                                <option key={subject} value={subject}>
                                  {subject}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="border border-slate-300 px-2 py-2">
                            <select
                              disabled={isLocked}
                              value={exam.mathSubject}
                              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                                handleChange(exam.id, "mathSubject", e.currentTarget.value)
                              }
                              className="mx-auto block w-[65%] min-w-[110px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                            >
                              <option value="">수학 선택과목</option>
                              {MATH_SUBJECTS.map((subject) => (
                                <option key={subject} value={subject}>
                                  {subject}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="border border-slate-300 bg-slate-50" rowSpan={3} />

                          <td className="border border-slate-300 px-2 py-2">
                            <select
                              disabled={isLocked}
                              value={exam.inquiry1Subject}
                              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                                handleChange(exam.id, "inquiry1Subject", e.currentTarget.value)
                              }
                              className="mx-auto block w-[65%] min-w-[110px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                            >
                              <option value="">탐구1 선택</option>
                              {INQUIRY_SUBJECTS.map((subject) => (
                                <option key={subject} value={subject}>
                                  {subject}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="border border-slate-300 px-2 py-2">
                            <select
                              disabled={isLocked}
                              value={exam.inquiry2Subject}
                              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                                handleChange(exam.id, "inquiry2Subject", e.currentTarget.value)
                              }
                              className="mx-auto block w-[65%] min-w-[110px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                            >
                              <option value="">탐구2 선택</option>
                              {INQUIRY_SUBJECTS.map((subject) => (
                                <option key={subject} value={subject}>
                                  {subject}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="w-[120px] min-w-[120px] border border-slate-300 px-2 py-2">
                            <select
                              disabled={isLocked}
                              value={exam.secondLanguageSubject}
                              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                                handleChange(exam.id, "secondLanguageSubject", e.currentTarget.value)
                              }
                              className="mx-auto block w-[75%] min-w-[72px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                            >
                              <option value="">제2/한문</option>
                              {SECOND_LANGUAGE_SUBJECTS.map((subject) => (
                                <option key={subject} value={subject}>
                                  {subject}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>

                        <tr>
                          <td className="w-[130px] min-w-[130px] border border-slate-300 px-3 py-3 text-center font-bold text-slate-700">
                            표준점수
                          </td>

                          <td className="border border-slate-300 px-2 py-2">
                            <input
                              type="number"
                              disabled={isLocked}
                              value={exam.koreanStandardScore}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleChange(exam.id, "koreanStandardScore", e.currentTarget.value)
                              }
                              className="mx-auto block w-[65%] min-w-[72px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                            />
                          </td>

                          <td className="border border-slate-300 px-2 py-2">
                            <input
                              type="number"
                              disabled={isLocked}
                              value={exam.mathStandardScore}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleChange(exam.id, "mathStandardScore", e.currentTarget.value)
                              }
                              className="mx-auto block w-[65%] min-w-[72px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                            />
                          </td>

                          <td className="border border-slate-300 px-2 py-2">
                            <input
                              type="number"
                              disabled={isLocked}
                              value={exam.inquiry1StandardScore}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleChange(exam.id, "inquiry1StandardScore", e.currentTarget.value)
                              }
                              className="mx-auto block w-[65%] min-w-[72px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                            />
                          </td>

                          <td className="border border-slate-300 px-2 py-2">
                            <input
                              type="number"
                              disabled={isLocked}
                              value={exam.inquiry2StandardScore}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleChange(exam.id, "inquiry2StandardScore", e.currentTarget.value)
                              }
                              className="mx-auto block w-[65%] min-w-[72px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                            />
                          </td>

                          <td className="border border-slate-300 bg-slate-50" />
                        </tr>

                        <tr>
                          <td className="w-[130px] min-w-[130px] border border-slate-300 px-3 py-3 text-center font-bold text-slate-700">
                            백분위
                          </td>

                          <td className="border border-slate-300 px-2 py-2">
                            <input
                              type="number"
                              disabled={isLocked}
                              value={exam.koreanPercentile}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleChange(exam.id, "koreanPercentile", e.currentTarget.value)
                              }
                              min={0}
                              max={100}
                              className="mx-auto block w-[65%] min-w-[72px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                            />
                          </td>

                          <td className="border border-slate-300 px-2 py-2">
                            <input
                              type="number"
                              disabled={isLocked}
                              value={exam.mathPercentile}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleChange(exam.id, "mathPercentile", e.currentTarget.value)
                              }
                              min={0}
                              max={100}
                              className="mx-auto block w-[65%] min-w-[72px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                            />
                          </td>

                          <td className="border border-slate-300 px-2 py-2">
                            <input
                              type="number"
                              disabled={isLocked}
                              value={exam.inquiry1Percentile}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleChange(exam.id, "inquiry1Percentile", e.currentTarget.value)
                              }
                              min={0}
                              max={100}
                              className="mx-auto block w-[65%] min-w-[72px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                            />
                          </td>

                          <td className="border border-slate-300 px-2 py-2">
                            <input
                              type="number"
                              disabled={isLocked}
                              value={exam.inquiry2Percentile}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleChange(exam.id, "inquiry2Percentile", e.currentTarget.value)
                              }
                              min={0}
                              max={100}
                              className="mx-auto block w-[65%] min-w-[72px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                            />
                          </td>

                          <td className="border border-slate-300 bg-slate-50" />
                        </tr>

                        <tr>
                          <td className="w-[130px] min-w-[130px] border border-slate-300 px-3 py-3 text-center font-bold text-slate-700">
                            등급
                          </td>

                          <td className="border border-slate-300 px-2 py-2">
                            <input
                              type="number"
                              disabled={isLocked}
                              value={exam.koreanHistoryGrade}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleChange(exam.id, "koreanHistoryGrade", e.currentTarget.value)
                              }
                              min={1}
                              max={9}
                              step={0.1}
                              className="mx-auto block w-[75%] min-w-[72px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                            />
                          </td>

                          <td className="border border-slate-300 px-2 py-2">
                            <input
                              type="number"
                              disabled={isLocked}
                              value={exam.koreanGrade}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleChange(exam.id, "koreanGrade", e.currentTarget.value)
                              }
                              min={1}
                              max={9}
                              step={0.1}
                              className="mx-auto block w-[65%] min-w-[72px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                            />
                          </td>

                          <td className="border border-slate-300 px-2 py-2">
                            <input
                              type="number"
                              disabled={isLocked}
                              value={exam.mathGrade}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleChange(exam.id, "mathGrade", e.currentTarget.value)
                              }
                              min={1}
                              max={9}
                              step={0.1}
                              className="mx-auto block w-[65%] min-w-[72px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                            />
                          </td>

                          <td className="border border-slate-300 px-2 py-2">
                            <input
                              type="number"
                              disabled={isLocked}
                              value={exam.englishGrade}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleChange(exam.id, "englishGrade", e.currentTarget.value)
                              }
                              min={1}
                              max={9}
                              step={0.1}
                              className="mx-auto block w-[75%] min-w-[72px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                            />
                          </td>

                          <td className="border border-slate-300 px-2 py-2">
                            <input
                              type="number"
                              disabled={isLocked}
                              value={exam.inquiry1Grade}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleChange(exam.id, "inquiry1Grade", e.currentTarget.value)
                              }
                              min={1}
                              max={9}
                              step={0.1}
                              className="mx-auto block w-[65%] min-w-[72px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                            />
                          </td>

                          <td className="border border-slate-300 px-2 py-2">
                            <input
                              type="number"
                              disabled={isLocked}
                              value={exam.inquiry2Grade}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleChange(exam.id, "inquiry2Grade", e.currentTarget.value)
                              }
                              min={1}
                              max={9}
                              step={0.1}
                              className="mx-auto block w-[65%] min-w-[72px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                            />
                          </td>

                          <td className="w-[120px] min-w-[120px] border border-slate-300 px-2 py-2">
                            <input
                              type="number"
                              disabled={isLocked}
                              value={exam.secondLanguageGrade}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleChange(exam.id, "secondLanguageGrade", e.currentTarget.value)
                              }
                              min={1}
                              max={9}
                              step={0.1}
                              className="mx-auto block w-[75%] min-w-[72px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <div className="mt-5 flex justify-start">
          <button
            type="button"
            onClick={handleAddExam}
            disabled={!canAddExam}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-extrabold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            + 모의고사 추가
          </button>
        </div>
      </section>
    </div>
  );
}
