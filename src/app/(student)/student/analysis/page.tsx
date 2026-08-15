//src/app/(student)/student/analysis/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUserOrRedirect } from "@/lib/auth/getCurrentUser";
import { hasActiveAnalysisMembership } from "@/lib/membership";

export default async function StudentAnalysisPage() {
  const user = await getCurrentUserOrRedirect();
  const isPaidMember = await hasActiveAnalysisMembership(user.id);

  if (!isPaidMember) {
    redirect("/student/payment");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
          내 성적으로 분석하기
        </div>

        <div className="mt-5 overflow-x-auto">
          <div className="flex min-w-max items-center gap-4 whitespace-nowrap">
            <h1 className="text-2xl font-extrabold text-slate-950">
              내 성적으로 분석하기
            </h1>

            <p className="text-sm leading-6 text-slate-600">
              대학 및 학과별 수시 입결을 검색하고, 내 성적 기준 비교 결과를 함께 확인하는 페이지입니다.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="space-y-6">
          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
            <div className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
              수시 입결 검색
            </div>

            <h2 className="mt-3 text-2xl font-extrabold text-slate-950">
              수시 입결 검색
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              대학 및 학과별 수시 입결을 검색하고 비교하는 페이지입니다.
            </p>

            <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm text-slate-600">
                검색 필터, 대학명/학과명 검색, 모집단위별 결과 표가 추후 추가될 예정입니다.
              </p>
            </div>
          </section>
        </article>

        <aside className="space-y-6">
          <section className="rounded-[32px] border border-blue-200 bg-white p-6 shadow-sm lg:p-8">
            <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              내 성적 비교 결과
            </div>

            <h2 className="mt-3 text-lg font-extrabold text-slate-950">
              대학별 비교 결과
            </h2>

            <div className="mt-5 rounded-[24px] border border-blue-100 bg-blue-50 p-6">
              <p className="text-sm font-bold text-blue-900">
                추후 추가될 영역
              </p>
              <p className="mt-2 text-sm leading-6 text-blue-800">
                검색한 대학/학과 기준으로 내 성적 환산점수, 적정/상향/안정 여부,
                전년도 결과와의 비교 내용이 이 영역에 표시될 예정입니다.
              </p>
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
            <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
              저장 기능
            </div>

            <h2 className="mt-3 text-lg font-extrabold text-slate-950">
              관심 대학 저장
            </h2>

            <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-bold text-slate-900">
                추후 추가될 영역
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                검색한 대학/학과를 저장하고 다시 확인할 수 있는 버튼과 목록이 이 영역에
                추가될 예정입니다.
              </p>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
