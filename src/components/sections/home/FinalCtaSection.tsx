const ctaHighlights = [
  "학생부 성적 등록 및 저장",
  "대학별 환산점수 자동 계산",
  "대학 발표 기준과 비교 분석",
  "지원 가능성 참고 결과 확인",
];

export default function FinalCtaSection() {
  return (
    <section className="border-y border-slate-800 bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="relative overflow-hidden rounded-[36px] border border-slate-800 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-8 shadow-[0_40px_100px_rgba(2,6,23,0.55)] sm:p-10 lg:p-14">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-blue-600/15 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="absolute inset-0 rounded-[36px] bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.08),_transparent_65%)]" />
          </div>

          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="relative -translate-y-2 sm:-translate-y-3">
                <span
                  style={{ color: "#ffffff", position: "relative", top: "-8px" }}
                  className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em]"
                >
                  Get Started Now
                </span>

                <h2
                  style={{ lineHeight: 1.45 }}
                  className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl"
                >
                  <span style={{ color: "#fcd34d" }}>내 성적으로 시작하는</span>
                  <span
                    style={{ display: "block", marginTop: "8px", color: "#ffffff" }}
                  >
                    대학별 수시 분석
                  </span>
                </h2>
              </div>

              <p
                style={{ color: "#f1f5f9" }}
                className="mt-6 text-base leading-8 sm:text-lg"
              >
                지금 수시KOK에서 학생부 성적을 등록하고, 대학별 환산점수와
                지원 가능성을 직접 확인해보세요.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="/signup"
                  style={{ color: "#ffffff" }}
                  className="inline-flex h-13 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-7 text-sm font-extrabold shadow-[0_18px_45px_rgba(59,130,246,0.28)] transition hover:translate-y-[-1px] hover:shadow-[0_22px_52px_rgba(59,130,246,0.34)]"
                >
                  무료로 시작하기
                </a>

                <a
                  href="/login"
                  style={{ color: "#ffffff" }}
                  className="inline-flex h-13 items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-7 text-sm font-semibold backdrop-blur transition hover:bg-white/10"
                >
                  로그인하기
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {ctaHighlights.map((item) => (
                  <div
                    key={item}
                    style={{ color: "#f8fafc" }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium backdrop-blur"
                  >
                    <span
                      style={{ color: "#bfdbfe" }}
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold"
                    >
                      ✓
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur sm:p-7">
              <p
                style={{ color: "#e2e8f0" }}
                className="text-xs font-semibold uppercase tracking-[0.18em]"
              >
                분석 결과 미리보기
              </p>

              <h3
                style={{ color: "#fcd34d", marginTop: "20px" }}
                className="text-xl font-bold"
              >
                지금 바로 확인할 수 있는 정보
              </h3>

              <div className="mt-6 flex flex-col gap-4">
                {[
                  {
                    label: "내 환산점수",
                    value: "92.35",
                    sub: "/ 100점",
                    bg: "from-blue-600 to-cyan-400",
                    percent: "92.35%",
                  },
                  {
                    label: "기준 점수",
                    value: "91.80",
                    sub: "대학 발표 기준",
                    bg: null,
                    percent: null,
                  },
                  {
                    label: "분석 결과",
                    value: "적정 지원",
                    sub: "지원 전략 참고용",
                    bg: null,
                    percent: null,
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p
                          style={{ color: "#e2e8f0" }}
                          className="text-sm font-medium"
                        >
                          {row.label}
                        </p>
                        <p
                          style={{ color: "#ffffff" }}
                          className="mt-2 text-2xl font-extrabold"
                        >
                          {row.value}
                        </p>
                        <p style={{ color: "#cbd5e1" }} className="mt-1 text-xs">
                          {row.sub}
                        </p>
                      </div>

                      {row.value === "적정 지원" && (
                        <span
                          style={{ color: "#d1fae5" }}
                          className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-sm font-bold"
                        >
                          적정
                        </span>
                      )}
                    </div>

                    {row.percent && (
                      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${row.bg}`}
                          style={{ width: row.percent }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3">
                <p style={{ color: "#dbeafe" }} className="text-xs leading-6">
                  ※ 위 수치는 예시 데이터이며, 실제 분석 결과는 입력하신
                  성적과 대학별 기준에 따라 달라집니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
