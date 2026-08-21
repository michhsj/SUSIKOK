import { NextRequest, NextResponse } from "next/server";
import {
  EntitlementFeatureCode,
  EntitlementStatus,
  Prisma,
  UniversityConversionRuleStatus,
} from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getSupportLevelLabel } from "@/lib/student/support-level";
import { calculateUniversityConversionSummaryFromTestSet } from "@/lib/university-conversion/calculate-rule-summary";

type SummaryField = { label: string; value: string };

type YearTableRow = {
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
};

type ChartSeries = { name: string; data: (number | null)[] };

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
  summaryFields: SummaryField[];
  yearTable: {
    columns: string[];
    rows: YearTableRow[];
  };
  charts: {
    competitionRate: {
      title: string;
      labels: string[];
      series: ChartSeries[];
    };
    scoreTrend: {
      title: string;
      labels: string[];
      series: ChartSeries[];
    };
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
};

type CalculateUniversityConversionInput = Parameters<
  typeof calculateUniversityConversionSummaryFromTestSet
>[0];

type CalculateUniversityConversionPayload =
  CalculateUniversityConversionInput["payload"];

const RULE_SPECIFICITY_PRIORITY_KEYS = [
  "recruitmentUnit",
  "collegeName",
  "admissionName",
  "track",
] as const;

function toStringValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toDisplayText(value: unknown): string {
  const text = toStringValue(value);
  return text || "-";
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

function toFixedScore(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  if (!Number.isFinite(value)) return "-";
  return value.toFixed(2);
}

function buildSummaryFields(row: any): SummaryField[] {
  return [
    { label: "전형방법", value: toDisplayText(row.admissionMethod) },
    { label: "학생부반영", value: toDisplayText(row.studentRecordReflection) },
    { label: "최저학력기준", value: toDisplayText(row.minimumAcademicRequirement) },
    { label: "원서접수", value: toDisplayText(row.applicationPeriod) },
    { label: "1차합격", value: toDisplayText(row.firstRoundAnnouncement) },
    { label: "논술/면접", value: toDisplayText(row.interviewOrEssayDate) },
    { label: "최종합격", value: toDisplayText(row.finalAnnouncement) },
    { label: "전형특기사항", value: toDisplayText(row.admissionSpecialNotes) },
  ];
}

function buildYearTableRows(row: any): YearTableRow[] {
  return [
    {
      year: "2026",
      recruitmentCount: toDisplayText(row.year26RecruitmentCountRaw),
      applicantCount: toDisplayText(row.year26ApplicantCountRaw),
      competitionRate: toDisplayText(row.year26CompetitionRateRaw),
      additionalPassCount: toDisplayText(row.year26AdditionalPassCountRaw),
      minSatisfiedRate: toDisplayText(row.year26MinSatisfiedRateRaw),
      minSatisfiedCount: toDisplayText(row.year26MinSatisfiedCountRaw),
      actualCompetitionRate: toDisplayText(row.year26ActualCompetitionRateRaw),
      score50: toDisplayText(row.year26Score50Raw),
      score70: toDisplayText(row.year26Score70Raw),
      converted50: toDisplayText(row.year26Converted50Raw),
      converted70: toDisplayText(row.year26Converted70Raw),
    },
    {
      year: "2025",
      recruitmentCount: toDisplayText(row.year25RecruitmentCountRaw),
      applicantCount: toDisplayText(row.year25ApplicantCountRaw),
      competitionRate: toDisplayText(row.year25CompetitionRateRaw),
      additionalPassCount: toDisplayText(row.year25AdditionalPassCountRaw),
      minSatisfiedRate: toDisplayText(row.year25MinSatisfiedRateRaw),
      minSatisfiedCount: toDisplayText(row.year25MinSatisfiedCountRaw),
      actualCompetitionRate: toDisplayText(row.year25ActualCompetitionRateRaw),
      score50: toDisplayText(row.year25Score50Raw),
      score70: toDisplayText(row.year25Score70Raw),
      converted50: toDisplayText(row.year25Converted50Raw),
      converted70: toDisplayText(row.year25Converted70Raw),
    },
    {
      year: "2024",
      recruitmentCount: toDisplayText(row.year24RecruitmentCountRaw),
      applicantCount: toDisplayText(row.year24ApplicantCountRaw),
      competitionRate: toDisplayText(row.year24CompetitionRateRaw),
      additionalPassCount: toDisplayText(row.year24AdditionalPassCountRaw),
      minSatisfiedRate: toDisplayText(row.year24MinSatisfiedRateRaw),
      minSatisfiedCount: toDisplayText(row.year24MinSatisfiedCountRaw),
      actualCompetitionRate: toDisplayText(row.year24ActualCompetitionRateRaw),
      score50: toDisplayText(row.year24Score50Raw),
      score70: toDisplayText(row.year24Score70Raw),
      converted50: toDisplayText(row.year24Converted50Raw),
      converted70: toDisplayText(row.year24Converted70Raw),
    },
  ];
}

function buildCharts(
  yearRows: YearTableRow[],
  currentHeadcountRaw: string | null,
): DetailItem["charts"] {
  const graphRows = [...yearRows].sort((a, b) => Number(a.year) - Number(b.year));

  return {
    competitionRate: {
      title: "경쟁률 추이",
      labels: ["2024", "2025", "2026", "2027"],
      series: [
        {
          name: "모집인원",
          data: [
            toNumber(graphRows[0]?.recruitmentCount),
            toNumber(graphRows[1]?.recruitmentCount),
            toNumber(graphRows[2]?.recruitmentCount),
            toNumber(currentHeadcountRaw),
          ],
        },
        {
          name: "경쟁률",
          data: [
            toNumber(graphRows[0]?.competitionRate),
            toNumber(graphRows[1]?.competitionRate),
            toNumber(graphRows[2]?.competitionRate),
            null,
          ],
        },
      ],
    },
    scoreTrend: {
      title: "점수 추이",
      labels: graphRows.map((r) => r.year),
      series: [
        {
          name: "성적70%",
          data: graphRows.map((r) => toNumber(r.score70)),
        },
        {
          name: "환산70%",
          data: graphRows.map((r) => toNumber(r.converted70)),
        },
      ],
    },
  };
}

function hasText(value: unknown): boolean {
  return toStringValue(value).length > 0;
}

function matchesRuleToTarget(rule: RuleCandidate, target: RuleTargetScope): boolean {
  if (rule.region !== target.region) return false;
  if (rule.university !== target.university) return false;
  if (rule.admissionType !== target.admissionType) return false;

  const optionalKeys: Array<
    keyof Pick<
      RuleTargetScope,
      "admissionName" | "track" | "collegeName" | "recruitmentUnit"
    >
  > = ["admissionName", "track", "collegeName", "recruitmentUnit"];

  for (const key of optionalKeys) {
    const ruleValue = toStringValue(rule[key]);
    const targetValue = toStringValue(target[key]);

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

function mapStudentGradeToCalculationRow(grade: StudentGradeRow) {
  return {
    academicTerm: grade.academicTermLabel,
    subjectGroup: grade.subjectGroupSnapshot,
    completionType: grade.completionTypeSnapshot ?? "",
    subjectName: grade.subjectName,
    credits: grade.credits != null ? String(grade.credits) : "",
    rawScore: grade.rawScore != null ? String(grade.rawScore) : "",
    averageScore: grade.averageScore != null ? String(grade.averageScore) : "",
    standardDeviation:
      grade.standardDeviation != null ? String(grade.standardDeviation) : "",
    achievement: grade.achievement ?? "",
    grade: grade.grade != null ? String(grade.grade) : "",
    enrolledStudentCount:
      grade.enrolledStudentCount != null ? String(grade.enrolledStudentCount) : "",
    achievementARatio:
      grade.achievementARatio != null ? String(grade.achievementARatio) : "",
    achievementBRatio:
      grade.achievementBRatio != null ? String(grade.achievementBRatio) : "",
    achievementCRatio:
      grade.achievementCRatio != null ? String(grade.achievementCRatio) : "",
  };
}

function mapAttendanceToCalculationInput(attendance: StudentAttendanceRow | null) {
  if (!attendance) return null;

  return {
    absenceDays: attendance.absence != null ? String(attendance.absence) : "",
    lateness: attendance.lateness != null ? String(attendance.lateness) : "",
    earlyLeave: attendance.earlyLeave != null ? String(attendance.earlyLeave) : "",
    outing: attendance.outing != null ? String(attendance.outing) : "",
  };
}

function getLatestTimestamp(
  values: Array<Date | string | number | null | undefined>,
): number {
  return values.reduce<number>((max, value) => {
    if (value == null) return max;

    if (value instanceof Date) {
      const time = value.getTime();
      return Number.isFinite(time) ? Math.max(max, time) : max;
    }

    if (typeof value === "number") {
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }

    if (typeof value === "string") {
      const time = new Date(value).getTime();
      return Number.isFinite(time) ? Math.max(max, time) : max;
    }

    return max;
  }, 0);
}

function isRulePayloadObject(
  value: Prisma.JsonValue | null,
): value is Prisma.JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function getOptionalCurrentUser() {
  try {
    return await getCurrentUser();
  } catch (error) {
    console.error("[student/admissions/search/[id]] getCurrentUser failed:", error);
    return null;
  }
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "id가 없습니다." },
        { status: 400 },
      );
    }

    const row = await db.admissionResult.findFirst({
      where: { id, isActive: true },
      select: {
        id: true,
        updatedAt: true,
        region: true,
        universityName: true,
        admissionType: true,
        admissionName: true,
        track: true,
        collegeName: true,
        recruitmentUnit: true,
        admissionMethod: true,
        studentRecordReflection: true,
        admissionSpecialNotes: true,
        minimumAcademicRequirement: true,
        applicationPeriod: true,
        firstRoundAnnouncement: true,
        interviewOrEssayDate: true,
        finalAnnouncement: true,
        currentHeadcountRaw: true,
        year26RecruitmentCountRaw: true,
        year26ApplicantCountRaw: true,
        year26CompetitionRateRaw: true,
        year26AdditionalPassCountRaw: true,
        year26MinSatisfiedRateRaw: true,
        year26MinSatisfiedCountRaw: true,
        year26ActualCompetitionRateRaw: true,
        year26Score50Raw: true,
        year26Score70Raw: true,
        year26Converted50Raw: true,
        year26Converted70Raw: true,
        year25RecruitmentCountRaw: true,
        year25ApplicantCountRaw: true,
        year25CompetitionRateRaw: true,
        year25AdditionalPassCountRaw: true,
        year25MinSatisfiedRateRaw: true,
        year25MinSatisfiedCountRaw: true,
        year25ActualCompetitionRateRaw: true,
        year25Score50Raw: true,
        year25Score70Raw: true,
        year25Converted50Raw: true,
        year25Converted70Raw: true,
        year24RecruitmentCountRaw: true,
        year24ApplicantCountRaw: true,
        year24CompetitionRateRaw: true,
        year24AdditionalPassCountRaw: true,
        year24MinSatisfiedRateRaw: true,
        year24MinSatisfiedCountRaw: true,
        year24ActualCompetitionRateRaw: true,
        year24Score50Raw: true,
        year24Score70Raw: true,
        year24Converted50Raw: true,
        year24Converted70Raw: true,
      },
    });

    if (!row) {
      return NextResponse.json(
        { success: false, message: "데이터를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const user = await getOptionalCurrentUser();

    let premiumLocked = true;
    let convertedScoreDisplay = "결제 후 이용 가능";
    let supportLevelDisplay = "결제 후 이용 가능";
    let saved = false;

    if (user?.id) {
      const now = new Date();

      const entitlement = await db.userEntitlement.findFirst({
        where: {
          userId: user.id,
          featureCode: EntitlementFeatureCode.ANALYSIS_30D,
          status: EntitlementStatus.ACTIVE,
          expiresAt: {
            gt: now,
          },
        },
        select: {
          id: true,
        },
      });

      premiumLocked = !entitlement;

      if (entitlement) {
        const [cachedAnalysis, savedItem, lockedSubmission, attendance, ruleCandidates] =
          await Promise.all([
            db.studentAdmissionAnalysisResult.findUnique({
              where: {
                userId_admissionResultId: {
                  userId: user.id,
                  admissionResultId: row.id,
                },
              },
              select: {
                convertedScore: true,
                supportLevel: true,
                calculatedAt: true,
                calculationMemo: true,
              },
            }),
            db.studentSavedRecruitmentUnit.findUnique({
              where: {
                userId_admissionResultId: {
                  userId: user.id,
                  admissionResultId: row.id,
                },
              },
              select: {
                id: true,
              },
            }),
            db.studentRecordSubmission.findFirst({
              where: {
                userId: user.id,
                isLocked: true,
              },
              orderBy: [
                { finalizedAt: "desc" },
                { updatedAt: "desc" },
                { createdAt: "desc" },
              ],
              select: {
                id: true,
                updatedAt: true,
                finalizedAt: true,
                inputMethod: true,
                grades: {
                  orderBy: [
                    { schoolYear: "asc" },
                    { semester: "asc" },
                    { subjectName: "asc" },
                  ],
                  select: {
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
                userId: user.id,
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
            db.universityConversionRule.findMany({
              where: {
                status: UniversityConversionRuleStatus.ACTIVE,
                isActive: true,
                region: row.region,
                university: row.universityName,
                admissionType: row.admissionType,
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

        saved = Boolean(savedItem);

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
          ruleCandidates
            .filter((rule: RuleCandidate) => matchesRuleToTarget(rule, targetScope))
            .sort((a: RuleCandidate, b: RuleCandidate) =>
              compareRulesBySpecificity(a, b),
            )[0] ?? null;

        const latestSourceUpdatedAt: number = getLatestTimestamp([
          row.updatedAt,
          lockedSubmission?.updatedAt,
          lockedSubmission?.finalizedAt,
          attendance?.updatedAt,
          matchedRule?.updatedAt,
        ]);

        const cacheFresh = Boolean(
          cachedAnalysis?.calculatedAt &&
            cachedAnalysis.calculatedAt.getTime() >= latestSourceUpdatedAt,
        );

        let effectiveAnalysis = cachedAnalysis;

        if (!cacheFresh) {
          let nextConvertedScore: number | null = null;
          let nextMemo = "";

          if (!lockedSubmission || lockedSubmission.grades.length === 0) {
            nextMemo = "NO_LOCKED_STUDENT_RECORD";
          } else if (!matchedRule) {
            nextMemo = "NO_ACTIVE_UNIVERSITY_CONVERSION_RULE";
          } else if (!isRulePayloadObject(matchedRule.rawPayload)) {
            nextMemo = "INVALID_RULE_PAYLOAD";
          } else {
            const summary = calculateUniversityConversionSummaryFromTestSet({
              payload: matchedRule.rawPayload as CalculateUniversityConversionPayload,
              scoreRows: lockedSubmission.grades.map(mapStudentGradeToCalculationRow),
              attendance: mapAttendanceToCalculationInput(attendance),
            });

            nextConvertedScore = toFiniteNumber(summary?.finalScore);
            nextMemo = `RULE:${matchedRule.id}`;
          }

          effectiveAnalysis = await db.studentAdmissionAnalysisResult.upsert({
            where: {
              userId_admissionResultId: {
                userId: user.id,
                admissionResultId: row.id,
              },
            },
            update: {
              convertedScore: nextConvertedScore,
              calculatedAt: new Date(),
              calculationMemo: nextMemo,
            },
            create: {
              userId: user.id,
              admissionResultId: row.id,
              convertedScore: nextConvertedScore,
              supportLevel: null,
              calculatedAt: new Date(),
              calculationMemo: nextMemo,
            },
            select: {
              convertedScore: true,
              supportLevel: true,
              calculatedAt: true,
              calculationMemo: true,
            },
          });
        }

        convertedScoreDisplay = toFixedScore(effectiveAnalysis?.convertedScore);
        supportLevelDisplay = effectiveAnalysis?.supportLevel
          ? getSupportLevelLabel(effectiveAnalysis.supportLevel)
          : "-";
      }
    }

    const yearRows = buildYearTableRows(row);

    const item: DetailItem = {
      id: row.id,
      identity: {
        region: toDisplayText(row.region),
        universityName: toDisplayText(row.universityName),
        admissionType: toDisplayText(row.admissionType),
        admissionName: toDisplayText(row.admissionName),
        track: toDisplayText(row.track),
        collegeName: toDisplayText(row.collegeName),
        recruitmentUnit: toDisplayText(row.recruitmentUnit),
      },
      recruitmentCount2027: {
        label: "2027학년도 모집인원",
        shortLabel: "27인원",
        raw: row.currentHeadcountRaw,
        display: toDisplayText(row.currentHeadcountRaw),
      },
      summaryFields: buildSummaryFields(row),
      yearTable: {
        columns: [
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
        ],
        rows: yearRows,
      },
      charts: buildCharts(yearRows, row.currentHeadcountRaw),
      premium: {
        locked: premiumLocked,
        title: "유료 서비스",
        items: [
          {
            label: "내성적",
            description: premiumLocked ? "결제 후 이용 가능" : convertedScoreDisplay,
            locked: premiumLocked,
          },
          {
            label: "지원가능성",
            description: premiumLocked ? "결제 후 이용 가능" : supportLevelDisplay,
            locked: premiumLocked,
          },
          {
            label: saved ? "저장됨" : "저장",
            description: premiumLocked
              ? "결제 후 이용 가능"
              : saved
                ? "내 입시 전략에 저장됨"
                : "클릭하여 저장",
            locked: premiumLocked,
          },
        ],
        saveAction: {
          label: saved ? "저장됨" : "저장",
        },
      },
    };

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error("[student/admissions/search/[id]] GET error:", error);
    return NextResponse.json(
      { success: false, message: "상세 데이터를 불러오는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
