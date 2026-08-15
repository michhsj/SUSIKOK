// src/components/sections/home/HeroSection.tsx

import { heroContent } from "@/contents/home/hero";

const trustPoints = [
  "대학별 반영 기준 기반 분석",
  "학생부 성적 데이터 저장 및 재활용",
  "지원 전략 수립 참고 결과 제공",
];

const miniStats = [
  { label: "분석 기준", value: "대학별 반영 방식 적용" },
  { label: "결과 방식", value: "환산점수 + 기준 비교" },
  { label: "활용 목적", value: "수시 지원 전략 참고" },
];

export default function HeroSection() {
  const titleLines = heroContent.title.split("\n");

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.10),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(6,182,212,0.10),_transparent_30%),linear-gradient(to_bottom,_#f8fbff,_#ffffff_35%,_#f8fafc_100%)]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-[-100px] top-[-80px] h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute right-[-120px] top-28 h-96 w-96 rounded-full bg-cyan-100/40 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-16">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-blue-800 uppercase shadow-sm backdrop-blur">
              <span className="inline-flex h-2 w-2 rounded-full bg-blue-600" />
              {heroContent.eyebrow}
            </div>

            <h1 className="mt-7 text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-950 sm:text-5xl lg:text-[3.7rem]">
              {titleLines.map((line, index) => (
                <span key={line}>
                  {line}
                  {index < titleLines.length - 1 && <br />}
                </span>
              ))}
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              {heroContent.description}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={heroContent.primaryCta.href}
                className="inline-flex h-13 items-center justify-center rounded-2xl bg-gradient-to-r from-slate-950 via-blue-900 to-blue-700 px-7 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(30,64,175,0.22)] transition hover:translate-y-[-1px] hover:shadow-[0_20px_42px_rgba(30,64,175,0.28)]"
              >
                {heroContent.primaryCta.label}
              </a>

              <a
                href={heroContent.secondaryCta.href}
                className="inline-flex h-13 items-center justify-center rounded-2xl border border-slate-300 bg-white px-7 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                {heroContent.secondaryCta.label}
              </a>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {trustPoints.map((point) => (
                <div
                  key={point}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    ✓
                  </span>
                  {point}
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center gap-2 text-sm text-slate-500">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                ⓘ
              </span>
              <p>{heroContent.helperText}</p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-8 hidden h-32 w-32 rounded-full bg-blue-100/70 blur-2xl lg:block" />
            <div className="absolute -right-6 bottom-10 hidden h-40 w-40 rounded-full bg-cyan-100/70 blur-2xl lg:block" />

            <div className="relative rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur sm:p-7 lg:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    {heroContent.preview.title}
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    지원 대학: {heroContent.preview.university}
                  </p>
                </div>

                <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                  {heroContent.preview.resultLabel}
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
                  <p className="text-sm font-medium text-slate-500">내 환산점수</p>

                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-5xl font-extrabold tracking-tight text-blue-700">
                      {heroContent.preview.myScore}
                    </span>
                    <span className="pb-1 text-sm font-medium text-slate-500">
                      / {heroContent.preview.maxScore}
                    </span>
                  </div>

                  <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-slate-900 via-blue-700 to-cyan-400"
                      style={{ width: "92.35%" }}
                    />
                  </div>

                  <p className="mt-4 text-sm text-slate-500">
                    대학별 반영 기준을 적용한 예시 환산점수입니다.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                    <p className="text-sm font-medium text-slate-500">기준 점수</p>
                    <p className="mt-2 text-3xl font-extrabold text-slate-950">
                      {heroContent.preview.baseScore}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      대학 발표 기준과 비교한 예시 값
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-blue-200 bg-blue-50 p-5">
                    <p className="text-sm font-medium text-blue-700">현재 위치</p>
                    <p className="mt-2 text-2xl font-extrabold text-blue-800">
                      {heroContent.preview.percentile}
                    </p>
                    <p className="mt-2 text-sm text-blue-700/80">
                      비교 그룹 내 예시 위치 정보
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">분석 그래프 예시</p>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold tracking-wide text-white">
                    STRATEGIC VIEW
                  </span>
                </div>

                <div className="flex h-24 items-end gap-2">
                  {[18, 28, 22, 35, 26, 46, 72, 30].map((height, index) => (
                    <div
                      key={index}
                      className={`flex-1 rounded-t-md ${
                        index === 6
                          ? "bg-gradient-to-t from-slate-900 to-blue-700"
                          : "bg-slate-300"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {miniStats.map((item) => (
            <div
              key={item.label}
              className="rounded-[24px] border border-slate-200 bg-white/85 p-6 shadow-sm backdrop-blur"
            >
              <p className="text-sm font-semibold tracking-[0.14em] text-slate-500 uppercase">
                {item.label}
              </p>
              <p className="mt-3 text-lg font-bold text-slate-950">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
