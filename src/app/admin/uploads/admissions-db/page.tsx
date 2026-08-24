import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/auth/admin-session";

import AdmissionsDbUploadPageClient from "./_components/AdmissionsDbUploadPageClient";

function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatDateTime(value: Date | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

async function getPageData() {
  const admissionYear = 2027;

  const [currentCount, latestRow] = await Promise.all([
    prisma.admissionResult.count({
      where: {
        admissionYear,
      },
    }),
    prisma.admissionResult.findFirst({
      where: {
        admissionYear,
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        updatedAt: true,
        sourceFileName: true,
      },
    }),
  ]);

  return {
    admissionYear,
    currentCount,
    latestUpdatedAt: latestRow?.updatedAt ?? null,
    latestSourceFileName: latestRow?.sourceFileName ?? null,
  };
}

export default async function AdmissionsDbUploadPage() {
  noStore();

  const cookieStore = await cookies();
  const adminToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const adminSession = adminToken
    ? verifyAdminSessionToken(adminToken)
    : null;

  if (!adminSession) {
    redirect("/admin/login");
  }

  const pageData = await getPageData();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.10),_transparent_35%),linear-gradient(to_bottom,_#f8fafc,_#eef2f7)]">
      <div className="mx-auto max-w-5xl px-6 py-8 lg:px-8 lg:py-10">
        <section className="rounded-[28px] border border-blue-200 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                ADMIN UPLOAD
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
                수시 통합DB 업로드
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                수정된 엑셀 파일을 업로드하면 현재{" "}
                <span className="font-semibold text-slate-900">
                  {pageData.admissionYear}학년도 수시 통합DB
                </span>
                를 먼저 삭제한 뒤, 새 파일 기준으로 다시 적재합니다.
              </p>
            </div>

            <Link
              href="/admin"
              className="inline-flex h-11 items-center justify-center rounded-xl border-2 border-blue-900 bg-white px-4 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
            >
              관리자 메인으로
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[20px] border border-blue-200 bg-blue-50/80 p-4 shadow-sm">
              <div className="text-xs font-medium text-slate-500">
                현재 {pageData.admissionYear} DB 건수
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {formatNumber(pageData.currentCount)}건
              </div>
            </div>

            <div className="rounded-[20px] border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm">
              <div className="text-xs font-medium text-slate-500">
                최근 반영 시각
              </div>
              <div className="mt-2 text-base font-bold text-slate-900">
                {formatDateTime(pageData.latestUpdatedAt)}
              </div>
            </div>

            <div className="rounded-[20px] border border-amber-200 bg-amber-50/80 p-4 shadow-sm">
              <div className="text-xs font-medium text-slate-500">
                최근 반영 파일
              </div>
              <div className="mt-2 text-sm font-bold text-slate-900 break-all">
                {pageData.latestSourceFileName ?? "-"}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <AdmissionsDbUploadPageClient
            admissionYear={pageData.admissionYear}
            currentCount={pageData.currentCount}
          />
        </section>
      </div>
    </main>
  );
}
