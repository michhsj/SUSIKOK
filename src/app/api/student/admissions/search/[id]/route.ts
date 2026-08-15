import { NextRequest, NextResponse } from "next/server";
import { EntitlementFeatureCode, EntitlementStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getSupportLevelLabel } from "@/lib/student/support-level";

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

    const row = await prisma.admissionResult.findFirst({
      where: { id, isActive: true },
      select: {
        id: true,
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

      const entitlement = await prisma.userEntitlement.findFirst({
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
        const [analysisResult, savedItem] = await Promise.all([
          prisma.studentAdmissionAnalysisResult.findUnique({
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
            },
          }),
          prisma.studentSavedRecruitmentUnit.findUnique({
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
        ]);

        convertedScoreDisplay = toFixedScore(analysisResult?.convertedScore);
        supportLevelDisplay = analysisResult?.supportLevel
          ? getSupportLevelLabel(analysisResult.supportLevel)
          : "-";
        saved = Boolean(savedItem);
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
