"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menus = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/student/records", label: "내신성적 입력" },
  { href: "/student/mock-exams", label: "모의고사 입력" },
  { href: "/student/hakjong-fit", label: "학종 적합성 평가" },
  { href: "/student/admissions", label: "수시 입결 검색" },
  { href: "/student/payment", label: "내 성적으로 분석하기" },
  { href: "/student/strategy", label: "나의 입시 전략" },
  { href: "/my", label: "내 정보" },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard" || href === "/my") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function StudentMenuBar() {
  const pathname = usePathname();

  return (
    <nav className="border-t border-blue-900/40 bg-[linear-gradient(135deg,#0f172a_0%,#172554_45%,#1d4ed8_100%)]">
      <div className="mx-auto w-full max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          {menus.map((menu) => {
            const active = isActive(pathname, menu.href);

            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={[
                  "inline-flex items-center rounded-full px-4 py-2 text-sm font-bold transition",
                  active
                    ? "bg-white !text-blue-900 shadow-sm"
                    : "!text-white hover:bg-white/10",
                ].join(" ")}
              >
                {menu.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
