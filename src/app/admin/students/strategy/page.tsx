import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore, revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrRedirect } from "@/lib/auth/getCurrentUser";
import { getActiveAnalysisEntitlement } from "@/lib/membership";
import {
  getSupportLevelLabel,
  getSupportLevelTone,
} from "@/lib/student/support-level";

type Tone = "blue" | "green" | "amber" | "pink" | "slate";

function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
  }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function panelToneClass(tone: "blue" | "green" | "amber" | "pink") {
  switch (tone) {
    case "blue":
      return "border-blue-200 bg-blue-50/70";
    case "green":
      return "border-emerald-200 bg-emerald-50/70";
    case "amber":
      return "border-amber-200 bg-amber-50/70";
    case "pink":
      return "border-pink-200 bg-pink-50/70";
  }
}

function badgeToneClass(tone: Tone) {
  switch (tone) {
    case "blue":
      return "border-blue-200 bg-white text-blue-700";
    case "green":
      return "border-emerald-200 bg-white text-emerald-700";
    case "amber":
      return "border-amber-200 bg-white text-amber-700";
    case "pink":
      return "border-pink-200 bg-white text-pink-700";
    case "slate":
    default:
      return "border-slate-200 bg-white text-slate-700";
  }
}

function statusToneFromSupport(levelLabel: string): Tone {
  switch (levelLabel) {
    case "도전":
      return "pink";
    case "상향":
      return "amber";
    case "안정":
      return "blue";
    case "적정":
      return "green";
    case "하향":
      return "slate";
    default:
      return "slate";
  }
}

async function removeSavedRecruitmentUnit(formData: FormData) {
  "use server";

  const user = await getCurrentUserOrRedirect();
  const savedId = String(formData.get("savedId") ?? "").trim();

  if (!savedId) return;

  await prisma.studentSavedRecruitmentUnit.deleteMany({
    where: {
      id: savedId,
      userId: user.id,
    },
  });

  revalidatePath("/student/strategy");
  revalidatePath("/student/admissions");
  revalidatePath("/student/payment");
}

function SectionTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          {eyebrow}
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: Tone;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap ${badgeToneClass(
        tone
      )}`}
    >
      {label}
    </span>
  );
}

export default async function StudentStrategyPage() {
  noStore();

  const user = await getCurrentUserOrRedirect();
  const entitlement = await getActiveAnalysisEntitlement(user.id);

  if (!entitlement) {
    redirect("/student/payment");
  }

  const savedItems = await prisma.studentSavedRecruitmentUnit.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      admissionResult: {
        select: {
          id: true,
          region: true,
          universityName: true,
          admissionType: true,
          admissionName: true,
          track: true,
          collegeName: true,
          recruitmentUnit: true,
          currentHeadcountRaw: true,
        },
      },
    },
  });

  const analysisResults = savedItems.length
    ? await prisma.studentAdmissionAnalysisResult.findMany({
        where: {
          userId: user.id,
          admissionResultId: {
            in: savedItems.map((item) => item.admissionResultId),
          },
        },
        select: {
          admissionResultId: true,
          convertedScore: true,
          supportLevel: true,
          calculatedAt: true,
          calculationMemo: true,
        },
      })
    : [];

  const analysisMap = new Map(
    analysisResults.map((item) => [item.admissionResultId, item])
  );

  const savedCount = savedItems.length;
  const withScoreCount = analysisResults.filter(
    (item) => item.convertedScore != null
  ).length;
  const withSupportCount = analysisResults.filter(
    (item) => item.supportLevel != null
  ).length;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.10),_transparent_35%),linear-gradient(to_bottom,_#f8fafc,_#eef2f7)]">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
        <section className="relative overflow-hidden rounded-[30px] border border-blue-200 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.10),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.08),_transparent_30%)]" />
          <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                MY ADMISSION STRATEGY
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                저장한 모집단위를 기준으로 보는
                <br className="hidden sm:block" />
                나의 입시 전략
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                결제 후 활성화된 저장 기능으로 모아둔 모집단위만 보여주며,
                대학별 환산점수와 지원가능성을 함께 확인할 수 있도록 구성했습니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/student/admissions"
                className="inline-flex h-11 items-center rounded-xl border-2 border-blue-900 bg-white px-4 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
              >
                입결 검색으로 이동
              </Link>
              <Link
                href="/student/payment"
                className="inline-flex h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                결제 페이지 보기
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-[22px] border border-blue-200 bg-blue-50/80 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <div className="text-sm font-medium text-slate-600">저장한 모집단위</div>
            <div className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
              {formatNumber(savedCount)}
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-700">
              내 입시 전략에 저장된 모집단위 수
            </p>
          </div>

          <div className="rounded-[22px] border border-emerald-200 bg-emerald-50/80 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <div className="text-sm font-medium text-slate-600">환산점수 표시 가능</div>
            <div className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
              {formatNumber(withScoreCount)}
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-700">
              학생별 분석 결과가 연결된 모집단위 수
            </p>
          </div>

          <div className="rounded-[22px] border border-pink-200 bg-pink-50/80 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <div className="text-sm font-medium text-slate-600">지원가능성 표시 가능</div>
            <div className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
              {formatNumber(withSupportCount)}
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-700">
              5단계 지원가능성이 연결된 모집단위 수
            </p>
          </div>
        </section>

        <section
          className={`mt-10 rounded-[30px] border p-6 shadow-sm ${panelToneClass(
            "blue"
          )}`}
        >
          <SectionTitle
            eyebrow="Saved Units"
            title="저장한 모집단위"
            description="학생이 admissions에서 저장한 모집단위만 보여줍니다."
            action={
              <div className="rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700">
                총 {formatNumber(savedCount)}건
              </div>
            }
          />

          {savedItems.length === 0 ? (
            <div className="rounded-[24px] border border-blue-200 bg-white p-8 text-center">
              <div className="text-base font-semibold text-slate-900">
                저장한 모집단위가 없습니다.
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                입결 검색 페이지에서 관심 있는 모집단위를 저장하면 이곳에 표시됩니다.
              </p>
              <div className="mt-5">
                <Link
                  href="/student/admissions"
                  className="inline-flex h-11 items-center rounded-xl border-2 border-blue-900 bg-white px-5 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
                >
                  모집단위 보러 가기
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="hidden xl:grid grid-cols-[1.15fr_0.9fr_1.1fr_0.8fr_0.8fr_0.9fr_0.9fr] gap-3 px-4 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                <div>대학 / 모집단위</div>
                <div>전형</div>
                <div>분류</div>
                <div>모집인원</div>
                <div>내성적</div>
                <div>지원가능성</div>
                <div>작업</div>
              </div>

              {savedItems.map((saved, index) => {
                const analysis = analysisMap.get(saved.admissionResultId);
                const supportLabel = getSupportLevelLabel(analysis?.supportLevel);
                const supportTone = statusToneFromSupport(supportLabel);

                return (
                  <div
                    key={saved.id}
                    className={`rounded-[24px] border px-4 py-4 shadow-[0_8px_18px_rgba(15,23,42,0.04)] ${
                      index % 4 === 0
                        ? "border-blue-200 bg-blue-50/65"
                        : index % 4 === 1
                        ? "border-emerald-200 bg-emerald-50/65"
                        : index % 4 === 2
                        ? "border-amber-200 bg-amber-50/65"
                        : "border-pink-200 bg-pink-50/65"
                    }`}
                  >
                    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.9fr_1.1fr_0.8fr_0.8fr_0.9fr_0.9fr] xl:items-center">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">
                          {saved.admissionResult.universityName}
                        </div>
                        <div className="mt-1 truncate text-sm text-slate-700">
                          {saved.admissionResult.recruitmentUnit}
                        </div>
                        <div className="mt-1 truncate text-xs text-slate-500">
                          저장일 {formatDateTime(saved.createdAt)}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="xl:hidden mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          전형
                        </div>
                        <div className="truncate text-sm text-slate-700">
                          {saved.admissionResult.admissionName}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="xl:hidden mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          분류
                        </div>
                        <div className="truncate text-sm text-slate-700">
                          {[
                            saved.admissionResult.region,
                            saved.admissionResult.admissionType,
                            saved.admissionResult.track || null,
                            saved.admissionResult.collegeName || null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      </div>

                      <div>
                        <div className="xl:hidden mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          모집인원
                        </div>
                        <div className="text-sm text-slate-700">
                          {saved.admissionResult.currentHeadcountRaw || "-"}
                        </div>
                      </div>

                      <div>
                        <div className="xl:hidden mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          내성적
                        </div>
                        <div className="text-sm font-semibold text-slate-900">
                          {analysis?.convertedScore != null
                            ? analysis.convertedScore.toFixed(2)
                            : "-"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {analysis?.calculatedAt
                            ? `반영 ${formatDateTime(analysis.calculatedAt)}`
                            : "분석 결과 대기"}
                        </div>
                      </div>

                      <div>
                        <div className="xl:hidden mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          지원가능성
                        </div>
                        <StatusBadge label={supportLabel} tone={supportTone} />
                      </div>

                      <div>
                        <div className="xl:hidden mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          작업
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href="/student/admissions"
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            다시 보기
                          </Link>

                          <form action={removeSavedRecruitmentUnit}>
                            <input type="hidden" name="savedId" value={saved.id} />
                            <button
                              type="submit"
                              className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-300 bg-white px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                            >
                              삭제
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>

                    {analysis?.calculationMemo ? (
                      <div className="mt-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600">
                        메모: {analysis.calculationMemo}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section
          className={`mt-10 rounded-[30px] border p-6 shadow-sm ${panelToneClass(
            "amber"
          )}`}
        >
          <SectionTitle
            eyebrow="Guide"
            title="지원가능성 표시 기준"
            description="현재는 5단계 라벨만 연결되어 있고, 정확한 점수 범위는 이후 기준 확정 후 반영하면 됩니다."
          />

          <div className="grid gap-4 md:grid-cols-5">
            <div className="rounded-2xl border border-pink-200 bg-white/90 p-4">
              <StatusBadge label="도전" tone="pink" />
            </div>
            <div className="rounded-2xl border border-amber-200 bg-white/90 p-4">
              <StatusBadge label="상향" tone="amber" />
            </div>
            <div className="rounded-2xl border border-blue-200 bg-white/90 p-4">
              <StatusBadge label="안정" tone="blue" />
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-white/90 p-4">
              <StatusBadge label="적정" tone="green" />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
              <StatusBadge label="하향" tone="slate" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
