import Link from "next/link";
import { unstable_noStore as noStore, revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  EntitlementFeatureCode,
  EntitlementGrantType,
  EntitlementStatus,
  HakjongFitSubmissionStatus,
  PaymentOrderStatus,
  PaymentProvider,
  StudentRecordInputMethod,
  UploadStatus,
  UserRole,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

type CardTone = "blue" | "green" | "amber" | "pink";
type PaymentSelectValue = "UNPAID" | "PAID" | "EXPIRED";

type SavedRecruitmentUnitRow = {
  id: string;
  universityName: string;
  admissionName: string;
  recruitmentUnit: string;
  analysisStatus: string;
  convertedScore: string;
  updatedAt: string;
};

function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

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

function cardToneClass(tone: CardTone) {
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

function inputMethodLabel(value: StudentRecordInputMethod | null | undefined) {
  if (!value) return "-";
  return value === StudentRecordInputMethod.EXCEL ? "엑셀 업로드" : "수동 입력";
}

function uploadStatusLabel(value: UploadStatus | null | undefined) {
  if (!value) return "미업로드";
  if (value === UploadStatus.FINALIZED) return "최종 제출";
  return "임시 저장";
}

function uploadStatusTone(value: UploadStatus | null | undefined): CardTone {
  if (!value) return "pink";
  if (value === UploadStatus.FINALIZED) return "green";
  return "amber";
}

function paymentProviderLabel(value: PaymentProvider) {
  switch (value) {
    case PaymentProvider.TOSS:
      return "토스";
    case PaymentProvider.PORTONE:
      return "포트원";
    case PaymentProvider.INICIS:
      return "이니시스";
    case PaymentProvider.MANUAL:
      return "관리자";
  }
}

function paymentOrderStatusLabel(value: PaymentOrderStatus) {
  switch (value) {
    case PaymentOrderStatus.PENDING:
      return "대기";
    case PaymentOrderStatus.PAID:
      return "결제 완료";
    case PaymentOrderStatus.FAILED:
      return "실패";
    case PaymentOrderStatus.CANCELED:
      return "취소";
    case PaymentOrderStatus.REFUNDED:
      return "환불";
    case PaymentOrderStatus.EXPIRED:
      return "만료";
  }
}

function paymentOrderStatusTone(value: PaymentOrderStatus): CardTone {
  switch (value) {
    case PaymentOrderStatus.PAID:
      return "green";
    case PaymentOrderStatus.PENDING:
      return "blue";
    case PaymentOrderStatus.EXPIRED:
      return "amber";
    case PaymentOrderStatus.CANCELED:
    case PaymentOrderStatus.REFUNDED:
    case PaymentOrderStatus.FAILED:
      return "pink";
  }
}

function entitlementStatusLabel(value: EntitlementStatus) {
  switch (value) {
    case EntitlementStatus.ACTIVE:
      return "활성";
    case EntitlementStatus.EXPIRED:
      return "만료";
    case EntitlementStatus.REVOKED:
      return "회수";
  }
}

function entitlementStatusTone(value: EntitlementStatus): CardTone {
  switch (value) {
    case EntitlementStatus.ACTIVE:
      return "green";
    case EntitlementStatus.EXPIRED:
      return "amber";
    case EntitlementStatus.REVOKED:
      return "pink";
  }
}

function hakjongStatusLabel(value: HakjongFitSubmissionStatus) {
  switch (value) {
    case HakjongFitSubmissionStatus.IN_PROGRESS:
      return "진행 중";
    case HakjongFitSubmissionStatus.COMPLETED:
      return "완료";
    case HakjongFitSubmissionStatus.ABANDONED:
      return "중단";
  }
}

function hakjongStatusTone(value: HakjongFitSubmissionStatus): CardTone {
  switch (value) {
    case HakjongFitSubmissionStatus.COMPLETED:
      return "green";
    case HakjongFitSubmissionStatus.IN_PROGRESS:
      return "blue";
    case HakjongFitSubmissionStatus.ABANDONED:
      return "pink";
  }
}

function gradeLabel(gradeLevel: number | null) {
  if (!gradeLevel) return "-";
  return `${gradeLevel}학년`;
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
          memo: "관리자 학생 상세 페이지에서 결제 여부를 결제 완료로 반영",
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
        memo: "관리자 학생 상세 페이지에서 만료 처리",
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
        memo: "관리자 학생 상세 페이지에서 미결제로 회수 처리",
      },
    });
  }

  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${userId}`);
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

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-sm leading-6 text-slate-800">{value}</div>
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
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap ${badgeToneClass(
        tone
      )}`}
    >
      {label}
    </span>
  );
}

function InlineValue({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </span>
      <span className="ml-2 truncate text-sm text-slate-700">{value}</span>
    </div>
  );
}

async function getStudentDetailData(studentId: string) {
  const now = new Date();

  const user = await prisma.user.findFirst({
    where: {
      id: studentId,
      role: UserRole.STUDENT,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      gradeLevel: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
      school: {
        select: {
          sido: true,
          sigungu: true,
          schoolName: true,
          schoolCode: true,
        },
      },
      studentRecordSubmissions: {
        orderBy: {
          updatedAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          inputMethod: true,
          fileName: true,
          status: true,
          isLocked: true,
          finalizedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      mockExamSubmissions: {
        orderBy: {
          updatedAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          status: true,
          isLocked: true,
          finalizedAt: true,
          createdAt: true,
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
        take: 10,
        select: {
          id: true,
          status: true,
          grantType: true,
          startsAt: true,
          expiresAt: true,
          usedSubmissionCount: true,
          allowedSubmissionCount: true,
          analysisUnlimited: true,
          memo: true,
          createdAt: true,
        },
      },
      paymentOrders: {
        orderBy: {
          requestedAt: "desc",
        },
        take: 10,
        select: {
          id: true,
          orderId: true,
          productName: true,
          amount: true,
          provider: true,
          status: true,
          requestedAt: true,
          paidAt: true,
          canceledAt: true,
          refundedAt: true,
        },
      },
      hakjongFitSubmissions: {
        orderBy: {
          updatedAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          version: true,
          status: true,
          totalQuestionCount: true,
          completedQuestionCount: true,
          startedAt: true,
          completedAt: true,
          updatedAt: true,
        },
      },
      _count: {
        select: {
          studentRecordGrades: true,
          mockExamRecords: true,
          paymentOrders: true,
          entitlements: true,
          hakjongFitSubmissions: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const latestRecord = user.studentRecordSubmissions[0];
  const latestMock = user.mockExamSubmissions[0];

  const activeEntitlement = user.entitlements.find(
    (item) => item.status === EntitlementStatus.ACTIVE && item.expiresAt > now
  );

  const latestEntitlement = user.entitlements[0];
  const latestPaidOrder = user.paymentOrders.find(
    (item) => item.status === PaymentOrderStatus.PAID
  );

  const paymentState = derivePaymentState({
    activeEntitlement,
    latestEntitlement,
    latestPaidOrder: latestPaidOrder
      ? { paidAt: latestPaidOrder.paidAt }
      : null,
  });

  const calculationState = deriveCalculationState({
    recordStatus: latestRecord?.status,
    mockStatus: latestMock?.status,
    paymentState: paymentState.selectValue,
  });

  const savedRecruitmentUnits: SavedRecruitmentUnitRow[] = [];

  return {
    user,
    latestRecord,
    latestMock,
    paymentState,
    calculationState,
    savedRecruitmentUnits,
  };
}

export default async function AdminStudentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  noStore();

  const { user, latestRecord, latestMock, paymentState, calculationState, savedRecruitmentUnits } =
    await getStudentDetailData(params.id);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.10),_transparent_35%),linear-gradient(to_bottom,_#f8fafc,_#eef2f7)]">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
        <section className="relative overflow-hidden rounded-[30px] border border-blue-200 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.10),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.08),_transparent_30%)]" />
          <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                ADMIN STUDENT DETAIL
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                {user.name} 학생 상세 페이지
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                기본 정보부터 성적 업로드 현황, 결제 및 이용권 상태, 저장한 모집단위 기준
                분석/환산 결과, 학종 적합성 진행 현황까지 순서대로 확인합니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/students"
                className="inline-flex h-11 items-center rounded-xl border-2 border-blue-900 bg-white px-4 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
              >
                학생 목록으로
              </Link>
              <Link
                href={`/admin/students/${user.id}/edit`}
                className="inline-flex h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                학생 정보 수정
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className={`rounded-[22px] border p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ${cardToneClass("blue")}`}>
            <div className="text-sm font-medium text-slate-600">학생부 과목 수</div>
            <div className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
              {formatNumber(user._count.studentRecordGrades)}
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-700">
              현재 저장된 학생부 과목 레코드 수
            </p>
          </div>

          <div className={`rounded-[22px] border p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ${cardToneClass("green")}`}>
            <div className="text-sm font-medium text-slate-600">모의고사 기록 수</div>
            <div className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
              {formatNumber(user._count.mockExamRecords)}
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-700">
              현재 저장된 모의고사 성적 레코드 수
            </p>
          </div>

          <div className={`rounded-[22px] border p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ${cardToneClass("amber")}`}>
            <div className="text-sm font-medium text-slate-600">결제 상태</div>
            <div className="mt-3">
              <StatusBadge label={paymentState.label} tone={paymentState.tone} />
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-700">{paymentState.description}</p>
          </div>

          <div className={`rounded-[22px] border p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ${cardToneClass("pink")}`}>
            <div className="text-sm font-medium text-slate-600">분석 가능 상태</div>
            <div className="mt-3">
              <StatusBadge
                label={calculationState.label}
                tone={calculationState.tone}
              />
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-700">
              {calculationState.description}
            </p>
          </div>
        </section>

        <section className={`mt-10 rounded-[30px] border p-6 shadow-sm ${panelToneClass("blue")}`}>
          <SectionTitle
            eyebrow="Profile"
            title="기본 정보"
            description="학생 식별 정보와 학교, 학년, 계정 상태를 한 카드 안에서 확인합니다."
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoItem label="이름" value={user.name} />
            <InfoItem label="이메일" value={user.email} />
            <InfoItem label="연락처" value={user.phone ?? "-"} />
            <InfoItem label="학년" value={gradeLabel(user.gradeLevel)} />
            <InfoItem label="학교" value={user.school?.schoolName ?? "-"} />
            <InfoItem
              label="지역"
              value={user.school ? `${user.school.sido} ${user.school.sigungu}` : "-"}
            />
            <InfoItem label="회원 상태" value={user.isActive ? "활성" : "비활성"} />
            <InfoItem
              label="최근 로그인"
              value={user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "-"}
            />
            <InfoItem label="가입일" value={formatDateTime(user.createdAt)} />
            <InfoItem label="최근 수정" value={formatDateTime(user.updatedAt)} />
            <InfoItem label="학교 코드" value={user.school?.schoolCode ?? "-"} />
            <InfoItem label="학생 ID" value={user.id} />
          </div>
        </section>

        <section className={`mt-10 rounded-[30px] border p-6 shadow-sm ${panelToneClass("green")}`}>
          <SectionTitle
            eyebrow="Uploads"
            title="성적 업로드 현황"
            description="학생부와 모의고사 제출 상태를 한 줄 행 구조로 확인합니다."
          />

          <div className="space-y-3">
            <div className="hidden xl:grid grid-cols-[0.9fr_0.8fr_0.9fr_1.3fr_1fr_1fr_0.7fr] gap-3 px-4 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              <div>구분</div>
              <div>상태</div>
              <div>입력방식</div>
              <div>파일명</div>
              <div>최종 제출</div>
              <div>최근 수정</div>
              <div>잠금</div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-white/90 px-4 py-4">
              <div className="grid gap-3 xl:grid-cols-[0.9fr_0.8fr_0.9fr_1.3fr_1fr_1fr_0.7fr] xl:items-center">
                <div className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                  학생부 업로드
                </div>
                <div>
                  <StatusBadge
                    label={uploadStatusLabel(latestRecord?.status)}
                    tone={uploadStatusTone(latestRecord?.status)}
                  />
                </div>
                <div className="truncate text-sm text-slate-700 whitespace-nowrap">
                  {inputMethodLabel(latestRecord?.inputMethod)}
                </div>
                <div className="truncate text-sm text-slate-700 whitespace-nowrap">
                  {latestRecord?.fileName ?? "-"}
                </div>
                <div className="truncate text-sm text-slate-700 whitespace-nowrap">
                  {latestRecord?.finalizedAt ? formatDateTime(latestRecord.finalizedAt) : "-"}
                </div>
                <div className="truncate text-sm text-slate-700 whitespace-nowrap">
                  {latestRecord?.updatedAt ? formatDateTime(latestRecord.updatedAt) : "-"}
                </div>
                <div className="truncate text-sm text-slate-700 whitespace-nowrap">
                  {latestRecord?.isLocked ? "잠금" : "열림"}
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-white/90 px-4 py-4">
              <div className="grid gap-3 xl:grid-cols-[0.9fr_0.8fr_0.9fr_1.3fr_1fr_1fr_0.7fr] xl:items-center">
                <div className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                  모의고사 업로드
                </div>
                <div>
                  <StatusBadge
                    label={uploadStatusLabel(latestMock?.status)}
                    tone={uploadStatusTone(latestMock?.status)}
                  />
                </div>
                <div className="truncate text-sm text-slate-700 whitespace-nowrap">
                  -
                </div>
                <div className="truncate text-sm text-slate-700 whitespace-nowrap">
                  -
                </div>
                <div className="truncate text-sm text-slate-700 whitespace-nowrap">
                  {latestMock?.finalizedAt ? formatDateTime(latestMock.finalizedAt) : "-"}
                </div>
                <div className="truncate text-sm text-slate-700 whitespace-nowrap">
                  {latestMock?.updatedAt ? formatDateTime(latestMock.updatedAt) : "-"}
                </div>
                <div className="truncate text-sm text-slate-700 whitespace-nowrap">
                  {latestMock?.isLocked ? "잠금" : "열림"}
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-white/90 px-4 py-4">
              <div className="grid gap-3 xl:grid-cols-[1fr_1fr_1fr] xl:items-center">
                <div className="truncate whitespace-nowrap text-sm text-slate-700">
                  학생부 제출 수 <span className="ml-2 font-semibold text-slate-900">{formatNumber(user.studentRecordSubmissions.length)}</span>
                </div>
                <div className="truncate whitespace-nowrap text-sm text-slate-700">
                  모의고사 제출 수 <span className="ml-2 font-semibold text-slate-900">{formatNumber(user.mockExamSubmissions.length)}</span>
                </div>
                <div className="truncate whitespace-nowrap text-sm text-slate-700">
                  학종 적합성 제출 수 <span className="ml-2 font-semibold text-slate-900">{formatNumber(user._count.hakjongFitSubmissions)}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={`mt-10 rounded-[30px] border p-6 shadow-sm ${panelToneClass("amber")}`}>
          <SectionTitle
            eyebrow="Payment & Entitlement"
            title="결제 및 이용권 상태"
            description="현재 결제 상태 수정, 이용권 상태, 최근 결제 이력을 한 섹션 안에서 확인합니다."
          />

          <div className="rounded-[22px] border border-slate-200 bg-white/90 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">현재 결제 상태</div>
                <div className="mt-2 text-sm text-slate-600">{paymentState.description}</div>
              </div>
              <StatusBadge label={paymentState.label} tone={paymentState.tone} />
            </div>

            <form action={updateStudentPaymentStatus} className="mt-5 space-y-4">
              <input type="hidden" name="userId" value={user.id} />

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  결제 상태 선택
                </label>
                <select
                  name="paymentStatus"
                  defaultValue={paymentState.selectValue}
                  className="h-12 w-full rounded-xl border border-blue-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                >
                  <option value="UNPAID">미결제</option>
                  <option value="PAID">결제 완료</option>
                  <option value="EXPIRED">만료</option>
                </select>
              </div>

              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-xl border-2 border-blue-900 bg-white px-5 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
              >
                저장 후 권한 반영
              </button>
            </form>
          </div>

          <div className="mt-4 space-y-3">
            {user.entitlements.length > 0 ? (
              user.entitlements.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[20px] border border-slate-200 bg-white/90 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900">분석 이용권</div>
                    <StatusBadge
                      label={entitlementStatusLabel(item.status)}
                      tone={entitlementStatusTone(item.status)}
                    />
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                    <div>부여 방식: {item.grantType}</div>
                    <div>시작일: {formatDateTime(item.startsAt)}</div>
                    <div>만료일: {formatDateTime(item.expiresAt)}</div>
                    <div>
                      제출 사용량: {item.usedSubmissionCount} / {item.allowedSubmissionCount}
                    </div>
                    <div>무제한 분석: {item.analysisUnlimited ? "예" : "아니오"}</div>
                    <div>메모: {item.memo ?? "-"}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[20px] border border-amber-200 bg-white p-5 text-sm text-slate-600">
                이용권 이력이 없습니다.
              </div>
            )}
          </div>

          <div className="mt-6">
            <div className="mb-3 text-sm font-semibold text-slate-900">최근 결제 이력</div>

            <div className="space-y-3">
              {user.paymentOrders.length > 0 ? (
                user.paymentOrders.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[20px] border border-slate-200 bg-white/90 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {item.productName}
                        </div>
                        <div className="mt-2 text-sm text-slate-600">
                          주문번호: {item.orderId}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          결제수단: {paymentProviderLabel(item.provider)}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          금액: {formatNumber(item.amount)}원
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          요청일: {formatDateTime(item.requestedAt)}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          결제일: {item.paidAt ? formatDateTime(item.paidAt) : "-"}
                        </div>
                      </div>
                      <StatusBadge
                        label={paymentOrderStatusLabel(item.status)}
                        tone={paymentOrderStatusTone(item.status)}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[20px] border border-amber-200 bg-white p-5 text-sm text-slate-600">
                  결제 주문 이력이 없습니다.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className={`mt-10 rounded-[30px] border p-6 shadow-sm ${panelToneClass("pink")}`}>
          <SectionTitle
            eyebrow="Saved Recruitment Units"
            title="저장한 모집단위 기준 분석/환산 결과"
            description="학생이 저장한 모집단위만 보여주는 전용 영역입니다."
          />

          {savedRecruitmentUnits.length > 0 ? (
            <div className="space-y-3">
              {savedRecruitmentUnits.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[20px] border border-slate-200 bg-white/90 p-4"
                >
                  <div className="grid gap-2 md:grid-cols-[1.2fr_1fr_1fr_0.8fr_0.8fr] md:items-center">
                    <div className="text-sm font-semibold text-slate-900">
                      {item.universityName}
                    </div>
                    <div className="text-sm text-slate-700">{item.admissionName}</div>
                    <div className="text-sm text-slate-700">{item.recruitmentUnit}</div>
                    <div className="text-sm text-slate-700">{item.analysisStatus}</div>
                    <div className="text-sm text-slate-700">{item.convertedScore}</div>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    최근 반영 {item.updatedAt}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[22px] border border-pink-200 bg-white p-6">
              <div className="text-sm font-semibold text-slate-900">
                저장한 모집단위 데이터 없음
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                현재 스키마에는 학생이 저장한 모집단위를 연결하는 모델이 없어,
                이 영역은 비워둔 상태입니다.
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                요청하신 방향에 맞춰 전체 모집단위는 보여주지 않고,
                <span className="font-semibold text-slate-800">
                  {" "}저장한 모집단위만 표시하는 전용 영역
                </span>
                으로 유지했습니다.
              </p>
            </div>
          )}
        </section>

        <section className={`mt-10 rounded-[30px] border p-6 shadow-sm ${panelToneClass("blue")}`}>
          <SectionTitle
            eyebrow="Hakjong Fit"
            title="학종 적합성 진행 현황"
            description="진행 상태와 문항 수, 시작/완료 시점을 한 줄 행 구조로 확인합니다."
          />

          {user.hakjongFitSubmissions.length > 0 ? (
            <div className="space-y-3">
              <div className="hidden xl:grid grid-cols-[0.8fr_0.8fr_1fr_1fr_1fr_1fr] gap-3 px-4 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                <div>버전</div>
                <div>상태</div>
                <div>진행 문항</div>
                <div>시작일</div>
                <div>완료일</div>
                <div>최근 수정</div>
              </div>

              {user.hakjongFitSubmissions.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[20px] border border-slate-200 bg-white/90 px-4 py-4"
                >
                  <div className="grid gap-3 xl:grid-cols-[0.8fr_0.8fr_1fr_1fr_1fr_1fr] xl:items-center">
                    <div className="truncate whitespace-nowrap text-sm font-semibold text-slate-900">
                      버전 {item.version}
                    </div>
                    <div>
                      <StatusBadge
                        label={hakjongStatusLabel(item.status)}
                        tone={hakjongStatusTone(item.status)}
                      />
                    </div>
                    <div className="truncate whitespace-nowrap text-sm text-slate-700">
                      {item.completedQuestionCount} / {item.totalQuestionCount}
                    </div>
                    <div className="truncate whitespace-nowrap text-sm text-slate-700">
                      {formatDateTime(item.startedAt)}
                    </div>
                    <div className="truncate whitespace-nowrap text-sm text-slate-700">
                      {item.completedAt ? formatDateTime(item.completedAt) : "-"}
                    </div>
                    <div className="truncate whitespace-nowrap text-sm text-slate-700">
                      {formatDateTime(item.updatedAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[20px] border border-blue-200 bg-white p-5 text-sm text-slate-600">
              학종 적합성 제출 이력이 없습니다.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
