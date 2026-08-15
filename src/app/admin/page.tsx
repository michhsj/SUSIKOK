import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import type { ReactNode } from "react";
import {
  EntitlementStatus,
  PaymentOrderStatus,
  UploadStatus,
  UserRole,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

type StatTone = "blue" | "green" | "amber" | "pink";

type StatCard = {
  title: string;
  value: string;
  change: string;
  tone: StatTone;
  description: string;
  note?: string;
};

type QuickActionTone = "blue" | "green" | "amber" | "pink";

type QuickAction = {
  title: string;
  description: string;
  href: string;
  buttonLabel: string;
  tone: QuickActionTone;
};

type CheckItem = {
  title: string;
  value: string;
  description: string;
  tone: "blue" | "green" | "amber" | "pink";
};

type ActivityItemType = {
  title: string;
  meta: string;
  detail: string;
  at: Date;
  tone: "blue" | "green" | "amber" | "pink";
};

const quickActions: QuickAction[] = [
  {
    title: "학종 적합성 평가 문항",
    description:
      "기준 엑셀 양식을 업로드하여 평가 문항 DB를 신규 등록하거나 수정합니다.",
    href: "/admin/uploads/evaluation-questions",
    buttonLabel: "업로드 바로가기",
    tone: "blue",
  },
  {
    title: "수시 통합DB",
    description:
      "대학·전형·모집단위 기준 데이터를 업로드하고 기존 데이터를 수정 반영합니다.",
    href: "/admin/uploads/admissions-db",
    buttonLabel: "업로드 바로가기",
    tone: "green",
  },
  {
    title: "교과 · 과목",
    description:
      "교과군, 과목명, 반영 과목 매핑 기준 파일을 업로드하여 반영합니다.",
    href: "/admin/uploads/subjects",
    buttonLabel: "업로드 바로가기",
    tone: "amber",
  },
  {
    title: "학생 DB업로드",
    description:
      "학생 다건 업로드, 중복 검출, 수정 대상 분리, 오류 행 리포트를 처리합니다.",
    href: "/admin/uploads/students",
    buttonLabel: "업로드 바로가기",
    tone: "pink",
  },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getStartOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function statToneClass(tone: StatTone) {
  switch (tone) {
    case "blue":
      return {
        card: "border-blue-200 bg-blue-50/80",
        badge: "bg-white text-blue-700 ring-1 ring-inset ring-blue-200",
        dot: "bg-blue-500",
        title: "text-slate-600",
        value: "text-slate-900",
        note: "text-slate-500",
      };
    case "green":
      return {
        card: "border-emerald-200 bg-emerald-50/80",
        badge: "bg-white text-emerald-700 ring-1 ring-inset ring-emerald-200",
        dot: "bg-emerald-500",
        title: "text-slate-600",
        value: "text-slate-900",
        note: "text-slate-500",
      };
    case "amber":
      return {
        card: "border-amber-200 bg-amber-50/80",
        badge: "bg-white text-amber-700 ring-1 ring-inset ring-amber-200",
        dot: "bg-amber-500",
        title: "text-slate-600",
        value: "text-slate-900",
        note: "text-slate-500",
      };
    case "pink":
      return {
        card: "border-pink-200 bg-pink-50/80",
        badge: "bg-white text-pink-700 ring-1 ring-inset ring-pink-200",
        dot: "bg-pink-500",
        title: "text-slate-600",
        value: "text-slate-900",
        note: "text-slate-500",
      };
  }
}

function panelToneClass(tone: "blue" | "green" | "amber" | "pink") {
  switch (tone) {
    case "blue":
      return "border-blue-200 bg-blue-50/60";
    case "green":
      return "border-emerald-200 bg-emerald-50/60";
    case "amber":
      return "border-amber-200 bg-amber-50/60";
    case "pink":
      return "border-pink-200 bg-pink-50/60";
  }
}

function quickActionToneClass(tone: QuickActionTone) {
  switch (tone) {
    case "blue":
      return {
        card: "border-blue-200 bg-blue-50/70",
        pill: "bg-white text-blue-700 ring-1 ring-inset ring-blue-200",
        button:
          "border-2 border-blue-900 bg-white text-blue-900 hover:bg-blue-100 hover:border-blue-950",
      };
    case "green":
      return {
        card: "border-emerald-200 bg-emerald-50/70",
        pill: "bg-white text-emerald-700 ring-1 ring-inset ring-emerald-200",
        button:
          "border-2 border-blue-900 bg-white text-blue-900 hover:bg-emerald-100 hover:border-blue-950",
      };
    case "amber":
      return {
        card: "border-amber-200 bg-amber-50/70",
        pill: "bg-white text-amber-700 ring-1 ring-inset ring-amber-200",
        button:
          "border-2 border-blue-900 bg-white text-blue-900 hover:bg-amber-100 hover:border-blue-950",
      };
    case "pink":
      return {
        card: "border-pink-200 bg-pink-50/70",
        pill: "bg-white text-pink-700 ring-1 ring-inset ring-pink-200",
        button:
          "border-2 border-blue-900 bg-white text-blue-900 hover:bg-pink-100 hover:border-blue-950",
      };
  }
}

function checkToneClass(tone: CheckItem["tone"]) {
  switch (tone) {
    case "blue":
      return "border-blue-200 bg-blue-50/75";
    case "green":
      return "border-emerald-200 bg-emerald-50/75";
    case "amber":
      return "border-amber-200 bg-amber-50/75";
    case "pink":
      return "border-pink-200 bg-pink-50/75";
  }
}

function activityToneClass(tone: ActivityItemType["tone"]) {
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
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function StatCardView({ item }: { item: StatCard }) {
  const tone = statToneClass(item.tone);

  return (
    <div
      className={`rounded-[22px] border p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(15,23,42,0.08)] ${tone.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`text-sm font-medium ${tone.title}`}>{item.title}</div>
          <div className={`mt-3 text-4xl font-bold tracking-tight ${tone.value}`}>
            {item.value}
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${tone.badge}`}
        >
          <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
          {item.change}
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-700">{item.description}</p>
      {item.note ? (
        <p className={`mt-2 text-xs leading-5 ${tone.note}`}>{item.note}</p>
      ) : null}
    </div>
  );
}

function ShortcutButton({
  href,
  title,
  description,
  primary = false,
}: {
  href: string;
  title: string;
  description: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-[22px] border-2 bg-white p-5 text-slate-900 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
        primary
          ? "border-blue-950 shadow-[0_10px_30px_rgba(30,58,138,0.08)]"
          : "border-blue-900/90"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-base font-semibold text-slate-900">{title}</div>
          <div className="mt-2 text-sm leading-6 text-slate-600">
            {description}
          </div>
        </div>
        <div className="rounded-full border-2 border-blue-900 bg-white px-3 py-1 text-xs font-semibold text-blue-900">
          이동
        </div>
      </div>
    </Link>
  );
}

function QuickActionCard({ item }: { item: QuickAction }) {
  const tone = quickActionToneClass(item.tone);

  return (
    <div
      className={`rounded-[22px] border p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition-all duration-300 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)] ${tone.card}`}
    >
      <div className="flex h-full flex-col">
        <div
          className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${tone.pill}`}
        >
          Upload
        </div>
        <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">
          {item.title}
        </h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
          {item.description}
        </p>
        <Link
          href={item.href}
          className={`mt-5 inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold transition ${tone.button}`}
        >
          {item.buttonLabel}
        </Link>
      </div>
    </div>
  );
}

function CheckItemCard({ item }: { item: CheckItem }) {
  return (
    <div className={`rounded-[20px] border p-4 ${checkToneClass(item.tone)}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">{item.title}</div>
          <div className="mt-2 text-sm leading-6 text-slate-600">
            {item.description}
          </div>
        </div>
        <div className="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-900 shadow-sm ring-1 ring-slate-200">
          {item.value}
        </div>
      </div>
    </div>
  );
}

function ActivityRow({
  title,
  meta,
  detail,
  tone,
}: {
  title: string;
  meta: string;
  detail: string;
  tone: ActivityItemType["tone"];
}) {
  return (
    <div
      className={`grid gap-3 rounded-[20px] border px-5 py-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)] md:grid-cols-[160px_190px_minmax(0,1fr)] md:items-center ${activityToneClass(
        tone
      )}`}
    >
      <div className="truncate text-sm font-semibold text-slate-900">{title}</div>
      <div className="truncate text-xs text-slate-500">{meta}</div>
      <div className="truncate text-sm text-slate-700">{detail}</div>
    </div>
  );
}

async function getDashboardData() {
  const todayStart = getStartOfToday();
  const now = new Date();

  const [
    uploadedStudentCount,
    paidStudentCountByOrder,
    activeEntitlementCount,
    activeAdmissionResultCount,
    todayStudentRecordUploads,
    todayMockExamUploads,
    pendingPaymentOrderCount,
    draftStudentRecordCount,
    draftMockExamCount,
    recentStudentRecordSubmissions,
    recentMockExamSubmissions,
    recentPaidOrders,
    recentAdmissionResults,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        role: UserRole.STUDENT,
        OR: [
          {
            studentRecordSubmissions: {
              some: { status: UploadStatus.FINALIZED },
            },
          },
          {
            mockExamSubmissions: {
              some: { status: UploadStatus.FINALIZED },
            },
          },
        ],
      },
    }),
    prisma.user.count({
      where: {
        role: UserRole.STUDENT,
        paymentOrders: {
          some: {
            status: PaymentOrderStatus.PAID,
          },
        },
      },
    }),
    prisma.userEntitlement.count({
      where: {
        status: EntitlementStatus.ACTIVE,
        expiresAt: {
          gt: now,
        },
      },
    }),
    prisma.admissionResult.count({
      where: {
        isActive: true,
      },
    }),
    prisma.studentRecordSubmission.count({
      where: {
        createdAt: {
          gte: todayStart,
        },
      },
    }),
    prisma.studentMockExamSubmission.count({
      where: {
        createdAt: {
          gte: todayStart,
        },
      },
    }),
    prisma.paymentOrder.count({
      where: {
        status: PaymentOrderStatus.PENDING,
      },
    }),
    prisma.studentRecordSubmission.count({
      where: {
        status: UploadStatus.DRAFT,
      },
    }),
    prisma.studentMockExamSubmission.count({
      where: {
        status: UploadStatus.DRAFT,
      },
    }),
    prisma.studentRecordSubmission.findMany({
      take: 3,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        fileName: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.studentMockExamSubmission.findMany({
      take: 2,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.paymentOrder.findMany({
      take: 3,
      orderBy: {
        updatedAt: "desc",
      },
      where: {
        status: PaymentOrderStatus.PAID,
      },
      select: {
        id: true,
        productName: true,
        amount: true,
        updatedAt: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.admissionResult.findMany({
      take: 3,
      orderBy: {
        updatedAt: "desc",
      },
      where: {
        isActive: true,
      },
      select: {
        id: true,
        updatedAt: true,
        admissionYear: true,
        universityName: true,
        admissionName: true,
        recruitmentUnit: true,
        sourceFileName: true,
      },
    }),
  ]);

  const toneOrder: ActivityItemType["tone"][] = ["blue", "green", "amber", "pink"];

  const recentActivities: ActivityItemType[] = [
    ...recentStudentRecordSubmissions.map((item, index) => ({
      title: "학생부 업로드",
      meta: `${formatDateTime(item.createdAt)} · ${item.user.name}`,
      detail: `${item.fileName ?? "수동/기본 업로드"} · 상태 ${item.status}`,
      at: item.createdAt,
      tone: toneOrder[index % toneOrder.length],
    })),
    ...recentMockExamSubmissions.map((item, index) => ({
      title: "모의고사 업로드",
      meta: `${formatDateTime(item.createdAt)} · ${item.user.name}`,
      detail: `모의고사 성적 제출 · 상태 ${item.status}`,
      at: item.createdAt,
      tone: toneOrder[(index + 1) % toneOrder.length],
    })),
    ...recentPaidOrders.map((item, index) => ({
      title: "결제 완료",
      meta: `${formatDateTime(item.updatedAt)} · ${item.user.name}`,
      detail: `${item.productName} · ${formatNumber(item.amount)}원`,
      at: item.updatedAt,
      tone: toneOrder[(index + 2) % toneOrder.length],
    })),
    ...recentAdmissionResults.map((item, index) => ({
      title: "수시 통합DB 반영",
      meta: `${formatDateTime(item.updatedAt)} · ${item.admissionYear}학년도`,
      detail: `${item.universityName} / ${item.admissionName} / ${item.recruitmentUnit}`,
      at: item.updatedAt,
      tone: toneOrder[(index + 3) % toneOrder.length],
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 6)
    .map((item, index) => ({
      ...item,
      tone: toneOrder[index % toneOrder.length],
    }));

  const stats: StatCard[] = [
    {
      title: "성적 업로드 학생 수",
      value: formatNumber(uploadedStudentCount),
      change: `오늘 ${formatNumber(todayStudentRecordUploads + todayMockExamUploads)}건`,
      tone: "blue",
      description: "학생부 또는 모의고사 업로드를 최종 제출한 학생 수",
      note: "기준: FINALIZED 제출이 1건 이상 있는 학생",
    },
    {
      title: "결제 완료",
      value: formatNumber(paidStudentCountByOrder),
      change: `${formatNumber(activeEntitlementCount)}건 활성 이용권`,
      tone: "green",
      description: "결제 주문이 PAID 상태인 학생 수",
      note: "현재 User 테이블에 결제 여부 필드가 없어 PaymentOrder.status = PAID 기준으로 집계합니다.",
    },
    {
      title: "규칙 미설정",
      value: "집계불가",
      change: "스키마 보강 필요",
      tone: "amber",
      description:
        "계산 불가 전형 수를 보여주려면 대학 환산 규칙 테이블이 필요합니다.",
      note: "현재 schema.prisma에는 전형별 환산 규칙 모델이 없습니다.",
    },
    {
      title: "계산 실패",
      value: "집계불가",
      change: "로그 테이블 필요",
      tone: "pink",
      description:
        "최근 업로드 처리 실패 건수를 보여주려면 업로드 실패 로그가 필요합니다.",
      note: "현재 schema.prisma에는 업로드 실패/처리 결과 로그 모델이 없습니다.",
    },
  ];

  const checks: CheckItem[] = [
    {
      title: "결제 대기 주문",
      value: `${formatNumber(pendingPaymentOrderCount)}건`,
      description: "현재 결제 요청은 생성되었지만 아직 완료되지 않은 주문 수",
      tone: "blue",
    },
    {
      title: "임시 저장 학생부",
      value: `${formatNumber(draftStudentRecordCount)}건`,
      description: "아직 최종 제출되지 않은 학생부 업로드 건수",
      tone: "green",
    },
    {
      title: "임시 저장 모의고사",
      value: `${formatNumber(draftMockExamCount)}건`,
      description: "아직 최종 제출되지 않은 모의고사 업로드 건수",
      tone: "amber",
    },
    {
      title: "수시 통합DB 건수",
      value: `${formatNumber(activeAdmissionResultCount)}건`,
      description: "현재 활성 상태로 조회 가능한 입시 데이터 건수",
      tone: "pink",
    },
  ];

  return {
    stats,
    checks,
    recentActivities,
    hero: {
      todayUploads: todayStudentRecordUploads + todayMockExamUploads,
      pendingPayments: pendingPaymentOrderCount,
      activeEntitlements: activeEntitlementCount,
    },
  };
}

export default async function AdminDashboardPage() {
  noStore();

  const { stats, checks, recentActivities, hero } = await getDashboardData();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.10),_transparent_35%),linear-gradient(to_bottom,_#f8fafc,_#eef2f7)]">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
        <section className="relative overflow-hidden rounded-[30px] border border-blue-200 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.10),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.08),_transparent_30%)]" />
          <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                ADMIN DASHBOARD
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                학생 데이터와 대학 환산 반영을
                <br className="hidden sm:block" />
                한 화면에서 관리하는 관리자 대시보드
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                실제 DB 기준으로 학생 업로드, 결제 주문, 활성 이용권, 입시 데이터 현황을
                확인할 수 있도록 연결한 관리자 첫 화면입니다.
              </p>
            </div>

            <div className="grid w-full gap-4 sm:grid-cols-3 xl:max-w-xl">
              <div className="rounded-[20px] border border-blue-200 bg-blue-50/80 p-4 shadow-sm">
                <div className="text-xs font-medium text-slate-500">오늘 업로드</div>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  {formatNumber(hero.todayUploads)}건
                </div>
              </div>
              <div className="rounded-[20px] border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm">
                <div className="text-xs font-medium text-slate-500">결제 대기 주문</div>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  {formatNumber(hero.pendingPayments)}건
                </div>
              </div>
              <div className="rounded-[20px] border border-pink-200 bg-pink-50/80 p-4 shadow-sm">
                <div className="text-xs font-medium text-slate-500">활성 이용권</div>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  {formatNumber(hero.activeEntitlements)}건
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <StatCardView key={item.title} item={item} />
          ))}
        </section>

        <section
          className={`mt-10 rounded-[30px] border p-6 shadow-sm ${panelToneClass("blue")}`}
        >
          <SectionTitle
            eyebrow="Navigation"
            title="핵심 관리 바로가기"
            description="학생 정보 관리와 대학 환산 반영 작업으로 빠르게 이동할 수 있도록 구성했습니다."
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <ShortcutButton
              href="/admin/students"
              title="학생 관리 페이지"
              description="학생 목록, 결제 여부 수정, 성적 확정, 계산 상태 확인, 행별 저장 기능 중심"
              primary
            />
            <ShortcutButton
              href="/admin/university-conversion"
              title="대학 환산 반영 페이지"
              description="대학·전형·모집단위 기준 환산 규칙 확인, 반영, 재계산 관리"
            />
          </div>
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
          <div
            className={`rounded-[30px] border p-6 shadow-sm ${panelToneClass("green")}`}
          >
            <SectionTitle
              eyebrow="Quick Actions"
              title="빠른 작업"
              description="이전에 사용한 엑셀 기준 업로드 흐름을 우선 배치했습니다."
            />
            <div className="grid gap-4 md:grid-cols-2">
              {quickActions.map((item) => (
                <QuickActionCard key={item.title} item={item} />
              ))}
            </div>
          </div>

          <div
            className={`rounded-[30px] border p-6 shadow-sm ${panelToneClass("amber")}`}
          >
            <SectionTitle
              eyebrow="Operations"
              title="운영 체크"
              description="현재 스키마에서 정확히 확인 가능한 운영 항목만 연결했습니다."
            />
            <div className="space-y-4">
              {checks.map((item) => (
                <CheckItemCard key={item.title} item={item} />
              ))}
            </div>
          </div>
        </section>

        <section
          className={`mt-10 rounded-[30px] border p-6 shadow-sm ${panelToneClass("pink")}`}
        >
          <SectionTitle
            eyebrow="Recent Activity"
            title="최근 작업 이력"
            description="업로드, 결제 완료, 입시 데이터 반영 이력을 한 줄씩 넓게 보여줍니다."
            action={
              <Link
                href="/admin/logs"
                className="inline-flex h-10 items-center rounded-xl border-2 border-blue-900 bg-white px-4 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
              >
                전체 이력 보기
              </Link>
            }
          />
          <div className="space-y-3">
            {recentActivities.length > 0 ? (
              recentActivities.map((item, index) => (
                <ActivityRow
                  key={`${item.title}-${item.meta}-${index}`}
                  title={item.title}
                  meta={item.meta}
                  detail={item.detail}
                  tone={item.tone}
                />
              ))
            ) : (
              <div className="rounded-[20px] border border-pink-200 bg-white p-6 text-sm text-slate-500">
                표시할 최근 작업 이력이 없습니다.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
