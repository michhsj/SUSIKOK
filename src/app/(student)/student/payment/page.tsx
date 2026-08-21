import Link from "next/link";
import { redirect } from "next/navigation";
import { EntitlementFeatureCode, EntitlementStatus } from "@prisma/client";
import AdmissionsPageClient from "../_components/AdmissionsPageClient";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

function InfoCard({
  title,
  description,
  tone = "blue",
}: {
  title: string;
  description: string;
  tone?: "blue" | "green" | "amber" | "pink";
}) {
  const toneClass =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : tone === "pink"
          ? "border-pink-200 bg-pink-50 text-pink-900"
          : "border-blue-200 bg-blue-50 text-blue-900";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-sm font-bold">{title}</p>
      <p className="mt-2 text-sm leading-6 opacity-90">{description}</p>
    </div>
  );
}

export default async function StudentPaymentPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const now = new Date();

  const entitlement = await prisma.userEntitlement.findFirst({
    where: {
      userId: user.id,
      featureCode: EntitlementFeatureCode.ANALYSIS_30D,
      status: EntitlementStatus.ACTIVE,
      expiresAt: {
        gt: now,
      },
    },
    select: {
      id: true,
      startsAt: true,
      expiresAt: true,
    },
  });

  const premiumUnlocked = Boolean(entitlement);

  if (premiumUnlocked) {
    return <AdmissionsPageClient premiumUnlocked={true} />;
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] pb-12 text-slate-900">
      <div className="mx-auto w-full max-w-[1180px] px-4 py-8">
        <section className="overflow-hidden rounded-[32px] border border-blue-100 bg-white shadow-[0_20px_70px_-35px_rgba(30,64,175,0.35)]">
          <div className="grid gap-6 px-6 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
            <div className="space-y-5">
              <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold tracking-[0.18em] text-blue-800">
                PREMIUM SERVICE
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-black tracking-[-0.04em] text-[#153e8a] lg:text-4xl">
                  결제 후 바로
                  <br />
                  수시입결검색 프리미엄 기능을 이용할 수 있습니다.
                </h1>

                <p className="max-w-2xl text-sm leading-7 text-slate-600">
                  결제가 완료되면 이 페이지에서 바로 입결 검색 화면이 열리고,
                  <span className="font-semibold text-slate-900"> 내성적</span>,
                  <span className="font-semibold text-slate-900"> 지원가능성</span>,
                  <span className="font-semibold text-slate-900"> 저장</span>
                  기능이 활성화됩니다.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <InfoCard
                  title="내성적"
                  description="후속 반영되는 대학별 환산점수를 확인할 수 있습니다."
                  tone="blue"
                />
                <InfoCard
                  title="지원가능성"
                  description="도전 · 상향 · 안정 · 적정 · 하향 기준으로 보여집니다."
                  tone="pink"
                />
                <InfoCard
                  title="저장"
                  description="선택한 모집단위를 내 입시 전략에 저장할 수 있습니다."
                  tone="green"
                />
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <div className="rounded-2xl border border-white bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">프리미엄 이용권</p>
                    <p className="mt-1 text-xs text-slate-500">ANALYSIS_30D</p>
                  </div>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                    결제 필요
                  </span>
                </div>

                <div className="mt-4 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-white to-blue-50 px-4 py-4 shadow-sm">
                  <p className="text-xs font-bold tracking-[0.16em] text-blue-700">
                    결제 금액
                  </p>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-black leading-none tracking-[-0.04em] text-blue-950">
                        33,000
                      </span>
                      <span className="pb-1 text-base font-bold text-blue-900">
                        원
                      </span>
                    </div>
                    <span className="rounded-full bg-blue-900 px-3 py-1 text-xs font-bold text-white">
                      30일 이용권
                    </span>
                  </div>
                </div>

                <div className="mt-5 space-y-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-semibold text-blue-900">서비스 기간</span>
                    <span className="text-sm font-bold text-blue-950">30일</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-semibold text-blue-900">이용 범위</span>
                    <span className="text-right text-sm font-medium text-blue-950">
                      내성적 / 지원가능성 / 저장
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-semibold text-blue-900">활성 조건</span>
                    <span className="text-right text-sm font-medium text-blue-950">
                      결제 완료 후 즉시 반영
                    </span>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <Link
                    href="/student/payment/checkout"
                    className="inline-flex h-12 w-full items-center justify-center rounded-2xl border-2 border-blue-900 bg-white px-4 text-sm font-bold text-blue-900 transition hover:bg-blue-50"
                  >
                    결제 진행하기
                  </Link>

                  <Link
                    href="/student/admissions"
                    className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    일반 입결 검색으로 이동
                  </Link>
                </div>

                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
                  실제 결제 완료 후에는 결제 성공 처리에서 이용권이 활성화되어야 하며,
                  이후 이 페이지에 다시 진입하면 자동으로 입결 검색 화면이 표시됩니다.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <InfoCard
            title="결제 완료 후 동작"
            description="이용권이 활성 상태로 확인되면 /student/payment 페이지에서 바로 admissions와 동일한 화면이 렌더링됩니다."
            tone="blue"
          />
          <InfoCard
            title="저장 기능 연동"
            description="저장 버튼을 누르면 선택한 모집단위가 내 입시 전략 페이지에 저장되어 다시 확인할 수 있습니다."
            tone="green"
          />
          <InfoCard
            title="지원가능성 단계"
            description="현재 단계값은 도전, 상향, 안정, 적정, 하향 기준으로 노출되며 범위 규칙은 후속 반영 가능합니다."
            tone="pink"
          />
        </section>
      </div>
    </main>
  );
}
