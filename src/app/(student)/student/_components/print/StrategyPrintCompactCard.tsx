import type { SavedStrategyListItem } from "./StrategyPrintDocument";

function parseSeriesValues(series: Array<number | null>) {
  return series.map((value) =>
    typeof value === "number" && Number.isFinite(value) ? value : 0,
  );
}

function MiniTrendChart({
  title,
  labels,
  values,
  color = "#2563eb",
}: {
  title: string;
  labels: string[];
  values: number[];
  color?: string;
}) {
  const safeValues = values.length > 0 ? values : [0];
  const safeLabels = labels.length > 0 ? labels : ["-"];

  const max = Math.max(...safeValues, 1);
  const min = Math.min(...safeValues, 0);
  const range = Math.max(max - min, 1);

  const width = 180;
  const height = 72;
  const padX = 16;
  const padY = 12;

  const getX = (index: number) =>
    safeLabels.length <= 1
      ? width / 2
      : padX + (index * (width - padX * 2)) / (safeLabels.length - 1);

  const getY = (value: number) =>
    height - padY - ((value - min) / range) * (height - padY * 2);

  const polyline = safeValues
    .map((value, index) => `${getX(index)},${getY(value)}`)
    .join(" ");

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2">
      <div className="mb-1 text-[10px] font-bold text-slate-700">{title}</div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-[72px] w-full">
        {[0, 1, 2].map((line) => {
          const y = padY + (line * (height - padY * 2)) / 2;
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
          stroke={color}
          strokeWidth="2.5"
          points={polyline}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {safeValues.map((value, index) => (
          <g key={`${safeLabels[index]}-${index}`}>
            <circle cx={getX(index)} cy={getY(value)} r="2.5" fill={color} />
            <text
              x={getX(index)}
              y={height - 2}
              textAnchor="middle"
              fontSize="8"
              fill="#64748b"
            >
              {safeLabels[index]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function StrategyPrintCompactCard({
  item,
}: {
  item: SavedStrategyListItem;
}) {
  const summaryFields = item.detail.summaryFields.slice(0, 6);
  const recentRows = item.detail.yearTable.rows.slice(0, 3);

  const competitionSeries = item.detail.charts.competitionRate.series[0];
  const scoreSeries = item.detail.charts.scoreTrend.series[0];

  const competitionValues = competitionSeries
    ? parseSeriesValues(competitionSeries.data)
    : [];
  const scoreValues = scoreSeries ? parseSeriesValues(scoreSeries.data) : [];

  return (
    <article className="min-h-[72mm] rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-800">
              우선순위 {item.priority + 1}
            </span>
            <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600">
              저장 전략
            </span>
          </div>

          <div className="mt-2 text-[15px] font-extrabold text-slate-950">
            {item.detail.identity.universityName}
          </div>

          <div className="mt-1 text-[11px] text-slate-600">
            {item.detail.identity.admissionType} ·{" "}
            {item.detail.identity.admissionName} ·{" "}
            {item.detail.identity.recruitmentUnit}
          </div>

          <div className="mt-1 text-[10px] text-slate-500">
            {item.detail.identity.region}
            {item.detail.identity.track ? ` · ${item.detail.identity.track}` : ""}
            {item.detail.identity.collegeName
              ? ` · ${item.detail.identity.collegeName}`
              : ""}
          </div>
        </div>

        <div className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-right">
          <div className="text-[10px] font-semibold text-slate-500">
            27 모집인원
          </div>
          <div className="mt-1 text-[14px] font-black text-slate-900">
            {item.detail.recruitmentCount2027.display}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[1.15fr_0.85fr] gap-3">
        <div className="space-y-3">
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <div className="grid grid-cols-3 bg-slate-50 text-[10px] font-bold text-slate-700">
              <div className="border-r border-slate-200 px-2 py-2">항목</div>
              <div className="border-r border-slate-200 px-2 py-2">내용</div>
              <div className="px-2 py-2">비고</div>
            </div>

            {summaryFields.map((field, index) => (
              <div
                key={`${field.label}-${index}`}
                className="grid grid-cols-3 border-t border-slate-200 text-[10px] text-slate-700"
              >
                <div className="border-r border-slate-200 px-2 py-2 font-semibold text-slate-600">
                  {field.label}
                </div>
                <div className="col-span-2 px-2 py-2">{field.value}</div>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <div className="grid grid-cols-4 bg-slate-50 text-[10px] font-bold text-slate-700">
              <div className="border-r border-slate-200 px-2 py-2">학년도</div>
              <div className="border-r border-slate-200 px-2 py-2">경쟁률</div>
              <div className="border-r border-slate-200 px-2 py-2">성적70%</div>
              <div className="px-2 py-2">환산70%</div>
            </div>

            {recentRows.map((row, index) => (
              <div
                key={`${row.year}-${index}`}
                className="grid grid-cols-4 border-t border-slate-200 text-[10px] text-slate-700"
              >
                <div className="border-r border-slate-200 px-2 py-2">
                  {row.year}
                </div>
                <div className="border-r border-slate-200 px-2 py-2">
                  {row.competitionRate}
                </div>
                <div className="border-r border-slate-200 px-2 py-2">
                  {row.score70}
                </div>
                <div className="px-2 py-2">{row.converted70}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <MiniTrendChart
            title={item.detail.charts.competitionRate.title}
            labels={item.detail.charts.competitionRate.labels}
            values={competitionValues}
            color="#2563eb"
          />

          <MiniTrendChart
            title={item.detail.charts.scoreTrend.title}
            labels={item.detail.charts.scoreTrend.labels}
            values={scoreValues}
            color="#dc2626"
          />

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-[10px] font-bold text-slate-700">
              출력 메모
            </div>
            <div className="mt-2 h-[38px] rounded-md border border-dashed border-slate-300 bg-white" />
          </div>
        </div>
      </div>
    </article>
  );
}
