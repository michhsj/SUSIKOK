import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { EntitlementFeatureCode, EntitlementStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getSupportLevelLabel } from "@/lib/student/support-level";

type SaveRequestBody = {
  admissionResultId?: string;
  forceRefreshSnapshot?: boolean;
};

type ReorderRequestBody = {
  items?: Array<{
    id?: string;
    priority?: number;
  }>;
};

type SummaryField = {
  label: string;
  value: string;
};

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

type ChartSeries = {
  name: string;
  data: Array<number | null>;
};

type ComprehensiveCompetencyChartItem = {
  key: "academic" | "career" | "community";
  label: string;
  description: string;
  universityRatioPercent: number;
  questionCount: number;
  userScore: number | null;
  userMaxScore: number | null;
  userPercent: number | null;
  weightedPercent: number | null;
};

type ComprehensiveCompetencyChartBlock = {
  title: string;
  subtitle: string;
  locked: boolean;
  items: ComprehensiveCompetencyChartItem[];
};

type SavedStrategyListItem = {
  id: string;
  admissionResultId: string;
  priority: number;
  snapshotVersion: number;
  createdAt: string;
  updatedAt: string;
  savedAt: string;
  detail: SavedAdmissionSnapshot;
};

type GetSavedAdmissionsResponse = {
  success: boolean;
  message?: string;
  items: SavedStrategyListItem[];
  meta: {
    totalCount: number;
  };
};

type SavedAdmissionSnapshot = {
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
    comprehensiveCompetency?: ComprehensiveCompetencyChartBlock | null;
  };
  premium: {
    locked: boolean;
    title: string;
    items: Array<{
      label: string;
      description?: string;
      locked: boolean;
    }>;
    saveAction: {
      label: string;
    };
  };
};

type AdmissionResultSnapshotSource = {
  id: string;
  admissionYear: number;
  updatedAt: Date;
  region: string;
  universityName: string;
  admissionType: string;
  admissionName: string;
  track: string;
  collegeName: string;
  recruitmentUnit: string;
  admissionMethod: string | null;
  studentRecordReflection: string | null;
  admissionSpecialNotes: string | null;
  minimumAcademicRequirement: string | null;
  applicationPeriod: string | null;
  firstRoundAnnouncement: string | null;
  interviewOrEssayDate: string | null;
  finalAnnouncement: string | null;
  currentHeadcountRaw: string | null;
  year26RecruitmentCountRaw: string | null;
  year26ApplicantCountRaw: string | null;
  year26CompetitionRateRaw: string | null;
  year26AdditionalPassCountRaw: string | null;
  year26MinSatisfiedRateRaw: string | null;
  year26MinSatisfiedCountRaw: string | null;
  year26ActualCompetitionRateRaw: string | null;
  year26Score50Raw: string | null;
  year26Score70Raw: string | null;
  year26Converted50Raw: string | null;
  year26Converted70Raw: string | null;
  year25RecruitmentCountRaw: string | null;
  year25ApplicantCountRaw: string | null;
  year25CompetitionRateRaw: string | null;
  year25AdditionalPassCountRaw: string | null;
  year25MinSatisfiedRateRaw: string | null;
  year25MinSatisfiedCountRaw: string | null;
  year25ActualCompetitionRateRaw: string | null;
  year25Score50Raw: string | null;
  year25Score70Raw: string | null;
  year25Converted50Raw: string | null;
  year25Converted70Raw: string | null;
  year24RecruitmentCountRaw: string | null;
  year24ApplicantCountRaw: string | null;
  year24CompetitionRateRaw: string | null;
  year24AdditionalPassCountRaw: string | null;
  year24MinSatisfiedRateRaw: string | null;
  year24MinSatisfiedCountRaw: string | null;
  year24ActualCompetitionRateRaw: string | null;
  year24Score50Raw: string | null;
  year24Score70Raw: string | null;
  year24Converted50Raw: string | null;
  year24Converted70Raw: string | null;
};

type AnalysisSnapshotSource = {
  convertedScore: number | null;
  supportLevel: Parameters<typeof getSupportLevelLabel>[0] | null;
  calculatedAt: Date | null;
  calculationMemo: string | null;
  updatedAt: Date;
};

function toStringValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toDisplayText(value: unknown): string {
  const text = toStringValue(value);
  return text || "-";
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(
      value.replace(/,/g, "").replace(/[^0-9.\-]/g, "").trim(),
    );
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toFixedScore(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "-";
  return value.toFixed(2);
}

function badRequest(message: string) {
  return NextResponse.json({ success: false, message }, { status: 400 });
}

function unauthorized(message = "로그인이 필요합니다.") {
  return NextResponse.json({ success: false, message }, { status: 401 });
}

function forbidden(message: string) {
  return NextResponse.json({ success: false, message }, { status: 403 });
}

function notFound(message: string) {
  return NextResponse.json({ success: false, message }, { status: 404 });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function getOptionalCurrentUser() {
  try {
    return await getCurrentUser();
  } catch (error) {
    console.error("[student/admissions/save] getCurrentUser failed:", error);
    return null;
  }
}

async function parseBody<T extends Record<string, unknown>>(
  request: NextRequest,
): Promise<T> {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object") {
      return {} as T;
    }
    return body as T;
  } catch (error) {
    console.error("[student/admissions/save] parse body failed:", error);
    return {} as T;
  }
}

function revalidateAdmissionRelatedPaths() {
  revalidatePath("/student/admissions");
  revalidatePath("/student/payment");
  revalidatePath("/student/strategy");
}

function buildSummaryFields(row: AdmissionResultSnapshotSource): SummaryField[] {
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

function buildYearTableRows(row: AdmissionResultSnapshotSource): YearTableRow[] {
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
): SavedAdmissionSnapshot["charts"] {
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
      labels: graphRows.map((item) => item.year),
      series: [
        {
          name: "성적70%",
          data: graphRows.map((item) => toNumber(item.score70)),
        },
        {
          name: "환산70%",
          data: graphRows.map((item) => toNumber(item.converted70)),
        },
      ],
    },
    comprehensiveCompetency: null,
  };
}

function buildSnapshot(params: {
  admissionResult: AdmissionResultSnapshotSource;
  analysis: AnalysisSnapshotSource | null;
}): SavedAdmissionSnapshot {
  const { admissionResult, analysis } = params;
  const yearRows = buildYearTableRows(admissionResult);
  const convertedScoreDisplay = toFixedScore(analysis?.convertedScore);
  const supportLevelDisplay = analysis?.supportLevel
    ? getSupportLevelLabel(analysis.supportLevel)
    : "-";

  return {
    identity: {
      region: toDisplayText(admissionResult.region),
      universityName: toDisplayText(admissionResult.universityName),
      admissionType: toDisplayText(admissionResult.admissionType),
      admissionName: toDisplayText(admissionResult.admissionName),
      track: toDisplayText(admissionResult.track),
      collegeName: toDisplayText(admissionResult.collegeName),
      recruitmentUnit: toDisplayText(admissionResult.recruitmentUnit),
    },
    recruitmentCount2027: {
      label: "2027학년도 모집인원",
      shortLabel: "27인원",
      raw: admissionResult.currentHeadcountRaw,
      display: toDisplayText(admissionResult.currentHeadcountRaw),
    },
    summaryFields: buildSummaryFields(admissionResult),
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
    charts: buildCharts(yearRows, admissionResult.currentHeadcountRaw),
    premium: {
      locked: false,
      title: "유료 서비스",
      items: [
        {
          label: "내성적",
          description: convertedScoreDisplay,
          locked: false,
        },
        {
          label: "지원가능성",
          description: supportLevelDisplay,
          locked: false,
        },
        {
          label: "저장됨",
          description: "내 입시 전략에 저장됨",
          locked: false,
        },
      ],
      saveAction: {
        label: "저장됨",
      },
    },
  };
}

function snapshotToPrismaData(snapshot: SavedAdmissionSnapshot) {
  return {
    snapshotIdentity: snapshot.identity,
    snapshotRecruitmentCount: snapshot.recruitmentCount2027,
    snapshotSummaryFields: snapshot.summaryFields,
    snapshotYearTable: snapshot.yearTable,
    snapshotCharts: snapshot.charts,
    snapshotPremium: snapshot.premium,
  } satisfies {
    snapshotIdentity: Prisma.InputJsonValue;
    snapshotRecruitmentCount: Prisma.InputJsonValue;
    snapshotSummaryFields: Prisma.InputJsonValue;
    snapshotYearTable: Prisma.InputJsonValue;
    snapshotCharts: Prisma.InputJsonValue;
    snapshotPremium: Prisma.InputJsonValue;
  };
}

function readStoredSnapshot(
  row: {
    snapshotIdentity: Prisma.JsonValue | null;
    snapshotRecruitmentCount: Prisma.JsonValue | null;
    snapshotSummaryFields: Prisma.JsonValue | null;
    snapshotYearTable: Prisma.JsonValue | null;
    snapshotCharts: Prisma.JsonValue | null;
    snapshotPremium: Prisma.JsonValue | null;
  },
  fallback: SavedAdmissionSnapshot,
): SavedAdmissionSnapshot {
  return {
    identity: isPlainObject(row.snapshotIdentity)
      ? (row.snapshotIdentity as SavedAdmissionSnapshot["identity"])
      : fallback.identity,
    recruitmentCount2027: isPlainObject(row.snapshotRecruitmentCount)
      ? (row.snapshotRecruitmentCount as SavedAdmissionSnapshot["recruitmentCount2027"])
      : fallback.recruitmentCount2027,
    summaryFields: Array.isArray(row.snapshotSummaryFields)
      ? (row.snapshotSummaryFields as SavedAdmissionSnapshot["summaryFields"])
      : fallback.summaryFields,
    yearTable: isPlainObject(row.snapshotYearTable)
      ? (row.snapshotYearTable as SavedAdmissionSnapshot["yearTable"])
      : fallback.yearTable,
    charts: isPlainObject(row.snapshotCharts)
      ? (row.snapshotCharts as SavedAdmissionSnapshot["charts"])
      : fallback.charts,
    premium: isPlainObject(row.snapshotPremium)
      ? (row.snapshotPremium as SavedAdmissionSnapshot["premium"])
      : fallback.premium,
  };
}

function hasCompleteStoredSnapshot(row: {
  snapshotIdentity: Prisma.JsonValue | null;
  snapshotRecruitmentCount: Prisma.JsonValue | null;
  snapshotSummaryFields: Prisma.JsonValue | null;
  snapshotYearTable: Prisma.JsonValue | null;
  snapshotCharts: Prisma.JsonValue | null;
  snapshotPremium: Prisma.JsonValue | null;
}) {
  return Boolean(
    row.snapshotIdentity &&
      row.snapshotRecruitmentCount &&
      row.snapshotSummaryFields &&
      row.snapshotYearTable &&
      row.snapshotCharts &&
      row.snapshotPremium,
  );
}

async function normalizeSavedRecruitmentPriorities(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  const rows = await tx.studentSavedRecruitmentUnit.findMany({
    where: { userId },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });

  await Promise.all(
    rows.map((row, index) =>
      tx.studentSavedRecruitmentUnit.update({
        where: { id: row.id },
        data: { priority: index },
      }),
    ),
  );
}

async function getAdmissionResultSnapshotSource(admissionResultId: string) {
  return prisma.admissionResult.findFirst({
    where: {
      id: admissionResultId,
      isActive: true,
    },
    select: {
      id: true,
      admissionYear: true,
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
}

export async function GET() {
  try {
    const user = await getOptionalCurrentUser();

    if (!user?.id) {
      return unauthorized();
    }

    const savedRows = await prisma.studentSavedRecruitmentUnit.findMany({
      where: {
        userId: user.id,
      },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        admissionResultId: true,
        priority: true,
        snapshotVersion: true,
        createdAt: true,
        updatedAt: true,
        snapshotIdentity: true,
        snapshotRecruitmentCount: true,
        snapshotSummaryFields: true,
        snapshotYearTable: true,
        snapshotCharts: true,
        snapshotPremium: true,
        admissionResult: {
          select: {
            id: true,
            admissionYear: true,
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
            analysisResults: {
              where: { userId: user.id },
              orderBy: { updatedAt: "desc" },
              take: 1,
              select: {
                convertedScore: true,
                supportLevel: true,
                calculatedAt: true,
                calculationMemo: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });

    const items = await Promise.all(
      savedRows.map(async (row) => {
        const analysis = row.admissionResult.analysisResults[0] ?? null;
        const fallbackSnapshot = buildSnapshot({
          admissionResult: row.admissionResult,
          analysis,
        });

        if (!hasCompleteStoredSnapshot(row)) {
          try {
            await prisma.studentSavedRecruitmentUnit.update({
              where: { id: row.id },
              data: {
                snapshotAdmissionYear: row.admissionResult.admissionYear,
                snapshotRegion: row.admissionResult.region,
                snapshotUniversityName: row.admissionResult.universityName,
                snapshotAdmissionType: row.admissionResult.admissionType,
                snapshotAdmissionName: row.admissionResult.admissionName,
                snapshotTrack: row.admissionResult.track,
                snapshotCollegeName: row.admissionResult.collegeName,
                snapshotRecruitmentUnit: row.admissionResult.recruitmentUnit,
                ...snapshotToPrismaData(fallbackSnapshot),
                snapshotVersion: 1,
                snapshotSourceUpdatedAt:
                  analysis && analysis.updatedAt > row.admissionResult.updatedAt
                    ? analysis.updatedAt
                    : row.admissionResult.updatedAt,
                snapshotSavedFromDetail: true,
              },
            });
          } catch (error) {
            console.error("[student/admissions/save] lazy snapshot update failed:", {
              savedId: row.id,
              admissionResultId: row.admissionResultId,
              error,
            });
          }
        }

        const snapshot = readStoredSnapshot(row, fallbackSnapshot);

        return {
          id: row.id,
          admissionResultId: row.admissionResultId,
          priority: row.priority,
          snapshotVersion: row.snapshotVersion ?? 1,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
          savedAt: row.updatedAt.toISOString(),
          detail: snapshot,
        } satisfies SavedStrategyListItem;
      }),
    );

    const response: GetSavedAdmissionsResponse = {
      success: true,
      items,
      meta: {
        totalCount: items.length,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[student/admissions/save] GET error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "저장한 모집단위를 불러오는 중 오류가 발생했습니다.",
        items: [],
        meta: {
          totalCount: 0,
        },
      } satisfies GetSavedAdmissionsResponse,
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getOptionalCurrentUser();

    if (!user?.id) {
      return unauthorized();
    }

    const body = await parseBody<SaveRequestBody>(request);
    const admissionResultId = toStringValue(body.admissionResultId);
    const forceRefreshSnapshot = body.forceRefreshSnapshot === true;

    if (!admissionResultId) {
      return badRequest("admissionResultId가 필요합니다.");
    }

    const now = new Date();

    const [admissionResult, entitlement, analysis] = await Promise.all([
      getAdmissionResultSnapshotSource(admissionResultId),
      prisma.userEntitlement.findFirst({
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
          expiresAt: true,
        },
      }),
      prisma.studentAdmissionAnalysisResult.findUnique({
        where: {
          userId_admissionResultId: {
            userId: user.id,
            admissionResultId,
          },
        },
        select: {
          convertedScore: true,
          supportLevel: true,
          calculatedAt: true,
          calculationMemo: true,
          updatedAt: true,
        },
      }),
    ]);

    if (!admissionResult) {
      return notFound("저장할 모집단위 정보를 찾을 수 없습니다.");
    }

    if (!entitlement) {
      return forbidden("유효한 이용권이 없어 저장할 수 없습니다.");
    }

    const snapshot = buildSnapshot({
      admissionResult,
      analysis,
    });

    const saved = await prisma.$transaction(async (tx) => {
      const existing = await tx.studentSavedRecruitmentUnit.findUnique({
        where: {
          userId_admissionResultId: {
            userId: user.id,
            admissionResultId: admissionResult.id,
          },
        },
        select: {
          id: true,
          priority: true,
          snapshotIdentity: true,
          snapshotRecruitmentCount: true,
          snapshotSummaryFields: true,
          snapshotYearTable: true,
          snapshotCharts: true,
          snapshotPremium: true,
        },
      });

      const snapshotData = {
        snapshotAdmissionYear: admissionResult.admissionYear,
        snapshotRegion: admissionResult.region,
        snapshotUniversityName: admissionResult.universityName,
        snapshotAdmissionType: admissionResult.admissionType,
        snapshotAdmissionName: admissionResult.admissionName,
        snapshotTrack: admissionResult.track,
        snapshotCollegeName: admissionResult.collegeName,
        snapshotRecruitmentUnit: admissionResult.recruitmentUnit,
        ...snapshotToPrismaData(snapshot),
        snapshotVersion: 1,
        snapshotSourceUpdatedAt:
          analysis && analysis.updatedAt > admissionResult.updatedAt
            ? analysis.updatedAt
            : admissionResult.updatedAt,
        snapshotSavedFromDetail: true,
      };

      if (existing) {
        const shouldRefreshSnapshot =
          forceRefreshSnapshot || !hasCompleteStoredSnapshot(existing);

        if (!shouldRefreshSnapshot) {
          return tx.studentSavedRecruitmentUnit.findUniqueOrThrow({
            where: { id: existing.id },
            select: {
              id: true,
              userId: true,
              admissionResultId: true,
              priority: true,
              createdAt: true,
              updatedAt: true,
            },
          });
        }

        return tx.studentSavedRecruitmentUnit.update({
          where: { id: existing.id },
          data: snapshotData,
          select: {
            id: true,
            userId: true,
            admissionResultId: true,
            priority: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      }

      const priorityAggregate = await tx.studentSavedRecruitmentUnit.aggregate({
        where: {
          userId: user.id,
        },
        _max: {
          priority: true,
        },
      });

      const nextPriority = (priorityAggregate._max.priority ?? -1) + 1;

      return tx.studentSavedRecruitmentUnit.create({
        data: {
          userId: user.id,
          admissionResultId: admissionResult.id,
          priority: nextPriority,
          ...snapshotData,
        },
        select: {
          id: true,
          userId: true,
          admissionResultId: true,
          priority: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    revalidateAdmissionRelatedPaths();

    return NextResponse.json({
      success: true,
      message: "모집단위를 저장했습니다.",
      action: "saved",
      saved,
      item: {
        id: admissionResult.id,
        priority: saved.priority,
        ...snapshot,
      },
    });
  } catch (error) {
    console.error("[student/admissions/save] POST error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "저장 처리 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getOptionalCurrentUser();

    if (!user?.id) {
      return unauthorized();
    }

    const body = await parseBody<ReorderRequestBody>(request);
    const rawItems = Array.isArray(body.items) ? body.items : [];

    if (rawItems.length === 0) {
      return badRequest("우선순위를 변경할 items가 필요합니다.");
    }

    const normalizedItems = rawItems
      .map((item) => ({
        id: toStringValue(item?.id),
        priority:
          typeof item?.priority === "number" && Number.isFinite(item.priority)
            ? item.priority
            : null,
      }))
      .filter((item) => item.id && item.priority !== null) as Array<{
      id: string;
      priority: number;
    }>;

    if (normalizedItems.length !== rawItems.length) {
      return badRequest("우선순위 요청 형식이 올바르지 않습니다.");
    }

    const uniqueIds = new Set(normalizedItems.map((item) => item.id));
    if (uniqueIds.size !== normalizedItems.length) {
      return badRequest("중복된 저장 항목 id가 포함되어 있습니다.");
    }

    const sortedItems = [...normalizedItems].sort((a, b) => a.priority - b.priority);

    const updatedItems = await prisma.$transaction(async (tx) => {
      const existing = await tx.studentSavedRecruitmentUnit.findMany({
        where: {
          userId: user.id,
          id: { in: sortedItems.map((item) => item.id) },
        },
        select: { id: true },
      });

      if (existing.length !== sortedItems.length) {
        throw new Error("우선순위를 변경할 저장 항목 일부를 찾을 수 없습니다.");
      }

      await Promise.all(
        sortedItems.map((item, index) =>
          tx.studentSavedRecruitmentUnit.update({
            where: { id: item.id },
            data: { priority: index },
          }),
        ),
      );

      return tx.studentSavedRecruitmentUnit.findMany({
        where: { userId: user.id },
        orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          priority: true,
        },
      });
    });

    revalidateAdmissionRelatedPaths();

    return NextResponse.json({
      success: true,
      message: "우선순위를 변경했습니다.",
      items: updatedItems,
    });
  } catch (error) {
    console.error("[student/admissions/save] PUT error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "우선순위 변경 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getOptionalCurrentUser();

    if (!user?.id) {
      return unauthorized();
    }

    const body = await parseBody<SaveRequestBody>(request);
    const admissionResultId = toStringValue(body.admissionResultId);

    if (!admissionResultId) {
      return badRequest("admissionResultId가 필요합니다.");
    }

    const deleted = await prisma.$transaction(async (tx) => {
      const result = await tx.studentSavedRecruitmentUnit.deleteMany({
        where: {
          userId: user.id,
          admissionResultId,
        },
      });

      await normalizeSavedRecruitmentPriorities(tx, user.id);

      return result;
    });

    revalidateAdmissionRelatedPaths();

    return NextResponse.json({
      success: true,
      message:
        deleted.count > 0
          ? "저장한 모집단위를 해제했습니다."
          : "이미 저장 해제된 상태입니다.",
      action: "removed",
      deletedCount: deleted.count,
      admissionResultId,
    });
  } catch (error) {
    console.error("[student/admissions/save] DELETE error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "저장 해제 처리 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
