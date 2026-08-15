import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/auth/session";
import StudentMenuBar from "../../components/layout/StudentMenuBar";

function getGradeLabel(gradeLevel: number | null) {
  if (gradeLevel === 1) return "1학년";
  if (gradeLevel === 2) return "2학년";
  if (gradeLevel === 3) return "3학년";
  if (gradeLevel === 4) return "N수/기타";
  return "-";
}

export default async function StudentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(sessionToken);

  if (!session) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      gradeLevel: true,
      school: {
        select: {
          schoolName: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  async function logoutAction() {
    "use server";

    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f9fc_0%,#eef3ff_50%,#f8fafc_100%)]">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 items-center">
              <Image
                src="/logo/susikok-logo.png"
                alt="수시KOK 로고"
                width={140}
                height={40}
                priority
                className="h-10 w-auto object-contain"
              />
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[11px] font-bold text-slate-500">
                학교
              </div>

              <div className="min-w-0 text-right">
                <p className="truncate text-sm font-extrabold text-slate-950">
                  {user.name}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {user.school?.schoolName || "학교 정보 없음"} ·{" "}
                  {getGradeLabel(user.gradeLevel)}
                </p>
              </div>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-extrabold text-rose-700 shadow-sm transition hover:bg-rose-100"
              >
                로그아웃
              </button>
            </form>
          </div>
        </div>

        <StudentMenuBar />
      </header>

      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </section>
    </div>
  );
}
