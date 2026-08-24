import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

type SelectedGradeRow = {
  id: string;
  academicTermLabel: string;
  schoolYear: number;
  semester: number;
  subjectGroupSnapshot: string;
  completionTypeSnapshot: string | null;
  subjectName: string;
  credits: number | null;
  grade: number | null;
  updatedAt: Date;
};

type LockedSubmissionPayload = {
  id: string;
  userId: string;
  inputMethod: string;
  fileName: string | null;
  status: string;
  isLocked: boolean;
  finalizedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  grades: SelectedGradeRow[];
};

type SubjectGroupKey = "국어" | "수학" | "영어" | "사회" | "과학";

type SemesterAnalysisDraft = {
  schoolYear: number;
  semester: number;
  academicTermLabel: string;
  displayOrder: number;
  averageGrade: number | null;
  totalCredits: number;
  subjectCount: number;
  usableSubjectCount: number;
};

type SubjectAnalysisDraft = {
  subjectGroup: SubjectGroupKey;
  displayOrder: number;
  averageGrade: number | null;
  totalCredits: number;
  subjectCount: number;
};

const CALCULATION_VERSION = "v1";
const SUBJECT_GROUP_ORDER: SubjectGroupKey[] = ["국어", "수학", "영어", "사회", "과학"];

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function getNormalizedSubjectGroup(row: Pick<SelectedGradeRow, "subjectGroupSnapshot" | "subjectName">): SubjectGroupKey | null {
  const raw = normalizeText(row.subjectGroupSnapshot || row.subjectName);

  if (!raw) return null;
  if (raw.includes("국어")) return "국어";
  if (raw.includes("수학")) return "수학";
  if (raw.includes("영어")) return "영어";
  if (raw.includes("사회") || raw.includes("역사") || raw.includes("한국사")) return "사회";
  if (raw.includes("과학")) return "과학";

  return null;
}

function isCommonOrGeneralSelectionCourse(row: Pick<SelectedGradeRow, "completionTypeSnapshot">): boolean {
  const normalized = normalizeText(row.completionTypeSnapshot);
  return normalized.includes("공통") || normalized.includes("일반선택");
}

function getUsableGrade(row: Pick<SelectedGradeRow, "grade">): number | null {
  return typeof row.grade === "number" && Number.isFinite(row.grade) ? row.grade : null;
}

function getUsableCredits(row: Pick<SelectedGradeRow, "credits">): number | null {
  return typeof row.credits === "number" && Number.isFinite(row.credits) && row.credits > 0
    ? row.credits
    : null;
}

function hasUsableScore(row: Pick<SelectedGradeRow, "grade" | "credits">): boolean {
  return getUsableGrade(row) != null && getUsableCredits(row) != null;
}

function calculateWeightedAverage(rows: Array<Pick<SelectedGradeRow, "grade" | "credits">>): number | null {
  const usableRows = rows.filter(hasUsableScore);
  if (!usableRows.length) return null;

  const totalCredits = usableRows.reduce((sum, row) => sum + (getUsableCredits(row) ?? 0), 0);
  if (totalCredits <= 0) return null;

  const weightedSum = usableRows.reduce(
    (sum, row) => sum + (getUsableGrade(row) ?? 0) * (getUsableCredits(row) ?? 0),
    0,
  );

  return Number((weightedSum / totalCredits).toFixed(2));
}

function sumCredits(rows: Array<Pick<SelectedGradeRow, "credits">>): number {
  return Number(
    rows.reduce((sum, row) => sum + (getUsableCredits(row) ?? 0), 0).toFixed(2),
  );
}

function getSemesterLabel(row: Pick<SelectedGradeRow, "academicTermLabel" | "schoolYear" | "semester">): string {
  if (row.academicTermLabel?.trim()) return row.academicTermLabel.trim();
  return `${row.schoolYear}학년 ${row.semester}학기`;
}

function getSemesterDisplayOrder(row: Pick<SelectedGradeRow, "schoolYear" | "semester">): number {
  return row.schoolYear * 10 + row.semester;
}

function buildSummary(grades: SelectedGradeRow[]) {
  const usableRows = grades.filter(hasUsableScore);
  const commonGeneralRows = grades.filter(
    (row) => hasUsableScore(row) && isCommonOrGeneralSelectionCourse(row),
  );

  const matchesSubjects = (row: SelectedGradeRow, subjects: readonly SubjectGroupKey[]): boolean => {
    const group = getNormalizedSubjectGroup(row);
    return group != null && subjects.includes(group);
  };

  const semesterKeys = new Set(
    usableRows.map((row) => `${row.schoolYear}-${row.semester}`),
  );

  return {
    koreanMathEnglishSocialGrade: calculateWeightedAverage(
      commonGeneralRows.filter((row) => matchesSubjects(row, ["국어", "수학", "영어", "사회"])),
    ),
    koreanMathEnglishScienceGrade: calculateWeightedAverage(
      commonGeneralRows.filter((row) => matchesSubjects(row, ["국어", "수학", "영어", "과학"])),
    ),
    koreanMathEnglishSocialScienceGrade: calculateWeightedAverage(
      commonGeneralRows.filter((row) =>
        matchesSubjects(row, ["국어", "수학", "영어", "사회", "과학"]),
      ),
    ),
    allSubjectsGrade: calculateWeightedAverage(usableRows),
    totalGradeRowCount: grades.length,
    usableGradeRowCount: usableRows.length,
    commonGeneralRowCount: commonGeneralRows.length,
    semesterCount: semesterKeys.size,
  };
}

function buildSemesterAnalyses(grades: SelectedGradeRow[]): SemesterAnalysisDraft[] {
  const semesterMap = new Map<string, SelectedGradeRow[]>();

  grades.forEach((row) => {
    const key = `${row.schoolYear}-${row.semester}`;
    const existing = semesterMap.get(key);

    if (existing) {
      existing.push(row);
      return;
    }

    semesterMap.set(key, [row]);
  });

  return [...semesterMap.values()]
    .map((rows) => {
      const base = rows[0];
      const usableRows = rows.filter(hasUsableScore);

      return {
        schoolYear: base.schoolYear,
        semester: base.semester,
        academicTermLabel: getSemesterLabel(base),
        displayOrder: getSemesterDisplayOrder(base),
        averageGrade: calculateWeightedAverage(usableRows),
        totalCredits: sumCredits(usableRows),
        subjectCount: rows.length,
        usableSubjectCount: usableRows.length,
      } satisfies SemesterAnalysisDraft;
    })
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

function buildSubjectAnalyses(grades: SelectedGradeRow[]): SubjectAnalysisDraft[] {
  const usableRows = grades.filter(
    (row) => hasUsableScore(row) && getNormalizedSubjectGroup(row) != null,
  );

  return SUBJECT_GROUP_ORDER.map((subjectGroup, index) => {
    const rows = usableRows.filter((row) => getNormalizedSubjectGroup(row) === subjectGroup);

    return {
      subjectGroup,
      displayOrder: index + 1,
      averageGrade: calculateWeightedAverage(rows),
      totalCredits: sumCredits(rows),
      subjectCount: rows.length,
    } satisfies SubjectAnalysisDraft;
  }).filter((item) => item.subjectCount > 0);
}

function getLatestSourceUpdatedAt(submission: LockedSubmissionPayload): Date {
  const timestamps = [
    submission.createdAt.getTime(),
    submission.updatedAt.getTime(),
    submission.finalizedAt?.getTime() ?? 0,
    ...submission.grades.map((grade) => grade.updatedAt.getTime()),
  ];

  return new Date(Math.max(...timestamps));
}

async function getLockedSubmission(userId: string): Promise<LockedSubmissionPayload | null> {
  return db.studentRecordSubmission.findFirst({
    where: {
      userId,
      isLocked: true,
    },
    orderBy: [{ finalizedAt: "desc" }, { updatedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      userId: true,
      inputMethod: true,
      fileName: true,
      status: true,
      isLocked: true,
      finalizedAt: true,
      createdAt: true,
      updatedAt: true,
      grades: {
        orderBy: [
          { schoolYear: "asc" },
          { semester: "asc" },
          { subjectName: "asc" },
        ],
        select: {
          id: true,
          academicTermLabel: true,
          schoolYear: true,
          semester: true,
          subjectGroupSnapshot: true,
          completionTypeSnapshot: true,
          subjectName: true,
          credits: true,
          grade: true,
          updatedAt: true,
        },
      },
    },
  });
}

function buildCalculationMemo(summary: ReturnType<typeof buildSummary>): string {
  return [
    `계산 버전 ${CALCULATION_VERSION}`,
    `전체 ${summary.totalGradeRowCount}건 중 사용 가능 ${summary.usableGradeRowCount}건 반영`,
    `공통·일반선택 ${summary.commonGeneralRowCount}건 반영`,
    `학기 ${summary.semesterCount}개 집계`,
  ].join(" | ");
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "로그인이 필요합니다.",
        },
        { status: 401 },
      );
    }

    const latestAnalysis = await db.studentRecordAnalysis.findFirst({
      where: {
        userId: currentUser.id,
        isLatest: true,
      },
      orderBy: [{ calculatedAt: "desc" }, { createdAt: "desc" }],
      include: {
        semesters: {
          orderBy: [{ displayOrder: "asc" }, { schoolYear: "asc" }, { semester: "asc" }],
        },
        subjects: {
          orderBy: [{ displayOrder: "asc" }, { subjectGroup: "asc" }],
        },
      },
    });

    if (!latestAnalysis) {
      return NextResponse.json({
        success: true,
        hasAnalysis: false,
        message: "저장된 내신 분석 결과가 없습니다.",
        analysis: null,
      });
    }

    return NextResponse.json({
      success: true,
      hasAnalysis: true,
      analysis: latestAnalysis,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "내신 분석 결과를 불러오지 못했습니다.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 },
    );
  }
}

export async function POST(_request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "로그인이 필요합니다.",
        },
        { status: 401 },
      );
    }

    const submission = await getLockedSubmission(currentUser.id);

    if (!submission) {
      return NextResponse.json(
        {
          success: false,
          message: "계산할 잠금 완료 내신 성적 제출본이 없습니다.",
        },
        { status: 404 },
      );
    }

    const summary = buildSummary(submission.grades);
    const semesters = buildSemesterAnalyses(submission.grades);
    const subjects = buildSubjectAnalyses(submission.grades);
    const sourceUpdatedAt = getLatestSourceUpdatedAt(submission);
    const calculationMemo = buildCalculationMemo(summary);

    const savedAnalysis = await db.$transaction(async (tx) => {
      await tx.studentRecordAnalysis.updateMany({
        where: {
          userId: currentUser.id,
          isLatest: true,
        },
        data: {
          isLatest: false,
        },
      });

      const analysis = await tx.studentRecordAnalysis.upsert({
        where: {
          submissionId_calculationVersion: {
            submissionId: submission.id,
            calculationVersion: CALCULATION_VERSION,
          },
        },
        create: {
          userId: currentUser.id,
          submissionId: submission.id,
          calculationVersion: CALCULATION_VERSION,
          sourceUpdatedAt,
          calculatedAt: new Date(),
          isLatest: true,
          koreanMathEnglishSocialGrade: summary.koreanMathEnglishSocialGrade,
          koreanMathEnglishScienceGrade: summary.koreanMathEnglishScienceGrade,
          koreanMathEnglishSocialScienceGrade: summary.koreanMathEnglishSocialScienceGrade,
          allSubjectsGrade: summary.allSubjectsGrade,
          totalGradeRowCount: summary.totalGradeRowCount,
          usableGradeRowCount: summary.usableGradeRowCount,
          commonGeneralRowCount: summary.commonGeneralRowCount,
          semesterCount: summary.semesterCount,
          calculationMemo,
          errorMessage: null,
        },
        update: {
          sourceUpdatedAt,
          calculatedAt: new Date(),
          isLatest: true,
          koreanMathEnglishSocialGrade: summary.koreanMathEnglishSocialGrade,
          koreanMathEnglishScienceGrade: summary.koreanMathEnglishScienceGrade,
          koreanMathEnglishSocialScienceGrade: summary.koreanMathEnglishSocialScienceGrade,
          allSubjectsGrade: summary.allSubjectsGrade,
          totalGradeRowCount: summary.totalGradeRowCount,
          usableGradeRowCount: summary.usableGradeRowCount,
          commonGeneralRowCount: summary.commonGeneralRowCount,
          semesterCount: summary.semesterCount,
          calculationMemo,
          errorMessage: null,
        },
      });

      await tx.studentRecordAnalysisSemester.deleteMany({
        where: {
          analysisId: analysis.id,
        },
      });

      await tx.studentRecordAnalysisSubject.deleteMany({
        where: {
          analysisId: analysis.id,
        },
      });

      if (semesters.length) {
        await tx.studentRecordAnalysisSemester.createMany({
          data: semesters.map((item) => ({
            analysisId: analysis.id,
            userId: currentUser.id,
            schoolYear: item.schoolYear,
            semester: item.semester,
            academicTermLabel: item.academicTermLabel,
            displayOrder: item.displayOrder,
            averageGrade: item.averageGrade,
            totalCredits: item.totalCredits,
            subjectCount: item.subjectCount,
            usableSubjectCount: item.usableSubjectCount,
          })),
        });
      }

      if (subjects.length) {
        await tx.studentRecordAnalysisSubject.createMany({
          data: subjects.map((item) => ({
            analysisId: analysis.id,
            userId: currentUser.id,
            subjectGroup: item.subjectGroup,
            displayOrder: item.displayOrder,
            averageGrade: item.averageGrade,
            totalCredits: item.totalCredits,
            subjectCount: item.subjectCount,
          })),
        });
      }

      return tx.studentRecordAnalysis.findUnique({
        where: {
          id: analysis.id,
        },
        include: {
          semesters: {
            orderBy: [{ displayOrder: "asc" }, { schoolYear: "asc" }, { semester: "asc" }],
          },
          subjects: {
            orderBy: [{ displayOrder: "asc" }, { subjectGroup: "asc" }],
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "내신 분석 결과를 계산하고 저장했습니다.",
      submission: {
        id: submission.id,
        inputMethod: submission.inputMethod,
        fileName: submission.fileName,
        status: submission.status,
        isLocked: submission.isLocked,
        finalizedAt: submission.finalizedAt,
        updatedAt: submission.updatedAt,
      },
      analysis: savedAnalysis,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "내신 분석 결과 저장에 실패했습니다.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 },
    );
  }
}
