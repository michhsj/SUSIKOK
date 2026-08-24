'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

type SavedMockExamRecord = {
  id: string;
  examYear: number | string;
  examMonth: number | string;
  gradeLevel: string | number | null;
  koreanSubject?: string | null;
  koreanStandardScore?: number | string | null;
  koreanPercentile?: number | string | null;
  koreanGrade?: number | string | null;
  mathSubject?: string | null;
  mathStandardScore?: number | string | null;
  mathPercentile?: number | string | null;
  mathGrade?: number | string | null;
  englishGrade?: number | string | null;
  koreanHistoryGrade?: number | string | null;
  inquiry1Subject?: string | null;
  inquiry1StandardScore?: number | string | null;
  inquiry1Percentile?: number | string | null;
  inquiry1Grade?: number | string | null;
  inquiry2Subject?: string | null;
  inquiry2StandardScore?: number | string | null;
  inquiry2Percentile?: number | string | null;
  inquiry2Grade?: number | string | null;
  secondLanguageSubject?: string | null;
  secondLanguageGrade?: number | string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type TrendSummaryPoint = {
  label: string;
  averageGrade: number | null;
  averagePercentile: number | null;
};

type SubjectComparisonPoint = {
  label: string;
  latestValue: number | null;
  previousValue: number | null;
  latestDisplay: string;
  previousDisplay: string;
};

type HakjongFitDomainSummary = {
  domain: string;
  rawScore: number;
  convertedScore: number;
  rawMaxScore: number;
  convertedMaxScore: number;
};

type HakjongFitSummaryPayload =
  | {
      success: true;
      hasResult: true;
      submissionId: string;
      version?: string;
      totalQuestionCount: number;
      completedQuestionCount: number;
      completedAt?: string | null;
      resultSummary: {
        domains: HakjongFitDomainSummary[];
      };
    }
  | {
      success: true;
      hasResult: false;
    }
  | {
      success: false;
      message: string;
    };


type SchoolRecordGradeRow = {
  id?: string;
  schoolYear: number | string | null;
  semester: number | string | null;
  academicTermLabel?: string | null;
  subjectGroupSnapshot?: string | null;
  completionTypeSnapshot?: string | null;
  subjectName?: string | null;
  credits: number | string | null;
  grade: number | string | null;
};

type SchoolRecordTrendPoint = {
  label: string;
  averageGrade: number | null;
};

type SchoolRecordSubjectAveragePoint = {
  label: string;
  averageGrade: number | null;
  display: string;
};


type SchoolRecordApiPayload = {
  message?: string;
  rows?: unknown;
  grades?: unknown;
  items?: unknown;
  records?: unknown;
  data?: unknown;
  result?: unknown;
  schoolRecords?: unknown;
  schoolRecordGrades?: unknown;
};

const SCHOOL_RECORD_API_CANDIDATES = [
  '/api/student/school-record-grades',
  '/api/student/school-records/grades',
  '/api/student/school-records',
] as const;

const DASHBOARD_CHART_CARD_CLASS =
  'rounded-[24px] border-2 border-blue-950 bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)] p-5 shadow-[0_18px_44px_rgba(15,23,42,0.12)] min-h-[340px] sm:min-h-[360px]';

const DASHBOARD_CHART_PLOT_HEIGHT = 210;

const DASHBOARD_CHART_PLOT_CLASS = 'h-[210px] sm:h-[220px]';

const DASHBOARD_CHART_EMPTY_CLASS =
  'flex h-[210px] sm:h-[220px] items-center justify-center rounded-[20px] border-2 border-dashed border-blue-300 bg-[linear-gradient(180deg,#eff6ff_0%,#dbeafe_100%)] text-sm font-semibold text-blue-950';

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function average(values: Array<number | null | undefined>): number | null {
  const valid = values.filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value),
  );

  if (!valid.length) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function formatGrade(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '-';
  return value.toFixed(2);
}

function formatPercentile(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '-';
  return Number.isInteger(value) ? `${value}` : value.toFixed(0);
}

function formatScore(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '-';
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function compareExamOrder(a: SavedMockExamRecord, b: SavedMockExamRecord): number {
  const yearDiff = (toNumber(a.examYear) ?? 0) - (toNumber(b.examYear) ?? 0);
  if (yearDiff !== 0) return yearDiff;

  const monthDiff = (toNumber(a.examMonth) ?? 0) - (toNumber(b.examMonth) ?? 0);
  if (monthDiff !== 0) return monthDiff;

  return String(a.id).localeCompare(String(b.id));
}

function fullExamLabel(exam: SavedMockExamRecord | null): string {
  if (!exam) return '-';

  const year = toNumber(exam.examYear);
  const month = toNumber(exam.examMonth);

  if (year && month) return `${year}년 ${month}월`;
  if (year) return `${year}년`;
  if (month) return `${month}월`;
  return '-';
}

function chartExamLabel(exam: SavedMockExamRecord): string {
  const year = toNumber(exam.examYear);
  const month = toNumber(exam.examMonth);

  if (year && month) return `${year}년 ${month}월`;
  if (month) return `${month}월`;
  return '회차';
}

function buildPolylinePath(points: Array<{ x: number; y: number }>): string {
  if (points.length < 2) return '';
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
}

function gradeToChartY(value: number, height: number): number {
  const top = 18;
  const bottom = height - 18;
  const clamped = Math.min(Math.max(value, 1), 5);
  return top + ((clamped - 1) / 4) * (bottom - top);
}

function percentileToChartY(value: number, height: number): number {
  const top = 18;
  const bottom = height - 18;
  const clamped = Math.min(Math.max(value, 0), 100);
  return bottom - (clamped / 100) * (bottom - top);
}

function normalizeGradeToScore(grade: number | null): number | null {
  if (grade == null) return null;
  const clamped = Math.min(Math.max(grade, 1), 9);
  return 100 - (clamped - 1) * 12.5;
}


function toObjectRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function normalizeSchoolRecordGradeRow(value: unknown): SchoolRecordGradeRow | null {
  const row = toObjectRecord(value);
  if (!row) return null;

  return {
    id: typeof row.id === 'string' ? row.id : undefined,
    schoolYear: (row.schoolYear ?? row.year ?? row.gradeLevel ?? null) as number | string | null,
    semester: (row.semester ?? row.term ?? row.academicSemester ?? null) as number | string | null,
    academicTermLabel:
      typeof row.academicTermLabel === 'string'
        ? row.academicTermLabel
        : typeof row.termLabel === 'string'
          ? row.termLabel
          : typeof row.semesterLabel === 'string'
            ? row.semesterLabel
            : null,
    subjectGroupSnapshot:
      typeof row.subjectGroupSnapshot === 'string'
        ? row.subjectGroupSnapshot
        : typeof row.subjectGroup === 'string'
          ? row.subjectGroup
          : typeof row.subjectCategory === 'string'
            ? row.subjectCategory
            : null,
    completionTypeSnapshot:
      typeof row.completionTypeSnapshot === 'string'
        ? row.completionTypeSnapshot
        : typeof row.completionType === 'string'
          ? row.completionType
          : typeof row.courseType === 'string'
            ? row.courseType
            : null,
    subjectName:
      typeof row.subjectName === 'string'
        ? row.subjectName
        : typeof row.courseName === 'string'
          ? row.courseName
          : typeof row.name === 'string'
            ? row.name
            : null,
    credits: (row.credits ?? row.credit ?? row.unit ?? null) as number | string | null,
    grade: (row.grade ?? row.achievementGrade ?? row.rankGrade ?? null) as number | string | null,
  };
}

function collectSchoolRecordRows(value: unknown): SchoolRecordGradeRow[] {
  if (Array.isArray(value)) {
    return value
      .map(normalizeSchoolRecordGradeRow)
      .filter((row): row is SchoolRecordGradeRow => row != null);
  }

  const record = toObjectRecord(value);
  if (!record) return [];

  const nestedCandidates = [
    record.rows,
    record.grades,
    record.items,
    record.records,
    record.data,
    record.result,
    record.schoolRecords,
    record.schoolRecordGrades,
  ];

  for (const candidate of nestedCandidates) {
    const rows = collectSchoolRecordRows(candidate);
    if (rows.length) return rows;
  }

  const singleRow = normalizeSchoolRecordGradeRow(record);
  return singleRow ? [singleRow] : [];
}

async function loadSchoolRecordRows(): Promise<{
  rows: SchoolRecordGradeRow[];
  error: string | null;
}> {
  let lastError: string | null = null;

  for (const endpoint of SCHOOL_RECORD_API_CANDIDATES) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        cache: 'no-store',
      });

      const payload = (await response.json().catch(() => null)) as
        | SchoolRecordApiPayload
        | unknown;

      if (response.status === 404) {
        continue;
      }

      if (!response.ok) {
        const payloadRecord = toObjectRecord(payload);
        lastError =
          payloadRecord && typeof payloadRecord.message === 'string'
            ? payloadRecord.message
            : '내신 성적 데이터를 불러오지 못했습니다.';
        continue;
      }

      return {
        rows: collectSchoolRecordRows(payload),
        error: null,
      };
    } catch (error) {
      lastError =
        error instanceof Error
          ? error.message
          : '내신 성적 데이터를 불러오지 못했습니다.';
    }
  }

  return {
    rows: [],
    error: lastError ?? '내신 성적 API를 찾지 못했습니다.',
  };
}


const SCHOOL_RECORD_SUBJECT_ORDER = ['국어', '수학', '영어', '사회', '과학'] as const;

function schoolGradeToChartY(value: number, height: number): number {
  const top = 18;
  const bottom = height - 18;
  const clamped = Math.min(Math.max(value, 1), 9);
  return top + ((clamped - 1) / 8) * (bottom - top);
}

function normalizeSchoolText(value: unknown): string {
  return String(value ?? '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

function getNormalizedSchoolSubjectGroup(row: SchoolRecordGradeRow): string | null {
  const raw = normalizeSchoolText(row.subjectGroupSnapshot ?? row.subjectName ?? '');

  if (!raw) return null;
  if (raw.includes('국어')) return '국어';
  if (raw.includes('수학')) return '수학';
  if (raw.includes('영어')) return '영어';
  if (raw.includes('사회') || raw.includes('역사') || raw.includes('한국사')) return '사회';
  if (raw.includes('과학')) return '과학';

  return null;
}

function isCommonOrGeneralSelectionCourse(row: SchoolRecordGradeRow): boolean {
  const normalized = normalizeSchoolText(row.completionTypeSnapshot);
  return normalized.includes('공통') || normalized.includes('일반선택');
}

function getUsableSchoolRecordGrade(row: SchoolRecordGradeRow): number | null {
  const grade = toNumber(row.grade);
  return grade != null && Number.isFinite(grade) ? grade : null;
}

function getUsableSchoolRecordCredits(row: SchoolRecordGradeRow): number | null {
  const credits = toNumber(row.credits);
  return credits != null && Number.isFinite(credits) && credits > 0 ? credits : null;
}

function hasUsableSchoolRecordScore(row: SchoolRecordGradeRow): boolean {
  return getUsableSchoolRecordGrade(row) != null && getUsableSchoolRecordCredits(row) != null;
}

function calculateSchoolRecordWeightedAverage(rows: SchoolRecordGradeRow[]): number | null {
  const usableRows = rows.filter(hasUsableSchoolRecordScore);

  if (!usableRows.length) return null;

  const totalCredits = usableRows.reduce(
    (sum, row) => sum + (getUsableSchoolRecordCredits(row) ?? 0),
    0,
  );

  if (totalCredits <= 0) return null;

  const weightedSum = usableRows.reduce(
    (sum, row) =>
      sum +
      (getUsableSchoolRecordGrade(row) ?? 0) * (getUsableSchoolRecordCredits(row) ?? 0),
    0,
  );

  return Number((weightedSum / totalCredits).toFixed(2));
}

function buildSchoolRecordSummaryAverages(rows: SchoolRecordGradeRow[]) {
  const commonGeneralRows = rows.filter(
    (row) => hasUsableSchoolRecordScore(row) && isCommonOrGeneralSelectionCourse(row),
  );

  const matchesSubjects = (
    row: SchoolRecordGradeRow,
    subjects: readonly string[],
  ): boolean => {
    const group = getNormalizedSchoolSubjectGroup(row);
    return group != null && subjects.includes(group);
  };

  return {
    koreanMathEnglishSocial: calculateSchoolRecordWeightedAverage(
      commonGeneralRows.filter((row) =>
        matchesSubjects(row, ['국어', '수학', '영어', '사회']),
      ),
    ),
    koreanMathEnglishScience: calculateSchoolRecordWeightedAverage(
      commonGeneralRows.filter((row) =>
        matchesSubjects(row, ['국어', '수학', '영어', '과학']),
      ),
    ),
    koreanMathEnglishSocialScience: calculateSchoolRecordWeightedAverage(
      commonGeneralRows.filter((row) =>
        matchesSubjects(row, ['국어', '수학', '영어', '사회', '과학']),
      ),
    ),
    allSubjects: calculateSchoolRecordWeightedAverage(rows.filter(hasUsableSchoolRecordScore)),
  };
}

function getSchoolRecordSemesterSortValue(row: SchoolRecordGradeRow): number {
  const schoolYear = toNumber(row.schoolYear) ?? 0;
  const semester = toNumber(row.semester) ?? 0;
  return schoolYear * 10 + semester;
}

function getSchoolRecordSemesterLabel(row: SchoolRecordGradeRow): string {
  const schoolYear = toNumber(row.schoolYear);
  const semester = toNumber(row.semester);

  if (schoolYear != null && semester != null) {
    return `${schoolYear}학년 ${semester}학기`;
  }

  if (typeof row.academicTermLabel === 'string' && row.academicTermLabel.trim()) {
    return row.academicTermLabel.trim();
  }

  return '학기';
}

function buildSchoolRecordTrendData(rows: SchoolRecordGradeRow[]): SchoolRecordTrendPoint[] {
  const usableRows = rows.filter(hasUsableSchoolRecordScore);
  const semesterMap = new Map<string, { order: number; label: string; rows: SchoolRecordGradeRow[] }>();

  usableRows.forEach((row) => {
    const key = `${toNumber(row.schoolYear) ?? 'x'}-${toNumber(row.semester) ?? 'x'}`;
    const existing = semesterMap.get(key);

    if (existing) {
      existing.rows.push(row);
      return;
    }

    semesterMap.set(key, {
      order: getSchoolRecordSemesterSortValue(row),
      label: getSchoolRecordSemesterLabel(row),
      rows: [row],
    });
  });

  return [...semesterMap.values()]
    .sort((a, b) => a.order - b.order)
    .map((entry) => ({
      label: entry.label,
      averageGrade: calculateSchoolRecordWeightedAverage(entry.rows),
    }));
}

function buildSchoolRecordSubjectAverageData(
  rows: SchoolRecordGradeRow[],
): SchoolRecordSubjectAveragePoint[] {
  const usableRows = rows.filter(
    (row) => hasUsableSchoolRecordScore(row) && getNormalizedSchoolSubjectGroup(row) != null,
  );

  return SCHOOL_RECORD_SUBJECT_ORDER.map((label) => {
    const averageGrade = calculateSchoolRecordWeightedAverage(
      usableRows.filter((row) => getNormalizedSchoolSubjectGroup(row) === label),
    );

    return {
      label,
      averageGrade,
      display: averageGrade == null ? '-' : `${formatGrade(averageGrade)}등급`,
    };
  });
}

function getLatestAverageGrade(exam: SavedMockExamRecord | null): number | null {
  if (!exam) return null;

  return average([
    toNumber(exam.koreanGrade),
    toNumber(exam.mathGrade),
    toNumber(exam.englishGrade),
    toNumber(exam.inquiry1Grade),
    toNumber(exam.inquiry2Grade),
  ]);
}

function getLatestAveragePercentile(exam: SavedMockExamRecord | null): number | null {
  if (!exam) return null;

  return average([
    toNumber(exam.koreanPercentile),
    toNumber(exam.mathPercentile),
    toNumber(exam.inquiry1Percentile),
    toNumber(exam.inquiry2Percentile),
  ]);
}

function getStrengthAndWeakness(exam: SavedMockExamRecord | null): {
  strongest: string;
  weakest: string;
} {
  if (!exam) {
    return {
      strongest: '-',
      weakest: '-',
    };
  }

  const candidates = [
    {
      label: '국어',
      score:
        toNumber(exam.koreanPercentile) ?? normalizeGradeToScore(toNumber(exam.koreanGrade)),
    },
    {
      label: '수학',
      score:
        toNumber(exam.mathPercentile) ?? normalizeGradeToScore(toNumber(exam.mathGrade)),
    },
    {
      label: '영어',
      score: normalizeGradeToScore(toNumber(exam.englishGrade)),
    },
    {
      label: '탐구1',
      score:
        toNumber(exam.inquiry1Percentile) ??
        normalizeGradeToScore(toNumber(exam.inquiry1Grade)),
    },
    {
      label: '탐구2',
      score:
        toNumber(exam.inquiry2Percentile) ??
        normalizeGradeToScore(toNumber(exam.inquiry2Grade)),
    },
    {
      label: '한국사',
      score: normalizeGradeToScore(toNumber(exam.koreanHistoryGrade)),
    },
  ].filter(
    (item): item is { label: string; score: number } =>
      typeof item.score === 'number' && Number.isFinite(item.score),
  );

  if (!candidates.length) {
    return {
      strongest: '-',
      weakest: '-',
    };
  }

  const strongest = [...candidates].sort((a, b) => b.score - a.score)[0];
  const weakest = [...candidates].sort((a, b) => a.score - b.score)[0];

  return {
    strongest: strongest.label,
    weakest: weakest.label,
  };
}

function getTrendSummaryData(exams: SavedMockExamRecord[]): TrendSummaryPoint[] {
  return exams.slice(-6).map((exam) => ({
    label: chartExamLabel(exam),
    averageGrade: getLatestAverageGrade(exam),
    averagePercentile: getLatestAveragePercentile(exam),
  }));
}

function getComparisonValue(
  exam: SavedMockExamRecord | null,
  key:
    | 'korean'
    | 'math'
    | 'english'
    | 'inquiry1'
    | 'inquiry2'
    | 'koreanHistory',
): { value: number | null; display: string } {
  if (!exam) {
    return {
      value: null,
      display: '-',
    };
  }

  if (key === 'korean') {
    const percentile = toNumber(exam.koreanPercentile);
    return {
      value: percentile,
      display: formatPercentile(percentile),
    };
  }

  if (key === 'math') {
    const percentile = toNumber(exam.mathPercentile);
    return {
      value: percentile,
      display: formatPercentile(percentile),
    };
  }

  if (key === 'english') {
    const grade = toNumber(exam.englishGrade);
    return {
      value: normalizeGradeToScore(grade),
      display: grade == null ? '-' : `${formatGrade(grade)}등급`,
    };
  }

  if (key === 'inquiry1') {
    const percentile = toNumber(exam.inquiry1Percentile);
    return {
      value: percentile,
      display: formatPercentile(percentile),
    };
  }

  if (key === 'inquiry2') {
    const percentile = toNumber(exam.inquiry2Percentile);
    return {
      value: percentile,
      display: formatPercentile(percentile),
    };
  }

  const grade = toNumber(exam.koreanHistoryGrade);
  return {
    value: normalizeGradeToScore(grade),
    display: grade == null ? '-' : `${formatGrade(grade)}등급`,
  };
}

function getSubjectComparisonData(
  latestExam: SavedMockExamRecord | null,
  previousExam: SavedMockExamRecord | null,
): SubjectComparisonPoint[] {
  const koreanLatest = getComparisonValue(latestExam, 'korean');
  const koreanPrevious = getComparisonValue(previousExam, 'korean');

  const mathLatest = getComparisonValue(latestExam, 'math');
  const mathPrevious = getComparisonValue(previousExam, 'math');

  const englishLatest = getComparisonValue(latestExam, 'english');
  const englishPrevious = getComparisonValue(previousExam, 'english');

  const inquiry1Latest = getComparisonValue(latestExam, 'inquiry1');
  const inquiry1Previous = getComparisonValue(previousExam, 'inquiry1');

  const inquiry2Latest = getComparisonValue(latestExam, 'inquiry2');
  const inquiry2Previous = getComparisonValue(previousExam, 'inquiry2');

  const historyLatest = getComparisonValue(latestExam, 'koreanHistory');
  const historyPrevious = getComparisonValue(previousExam, 'koreanHistory');

  return [
    {
      label: '국어',
      latestValue: koreanLatest.value,
      previousValue: koreanPrevious.value,
      latestDisplay: koreanLatest.display,
      previousDisplay: koreanPrevious.display,
    },
    {
      label: '수학',
      latestValue: mathLatest.value,
      previousValue: mathPrevious.value,
      latestDisplay: mathLatest.display,
      previousDisplay: mathPrevious.display,
    },
    {
      label: '영어',
      latestValue: englishLatest.value,
      previousValue: englishPrevious.value,
      latestDisplay: englishLatest.display,
      previousDisplay: englishPrevious.display,
    },
    {
      label: '탐구1',
      latestValue: inquiry1Latest.value,
      previousValue: inquiry1Previous.value,
      latestDisplay: inquiry1Latest.display,
      previousDisplay: inquiry1Previous.display,
    },
    {
      label: '탐구2',
      latestValue: inquiry2Latest.value,
      previousValue: inquiry2Previous.value,
      latestDisplay: inquiry2Latest.display,
      previousDisplay: inquiry2Previous.display,
    },
    {
      label: '한국사',
      latestValue: historyLatest.value,
      previousValue: historyPrevious.value,
      latestDisplay: historyLatest.display,
      previousDisplay: historyPrevious.display,
    },
  ];
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 3h6" />
      <path d="M9 3a2 2 0 0 0-2 2v1h10V5a2 2 0 0 0-2-2" />
      <path d="M7 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-1" />
      <path d="M9 11h6" />
      <path d="M9 15h6" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M7 15l4-4 3 3 5-7" />
      <path d="M8 19v-2" />
      <path d="M12 19v-6" />
      <path d="M16 19v-4" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 16 19 6" />
      <path d="M13 6h6v6" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m12 3 2.7 5.48 6.05.88-4.38 4.27 1.03 6.02L12 16.77 6.6 19.65l1.03-6.02L3.25 9.36l6.05-.88L12 3Z" />
    </svg>
  );
}

function SummaryMetricCard({
  icon,
  iconClassName,
  title,
  value,
}: {
  icon: ReactNode;
  iconClassName: string;
  title: string;
  value: ReactNode;
}) {
  return (
    <article className="rounded-[22px] border-2 border-blue-950 bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)] px-5 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${iconClassName}`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[12px] font-bold text-slate-500">{title}</p>
          <div className="mt-1 text-[16px] font-extrabold tracking-tight text-slate-950 sm:text-[18px]">
            {value}
          </div>
        </div>
      </div>
    </article>
  );
}

function RecentTrendChart({ data }: { data: TrendSummaryPoint[] }) {
  const chartWidth = 560;
  const chartHeight = DASHBOARD_CHART_PLOT_HEIGHT;
  const paddingX = 28;

  const points = data.map((item, index) => {
    const x =
      data.length <= 1
        ? chartWidth / 2
        : paddingX + (index * (chartWidth - paddingX * 2)) / (data.length - 1);

    return {
      ...item,
      x,
    };
  });

  const gradePoints = points
    .filter((item) => item.averageGrade != null)
    .map((item) => ({
      ...item,
      y: gradeToChartY(item.averageGrade as number, chartHeight),
    }));

  const percentilePoints = points
    .filter((item) => item.averagePercentile != null)
    .map((item) => ({
      ...item,
      y: percentileToChartY(item.averagePercentile as number, chartHeight),
    }));

  const gradePath = buildPolylinePath(gradePoints);
  const percentilePath = buildPolylinePath(percentilePoints);
  const hasData = gradePoints.length > 0 || percentilePoints.length > 0;

  return (
    <article className={DASHBOARD_CHART_CARD_CLASS}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold tracking-tight text-slate-950">최근 성적 추이</h3>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-500">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              평균 등급
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full border border-sky-400 bg-sky-200" />
              백분위 평균
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5">
        {hasData ? (
          <div className={`flex gap-3 ${DASHBOARD_CHART_PLOT_CLASS}`}>
            <div className="flex h-full w-6 shrink-0 flex-col justify-between pb-4 text-[11px] font-semibold text-slate-400">
              {[1, 2, 3, 4, 5].map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>

            <div className="min-w-0 flex-1">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="h-full w-full"
                preserveAspectRatio="none"
              >
                {[1, 2, 3, 4, 5].map((line) => {
                  const y = gradeToChartY(line, chartHeight);
                  return (
                    <line
                      key={`g-${line}`}
                      x1="0"
                      y1={y}
                      x2={chartWidth}
                      y2={y}
                      stroke="#e5e7eb"
                      strokeDasharray="3 4"
                    />
                  );
                })}

                {percentilePath ? (
                  <path
                    d={percentilePath}
                    fill="none"
                    stroke="#93c5fd"
                    strokeWidth="3"
                    strokeDasharray="4 4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null}

                {gradePath ? (
                  <path
                    d={gradePath}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null}

                {percentilePoints.map((point) => (
                  <g key={`percentile-${point.label}`}>
                    <circle cx={point.x} cy={point.y} r="4" fill="#93c5fd" />
                    <text
                      x={point.x}
                      y={point.y - 10}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="700"
                      fill="#60a5fa"
                    >
                      {formatPercentile(point.averagePercentile)}
                    </text>
                  </g>
                ))}

                {gradePoints.map((point) => (
                  <g key={`grade-${point.label}`}>
                    <circle cx={point.x} cy={point.y} r="4.5" fill="#2563eb" />
                    <text
                      x={point.x}
                      y={point.y + 18}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="700"
                      fill="#1e3a8a"
                    >
                      {formatGrade(point.averageGrade)}
                    </text>
                  </g>
                ))}
              </svg>

              <div className="mt-2 flex items-start justify-between gap-2">
                {points.map((point) => (
                  <span
                    key={point.label}
                    className="min-w-0 flex-1 text-center text-[11px] font-semibold text-slate-500"
                  >
                    {point.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex h-full w-8 shrink-0 flex-col justify-between pb-4 text-right text-[11px] font-semibold text-slate-400">
              {[100, 80, 60, 40, 20, 0].map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </div>
        ) : (
          <div className={DASHBOARD_CHART_EMPTY_CLASS}>
            표시할 성적 추이 데이터가 없습니다.
          </div>
        )}
      </div>
    </article>
  );
}

function SubjectComparisonChart({
  latestLabel,
  previousLabel,
  data,
}: {
  latestLabel: string;
  previousLabel: string;
  data: SubjectComparisonPoint[];
}) {
  const chartWidth = 560;
  const chartHeight = DASHBOARD_CHART_PLOT_HEIGHT;
  const groupWidth = chartWidth / Math.max(data.length, 1);
  const barWidth = 18;

  const hasData = data.some(
    (item) => item.latestValue != null || item.previousValue != null,
  );

  return (
    <article className={DASHBOARD_CHART_CARD_CLASS}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold tracking-tight text-slate-950">
            최근 시험 과목 비교
          </h3>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-500">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-blue-800" />
              {latestLabel}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-slate-300" />
              {previousLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5">
        {hasData ? (
          <div className={`flex gap-3 ${DASHBOARD_CHART_PLOT_CLASS}`}>
            <div className="flex h-full w-8 shrink-0 flex-col justify-between pb-4 text-[11px] font-semibold text-slate-400">
              {[100, 80, 60, 40, 20, 0].map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>

            <div className="min-w-0 flex-1">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="h-full w-full"
                preserveAspectRatio="none"
              >
                {[0, 20, 40, 60, 80, 100].map((line) => {
                  const y = percentileToChartY(line, chartHeight);
                  return (
                    <line
                      key={line}
                      x1="0"
                      y1={y}
                      x2={chartWidth}
                      y2={y}
                      stroke="#e5e7eb"
                    />
                  );
                })}

                {data.map((item, index) => {
                  const centerX = groupWidth * index + groupWidth / 2;
                  const latestHeight =
                    item.latestValue == null
                      ? 0
                      : chartHeight - 18 - percentileToChartY(item.latestValue, chartHeight);
                  const previousHeight =
                    item.previousValue == null
                      ? 0
                      : chartHeight - 18 - percentileToChartY(item.previousValue, chartHeight);

                  const latestY =
                    item.latestValue == null
                      ? chartHeight - 18
                      : percentileToChartY(item.latestValue, chartHeight);

                  const previousY =
                    item.previousValue == null
                      ? chartHeight - 18
                      : percentileToChartY(item.previousValue, chartHeight);

                  return (
                    <g key={item.label}>
                      {item.latestValue != null ? (
                        <>
                          <rect
                            x={centerX - barWidth - 4}
                            y={latestY}
                            width={barWidth}
                            height={latestHeight}
                            rx="4"
                            fill="#1e40af"
                          />
                          <text
                            x={centerX - barWidth / 2 - 4}
                            y={latestY - 8}
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="700"
                            fill="#0f172a"
                          >
                            {item.latestDisplay}
                          </text>
                        </>
                      ) : (
                        <text
                          x={centerX - barWidth / 2 - 4}
                          y={chartHeight - 28}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="700"
                          fill="#94a3b8"
                        >
                          -
                        </text>
                      )}

                      {item.previousValue != null ? (
                        <>
                          <rect
                            x={centerX + 4}
                            y={previousY}
                            width={barWidth}
                            height={previousHeight}
                            rx="4"
                            fill="#cbd5e1"
                          />
                          <text
                            x={centerX + barWidth / 2 + 4}
                            y={previousY - 8}
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="700"
                            fill="#475569"
                          >
                            {item.previousDisplay}
                          </text>
                        </>
                      ) : (
                        <text
                          x={centerX + barWidth / 2 + 4}
                          y={chartHeight - 28}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="700"
                          fill="#94a3b8"
                        >
                          -
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              <div className="mt-2 flex items-start justify-between gap-2">
                {data.map((item) => (
                  <span
                    key={item.label}
                    className="min-w-0 flex-1 text-center text-[11px] font-semibold text-slate-600"
                  >
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className={DASHBOARD_CHART_EMPTY_CLASS}>
            비교할 과목 데이터가 없습니다.
          </div>
        )}
      </div>
    </article>
  );
}

function SchoolRecordTrendChart({ data }: { data: SchoolRecordTrendPoint[] }) {
  const chartWidth = 560;
  const chartHeight = DASHBOARD_CHART_PLOT_HEIGHT;
  const paddingX = 28;

  const points = data.map((item, index) => {
    const x =
      data.length <= 1
        ? chartWidth / 2
        : paddingX + (index * (chartWidth - paddingX * 2)) / (data.length - 1);

    return {
      ...item,
      x,
    };
  });

  const gradePoints = points
    .filter((item) => item.averageGrade != null)
    .map((item) => ({
      ...item,
      y: schoolGradeToChartY(item.averageGrade as number, chartHeight),
    }));

  const gradePath = buildPolylinePath(gradePoints);
  const hasData = gradePoints.length > 0;

  return (
    <article className={DASHBOARD_CHART_CARD_CLASS}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold tracking-tight text-slate-950">최근 성적 추이</h3>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-500">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              학기별 전과목 평균
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5">
        {hasData ? (
          <div className={`flex gap-3 ${DASHBOARD_CHART_PLOT_CLASS}`}>
            <div className="flex h-full w-6 shrink-0 flex-col justify-between pb-4 text-[11px] font-semibold text-slate-400">
              {[1, 3, 5, 7, 9].map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>

            <div className="min-w-0 flex-1">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="h-full w-full"
                preserveAspectRatio="none"
              >
                {[1, 3, 5, 7, 9].map((line) => {
                  const y = schoolGradeToChartY(line, chartHeight);
                  return (
                    <line
                      key={`school-${line}`}
                      x1="0"
                      y1={y}
                      x2={chartWidth}
                      y2={y}
                      stroke="#e5e7eb"
                      strokeDasharray="3 4"
                    />
                  );
                })}

                {gradePath ? (
                  <path
                    d={gradePath}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null}

                {gradePoints.map((point) => (
                  <g key={`school-grade-${point.label}`}>
                    <circle cx={point.x} cy={point.y} r="4.5" fill="#2563eb" />
                    <text
                      x={point.x}
                      y={point.y - 10}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="700"
                      fill="#1e3a8a"
                    >
                      {formatGrade(point.averageGrade)}
                    </text>
                  </g>
                ))}
              </svg>

              <div className="mt-2 flex items-start justify-between gap-2">
                {points.map((point) => (
                  <span
                    key={point.label}
                    className="min-w-0 flex-1 text-center text-[11px] font-semibold text-slate-500"
                  >
                    {point.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className={DASHBOARD_CHART_EMPTY_CLASS}>
            학기별 내신 데이터가 아직 연결되지 않았습니다.
          </div>
        )}
      </div>
    </article>
  );
}

function SchoolRecordSubjectAverageChart({
  data,
}: {
  data: SchoolRecordSubjectAveragePoint[];
}) {
  const chartWidth = 560;
  const chartHeight = DASHBOARD_CHART_PLOT_HEIGHT;
  const groupWidth = chartWidth / Math.max(data.length, 1);
  const barWidth = 28;
  const hasData = data.some((item) => item.averageGrade != null);

  return (
    <article className={DASHBOARD_CHART_CARD_CLASS}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold tracking-tight text-slate-950">
            과목별 평균 성적
          </h3>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-500">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-blue-800" />
              전학년 이수단위 반영 평균
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5">
        {hasData ? (
          <div className={`flex gap-3 ${DASHBOARD_CHART_PLOT_CLASS}`}>
            <div className="flex h-full w-6 shrink-0 flex-col justify-between pb-4 text-[11px] font-semibold text-slate-400">
              {[1, 3, 5, 7, 9].map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>

            <div className="min-w-0 flex-1">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="h-full w-full"
                preserveAspectRatio="none"
              >
                {[1, 3, 5, 7, 9].map((line) => {
                  const y = schoolGradeToChartY(line, chartHeight);
                  return (
                    <line
                      key={`subject-${line}`}
                      x1="0"
                      y1={y}
                      x2={chartWidth}
                      y2={y}
                      stroke="#e5e7eb"
                    />
                  );
                })}

                {data.map((item, index) => {
                  const centerX = groupWidth * index + groupWidth / 2;
                  const y =
                    item.averageGrade == null
                      ? chartHeight - 18
                      : schoolGradeToChartY(item.averageGrade, chartHeight);
                  const height =
                    item.averageGrade == null ? 0 : chartHeight - 18 - y;

                  return (
                    <g key={item.label}>
                      {item.averageGrade != null ? (
                        <>
                          <rect
                            x={centerX - barWidth / 2}
                            y={y}
                            width={barWidth}
                            height={height}
                            rx="6"
                            fill="#1e40af"
                          />
                          <text
                            x={centerX}
                            y={y - 8}
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="700"
                            fill="#0f172a"
                          >
                            {item.display}
                          </text>
                        </>
                      ) : (
                        <text
                          x={centerX}
                          y={chartHeight - 28}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="700"
                          fill="#94a3b8"
                        >
                          -
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              <div className="mt-2 flex items-start justify-between gap-2">
                {data.map((item) => (
                  <span
                    key={item.label}
                    className="min-w-0 flex-1 text-center text-[11px] font-semibold text-slate-600"
                  >
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className={DASHBOARD_CHART_EMPTY_CLASS}>
            과목별 평균을 계산할 내신 데이터가 아직 연결되지 않았습니다.
          </div>
        )}
      </div>
    </article>
  );
}

function HakjongFitDashboardChart({
  domains,
}: {
  domains: HakjongFitDomainSummary[];
}) {
  const hasData = domains.length > 0;

  return (
    <article className={DASHBOARD_CHART_CARD_CLASS}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold tracking-tight text-slate-950">
            학종 적합성 검사 결과
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            최종 완료된 검사 기준으로 3개 영역 결과를 한눈에 확인할 수 있습니다.
          </p>
        </div>
      </div>

      <div className="mt-5">
        {hasData ? (
          <div className={`flex gap-3 ${DASHBOARD_CHART_PLOT_CLASS}`}>
            <div className="flex h-full w-8 shrink-0 flex-col justify-between pb-4 text-[11px] font-semibold text-slate-400">
              {[100, 80, 60, 40, 20, 0].map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>

            <div className="relative min-w-0 flex-1">
              {[0, 20, 40, 60, 80, 100].map((line) => (
                <div
                  key={line}
                  className="absolute inset-x-0 border-t border-slate-200"
                  style={{ top: `${100 - line}%` }}
                />
              ))}

              <div className="relative flex h-full items-end justify-between gap-2 px-1 sm:gap-4 sm:px-2">
                {domains.map((item) => {
                  const barHeight = Math.min(
                    100,
                    Math.max(0, (item.convertedScore / item.convertedMaxScore) * 100),
                  );

                  return (
                    <div key={item.domain} className="flex flex-1 flex-col items-center justify-end">
                      <div className="mb-2 text-[11px] font-extrabold text-blue-700">
                        {formatScore(item.convertedScore)}
                      </div>

                      <div className="relative flex h-[150px] w-full max-w-[72px] items-end overflow-hidden rounded-t-[18px] bg-slate-100 shadow-inner sm:h-[160px] sm:max-w-[84px]">
                        <div
                          className="w-full rounded-t-[18px] bg-[linear-gradient(180deg,#bfdbfe_0%,#60a5fa_28%,#2563eb_62%,#1d4ed8_100%)] transition-all duration-500"
                          style={{ height: `${barHeight}%` }}
                        />
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-white/20" />
                      </div>

                      <div className="mt-3 text-center">
                        <p className="break-keep text-[12px] font-extrabold text-slate-700">
                          {item.domain}
                        </p>
                        <p className="mt-1 text-[11px] font-semibold text-slate-400">
                          {formatScore(item.convertedScore)} / {formatScore(item.convertedMaxScore)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className={DASHBOARD_CHART_EMPTY_CLASS}>
            표시할 검사 결과가 없습니다.
          </div>
        )}
      </div>
    </article>
  );
}

export default function DashboardPage() {
  const [records, setRecords] = useState<SavedMockExamRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [hakjongDomains, setHakjongDomains] = useState<HakjongFitDomainSummary[]>([]);
  const [isHakjongLoading, setIsHakjongLoading] = useState(true);
  const [hakjongLoadError, setHakjongLoadError] = useState<string | null>(null);

  const [schoolRecordRows, setSchoolRecordRows] = useState<SchoolRecordGradeRow[]>([]);
  const [isSchoolRecordLoading, setIsSchoolRecordLoading] = useState(true);
  const [schoolRecordLoadError, setSchoolRecordLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        setIsLoading(true);
        setLoadError(null);
        setIsHakjongLoading(true);
        setHakjongLoadError(null);
        setIsSchoolRecordLoading(true);
        setSchoolRecordLoadError(null);

        const [mockExamResponse, hakjongResponse, schoolRecordResult] = await Promise.all([
          fetch('/api/student/mock-exams', {
            method: 'GET',
            cache: 'no-store',
          }),
          fetch('/api/student/hakjong-fit/summary', {
            method: 'GET',
            cache: 'no-store',
          }),
          loadSchoolRecordRows(),
        ]);

        const mockExamPayload = (await mockExamResponse.json().catch(() => null)) as
          | { records?: SavedMockExamRecord[]; items?: SavedMockExamRecord[]; message?: string }
          | SavedMockExamRecord[]
          | null;

        if (!mockExamResponse.ok) {
          const message =
            mockExamPayload &&
            !Array.isArray(mockExamPayload) &&
            typeof mockExamPayload.message === 'string'
              ? mockExamPayload.message
              : '모의고사 성적을 불러오지 못했습니다.';
          throw new Error(message);
        }

        const nextRecords = Array.isArray(mockExamPayload)
          ? mockExamPayload
          : Array.isArray(mockExamPayload?.records)
            ? mockExamPayload.records
            : Array.isArray(mockExamPayload?.items)
              ? mockExamPayload.items
              : [];

        const hakjongPayload = (await hakjongResponse.json().catch(() => null)) as HakjongFitSummaryPayload | null;

        if (!hakjongResponse.ok) {
          const message =
            hakjongPayload &&
            typeof hakjongPayload === 'object' &&
            'message' in hakjongPayload &&
            typeof hakjongPayload.message === 'string'
              ? hakjongPayload.message
              : '학종 검사 결과를 불러오지 못했습니다.';
          throw new Error(message);
        }

        let nextHakjongDomains: HakjongFitDomainSummary[] = [];

        if (
          hakjongPayload &&
          typeof hakjongPayload === 'object' &&
          'success' in hakjongPayload &&
          hakjongPayload.success === true &&
          'hasResult' in hakjongPayload &&
          hakjongPayload.hasResult &&
          hakjongPayload.resultSummary
        ) {
          nextHakjongDomains = hakjongPayload.resultSummary.domains ?? [];
        }

        if (!isMounted) return;

        setRecords(nextRecords);
        setHakjongDomains(nextHakjongDomains);
        setSchoolRecordRows(schoolRecordResult.rows);
        setSchoolRecordLoadError(schoolRecordResult.error);
      } catch (error) {
        if (!isMounted) return;

        const message =
          error instanceof Error
            ? error.message
            : '대시보드 정보를 불러오지 못했습니다.';

        setLoadError(message);
        setHakjongLoadError(message);
        setSchoolRecordLoadError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsHakjongLoading(false);
          setIsSchoolRecordLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const savedExams = useMemo(() => {
    return [...records].sort(compareExamOrder);
  }, [records]);

  const latestExam = savedExams.length ? savedExams[savedExams.length - 1] : null;
  const previousExam = savedExams.length > 1 ? savedExams[savedExams.length - 2] : null;

  const latestAverageGrade = useMemo(() => {
    return getLatestAverageGrade(latestExam);
  }, [latestExam]);

  const gradeDelta = useMemo(() => {
    const current = getLatestAverageGrade(latestExam);
    const previous = getLatestAverageGrade(previousExam);

    if (current == null || previous == null) return null;
    return previous - current;
  }, [latestExam, previousExam]);

  const strengthInfo = useMemo(() => {
    return getStrengthAndWeakness(latestExam);
  }, [latestExam]);

  const trendSummaryData = useMemo(() => {
    return getTrendSummaryData(savedExams);
  }, [savedExams]);

  const comparisonData = useMemo(() => {
    return getSubjectComparisonData(latestExam, previousExam);
  }, [latestExam, previousExam]);

  const schoolRecordSummary = useMemo(() => {
    return buildSchoolRecordSummaryAverages(schoolRecordRows);
  }, [schoolRecordRows]);

  const schoolRecordTrendData = useMemo(() => {
    return buildSchoolRecordTrendData(schoolRecordRows);
  }, [schoolRecordRows]);

  const schoolRecordSubjectAverageData = useMemo(() => {
    return buildSchoolRecordSubjectAverageData(schoolRecordRows);
  }, [schoolRecordRows]);

  const latestExamShortLabel = latestExam ? fullExamLabel(latestExam) : '데이터 없음';
  const previousExamShortLabel = previousExam ? fullExamLabel(previousExam) : '이전 없음';

  const deltaNode =
    gradeDelta == null ? (
      <span className="text-slate-400">-</span>
    ) : gradeDelta > 0 ? (
      <span className="text-red-500">▲ {gradeDelta.toFixed(1)}</span>
    ) : gradeDelta < 0 ? (
      <span className="text-blue-600">▼ {Math.abs(gradeDelta).toFixed(1)}</span>
    ) : (
      <span className="text-slate-500">- 0.0</span>
    );

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border-2 border-blue-950 bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)] shadow-[0_30px_90px_rgba(15,23,42,0.14)]">
        <div className="relative overflow-hidden border-b border-blue-950 bg-[linear-gradient(135deg,#0f172a_0%,#172554_45%,#1d4ed8_100%)] px-5 py-7 sm:px-7 sm:py-8 lg:px-10">
          <div className="relative">
            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-white shadow-sm backdrop-blur-sm">
              Dashboard Summary
            </div>

            <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              학생 대시보드
            </h1>

            <p className="mt-3 text-sm leading-7 text-blue-50 sm:text-base">
              내신 성적, 모의고사 성적, 입결 검색, 입시 전략을 한눈에 확인하는 요약 페이지입니다.
            </p>
          </div>
        </div>

        <div className="p-6 lg:p-8">
          <div className="rounded-[24px] border-2 border-blue-900 bg-[linear-gradient(180deg,#eff6ff_0%,#dbeafe_100%)] p-6">
            <p className="text-sm text-slate-600">
              이 영역은 우선 유지했습니다. 내신 성적 요약 기준이 정해지면 모의고사 섹션 위쪽에 맞춰서 같은 스타일로 이어서 구성하면 됩니다.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-[30px] border-2 border-blue-950 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(239,246,255,0.92)_100%)] p-5 shadow-[0_22px_56px_rgba(15,23,42,0.10)] sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-950">
              내신 성적 요약
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              지정한 교과의 공통과목·일반선택과목 전과목을 이수단위 반영 방식으로 계산해 보여주는 영역입니다.
            </p>
          </div>

          <span className="inline-flex h-10 items-center justify-center rounded-xl border-2 border-blue-950 bg-[linear-gradient(180deg,#ffffff_0%,#dbeafe_100%)] px-4 text-sm font-bold text-blue-950 shadow-sm">
            계산식 기준 적용
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryMetricCard
            icon={<ClipboardIcon />}
            iconClassName="bg-blue-50 text-blue-600"
            title="국,수,영,사"
            value={
              <span>
                {schoolRecordSummary.koreanMathEnglishSocial == null
                  ? '--.--등급'
                  : `${formatGrade(schoolRecordSummary.koreanMathEnglishSocial)}등급`}
                <span className="mt-1 block text-[12px] font-semibold text-slate-500">
                  공통 · 일반선택
                </span>
              </span>
            }
          />

          <SummaryMetricCard
            icon={<ChartIcon />}
            iconClassName="bg-emerald-50 text-emerald-600"
            title="국,수,영,과"
            value={
              <span>
                {schoolRecordSummary.koreanMathEnglishScience == null
                  ? '--.--등급'
                  : `${formatGrade(schoolRecordSummary.koreanMathEnglishScience)}등급`}
                <span className="mt-1 block text-[12px] font-semibold text-slate-500">
                  공통 · 일반선택
                </span>
              </span>
            }
          />

          <SummaryMetricCard
            icon={<ArrowIcon />}
            iconClassName="bg-orange-50 text-orange-500"
            title="국,수,영,사,과"
            value={
              <span>
                {schoolRecordSummary.koreanMathEnglishSocialScience == null
                  ? '--.--등급'
                  : `${formatGrade(schoolRecordSummary.koreanMathEnglishSocialScience)}등급`}
                <span className="mt-1 block text-[12px] font-semibold text-slate-500">
                  공통 · 일반선택
                </span>
              </span>
            }
          />

          <SummaryMetricCard
            icon={<StarIcon />}
            iconClassName="bg-violet-50 text-violet-600"
            title="전과목"
            value={
              <span>
                {schoolRecordSummary.allSubjects == null
                  ? '--.--등급'
                  : `${formatGrade(schoolRecordSummary.allSubjects)}등급`}
                <span className="mt-1 block text-[12px] font-semibold text-slate-500">
                  등급·이수단위가 있는 모든 과목
                </span>
              </span>
            }
          />
        </div>

        {isSchoolRecordLoading ? (
          <div className="rounded-[24px] border-2 border-blue-950 bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)] p-6 text-sm font-semibold text-blue-950 shadow-[0_14px_36px_rgba(15,23,42,0.10)]">
            내신 성적 데이터를 불러오는 중입니다...
          </div>
        ) : schoolRecordLoadError ? (
          <div className="rounded-[24px] border-2 border-red-500 bg-[linear-gradient(180deg,#fff1f2_0%,#ffe4e6_100%)] p-6 text-sm font-semibold text-red-700 shadow-[0_14px_36px_rgba(15,23,42,0.10)]">
            {schoolRecordLoadError}
          </div>
        ) : !schoolRecordRows.length ? (
          <div className="rounded-[24px] border-2 border-dashed border-blue-400 bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)] p-8 text-center shadow-[0_14px_36px_rgba(15,23,42,0.10)]">
            <p className="text-base font-bold text-slate-900">
              아직 연결된 내신 성적 데이터가 없습니다.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              학기별 과목 등급과 이수단위 데이터가 저장되면 카드와 그래프가 자동으로 표시됩니다.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            <SchoolRecordTrendChart data={schoolRecordTrendData} />
            <SchoolRecordSubjectAverageChart data={schoolRecordSubjectAverageData} />
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-[30px] border-2 border-blue-950 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(239,246,255,0.92)_100%)] p-5 shadow-[0_22px_56px_rgba(15,23,42,0.10)] sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-950">
            모의고사 성적 요약
          </h2>

          <Link
            href="/student/mock-exams"
            className="inline-flex h-10 items-center justify-center rounded-xl border-2 border-blue-950 bg-[linear-gradient(180deg,#ffffff_0%,#dbeafe_100%)] px-4 text-sm font-bold text-blue-950 shadow-sm transition hover:brightness-[0.98]"
          >
            성적 입력
          </Link>
        </div>

        {isLoading ? (
          <div className="rounded-[24px] border-2 border-blue-950 bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)] p-6 text-sm font-semibold text-blue-950 shadow-[0_14px_36px_rgba(15,23,42,0.10)]">
            모의고사 데이터를 불러오는 중입니다...
          </div>
        ) : loadError ? (
          <div className="rounded-[24px] border-2 border-red-500 bg-[linear-gradient(180deg,#fff1f2_0%,#ffe4e6_100%)] p-6 text-sm font-semibold text-red-700 shadow-[0_14px_36px_rgba(15,23,42,0.10)]">
            {loadError}
          </div>
        ) : !savedExams.length ? (
          <div className="rounded-[24px] border-2 border-dashed border-blue-400 bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)] p-8 text-center shadow-[0_14px_36px_rgba(15,23,42,0.10)]">
            <p className="text-base font-bold text-slate-900">
              아직 저장된 모의고사 성적이 없습니다.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              성적을 저장하면 최근 모의고사, 평균 등급, 성적 추이, 과목 비교가 여기에 표시됩니다.
            </p>
            <Link
              href="/student/mock-exams"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              첫 성적 입력하기
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryMetricCard
                icon={<ClipboardIcon />}
                iconClassName="bg-blue-50 text-blue-600"
                title="최근 모의고사"
                value={latestExamShortLabel}
              />

              <SummaryMetricCard
                icon={<ChartIcon />}
                iconClassName="bg-emerald-50 text-emerald-600"
                title="평균 등급"
                value={formatGrade(latestAverageGrade)}
              />

              <SummaryMetricCard
                icon={<ArrowIcon />}
                iconClassName="bg-orange-50 text-orange-500"
                title="직전 대비"
                value={deltaNode}
              />

              <SummaryMetricCard
                icon={<StarIcon />}
                iconClassName="bg-violet-50 text-violet-600"
                title="강점 과목 / 보완 과목"
                value={
                  <span>
                    <span className="text-blue-600">{strengthInfo.strongest}</span>
                    <span className="text-slate-400"> / </span>
                    <span className="text-red-500">{strengthInfo.weakest}</span>
                  </span>
                }
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <RecentTrendChart data={trendSummaryData} />
              <SubjectComparisonChart
                latestLabel={latestExamShortLabel}
                previousLabel={previousExamShortLabel}
                data={comparisonData}
              />
            </div>

            <div className="rounded-[20px] border-2 border-blue-900 bg-[linear-gradient(180deg,#eff6ff_0%,#dbeafe_100%)] px-4 py-3 text-[12px] font-semibold text-blue-950">
              최근 성적 추이는 평균 등급과 백분위 평균을 함께 표시하고, 과목 비교는 국어·수학·탐구는 백분위 기준, 영어·한국사는 등급 기준으로 비교합니다.
            </div>
          </>
        )}
      </section>

      <section className="space-y-4 rounded-[30px] border-2 border-blue-950 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(239,246,255,0.92)_100%)] p-5 shadow-[0_22px_56px_rgba(15,23,42,0.10)] sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-950">
            학종 적합성 검사 결과
          </h2>

          <Link
            href="/student/hakjong-fit"
            className="inline-flex h-10 items-center justify-center rounded-xl border-2 border-blue-950 bg-[linear-gradient(180deg,#ffffff_0%,#dbeafe_100%)] px-4 text-sm font-bold text-blue-950 shadow-sm transition hover:brightness-[0.98]"
          >
            결과 보기
          </Link>
        </div>

        {isHakjongLoading ? (
          <div className="rounded-[24px] border-2 border-blue-950 bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)] p-6 text-sm font-semibold text-blue-950 shadow-[0_14px_36px_rgba(15,23,42,0.10)]">
            학종 검사 결과를 불러오는 중입니다...
          </div>
        ) : hakjongLoadError ? (
          <div className="rounded-[24px] border-2 border-red-500 bg-[linear-gradient(180deg,#fff1f2_0%,#ffe4e6_100%)] p-6 text-sm font-semibold text-red-700 shadow-[0_14px_36px_rgba(15,23,42,0.10)]">
            {hakjongLoadError}
          </div>
        ) : hakjongDomains.length === 0 ? (
          <div className="rounded-[24px] border-2 border-dashed border-blue-400 bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)] p-8 text-center shadow-[0_14px_36px_rgba(15,23,42,0.10)]">
            <p className="text-base font-bold text-slate-900">
              아직 완료된 학종 적합성 검사 결과가 없습니다.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              검사를 끝까지 완료하면 영역별 결과 그래프가 여기에 표시됩니다.
            </p>
            <Link
              href="/student/hakjong-fit"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              검사 페이지로 이동
            </Link>
          </div>
        ) : (
          <HakjongFitDashboardChart domains={hakjongDomains} />
        )}
      </section>
    </div>
  );
}
