import { redirect } from "next/navigation";
import { getCurrentUserOrRedirect } from "@/lib/auth/getCurrentUser";
import { hasActiveAnalysisMembership } from "@/lib/membership";
import StrategyPageClient from "../_components/StrategyPageClient";

export default async function StudentStrategyPage() {
  const user = await getCurrentUserOrRedirect();
  const isPaidMember = await hasActiveAnalysisMembership(user.id);

  if (!isPaidMember) {
    redirect("/student/payment");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
          나의 입시 전략
        </div>

        <div className="mt-5 overflow-x-auto">
          <div className="flex min-w-max items-center gap-4 whitespace-nowrap">
            <h1 className="text-2xl font-extrabold text-slate-950">
              나의 입시 전략
            </h1>

            <p className="text-sm leading-6 text-slate-600">
              학생의 내신, 모의고사, 지원 가능 대학 정보를 바탕으로 개인화된 입시 전략을 확인하는 페이지입니다.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <StrategyPageClient />
        </div>
      </section>
    </div>
  );
}
