// src/components/layout/MainHeader.tsx

const navigationItems = [
  { label: "수시KOK 서비스 안내", href: "#service-overview" },
  { label: "이용 방법", href: "#how-it-works" },
  { label: "분석 안내", href: "#analysis-guide" },
  { label: "공지사항", href: "/notice" },
  { label: "고객센터", href: "/support" },
];

export default function MainHeader() {
  return (
    <header className="sticky top-0 z-50">
      <div className="border-b border-slate-800 bg-slate-950 text-slate-200">
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-4 text-xs sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-2 w-2 rounded-full bg-blue-400" />
            <span className="font-medium tracking-wide text-slate-300">
              학생부 기반 대학별 환산 분석 서비스
            </span>
          </div>

          <div className="hidden items-center gap-5 text-slate-400 md:flex">
            <span>입시 전략 참고 자료 제공</span>
            <span className="h-3 w-px bg-slate-700" />
            <span>고객센터 평일 09:00 - 18:00</span>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200/80 bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-10">
            <a
              href="/"
              className="group inline-flex items-center gap-3"
              aria-label="수시KOK 홈으로 이동"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 text-sm font-extrabold text-white shadow-lg shadow-blue-900/20">
                K
              </span>
              <div>
                <p className="text-2xl font-extrabold tracking-tight text-slate-950">
                  수시KOK
                </p>
                <p className="text-[11px] font-medium tracking-[0.18em] text-slate-500 uppercase">
                  Admissions Strategy
                </p>
              </div>
            </a>

            <nav className="hidden items-center gap-8 lg:flex">
              {navigationItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="relative text-sm font-semibold text-slate-700 transition hover:text-blue-700"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <a
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              로그인
            </a>

            <a
              href="/signup"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-slate-900 to-blue-800 px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] transition hover:from-slate-950 hover:to-blue-900"
            >
              회원가입
            </a>
          </div>

          <a
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 sm:hidden"
          >
            로그인
          </a>
        </div>
      </div>
    </header>
  );
}
