import Link from "next/link";
import { unstable_noStore as noStore, revalidatePath } from "next/cache";
import type { ReactNode } from "react";
import {
  EntitlementFeatureCode,
  EntitlementGrantType,
  EntitlementStatus,
  PaymentOrderStatus,
  UploadStatus,
  UserRole,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

type SearchParams = {
  q?: string;
  grade?: string;
  payment?: string;
  record?: string;
  page?: string;
};

type CardTone = "blue" | "green" | "amber" | "pink";
type PaymentSelectValue = "UNPAID" | "PAID" | "EXPIRED";

type StudentRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  schoolName: string;
  gradeLabel: string;
  recordInputLabel: string;
  mockInputLabel: string;
  recordConfirmedLabel: string;
  paymentLabel: string;
  paymentSelectValue: PaymentSelectValue;
  paymentDescription: string;
  calculationLabel: string;
  calculationDescription: string;
  lastActivityLabel: string;
  tones: {
    payment: CardTone;
    record: CardTone;
    mock: CardTone;
    confirm: CardTone;
    calculation: CardTone;
  };
};

type SummaryCard = {
  title: string;
  value: string;
  description: string;
  tone: CardTone;
};

function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
  }).format(date);
}

function getStartOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getSearchValue(value?: string) {
  return typeof value === "string" ? value.trim() : "";
}

function panelToneClass(tone: CardTone) {
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

function badgeToneClass(tone: CardTone) {
  switch (tone) {
    case "blue":
      return "border-blue-200 bg-white text-blue-700";
    case "green":
      return "border-emerald-200 bg-white text-emerald-700";
    case "amber":
      return "border-amber-200 bg-white text-amber-700";
    case "pink":
      return "border-pink-200 bg-white text-pink-700";
  }
}

function statToneClass(tone: CardTone) {
  switch (tone) {
    case "blue":
      return "border-blue-200 bg-blue-50/80";
    case "green":
      return "border-emerald-200 bg-emerald-50/80";
    case "amber":
      return "border-amber-200 bg-amber-50/80";
    case "pink":
      return "border-pink-200 bg-pink-50/80";
  }
}

function rowToneClass(tone: CardTone) {
  switch (tone) {
    case "blue":
      return "border-blue-200 bg-blue-50/65";
    case "green":
      return "border-emerald-200 bg-emerald-50/65";
    case "amber":
      return "border-amber-200 bg-amber-50/65";
    case "pink":
      return "border-pink-200 bg-pink-50/65";
  }
}

function gradeLabel(gradeLevel: number | null) {
  if (!gradeLevel) return "-";
  return `${gradeLevel}학년`;
}

function uploadStatusLabel(status?: UploadStatus | null) {
  if (!status) return "미업로드";
  if (status === UploadStatus.FINALIZED) return "업로드 완료";
  return "임시 저장";
}

function uploadStatusTone(status?: UploadStatus | null): CardTone {
  if (!status) return "pink";
  if (status === UploadStatus.FINALIZED) return "green";
  return "amber";
}

function recordConfirmedLabel(status?: UploadStatus | null) {
  if (status === UploadStatus.FINALIZED) return "확정";
  if (status === UploadStatus.DRAFT) return "임시";
  return "미확정";
}

function recordConfirmedTone(status?: UploadStatus | null): CardTone {
  if (status === UploadStatus.FINALIZED) return "green";
  if (status === UploadStatus.DRAFT) return "amber";
  return "pink";
}

function derivePaymentState(input: {
  activeEntitlement?: {
    expiresAt: Date;
  } | null;
  latestEntitlement?: {
    status: EntitlementStatus;
    expiresAt: Date;
  } | null;
  latestPaidOrder?: {
    paidAt: Date | null;
  } | null;
}) {
  const { activeEntitlement, latestEntitlement, latestPaidOrder } = input;

  if (activeEntitlement) {
    return {
      label: "결제 완료",
      selectValue: "PAID" as PaymentSelectValue,
      tone: "green" as CardTone,
      description: `이용권 만료 ${formatDate(activeEntitlement.expiresAt)}`,
    };
  }

  if (latestEntitlement || latestPaidOrder) {
    const expiredDate =
      latestEntitlement?.expiresAt ??
      latestPaidOrder?.paidAt ??
      new Date();

    return {
      label: "만료",
      selectValue: "EXPIRED" as PaymentSelectValue,
      tone: "amber" as CardTone,
      description: `최근 이력 ${formatDate(expiredDate)}`,
    };
  }

  return {
    label: "미결제",
    selectValue: "UNPAID" as PaymentSelectValue,
    tone: "pink" as CardTone,
    description: "활성 이용권 없음",
  };
}

function deriveCalculationState(input: {
  recordStatus?: UploadStatus | null;
  mockStatus?: UploadStatus | null;
  paymentState: PaymentSelectValue;
}) {
  const hasAnyFinalized =
    input.recordStatus === UploadStatus.FINALIZED ||
    input.mockStatus === UploadStatus.FINALIZED;

  if (!hasAnyFinalized) {
    return {
      label: "입력대기",
      description: "성적 최종 제출 전",
      tone: "pink" as CardTone,
    };
  }

  if (input.paymentState === "PAID") {
    return {
      label: "조회 가능",
      description: "권한 활성 상태",
      tone: "green" as CardTone,
    };
  }

  return {
    label: "환산 미연결",
    description: "결과 노출 전",
    tone: "amber" as CardTone,
  };
}

async function updateStudentPaymentStatus(formData: FormData) {
  "use server";

  const userId = String(formData.get("userId") ?? "");
  const nextStatus = String(formData.get("paymentStatus") ?? "") as PaymentSelectValue;

  if (!userId || !["UNPAID", "PAID", "EXPIRED"].includes(nextStatus)) {
    return;
  }

  const now = new Date();

  if (nextStatus === "PAID") {
    const active = await prisma.userEntitlement.findFirst({
      where: {
        userId,
        featureCode: EntitlementFeatureCode.ANALYSIS_30D,
        status: EntitlementStatus.ACTIVE,
        expiresAt: { gt: now },
      },
      select: { id: true },
    });

    if (!active) {
      await prisma.userEntitlement.create({
        data: {
          userId,
          featureCode: EntitlementFeatureCode.ANALYSIS_30D,
          grantType: EntitlementGrantType.ADMIN,
          status: EntitlementStatus.ACTIVE,
          startsAt: now,
          expiresAt: addDays(now, 30),
          allowedSubmissionCount: 1,
          usedSubmissionCount: 0,
          analysisUnlimited: true,
          memo: "관리자 학생 목록에서 결제 여부를 결제 완료로 반영",
        },
      });
    }
  }

  if (nextStatus === "EXPIRED") {
    await prisma.userEntitlement.updateMany({
      where: {
        userId,
        featureCode: EntitlementFeatureCode.ANALYSIS_30D,
        status: EntitlementStatus.ACTIVE,
      },
      data: {
        status: EntitlementStatus.EXPIRED,
        expiresAt: now,
        memo: "관리자 학생 목록에서 만료 처리",
      },
    });
  }

  if (nextStatus === "UNPAID") {
    await prisma.userEntitlement.updateMany({
      where: {
        userId,
        featureCode: EntitlementFeatureCode.ANALYSIS_30D,
        status: EntitlementStatus.ACTIVE,
      },
      data: {
        status: EntitlementStatus.REVOKED,
        expiresAt: now,
        memo: "관리자 학생 목록에서 미결제로 회수 처리",
      },
    });
  }

  revalidatePath("/admin/students");
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
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          {eyebrow}
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function SummaryCardView({ item }: { item: SummaryCard }) {
  return (
    <div
      className={`rounded-[22px] border p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ${statToneClass(
        item.tone
      )}`}
    >
      <div className="text-sm font-medium text-slate-600">{item.title}</div>
      <div className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
        {item.value}
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-700">{item.description}</p>
    </div>
  );
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: CardTone;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${badgeToneClass(
        tone
      )}`}
    >
      {label}
    </span>
  );
}

async function getStudentsPageData(searchParams?: SearchParams) {
  const q = getSearchValue(searchParams?.q);
  const grade = getSearchValue(searchParams?.grade);
  const payment = getSearchValue(searchParams?.payment);
  const record = getSearchValue(searchParams?.record);
  const page = Math.max(Number(searchParams?.page || "1") || 1, 1);
  const pageSize = 20;
  const now = new Date();
  const todayStart = getStartOfToday();

  const where = {
    role: UserRole.STUDENT,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
            {
              school: {
                schoolName: { contains: q, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
    ...(grade ? { gradeLevel: Number(grade) } : {}),
  };

  const [
    totalStudents,
    finalizedRecordStudents,
    activePaidStudents,
    draftUploadsToday,
    users,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        role: UserRole.STUDENT,
      },
    }),
    prisma.user.count({
      where: {
        role: UserRole.STUDENT,
        studentRecordSubmissions: {
          some: {
            status: UploadStatus.FINALIZED,
          },
        },
      },
    }),
    prisma.user.count({
      where: {
        role: UserRole.STUDENT,
        entitlements: {
          some: {
            featureCode: EntitlementFeatureCode.ANALYSIS_30D,
            status: EntitlementStatus.ACTIVE,
            expiresAt: {
              gt: now,
            },
          },
        },
      },
    }),
    prisma.studentRecordSubmission.count({
      where: {
        status: UploadStatus.DRAFT,
        createdAt: {
          gte: todayStart,
        },
      },
    }),
    prisma.user.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        updatedAt: true,
        gradeLevel: true,
        school: {
          select: {
            schoolName: true,
          },
        },
        studentRecordSubmissions: {
          orderBy: {
            updatedAt: "desc",
          },
          take: 1,
          select: {
            status: true,
            updatedAt: true,
          },
        },
        mockExamSubmissions: {
          orderBy: {
            updatedAt: "desc",
          },
          take: 1,
          select: {
            status: true,
            updatedAt: true,
          },
        },
        entitlements: {
          where: {
            featureCode: EntitlementFeatureCode.ANALYSIS_30D,
          },
          orderBy: {
            expiresAt: "desc",
          },
          take: 3,
          select: {
            status: true,
            expiresAt: true,
          },
        },
        paymentOrders: {
          where: {
            status: PaymentOrderStatus.PAID,
          },
          orderBy: {
            paidAt: "desc",
          },
          take: 1,
          select: {
            paidAt: true,
          },
        },
      },
    }),
  ]);

  const mapped = users.map<StudentRow>((user) => {
    const latestRecord = user.studentRecordSubmissions[0];
    const latestMock = user.mockExamSubmissions[0];

    const activeEntitlement = user.entitlements.find(
      (item) => item.status === EntitlementStatus.ACTIVE && item.expiresAt > now
    );

    const latestEntitlement = user.entitlements[0];
    const latestPaidOrder = user.paymentOrders[0];

    const paymentState = derivePaymentState({
      activeEntitlement,
      latestEntitlement,
      latestPaidOrder,
    });

    const calculationState = deriveCalculationState({
      recordStatus: latestRecord?.status,
      mockStatus: latestMock?.status,
      paymentState: paymentState.selectValue,
    });

    const lastActivityDate = [
      latestRecord?.updatedAt,
      latestMock?.updatedAt,
      latestPaidOrder?.paidAt ?? undefined,
      user.updatedAt,
    ]
      .filter(Boolean)
      .sort((a, b) => {
        const aTime = new Date(a as Date).getTime();
        const bTime = new Date(b as Date).getTime();
        return bTime - aTime;
      })[0];

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? "-",
      schoolName: user.school?.schoolName ?? "-",
      gradeLabel: gradeLabel(user.gradeLevel),
      recordInputLabel: uploadStatusLabel(latestRecord?.status),
      mockInputLabel: uploadStatusLabel(latestMock?.status),
      recordConfirmedLabel: recordConfirmedLabel(latestRecord?.status),
      paymentLabel: paymentState.label,
      paymentSelectValue: paymentState.selectValue,
      paymentDescription: paymentState.description,
      calculationLabel: calculationState.label,
      calculationDescription: calculationState.description,
      lastActivityLabel: lastActivityDate
        ? formatDateTime(new Date(lastActivityDate))
        : "-",
      tones: {
        payment: paymentState.tone,
        record: uploadStatusTone(latestRecord?.status),
        mock: uploadStatusTone(latestMock?.status),
        confirm: recordConfirmedTone(latestRecord?.status),
        calculation: calculationState.tone,
      },
    };
  });

  const filtered = mapped.filter((row) => {
    const paymentOk =
      !payment ||
      (payment === "paid" && row.paymentSelectValue === "PAID") ||
      (payment === "expired" && row.paymentSelectValue === "EXPIRED") ||
      (payment === "unpaid" && row.paymentSelectValue === "UNPAID");

    const recordOk =
      !record ||
      (record === "finalized" && row.recordConfirmedLabel === "확정") ||
      (record === "draft" && row.recordConfirmedLabel === "임시") ||
      (record === "none" && row.recordConfirmedLabel === "미확정");

    return paymentOk && recordOk;
  });

  const totalFiltered = filtered.length;
  const totalPages = Math.max(Math.ceil(totalFiltered / pageSize), 1);
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const students = filtered.slice(start, start + pageSize);

  const summaryCards: SummaryCard[] = [
    {
      title: "전체 학생",
      value: formatNumber(totalStudents),
      description: "학생 권한을 가진 전체 회원 수",
      tone: "blue",
    },
    {
      title: "성적 확정",
      value: formatNumber(finalizedRecordStudents),
      description: "학생부 최종 제출이 완료된 학생 수",
      tone: "green",
    },
    {
      title: "결제 완료",
      value: formatNumber(activePaidStudents),
      description: "활성 이용권이 있는 학생 수",
      tone: "amber",
    },
    {
      title: "오늘 임시 저장",
      value: formatNumber(draftUploadsToday),
      description: "오늘 생성된 학생부 임시 저장 건수",
      tone: "pink",
    },
  ];

  return {
    q,
    grade,
    payment,
    record,
    page: safePage,
    pageSize,
    totalFiltered,
    totalPages,
    students,
    summaryCards,
  };
}

function buildPageHref(input: {
  q: string;
  grade: string;
  payment: string;
  record: string;
  page: number;
}) {
  const params = new URLSearchParams();

  if (input.q) params.set("q", input.q);
  if (input.grade) params.set("grade", input.grade);
  if (input.payment) params.set("payment", input.payment);
  if (input.record) params.set("record", input.record);
  params.set("page", String(input.page));

  return `/admin/students?${params.toString()}`;
}

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  noStore();

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const data = await getStudentsPageData(resolvedSearchParams);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.10),_transparent_35%),linear-gradient(to_bottom,_#f8fafc,_#eef2f7)]">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
        <section className="relative overflow-hidden rounded-[30px] border border-blue-200 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.10),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.08),_transparent_30%)]" />
          <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                ADMIN STUDENTS
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                학생 업로드 상태와 결제 권한을
                <br className="hidden sm:block" />
                한 화면에서 관리하는 학생 관리 페이지
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                학생부, 모의고사, 결제 권한, 최근 활동을 한 번에 확인하고 학생
                목록에서 바로 결제 여부를 저장할 수 있도록 구성했습니다.
              </p>
            </div>

            <div className="grid w-full gap-4 sm:grid-cols-3 xl:max-w-xl">
              <div className="rounded-[20px] border border-blue-200 bg-blue-50/80 p-4 shadow-sm">
                <div className="text-xs font-medium text-slate-500">검색 결과</div>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  {formatNumber(data.totalFiltered)}명
                </div>
              </div>
              <div className="rounded-[20px] border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm">
                <div className="text-xs font-medium text-slate-500">현재 페이지</div>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  {data.page} / {data.totalPages}
                </div>
              </div>
              <div className="rounded-[20px] border border-pink-200 bg-pink-50/80 p-4 shadow-sm">
                <div className="text-xs font-medium text-slate-500">페이지당</div>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  {data.pageSize}명
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {data.summaryCards.map((item) => (
            <SummaryCardView key={item.title} item={item} />
          ))}
        </section>

        <section
          className={`mt-10 rounded-[30px] border p-6 shadow-sm ${panelToneClass("blue")}`}
        >
          <SectionTitle
            eyebrow="Search & Filter"
            title="학생 검색 및 필터"
            description="이름, 학교, 학년, 결제 상태, 성적확정 상태 기준으로 학생 목록을 빠르게 좁힐 수 있습니다."
            action={
              <Link
                href="/admin"
                className="inline-flex h-10 items-center rounded-xl border-2 border-blue-900 bg-white px-4 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
              >
                대시보드로 이동
              </Link>
            }
          />

          <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                이름 / 이메일 / 학교
              </label>
              <input
                type="text"
                name="q"
                defaultValue={data.q}
                placeholder="학생 이름, 이메일, 학교명 검색"
                className="h-12 w-full rounded-xl border border-blue-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                학년
              </label>
              <select
                name="grade"
                defaultValue={data.grade}
                className="h-12 w-full rounded-xl border border-emerald-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-400"
              >
                <option value="">전체</option>
                <option value="1">1학년</option>
                <option value="2">2학년</option>
                <option value="3">3학년</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                결제 여부
              </label>
              <select
                name="payment"
                defaultValue={data.payment}
                className="h-12 w-full rounded-xl border border-amber-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-amber-400"
              >
                <option value="">전체</option>
                <option value="paid">결제 완료</option>
                <option value="expired">만료</option>
                <option value="unpaid">미결제</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                성적확정
              </label>
              <select
                name="record"
                defaultValue={data.record}
                className="h-12 w-full rounded-xl border border-pink-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-pink-400"
              >
                <option value="">전체</option>
                <option value="finalized">확정</option>
                <option value="draft">임시</option>
                <option value="none">미확정</option>
              </select>
            </div>

            <div className="md:col-span-2 xl:col-span-5 flex flex-wrap gap-3">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-xl border-2 border-blue-900 bg-white px-5 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
              >
                검색 적용
              </button>
              <Link
                href="/admin/students"
                className="inline-flex h-11 items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                초기화
              </Link>
            </div>
          </form>
        </section>

        <section
          className={`mt-10 rounded-[30px] border p-6 shadow-sm ${panelToneClass("green")}`}
        >
          <SectionTitle
            eyebrow="Student List"
            title="학생 목록"
            description="학생 1명당 1행으로 표시되며, 한 번에 20명씩 확인할 수 있습니다."
            action={
              <div className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700">
                총 {formatNumber(data.totalFiltered)}명
              </div>
            }
          />

          <div className="hidden xl:grid grid-cols-[1.4fr_1.1fr_0.5fr_0.7fr_0.7fr_0.8fr_1.8fr_0.9fr_1fr_1fr] gap-3 px-4 pb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <div>학생 정보</div>
            <div>학교</div>
            <div>학년</div>
            <div>내신</div>
            <div>모의고사</div>
            <div>성적확정</div>
            <div>결제 여부</div>
            <div>계산상태</div>
            <div>최근 활동</div>
            <div>작업</div>
          </div>

          <div className="space-y-3">
            {data.students.length > 0 ? (
              data.students.map((student, index) => {
                const tones: CardTone[] = ["blue", "green", "amber", "pink"];
                const baseTone = tones[index % tones.length];

                return (
                  <div
                    key={student.id}
                    className={`rounded-[24px] border px-4 py-4 shadow-[0_8px_18px_rgba(15,23,42,0.04)] ${rowToneClass(
                      baseTone
                    )}`}
                  >
                    <div className="grid gap-4 xl:grid-cols-[1.4fr_1.1fr_0.5fr_0.7fr_0.7fr_0.8fr_1.8fr_0.9fr_1fr_1fr] xl:items-center">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">
                          {student.name}
                        </div>
                        <div className="mt-1 truncate text-xs text-slate-500">
                          {student.email}
                        </div>
                        <div className="mt-1 truncate text-xs text-slate-500">
                          {student.phone}
                        </div>
                        <div className="mt-1 truncate text-[11px] text-slate-400">
                          {student.id}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="xl:hidden mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          학교
                        </div>
                        <div className="truncate text-sm text-slate-700">
                          {student.schoolName}
                        </div>
                      </div>

                      <div>
                        <div className="xl:hidden mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          학년
                        </div>
                        <div className="text-sm text-slate-700">{student.gradeLabel}</div>
                      </div>

                      <div>
                        <div className="xl:hidden mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          내신
                        </div>
                        <StatusBadge
                          label={student.recordInputLabel}
                          tone={student.tones.record}
                        />
                      </div>

                      <div>
                        <div className="xl:hidden mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          모의고사
                        </div>
                        <StatusBadge
                          label={student.mockInputLabel}
                          tone={student.tones.mock}
                        />
                      </div>

                      <div>
                        <div className="xl:hidden mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          성적확정
                        </div>
                        <StatusBadge
                          label={student.recordConfirmedLabel}
                          tone={student.tones.confirm}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="xl:hidden mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          결제 여부
                        </div>
                        <form action={updateStudentPaymentStatus} className="space-y-2">
                          <input type="hidden" name="userId" value={student.id} />
                          <div className="flex gap-2">
                            <select
                              name="paymentStatus"
                              defaultValue={student.paymentSelectValue}
                              className="h-10 min-w-0 flex-1 rounded-xl border border-blue-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                            >
                              <option value="UNPAID">미결제</option>
                              <option value="PAID">결제 완료</option>
                              <option value="EXPIRED">만료</option>
                            </select>
                            <button
                              type="submit"
                              className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border-2 border-blue-900 bg-white px-3 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
                            >
                              저장
                            </button>
                          </div>
                          <div className="truncate text-xs text-slate-500">
                            현재: {student.paymentLabel} · {student.paymentDescription}
                          </div>
                        </form>
                      </div>

                      <div>
                        <div className="xl:hidden mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          계산상태
                        </div>
                        <StatusBadge
                          label={student.calculationLabel}
                          tone={student.tones.calculation}
                        />
                        <div className="mt-1 truncate text-xs text-slate-500">
                          {student.calculationDescription}
                        </div>
                      </div>

                      <div>
                        <div className="xl:hidden mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          최근 활동
                        </div>
                        <div className="text-sm text-slate-700">
                          {student.lastActivityLabel}
                        </div>
                      </div>

                      <div>
                        <div className="xl:hidden mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          작업
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/admin/students/${student.id}`}
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            상세
                          </Link>
                          <Link
                            href={`/admin/students/${student.id}/edit`}
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            수정
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[24px] border border-pink-200 bg-pink-50/70 p-8 text-center text-sm text-slate-600">
                조건에 맞는 학생이 없습니다.
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm text-slate-600">
              페이지 <span className="font-semibold text-slate-900">{data.page}</span> /{" "}
              <span className="font-semibold text-slate-900">{data.totalPages}</span>
              <span className="ml-3 text-slate-500">
                · 페이지당 {data.pageSize}명
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={buildPageHref({
                  q: data.q,
                  grade: data.grade,
                  payment: data.payment,
                  record: data.record,
                  page: Math.max(1, data.page - 1),
                })}
                className={`inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition ${
                  data.page <= 1
                    ? "pointer-events-none border-slate-200 bg-slate-100 text-slate-400"
                    : "border-blue-900 bg-white text-blue-900 hover:bg-blue-50"
                }`}
              >
                이전
              </Link>
              <Link
                href={buildPageHref({
                  q: data.q,
                  grade: data.grade,
                  payment: data.payment,
                  record: data.record,
                  page: Math.min(data.totalPages, data.page + 1),
                })}
                className={`inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition ${
                  data.page >= data.totalPages
                    ? "pointer-events-none border-slate-200 bg-slate-100 text-slate-400"
                    : "border-blue-900 bg-white text-blue-900 hover:bg-blue-50"
                }`}
              >
                다음
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
