"use client";

import { useRouter, useSearchParams } from "next/navigation";

const LEGACY_CONSENT_STORAGE_KEY = "susikok_signup_consents";
const SIGNUP_FLOW_QUERY_KEY = "flow";
const SIGNUP_DRAFT_STORAGE_KEY_PREFIX = "susikok_signup_draft";

function createSignupFlowId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `signup_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function getSignupDraftStorageKey(flowId: string) {
  return `${SIGNUP_DRAFT_STORAGE_KEY_PREFIX}:${flowId}`;
}

function updateStoredConsent(
  flowId: string,
  next: {
    termsConsent?: boolean;
    privacyConsent?: boolean;
    marketingConsent?: boolean;
  }
) {
  if (typeof window === "undefined") return;

  let current: Record<string, unknown> = {};

  try {
    window.localStorage.removeItem(LEGACY_CONSENT_STORAGE_KEY);

    const raw = window.sessionStorage.getItem(getSignupDraftStorageKey(flowId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        current = parsed as Record<string, unknown>;
      }
    }
  } catch {
    current = {};
  }

  window.sessionStorage.setItem(
    getSignupDraftStorageKey(flowId),
    JSON.stringify({
      ...current,
      ...next,
    })
  );
}

export default function TermsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const flowId = searchParams.get(SIGNUP_FLOW_QUERY_KEY)?.trim() ?? "";

  const handleAgree = () => {
    const activeFlowId = flowId || createSignupFlowId();
    updateStoredConsent(activeFlowId, { termsConsent: true });
    router.push(
      `/signup?${SIGNUP_FLOW_QUERY_KEY}=${encodeURIComponent(activeFlowId)}`
    );
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f9fc_0%,#eef3ff_50%,#f8fafc_100%)] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#f8fbff_0%,#eef4ff_55%,#f8fafc_100%)] px-5 py-6 sm:px-7 sm:py-7 lg:px-8">
          <div className="inline-flex items-center rounded-full border border-indigo-100 bg-white/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-indigo-600 shadow-sm">
            Terms of Service
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
            이용약관
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
            수시콕 서비스 이용에 관한 기본 조건, 이용자의 권리와 의무, 서비스 운영 기준을 안내합니다.
          </p>
        </div>

        <div className="space-y-6 p-5 sm:p-7 lg:p-8">
          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">제1조 목적</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              본 약관은 수시콕이 제공하는 서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              제2조 회원가입 및 계정 관리
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>회원은 정확한 정보를 입력하여 가입해야 합니다.</li>
              <li>이메일과 비밀번호에 대한 관리 책임은 회원 본인에게 있습니다.</li>
              <li>허위 정보 입력 시 서비스 이용이 제한될 수 있습니다.</li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              제3조 서비스 제공 내용
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>회원가입 및 로그인 기능</li>
              <li>학교 및 성적 기반 정보 관리 기능</li>
              <li>대학/전형/학과 관련 정보 조회 기능</li>
              <li>기타 수시 지원 분석 및 비교 서비스</li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              제4조 회원의 의무
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>
                타인의 정보를 도용하거나 부정한 목적으로 서비스를 이용해서는 안 됩니다.
              </li>
              <li>서비스 운영을 방해하는 행위를 해서는 안 됩니다.</li>
              <li>관련 법령 및 본 약관을 준수해야 합니다.</li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              제5조 서비스 이용 제한
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              회사는 회원이 약관을 위반하거나 서비스 운영에 중대한 지장을 초래하는
              경우, 사전 통지 후 서비스 이용을 제한하거나 계정을 정지할 수
              있습니다.
            </p>
          </section>

          <section className="rounded-[24px] border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-lg font-extrabold text-amber-900">안내</h2>
            <p className="mt-3 text-sm leading-7 text-amber-900/90">
              본 페이지는 서비스 운영을 위한 기본 약관 초안 성격입니다. 실제 운영
              전에는 법률 검토를 거쳐 최종 문구를 확정하는 것을 권장합니다.
            </p>
          </section>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-5 py-5 sm:px-7 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-slate-600">
              내용을 모두 확인했다면 아래 버튼을 눌러 회원가입 페이지에 동의 상태를
              반영하세요.
            </p>
            <button
              type="button"
              onClick={handleAgree}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#4f46e5_0%,#2563eb_100%)] px-6 text-sm font-extrabold text-white shadow-[0_16px_32px_rgba(37,99,235,0.22)] transition hover:translate-y-[-1px] hover:shadow-[0_20px_40px_rgba(37,99,235,0.28)]"
            >
              동의하기
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
