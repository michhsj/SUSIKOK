"use client";

import Image from "next/image";
import { useState } from "react";

const navigationItems = [
  { label: "수시KOK 서비스 안내", href: "#service-overview" },
  { label: "추천합니다", href: "#target-users" },
  { label: "분석 안내", href: "#analysis-guide" },
  { label: "고객센터", href: "#company-info" },
];

export default function MainHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCloseMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50">
      {/* 상단 안내 바 */}
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
            <span>고객센터 평일 10:00 - 18:00</span>
          </div>
        </div>
      </div>

      {/* 메인 헤더 */}
      <div className="border-b border-slate-200/80 bg-white/92 backdrop-blur-xl">
        <div className="relative mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:h-24 sm:px-6 lg:px-8">
          {/* 왼쪽 로고 */}
          <div className="flex items-center">
            <a
              href="/"
              className="group inline-flex items-center"
              aria-label="UNIKOK 홈으로 이동"
              onClick={handleCloseMenu}
            >
              <Image
                src="/logo/unikok-logo.png"
                alt="UNIKOK 로고"
                width={220}
                height={56}
                priority
                className="h-auto w-[150px] object-contain sm:w-[190px] lg:w-[220px]"
              />
            </a>
          </div>

          {/* 데스크톱 가운데 메뉴 */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex">
            {navigationItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="relative text-[18px] font-bold leading-none text-slate-700 transition hover:text-blue-700"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* 데스크톱 오른쪽 버튼 */}
          <div className="hidden items-center gap-3 sm:flex">
            <a
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-5 text-sm font-semibold text-blue-800 shadow-[0_10px_24px_rgba(30,64,175,0.10)] transition hover:border-blue-300 hover:bg-blue-100"
            >
              로그인
            </a>

            <a
              href="/signup"
              style={{ color: "#ffffff" }}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-slate-900 to-blue-800 px-5 text-sm font-semibold text-white !text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] transition hover:from-slate-950 hover:to-blue-900"
            >
              회원가입
            </a>
          </div>

          {/* 모바일 햄버거 버튼 */}
          <button
            type="button"
            aria-label="메뉴 열기"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 sm:hidden"
          >
            <span className="sr-only">메뉴</span>
            <div className="flex flex-col gap-1.5">
              <span className="h-0.5 w-5 rounded-full bg-slate-700" />
              <span className="h-0.5 w-5 rounded-full bg-slate-700" />
              <span className="h-0.5 w-5 rounded-full bg-slate-700" />
            </div>
          </button>
        </div>

        {/* 모바일 드롭다운 메뉴 */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white sm:hidden">
            <div className="mx-auto max-w-7xl px-4 py-4">
              <nav className="flex flex-col gap-2">
                {navigationItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={handleCloseMenu}
                    className="rounded-xl px-4 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-blue-700"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              <div className="mt-4 flex flex-col gap-3">
                <a
                  href="/login"
                  onClick={handleCloseMenu}
                  className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-sm font-semibold text-blue-800 shadow-[0_10px_24px_rgba(30,64,175,0.10)] transition hover:border-blue-300 hover:bg-blue-100"
                >
                  로그인
                </a>

                <a
                  href="/signup"
                  onClick={handleCloseMenu}
                  style={{ color: "#ffffff" }}
                  className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-slate-900 to-blue-800 text-sm font-semibold text-white !text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] transition hover:from-slate-950 hover:to-blue-900"
                >
                  회원가입
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
