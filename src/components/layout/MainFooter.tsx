// src/components/layout/MainFooter.tsx

const footerLinks = {
  service: {
    title: "서비스",
    links: [
      { label: "수시KOK 서비스 안내", href: "#service-overview" },
      { label: "이용 방법", href: "#how-it-works" },
      { label: "분석 안내", href: "#analysis-guide" },
    ],
  },
  support: {
    title: "고객지원",
    links: [
      { label: "공지사항", href: "/notice" },
      { label: "고객센터", href: "/support" },
      { label: "자주 묻는 질문", href: "#faq" },
    ],
  },
  legal: {
    title: "이용안내",
    links: [
      { label: "이용약관", href: "/terms" },
      { label: "개인정보처리방침", href: "/privacy" },
    ],
  },
};

const contactInfo = [
  { label: "문의", value: "help@susikok.kr" },
  { label: "전화", value: "02-1234-5678" },
  { label: "운영시간", value: "평일 09:00 - 18:00" },
];

export default function MainFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950">

      {/* 상단 영역 */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr]">

          {/* 브랜드 영역 */}
          <div className="lg:col-span-1">
            <a href="/" className="inline-flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 via-blue-800 to-blue-600 text-sm font-extrabold text-white shadow-lg">
                K
              </span>
              <div>
                <p className="text-xl font-extrabold tracking-tight text-white">
                  수시KOK
                </p>
                <p className="text-[11px] font-medium tracking-[0.16em] text-slate-500 uppercase">
                  Admissions Strategy
                </p>
              </div>
            </a>

            <p className="mt-6 text-sm leading-7 text-slate-400">
              학생부 성적 기반 대학별 환산 분석 서비스
            </p>

            <p className="mt-4 text-sm leading-7 text-slate-500">
              수시KOK는 학생부 성적을 바탕으로 대학별 환산점수를 계산하고,
              대학 발표 기준과 비교하여 수시 지원 전략 수립에 필요한 참고
              정보를 제공합니다.
            </p>

            <div className="mt-6 space-y-2">
              {contactInfo.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 text-sm text-slate-400"
                >
                  <span className="w-16 shrink-0 font-semibold text-slate-500">
                    {item.label}
                  </span>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 링크 영역 */}
          {Object.values(footerLinks).map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-300">
                {group.title}
              </h3>

              <ul className="mt-5 flex flex-col gap-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-slate-400 transition hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* CTA 영역 */}
          <div className="rounded-[24px] border border-slate-800 bg-gradient-to-br from-white/5 to-white/[0.02] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Start Free
            </p>

            <h3 className="mt-3 text-lg font-bold text-white">
              지금 무료로 시작해보세요
            </h3>

            <p className="mt-3 text-sm leading-7 text-slate-400">
              학생부 성적을 입력하고 대학별 환산점수를 바로 확인할 수
              있습니다.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <a
                href="/signup"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-slate-100 to-white text-sm font-semibold text-slate-950 transition hover:bg-white"
              >
                무료로 시작하기
              </a>

              <a
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-700 bg-transparent text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                로그인하기
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 카피라이트 */}
      <div className="border-t border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="text-sm text-slate-500">
            © 2024 수시KOK. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            <a
              href="/terms"
              className="text-sm text-slate-500 transition hover:text-slate-300"
            >
              이용약관
            </a>
            <span className="h-3 w-px bg-slate-700" />
            <a
              href="/privacy"
              className="text-sm text-slate-500 transition hover:text-slate-300"
            >
              개인정보처리방침
            </a>
            <span className="h-3 w-px bg-slate-700" />
            <a
              href="/support"
              className="text-sm text-slate-500 transition hover:text-slate-300"
            >
              고객센터
            </a>
          </div>

          <p className="text-sm text-slate-600">
            학생부 성적 기반 대학별 환산 분석 서비스
          </p>
        </div>
      </div>
    </footer>
  );
}
