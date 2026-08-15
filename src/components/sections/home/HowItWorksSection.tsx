// src/components/sections/home/HowItWorksSection.tsx

const steps = [
  {
    step: "01",
    title: "회원가입 및 로그인",
    description:
      "회원가입 후 로그인하여 서비스를 시작합니다. 등록한 정보와 성적 데이터는 개인 계정에 저장되어 지속적으로 활용할 수 있습니다.",
  },
  {
    step: "02",
    title: "학생부 성적 입력",
    description:
      "엑셀 업로드 또는 직접 입력을 통해 학생부 성적을 등록합니다. 입력된 데이터는 분석에 적합한 형태로 정리되어 저장됩니다.",
  },
  {
    step: "03",
    title: "대학 및 전형 선택",
    description:
      "분석하고자 하는 대학과 전형, 모집단위를 선택하면 해당 기준에 맞는 분석이 자동으로 적용됩니다.",
  },
  {
    step: "04",
    title: "환산점수 및 지원 가능성 확인",
    description:
      "대학별 환산점수와 기준 점수를 비교하여 지원 가능성을 한눈에 확인할 수 있습니다.",
  },
];

const processNotes = [
  "복잡한 계산 대신 이해하기 쉬운 분석 흐름",
  "대학별 기준을 반영한 비교 결과 제공",
  "학생·학부모·상담 현장에서 활용 가능한 구조",
];

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="border-y border-slate-800 bg-slate-950"
    >
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div>
            <span className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
              How It Works
            </span>

            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              이용 방법
            </h2>

            <p className="mt-3 text-lg font-semibold text-slate-300">
              성적 등록부터 대학별 분석까지 간편하게
            </p>

            <p className="mt-6 text-base leading-8 text-slate-300 sm:text-lg">
              회원가입 후 학생부 성적을 등록하고, 관심 있는 대학과 전형을
              선택하면 대학별 환산점수와 지원 가능성 결과를 손쉽게 확인할 수
              있습니다.
            </p>

            <div className="mt-8 space-y-3">
              {processNotes.map((note) => (
                <div
                  key={note}
                  className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-white/5 px-4 py-3"
                >
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/15 text-xs font-bold text-blue-300">
                    ✓
                  </span>
                  <p className="text-sm leading-7 text-slate-300">{note}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[28px] border border-slate-800 bg-gradient-to-br from-white/5 to-white/[0.03] p-6 shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Advisory Flow
              </p>

              <h3 className="mt-3 text-xl font-bold text-white">
                수시 전략 검토 흐름에 맞춘 단계형 구성
              </h3>

              <p className="mt-4 text-sm leading-7 text-slate-400">
                단순 입력 화면이 아니라, 학생부 성적을 바탕으로 대학별 분석
                흐름을 단계적으로 이해할 수 있도록 구성합니다.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href="/guide"
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-white px-6 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                >
                  이용 방법 자세히 보기
                </a>

                <a
                  href="/signup"
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-700 bg-transparent px-6 text-sm font-semibold text-white transition hover:border-slate-500 hover:bg-white/5"
                >
                  회원가입 후 시작하기
                </a>
              </div>
            </div>
          </div>

          <div className="grid gap-5">
            {steps.map((item, index) => (
              <article
                key={item.step}
                className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 shadow-[0_24px_70px_rgba(2,6,23,0.38)]"
              >
                <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl" />

                <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-base font-extrabold text-white shadow-lg">
                      {item.step}
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Step {index + 1}
                      </p>
                      <h3 className="mt-2 text-xl font-bold text-white">
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  <span className="inline-flex w-fit rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
                    분석 흐름
                  </span>
                </div>

                <p className="relative mt-5 text-sm leading-7 text-slate-300 sm:text-[15px]">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
