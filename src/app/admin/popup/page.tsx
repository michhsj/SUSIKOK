import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/auth/admin-session";
import HomePopupAdminPanel from "../_components/HomePopupAdminPanel";

export default async function AdminPopupPage() {
  noStore();

  const cookieStore = await cookies();
  const adminToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const adminSession = adminToken
    ? verifyAdminSessionToken(adminToken)
    : null;

  if (!adminSession) {
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.10),_transparent_35%),linear-gradient(to_bottom,_#f8fafc,_#eef2f7)]">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
        <section className="relative overflow-hidden rounded-[30px] border border-blue-200 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.10),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.08),_transparent_30%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                ADMIN POPUP SETTINGS
              </div>

              <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                메인 페이지 팝업 설정
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                메인 페이지(`/`)에 노출할 팝업 이미지를 관리합니다. 이미지 1장 업로드,
                팝업 크기, 위치, 활성화 여부, 오늘 하루 보지 않기 옵션을 설정할 수 있습니다.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                관리자 메인으로
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <HomePopupAdminPanel />
        </section>
      </div>
    </main>
  );
}
