// src/components/sections/home/ServiceOverviewSection.tsx

const featureCards = [
  {
    id: "01",
    title: "학생부 성적 등록 및 저장",
    description:
      "엑셀 업로드 또는 직접 입력을 통해 학생부 성적을 손쉽게 등록하고, 개인별 성적 데이터를 안전하게 저장할 수 있습니다.",
    accent: "from-blue-700 to-cyan-500",
  },
  {
    id: "02",
    title: "대학별 환산점수 자동 계산",
    description:
      "대학별 반영 기준과 전형 방식을 적용하여, 내 성적에 맞는 환산점수를 자동으로 계산합니다.",
    accent: "from-slate-900 to-blue-800",
  },
  {
    id: "03",
    title: "대학 발표 기준과 비교 분석",
    description:
      "대학이 발표한 기준 점수와 내 환산점수를 비교하여 현재 위치를 보다 명확하게 확인할 수 있습니다.",
    accent: "from-indigo-700 to-blue-500",
  },
  {
    id: "04",
    title: "지원 가능성 참고 결과 제공",
    description:
      "분석 결과를 바탕으로 지원 방향을 검토할 수 있도록 직관적인 참고 결과를 제공합니다.",
    accent: "from-cyan-600 to-sky-500",
  },
];

const credibilityPoints = [
  "대학별 반영 방식과 기준을 고려한 분석 구조",
  "학생부 데이터 기반의 일관된 비교 흐름",
  "수시 지원 전략 수립을 위한 참고 정보 제공",
];

export default function ServiceOverviewSection() {
  return (
    <section
      id="service-overview"
      className="border-y border-slate-200 bg-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-800">
              Service Overview
            </span>

            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              수시KOK 서비스 안내
            </h2>

            <p className="mt-3 text-lg font-semibold text-slate-700">
              학생부 성적 기반 대학별 환산 분석 서비스
            </p>

            <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">
              수시KOK는 학생부 성적을 기반으로 대학별 환산점수를 자동
              계산하고, 대학이 발표한 기준 점수와 비교하여 지원 가능성을 보다
              체계적으로 검토할 수 있도록 돕는 서비스입니다.
            </p>

            <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
              대학마다 서로 다른 반영 방식과 기준을 고려하여, 보다 실질적인
              수시 지원 판단에 도움이 되는 분석 결과를 제공합니다.
            </p>

            <div className="mt-8 space-y-3">
              {credibilityPoints.map((point) => (
                <div
                  key={point}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    ✓
                  </span>
                  <p className="text-sm leading-7 text-slate-700">{point}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/about"
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-slate-950 via-blue-900 to-blue-700 px-6 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(30,64,175,0.18)] transition hover:translate-y-[-1px] hover:shadow-[0_18px_40px_rgba(30,64,175,0.24)]"
              >
                서비스 자세히 보기
              </a>

              <a
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                무료로 시작하기
              </a>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {featureCards.map((card) => (
              <article
                key={card.id}
                className="group rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.07)] transition hover:translate-y-[-2px] hover:shadow-[0_26px_70px_rgba(15,23,42,0.10)]"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent} text-sm font-extrabold text-white shadow-lg`}
                  >
                    {card.id}
                  </div>

                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Core Feature
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-bold leading-8 text-slate-950">
                  {card.title}
                </h3>

                <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-[15px]">
                  {card.description}
                </p>

                <div className="mt-6 h-px w-full bg-gradient-to-r from-slate-200 via-blue-200 to-transparent" />

                <p className="mt-5 text-sm font-medium text-blue-700">
                  대학별 기준을 고려한 전문 분석 흐름 제공
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
