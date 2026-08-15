// src/components/sections/home/AnalysisGuideSection.tsx

const guideCards = [
  {
    title: "환산점수란",
    description:
      "대학별 반영 기준에 따라 학생부 성적을 다시 계산한 점수로, 대학별 지원 가능성을 비교하는 기준이 됩니다.",
  },
  {
    title: "비교 기준이란",
    description:
      "대학이 발표한 전년도 또는 최근 입시 결과를 바탕으로 제공되는 기준 점수입니다.",
  },
  {
    title: "지원 가능성이란",
    description:
      "내 환산점수와 비교 기준 간 차이를 바탕으로 지원 방향을 검토할 수 있도록 제공되는 참고 결과입니다.",
  },
];

const interpretationItems = [
  {
    title: "안정 지원",
    description: "기준 점수보다 여유가 있는 경우",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  {
    title: "적정 지원",
    description: "기준 점수와 유사하거나 긍정적으로 검토 가능한 경우",
    tone: "border-blue-200 bg-blue-50 text-blue-700",
  },
  {
    title: "소신 지원",
    description: "기준과 비슷하거나 다소 도전적인 경우",
    tone: "border-amber-200 bg-amber-50 text-amber-700",
  },
  {
    title: "도전 지원",
    description: "기준보다 낮아 신중한 판단이 필요한 경우",
    tone: "border-rose-200 bg-rose-50 text-rose-700",
  },
];

const analysisHighlights = [
  "대학별 반영 기준 적용",
  "비교 기준 기반 결과 제시",
  "지원 전략 참고용 해석 제공",
];

export default function AnalysisGuideSection() {
  return (
    <section
      id="analysis-guide"
      className="border-y border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.07),_transparent_26%),linear-gradient(to_bottom,_#ffffff,_#f8fbff)]"
    >
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-3xl">
          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-800">
            Analysis Guide
          </span>

          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            분석 안내
          </h2>

          <p className="mt-3 text-lg font-semibold text-slate-700">
            대학 기준 비교를 통한 지원 판단 참고 제공
          </p>

          <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">
            수시KOK의 분석 결과는 입력한 학생부 성적을 대학별 반영 기준에 따라
            환산한 뒤, 대학 발표 기준과 비교하여 지원 전략 수립에 참고할 수
            있도록 제공됩니다.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            {analysisHighlights.map((item) => (
              <span
                key={item}
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {guideCards.map((card, index) => (
            <article
              key={card.title}
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.07)]"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-blue-700 text-sm font-extrabold text-white shadow-lg">
                0{index + 1}
              </div>

              <h3 className="mt-6 text-xl font-bold text-slate-950">
                {card.title}
              </h3>

              <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-[15px]">
                {card.description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Result Interpretation
                </p>
                <h3 className="mt-2 text-2xl font-bold text-slate-950">
                  결과는 이렇게 해석할 수 있습니다
                </h3>
              </div>

              <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                참고용 해석 기준
              </span>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {interpretationItems.map((item) => (
                <div
                  key={item.title}
                  className={`rounded-2xl border p-5 ${item.tone}`}
                >
                  <p className="text-lg font-bold">{item.title}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-700">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-7 text-white shadow-[0_30px_80px_rgba(15,23,42,0.24)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
              Advisory Note
            </p>

            <h3 className="mt-3 text-2xl font-bold leading-9">
              분석 결과는 전략 수립을 위한 참고 자료입니다
            </h3>

            <p className="mt-5 text-sm leading-8 text-slate-300 sm:text-[15px]">
              분석 결과는 수시 지원 전략 수립을 위한 참고 자료이며, 실제
              결과는 대학별 전형 요소와 지원 상황에 따라 달라질 수 있습니다.
            </p>

            <div className="mt-7 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                대학별 전형 기준과 반영 방식에 따라 결과는 달라질 수 있습니다.
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                실제 지원 전략은 학생 개인 상황과 전형 요소를 함께 검토해야
                합니다.
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <a
                href="/analysis-guide"
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-white px-6 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                분석 기준 확인하기
              </a>

              <a
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/20 bg-transparent px-6 text-sm font-semibold text-white transition hover:bg-white/5"
              >
                무료로 시작하기
              </a>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
