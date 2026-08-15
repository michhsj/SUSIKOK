// src/components/sections/home/TargetUsersSection.tsx

const userTypes = [
  {
    id: "01",
    title: "학생",
    subtitle: "수시 지원을 직접 준비하는 수험생",
    description:
      "내 성적으로 어느 대학과 전형을 검토할 수 있는지 미리 확인하고 싶은 학생",
    points: [
      "대학별 환산점수 직접 확인",
      "지원 가능성 결과 참고",
      "성적 데이터 누적 저장",
    ],
    accent: "from-blue-700 to-cyan-500",
    badgeTone: "border-blue-200 bg-blue-50 text-blue-700",
  },
  {
    id: "02",
    title: "학부모",
    subtitle: "자녀의 입시 전략을 함께 검토하는 보호자",
    description:
      "자녀의 수시 지원 방향을 보다 객관적인 기준으로 함께 검토하고 싶은 학부모",
    points: [
      "객관적인 비교 기준 확인",
      "대학 발표 기준 대비 위치 파악",
      "이해하기 쉬운 분석 결과 제공",
    ],
    accent: "from-slate-900 to-blue-800",
    badgeTone: "border-slate-200 bg-slate-50 text-slate-700",
  },
  {
    id: "03",
    title: "상담교사 및 학원",
    subtitle: "학생 지도와 전략 수립이 필요한 상담 현장",
    description:
      "학생별 성적을 보다 체계적으로 비교·분석하여 상담과 지도를 진행하고 싶은 분들",
    points: [
      "다수 학생 성적 비교 관리",
      "전형별 기준 기반 전략 참고",
      "상담 현장 활용에 적합한 결과 구조",
    ],
    accent: "from-indigo-700 to-blue-500",
    badgeTone: "border-indigo-200 bg-indigo-50 text-indigo-700",
  },
];

export default function TargetUsersSection() {
  return (
    <section
      id="target-users"
      className="border-y border-slate-200 bg-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">

        {/* 헤더 */}
        <div className="max-w-3xl">
          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-800">
            Who We Help
          </span>

          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            이런 분들께 추천합니다
          </h2>

          <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">
            수시KOK는 학생, 학부모, 상담교사와 같이 수시 지원 판단이 필요한
            다양한 사용자에게 유용한 서비스를 제공합니다.
          </p>
        </div>

        {/* 카드 그리드 */}
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {userTypes.map((user) => (
            <article
              key={user.id}
              className="group flex flex-col rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_20px_60px_rgba(15,23,42,0.07)] transition hover:translate-y-[-2px] hover:shadow-[0_26px_70px_rgba(15,23,42,0.10)] sm:p-8"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${user.accent} text-sm font-extrabold text-white shadow-lg`}
                >
                  {user.id}
                </div>

                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${user.badgeTone}`}
                >
                  {user.title}
                </span>
              </div>

              <h3 className="mt-7 text-2xl font-extrabold tracking-tight text-slate-950">
                {user.title}
              </h3>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                {user.subtitle}
              </p>

              <p className="mt-5 text-[15px] leading-8 text-slate-600">
                {user.description}
              </p>

              <div className="mt-7 h-px w-full bg-gradient-to-r from-slate-200 via-blue-200 to-transparent" />

              <ul className="mt-6 flex flex-col gap-3">
                {user.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-3"
                  >
                    <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                      ✓
                    </span>
                    <span className="text-sm leading-7 text-slate-700">
                      {point}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex-1" />

              <a
                href="/signup"
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-slate-950 via-blue-900 to-blue-700 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(30,64,175,0.16)] transition hover:translate-y-[-1px] hover:shadow-[0_18px_40px_rgba(30,64,175,0.22)]"
              >
                회원가입 후 이용하기
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
