import type {
  DashboardChartPoint,
  DashboardMetric,
  DashboardPrintData,
} from "./StrategyPrintDocument";

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
    <div className="grid grid-cols-4 gap-2.5">
      {items.map((item) => (
        <div
          key={`${item.label}-${item.value}`}
          className={`rounded-lg border px-3 py-2.5 ${toneClass(item.tone)}`}
        >
          <div className="text-[10px] font-semibold">{item.label}</div>
          <div className="mt-1 text-[16px] font-extrabold">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function MiniLineChart({
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
  const height = 96;
  const padX = 22;
  const padY = 16;

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
    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
      <div className="mb-1.5 text-[11px] font-bold text-slate-700">{title}</div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-[96px] w-full">
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
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polyline}
        />

        {safePoints.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle cx={getX(index)} cy={getY(point.value)} r="3" fill="#2563eb" />
            <text
              x={getX(index)}
              y={getY(point.value) - 7}
              textAnchor="middle"
              fontSize="8"
              fill="#1e3a8a"
              fontWeight="700"
            >
              {point.value}
            </text>
            <text
              x={getX(index)}
              y={height - 3}
              textAnchor="middle"
              fontSize="8"
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

function MiniBarChart({
  title,
  points,
}: {
  title: string;
  points: DashboardChartPoint[];
}) {
  const safePoints = points.length > 0 ? points : [{ label: "-", value: 0 }];
  const max = Math.max(...safePoints.map((item) => item.value), 1);

  const width = 260;
  const height = 96;
  const padX = 16;
  const padY = 16;
  const innerWidth = width - padX * 2;
  const slotWidth = innerWidth / Math.max(safePoints.length, 1);
  const barWidth = Math.min(24, slotWidth * 0.5);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
      <div className="mb-1.5 text-[11px] font-bold text-slate-700">{title}</div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-[96px] w-full">
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
                rx="5"
                fill="#2563eb"
                opacity="0.88"
              />
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize="8"
                fill="#1e3a8a"
                fontWeight="700"
              >
                {point.value}
              </text>
              <text
                x={x + barWidth / 2}
                y={height - 3}
                textAnchor="middle"
                fontSize="8"
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

export default function StrategyPrintDashboardPage({
  dashboardData,
}: {
  dashboardData: DashboardPrintData;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="rounded-[18px] bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] px-5 py-4 text-white">
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-100">
          Dashboard Summary
        </div>
        <div className="mt-1.5 text-[22px] font-extrabold">
          나의 입시 전략 리포트
        </div>
        <div className="mt-1 text-[11px] text-blue-100">
          개인별 대시보드 요약 페이지 · 출력일 기준 최신 데이터 반영
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-3.5">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="text-[15px] font-extrabold text-slate-900">
              {dashboardData.academicSummary.title}
            </div>
            <div className="text-[10px] text-slate-500">대시보드 반영</div>
          </div>

          <MetricGrid items={dashboardData.academicSummary.metrics} />

          <div className="mt-3 grid grid-cols-2 gap-3">
            <MiniLineChart
              title="최근 성적 추이"
              points={dashboardData.academicSummary.trendChart}
            />
            <MiniBarChart
              title="과목별 평균 선택"
              points={dashboardData.academicSummary.fitChart}
            />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-3.5">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="text-[15px] font-extrabold text-slate-900">
              {dashboardData.mockExamSummary.title}
            </div>
            <div className="text-[10px] text-slate-500">대시보드 반영</div>
          </div>

          <MetricGrid items={dashboardData.mockExamSummary.metrics} />

          <div className="mt-3 grid grid-cols-2 gap-3">
            <MiniLineChart
              title="최근 모의 추이"
              points={dashboardData.mockExamSummary.trendChart}
            />
            <MiniBarChart
              title="최근 시험 과목 비교"
              points={dashboardData.mockExamSummary.subjectChart}
            />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-3.5">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="text-[15px] font-extrabold text-slate-900">
              {dashboardData.fitAnalysis.title}
            </div>
            <div className="text-[10px] text-slate-500">요약 그래프</div>
          </div>

          <MiniBarChart
            title="학생 적합성 결과"
            points={dashboardData.fitAnalysis.items}
          />
        </section>
      </div>
    </div>
  );
}
