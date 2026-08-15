// src/components/sections/home/TrustIndicatorsSection.tsx

const trustPoints = [
  {
    id: "01",
    title: "신뢰할 수 있는 데이터",
    description:
      "공식 발표 자료를 바탕으로 보다 정확하고 신뢰도 높은 분석 기준을 제공합니다.",
    accent: "from-slate-900 to-blue-800",
    note: "공식 자료 기반 분석",
  },
  {
    id: "02",
    title: "안전한 정보 관리",
    description:
      "개인정보와 성적 데이터는 안전하게 보호되며, 안정적인 환경에서 관리됩니다.",
    accent: "from-blue-700 to-cyan-500",
    note: "개인정보 보호 구조",
  },
  {
    id: "03",
    title: "지속적인 기준 업데이트",
    description:
      "대학별 입시 요강과 반영 기준의 변경 사항을 반영하여 분석 품질을 지속적으로 개선합니다.",
    accent: "from-indigo-700 to-blue-500",
    note: "연도별 기준 갱신",
  },
  {
    id: "04",
    title: "전문적인 이용 지원",
    description:
      "이용 중 필요한 안내와 문의 사항은 고객센터를 통해 편리하게 확인할 수 있습니다.",
    accent: "from-cyan-600 to-sky-400",
    note: "1:1 문의 운영",
  },
];

const platformHighlights = [
  {
    value: "120+",
    label: "분석 가능 대학",
    description: "전국 주요 대학 기준 반영",
  },
  {
    value: "100점",
    label: "환산 만점 기준",
    description: "대학별 반영 방식 적용",
  },
  {
    value: "4단계",
    label: "지원 가능성 구분",
    description: "안정 · 적정 · 소신 · 도전",
  },
];

export default function TrustIndicatorsSection() {
  return (
    <section
      id="why-susikok"
      className="border-y border-slate-800 bg-slate-950"
    >
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">

        {/* 상단 헤더 */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
              Why 수시KOK
            </span>

            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              왜 수시KOK인가
            </h2>

            <p className="mt-5 text-base leading-8 text-slate-300 sm:text-lg">
              수시KOK는 단순한 성적 계산을 넘어, 대학별 반영 기준을 바탕으로
              보다 실질적인 비교와 판단이 가능하도록 설계된 수시 분석
              서비스입니다.
            </p>
          </div>

          <a
            href="/signup"
            className="inline-flex h-12 w-fit items-center justify-center rounded-2xl bg-white px-6 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
          >
            수시KOK 시작하기
          </a>
        </div>

        {/* 신뢰 포인트 카드 */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {trustPoints.map((card) => (
            <article
              key={card.id}
              className="group relative overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 shadow-[0_24px_70px_rgba(2,6,23,0.38)] transition hover:translate-y-[-2px] hover:shadow-[0_30px_80px_rgba(2,6,23,0.48)]"
            >
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl" />

              <div className="relative">
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent} text-sm font-extrabold text-white shadow-lg`}
                >
                  {card.id}
                </div>

                <h3 className="mt-6 text-xl font-bold text-white">
                  {card.title}
                </h3>

                <p className="mt-4 text-sm leading-7 text-slate-300">
                  {card.description}
                </p>

                <div className="mt-6 h-px w-full bg-gradient-to-r from-blue-500/30 via-slate-700 to-transparent" />

                <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                  <span className="text-xs font-semibold text-blue-300">
                    {card.note}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* 하단 플랫폼 수치 */}
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {platformHighlights.map((item) => (
            <div
              key={item.label}
              className="rounded-[28px] border border-slate-800 bg-gradient-to-br from-white/5 to-white/[0.02] p-7 shadow-[0_20px_60px_rgba(2,6,23,0.35)]"
            >
              <p className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                {item.value}
              </p>

              <p className="mt-3 text-lg font-bold text-slate-200">
                {item.label}
              </p>

              <div className="mt-3 h-px w-full bg-gradient-to-r from-blue-500/30 to-transparent" />

              <p className="mt-4 text-sm text-slate-400">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
