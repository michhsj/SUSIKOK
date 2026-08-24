// src/app/(student)/student/_components/print/StrategyPrintDocument.tsx
import AdmissionDetailContent from "../admissions/detail/AdmissionDetailContent";
import type { DetailItem } from "../admissions/detail/admission-detail-types";

export type SavedStrategyListItem = {
  id: string;
  admissionResultId: string;
  priority: number;
  snapshotVersion: number;
  createdAt: string;
  updatedAt: string;
  savedAt: string;
  detail: DetailItem;
};

export type DashboardMetric = {
  label: string;
  value: string;
  tone?: "blue" | "green" | "amber" | "purple" | "red";
};

export type DashboardChartPoint = {
  label: string;
  value: number;
};

export type DashboardPrintData = {
  userId: string;
  studentLabel: string;
  updatedAt: string;
  academicSummary: {
    title: string;
    metrics: DashboardMetric[];
    trendChart: DashboardChartPoint[];
    fitChart: DashboardChartPoint[];
  };
  mockExamSummary: {
    title: string;
    metrics: DashboardMetric[];
    trendChart: DashboardChartPoint[];
    subjectChart: DashboardChartPoint[];
  };
  fitAnalysis: {
    title: string;
    items: DashboardChartPoint[];
  };
};

function chunkItems<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function toneClass(tone?: DashboardMetric["tone"]) {
  switch (tone) {
    case "green":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "amber":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "purple":
      return "bg-violet-50 text-violet-700 border-violet-100";
    case "red":
      return "bg-rose-50 text-rose-700 border-rose-100";
    case "blue":
    default:
      return "bg-blue-50 text-blue-700 border-blue-100";
  }
}

function MetricGrid({ items }: { items: DashboardMetric[] }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map((item) => (
        <div
          key={`${item.label}-${item.value}`}
          className={`rounded-lg border px-2 py-1.5 ${toneClass(item.tone)}`}
        >
          <div className="text-[9px] font-semibold">{item.label}</div>
          <div className="mt-0.5 text-[14px] font-extrabold">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function DashboardLineChart({
  title,
  points,
}: {
  title: string;
  points: DashboardChartPoint[];
}) {
  const safePoints = points.length > 0 ? points : [{ label: "-", value: 0 }];
  const values = safePoints.map((item) => item.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  const width = 260;
  const height = 74;
  const padX = 22;
  const padY = 12;

  const getX = (index: number) =>
    safePoints.length <= 1
      ? width / 2
      : padX + (index * (width - padX * 2)) / (safePoints.length - 1);

  const getY = (value: number) =>
    height - padY - ((value - min) / range) * (height - padY * 2);

  const polyline = safePoints
    .map((point, index) => `${getX(index)},${getY(point.value)}`)
    .join(" ");

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2">
      <div className="mb-1 text-[9px] font-bold text-slate-700">{title}</div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-[74px] w-full">
        {[0, 1, 2, 3].map((line) => {
          const y = padY + (line * (height - padY * 2)) / 3;
          return (
            <line
              key={line}
              x1={padX}
              y1={y}
              x2={width - padX}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          );
        })}

        <polyline
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polyline}
        />

        {safePoints.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle cx={getX(index)} cy={getY(point.value)} r="2.25" fill="#2563eb" />
            <text
              x={getX(index)}
              y={getY(point.value) - 5}
              textAnchor="middle"
              fontSize="6.5"
              fill="#1e3a8a"
              fontWeight="700"
            >
              {point.value}
            </text>
            <text
              x={getX(index)}
              y={height - 2}
              textAnchor="middle"
              fontSize="6.5"
              fill="#64748b"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function DashboardBarChart({
  title,
  points,
}: {
  title: string;
  points: DashboardChartPoint[];
}) {
  const safePoints = points.length > 0 ? points : [{ label: "-", value: 0 }];
  const max = Math.max(...safePoints.map((item) => item.value), 1);

  const width = 260;
  const height = 74;
  const padX = 16;
  const padY = 12;
  const innerWidth = width - padX * 2;
  const slotWidth = innerWidth / Math.max(safePoints.length, 1);
  const barWidth = Math.min(20, slotWidth * 0.42);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2">
      <div className="mb-1 text-[9px] font-bold text-slate-700">{title}</div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-[74px] w-full">
        {[0, 1, 2, 3].map((line) => {
          const y = padY + (line * (height - padY * 2)) / 3;
          return (
            <line
              key={line}
              x1={padX}
              y1={y}
              x2={width - padX}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          );
        })}

        {safePoints.map((point, index) => {
          const x = padX + index * slotWidth + (slotWidth - barWidth) / 2;
          const barHeight = (point.value / max) * (height - padY * 2);
          const y = height - padY - barHeight;

          return (
            <g key={`${point.label}-${index}`}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="4"
                fill="#2563eb"
                opacity="0.88"
              />
              <text
                x={x + barWidth / 2}
                y={y - 3}
                textAnchor="middle"
                fontSize="6.5"
                fill="#1e3a8a"
                fontWeight="700"
              >
                {point.value}
              </text>
              <text
                x={x + barWidth / 2}
                y={height - 2}
                textAnchor="middle"
                fontSize="6.5"
                fill="#64748b"
              >
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function StrategyPrintDashboardPage({
  dashboardData,
}: {
  dashboardData: DashboardPrintData;
}) {
  return (
    <div className="grid h-full grid-rows-[auto_1fr_1fr_0.82fr] gap-2.5 overflow-hidden">
      <div className="rounded-[16px] bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] px-4 py-3 text-white">
        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-100">
          Dashboard Summary
        </div>
        <div className="mt-1 text-[19px] font-extrabold">나의 입시 전략 리포트</div>
        <div className="mt-1 text-[10px] text-blue-100">
          개인별 대시보드 요약 페이지 · 출력일 기준 최신 데이터 반영
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white p-2.5">
        <div className="mb-1.5 flex items-center justify-between">
          <div className="text-[13px] font-extrabold text-slate-900">
            {dashboardData.academicSummary.title}
          </div>
          <div className="text-[9px] text-slate-500">대시보드 반영</div>
        </div>

        <MetricGrid items={dashboardData.academicSummary.metrics} />

        <div className="mt-2 grid grid-cols-2 gap-2">
          <DashboardLineChart
            title="최근 성적 추이"
            points={dashboardData.academicSummary.trendChart}
          />
          <DashboardBarChart
            title="과목별 평균 선택"
            points={dashboardData.academicSummary.fitChart}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white p-2.5">
        <div className="mb-1.5 flex items-center justify-between">
          <div className="text-[13px] font-extrabold text-slate-900">
            {dashboardData.mockExamSummary.title}
          </div>
          <div className="text-[9px] text-slate-500">대시보드 반영</div>
        </div>

        <MetricGrid items={dashboardData.mockExamSummary.metrics} />

        <div className="mt-2 grid grid-cols-2 gap-2">
          <DashboardLineChart
            title="최근 모의 추이"
            points={dashboardData.mockExamSummary.trendChart}
          />
          <DashboardBarChart
            title="최근 시험 과목 비교"
            points={dashboardData.mockExamSummary.subjectChart}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white p-2.5">
        <div className="mb-1.5 flex items-center justify-between">
          <div className="text-[13px] font-extrabold text-slate-900">
            {dashboardData.fitAnalysis.title}
          </div>
          <div className="text-[9px] text-slate-500">요약 그래프</div>
        </div>

        <DashboardBarChart
          title="학생 적합성 결과"
          points={dashboardData.fitAnalysis.items}
        />
      </section>
    </div>
  );
}

function formatSavedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

const DETAIL_CANVAS_WIDTH = 1120;
const DETAIL_CANVAS_HEIGHT = 330;
const DETAIL_SCALE = 0.43;

function StrategyPrintSameDetailCard({
  item,
}: {
  item: SavedStrategyListItem;
}) {
  const viewportHeight = Math.round(DETAIL_CANVAS_HEIGHT * DETAIL_SCALE);

  return (
    <article className="grid h-full grid-rows-[auto_1fr] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-none">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-800">
                우선순위 {item.priority + 1}
              </span>

              <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                저장됨
              </span>
            </div>

            <div className="mt-2 text-base font-bold text-slate-900">
              {item.detail.identity.universityName}
            </div>

            <div className="mt-1 text-sm text-slate-600">
              {item.detail.identity.admissionType} ·{" "}
              {item.detail.identity.admissionName} ·{" "}
              {item.detail.identity.recruitmentUnit}
            </div>

            <div className="mt-1 text-[12px] text-slate-500">
              {item.detail.identity.region}
              {item.detail.identity.track ? ` · ${item.detail.identity.track}` : ""}
              {item.detail.identity.collegeName
                ? ` · ${item.detail.identity.collegeName}`
                : ""}
              {item.savedAt ? ` · 저장 ${formatSavedAt(item.savedAt)}` : ""}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden px-3 py-3">
        <div
          className="overflow-hidden rounded-lg border border-slate-100 bg-white"
          style={{ height: `${viewportHeight}px` }}
        >
          <div
            className="origin-top-left"
            style={{
              width: `${DETAIL_CANVAS_WIDTH}px`,
              minWidth: `${DETAIL_CANVAS_WIDTH}px`,
              height: `${DETAIL_CANVAS_HEIGHT}px`,
              transform: `scale(${DETAIL_SCALE})`,
              transformOrigin: "top left",
            }}
          >
            <AdmissionDetailContent detail={item.detail} />
          </div>
        </div>
      </div>
    </article>
  );
}

export default function StrategyPrintDocument({
  dashboardData,
  savedItems,
}: {
  dashboardData: DashboardPrintData;
  savedItems: SavedStrategyListItem[];
}) {
  const sortedSavedItems = [...savedItems].sort((a, b) => a.priority - b.priority);
  const strategyPages = chunkItems(sortedSavedItems, 3);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: A4 portrait;
              margin: 10mm;
            }

            @media print {
              html, body {
                background: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              .print\\:hidden {
                display: none !important;
              }
            }
          `,
        }}
      />

      <div className="mx-auto max-w-[1100px] px-4 py-6 print:max-w-none print:px-0 print:py-0">
        {/* 1페이지: 대시보드 */}
        <section className="mx-auto mb-6 h-[277mm] w-[190mm] overflow-hidden break-after-page bg-white p-[6mm] shadow-sm print:mb-0 print:shadow-none">
          <StrategyPrintDashboardPage dashboardData={dashboardData} />
        </section>

        {/* 2페이지부터: 저장 대학 3개씩, 실제 상세 UI 유지 */}
        {strategyPages.length > 0 ? (
          strategyPages.map((pageItems, pageIndex) => (
            <section
              key={`strategy-page-${pageIndex}`}
              className={cn(
                "mx-auto mb-6 h-[277mm] w-[190mm] overflow-hidden bg-white p-[6mm] shadow-sm print:mb-0 print:shadow-none",
                pageIndex < strategyPages.length - 1 ? "break-after-page" : "",
              )}
            >
              <div className="flex h-full flex-col">
                <div className="border-b border-slate-200 pb-3">
                  <div className="text-[20px] font-extrabold text-slate-950">
                    나의 입시 전략
                  </div>
                  <div className="mt-1 text-[12px] text-slate-500">
                    저장 대학 상세 출력 · 페이지 {pageIndex + 2}
                  </div>
                </div>

                <div className="mt-3 grid flex-1 grid-rows-3 gap-3 overflow-hidden">
                  {pageItems.map((item) => (
                    <StrategyPrintSameDetailCard key={item.id} item={item} />
                  ))}

                  {Array.from({ length: 3 - pageItems.length }).map((_, emptyIndex) => (
                    <div
                      key={`empty-slot-${pageIndex}-${emptyIndex}`}
                      className="rounded-xl border border-dashed border-slate-200 bg-slate-50"
                    />
                  ))}
                </div>
              </div>
            </section>
          ))
        ) : (
          <section className="mx-auto mb-6 flex h-[277mm] w-[190mm] items-center justify-center overflow-hidden bg-white p-[6mm] shadow-sm print:mb-0 print:shadow-none">
            <div className="text-center">
              <div className="text-lg font-bold text-slate-900">저장된 전략이 없습니다</div>
              <div className="mt-2 text-sm text-slate-500">
                저장된 대학이 있으면 2페이지부터 3개씩 출력됩니다.
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
