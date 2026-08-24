import { cookies, headers } from "next/headers";
import StrategyPrintActions from "../../../../(student)/student/_components/print/StrategyPrintActions";
import StrategyPrintDocument, {
  type DashboardPrintData,
  type SavedStrategyListItem,
} from "../../../../(student)/student/_components/print/StrategyPrintDocument";

export const dynamic = "force-dynamic";

type PrintPageSearchParams = {
  autoPrint?: string | string[] | undefined;
};

type PrintPageProps = {
  searchParams?: Promise<PrintPageSearchParams> | PrintPageSearchParams;
};

function getAutoPrintFlag(searchParams?: PrintPageSearchParams) {
  const raw = searchParams?.autoPrint;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === "1";
}

async function getBaseUrl() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "http";

  if (!host) {
    throw new Error("호스트 정보를 찾을 수 없습니다.");
  }

  return `${proto}://${host}`;
}

async function getSavedStrategiesForPrint(): Promise<SavedStrategyListItem[]> {
  const baseUrl = await getBaseUrl();
  const cookieStore = await cookies();

  const response = await fetch(`${baseUrl}/api/student/admissions/save`, {
    method: "GET",
    headers: {
      cookie: cookieStore.toString(),
    },
    cache: "no-store",
  });

  const data = (await response.json()) as {
    success: boolean;
    message?: string;
    items?: SavedStrategyListItem[];
  };

  if (!response.ok || !data?.success) {
    throw new Error(data?.message ?? "저장 전략 목록을 불러오지 못했습니다.");
  }

  return Array.isArray(data.items) ? data.items : [];
}

async function getDashboardPrintData(): Promise<DashboardPrintData> {
  return {
    userId: "print-preview-user",
    studentLabel: "수험생",
    updatedAt: new Date().toISOString(),
    academicSummary: {
      title: "학생부/내신 요약",
      metrics: [
        { label: "평균 등급", value: "2.8", tone: "blue" },
        { label: "상위 과목", value: "국어·영어", tone: "green" },
        { label: "비교과", value: "양호", tone: "purple" },
        { label: "지원 안정성", value: "보통", tone: "amber" },
      ],
      trendChart: [
        { label: "1학년", value: 34 },
        { label: "2학년", value: 46 },
        { label: "3학년", value: 52 },
      ],
      fitChart: [
        { label: "국어", value: 88 },
        { label: "영어", value: 82 },
        { label: "수학", value: 79 },
        { label: "탐구", value: 85 },
      ],
    },
    mockExamSummary: {
      title: "모의고사 요약",
      metrics: [
        { label: "국어", value: "2등급", tone: "blue" },
        { label: "수학", value: "3등급", tone: "amber" },
        { label: "영어", value: "2등급", tone: "green" },
        { label: "탐구", value: "2등급", tone: "purple" },
      ],
      trendChart: [
        { label: "3월", value: 61 },
        { label: "6월", value: 68 },
        { label: "9월", value: 73 },
      ],
      subjectChart: [
        { label: "국어", value: 84 },
        { label: "수학", value: 76 },
        { label: "영어", value: 88 },
        { label: "탐구", value: 81 },
      ],
    },
    fitAnalysis: {
      title: "학생 적합성 검사 결과",
      items: [
        { label: "학생부교과", value: 78 },
        { label: "학생부종합", value: 86 },
        { label: "논술", value: 64 },
        { label: "정시", value: 71 },
      ],
    },
  };
}

export default async function StudentStrategyPrintPage({
  searchParams,
}: PrintPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const autoPrint = getAutoPrintFlag(resolvedSearchParams);

  const [dashboardData, savedItems] = await Promise.all([
    getDashboardPrintData(),
    getSavedStrategiesForPrint(),
  ]);

  return (
    <div className="min-h-screen bg-slate-100">
      <StrategyPrintActions autoPrint={autoPrint} />
      <StrategyPrintDocument
        dashboardData={dashboardData}
        savedItems={savedItems}
      />
    </div>
  );
}
