import AdmissionSummaryTable from "./AdmissionSummaryTable";
import type {
  ChartSeries,
  ComprehensiveCompetencyChartBlock,
  DetailItem,
  YearRow,
} from "./admission-detail-types";

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
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
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="grid grid-cols-12 bg-slate-50 text-[11px] font-bold text-slate-700">
        {headers.map((header, index) => (
          <div
            key={header}
            className={cn(
              "px-2 py-2 text-center leading-4",
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
                "px-2 py-2 text-center leading-4",
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
    <div className="w-full rounded-xl border border-slate-200 bg-white p-2.5 lg:max-w-[246px] print:max-w-[246px]">
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

function ComprehensiveCompetencyChart({
  chart,
}: {
  chart: ComprehensiveCompetencyChartBlock;
}) {
  const totalScore = chart.items.reduce((sum, item) => {
    const value =
      typeof item.weightedPercent === "number" && Number.isFinite(item.weightedPercent)
        ? item.weightedPercent
        : 0;
    return sum + value;
  }, 0);

  const barValues = chart.items.map((item) =>
    typeof item.weightedPercent === "number" && Number.isFinite(item.weightedPercent)
      ? item.weightedPercent
      : 0,
  );

  const maxValue = Math.max(...barValues, 1);

  function formatChartNumber(value: number | null | undefined) {
    if (typeof value !== "number" || !Number.isFinite(value)) return "-";
    return value.toFixed(2);
  }

  function getBarHeight(value: number | null | undefined) {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return 0;
    return Math.max(10, Math.min((value / maxValue) * 54, 54));
  }

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-2.5 lg:max-w-[246px] print:max-w-[246px]">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold text-slate-800">
            {chart.title || "대학별 종합전형 비율"}
          </div>
          {chart.subtitle ? (
            <div className="mt-0.5 text-[10px] leading-4 text-slate-500">{chart.subtitle}</div>
          ) : null}
        </div>

        {!chart.locked ? (
          <div className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-center">
            <div className="text-[9px] font-bold leading-none text-emerald-700">총점</div>
            <div className="mt-1 text-[16px] font-black leading-none tracking-[-0.03em] text-emerald-900">
              {totalScore.toFixed(2)}
            </div>
          </div>
        ) : null}
      </div>

      {chart.locked ? (
        <div className="flex h-[92px] items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
          결제 후 이용 가능
        </div>
      ) : chart.items.length > 0 ? (
        <div className="relative h-[92px] rounded-md border border-slate-100 bg-white px-3 pb-5 pt-2">
          <div className="absolute inset-x-3 top-2 bottom-5">
            {[0, 1, 2, 3].map((tick) => (
              <div
                key={tick}
                className="absolute left-0 right-0 border-t border-slate-200"
                style={{ top: `${(tick / 3) * 100}%` }}
              />
            ))}
          </div>

          <div className="relative z-10 flex h-full items-end justify-around gap-2">
            {chart.items.map((item) => {
              const value =
                typeof item.weightedPercent === "number" && Number.isFinite(item.weightedPercent)
                  ? item.weightedPercent
                  : 0;

              return (
                <div
                  key={item.key}
                  className="flex w-full max-w-[68px] flex-col items-center justify-end"
                >
                  <div className="mb-1 text-[9px] font-bold leading-none text-[#154fcf]">
                    {formatChartNumber(value)}
                  </div>
                  <div
                    className="w-7 rounded-t-[4px] bg-[#0f4ed7] shadow-[inset_0_-8px_12px_rgba(0,0,0,0.12)]"
                    style={{
                      height: `${getBarHeight(value)}px`,
                      minHeight: value > 0 ? 10 : 0,
                    }}
                  />
                  <div className="mt-1 break-keep text-center text-[10px] font-bold leading-3 text-slate-700">
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="absolute bottom-5 left-3 right-3 border-t border-slate-400" />
        </div>
      ) : (
        <div className="flex h-[92px] items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
          학종 역량 데이터를 찾을 수 없습니다.
        </div>
      )}
    </div>
  );
}

export default function AdmissionDetailContent({
  detail,
  className,
}: {
  detail: DetailItem;
  className?: string;
}) {
  const showComprehensiveCompetencyChart = Boolean(
    detail.charts.comprehensiveCompetency,
  );

  return (
    <div
      className={cn(
        "rounded-[22px] border border-[#cddcf6] bg-[#f7fbff] p-3 shadow-[0_0_0_4px_rgba(207,225,255,0.9)]",
        className,
      )}
    >
      <div
        className={cn(
          "grid items-start gap-3",
          "lg:grid-cols-[minmax(0,1fr)_246px]",
          "print:grid-cols-[minmax(0,1fr)_246px]",
        )}
      >
        <div className="min-w-0 space-y-3">
          <AdmissionSummaryTable fields={detail.summaryFields} />
          <YearDataTable rows={detail.yearTable.rows} />
        </div>

        <div className="space-y-3 lg:w-[246px] print:w-[246px]">
          <MiniLineChart
            title={detail.charts.competitionRate.title}
            labels={detail.charts.competitionRate.labels}
            series={detail.charts.competitionRate.series}
            colors={["#2563eb", "#dc2626"]}
          />

          {showComprehensiveCompetencyChart && detail.charts.comprehensiveCompetency ? (
            <ComprehensiveCompetencyChart chart={detail.charts.comprehensiveCompetency} />
          ) : (
            <MiniLineChart
              title={detail.charts.scoreTrend.title}
              labels={detail.charts.scoreTrend.labels}
              series={detail.charts.scoreTrend.series}
              colors={
                detail.charts.scoreTrend.series.length >= 3
                  ? ["#2563eb", "#7c3aed", "#dc2626"]
                  : ["#2563eb", "#dc2626"]
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
