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

export default function MarketingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const flowId = searchParams.get(SIGNUP_FLOW_QUERY_KEY)?.trim() ?? "";

  const handleAgree = () => {
    const activeFlowId = flowId || createSignupFlowId();
    updateStoredConsent(activeFlowId, { marketingConsent: true });
    router.push(
      `/signup?${SIGNUP_FLOW_QUERY_KEY}=${encodeURIComponent(activeFlowId)}`
    );
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f9fc_0%,#eef3ff_50%,#f8fafc_100%)] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#f8fbff_0%,#eef4ff_55%,#f8fafc_100%)] px-5 py-6 sm:px-7 sm:py-7 lg:px-8">
          <div className="inline-flex items-center rounded-full border border-indigo-100 bg-white/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-indigo-600 shadow-sm">
            Marketing Consent
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
            마케팅 정보 수신 동의 안내
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
            이벤트, 서비스 업데이트, 혜택 안내 등 마케팅 정보 수신에 대한 내용을
            안내합니다.
          </p>
        </div>

        <div className="space-y-6 p-5 sm:p-7 lg:p-8">
          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              1. 수신 목적
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>이벤트 및 프로모션 안내</li>
              <li>신규 기능 및 서비스 업데이트 소식 제공</li>
              <li>맞춤형 혜택 및 공지 전달</li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              2. 수신 항목
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              회원이 제공한 이메일 등 회사가 서비스 제공 과정에서 적법하게 수집한
              연락 수단을 통해 마케팅 정보를 발송할 수 있습니다.
            </p>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              3. 동의 거부 권리
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              회원은 마케팅 정보 수신에 동의하지 않아도 기본적인 서비스 이용에는
              제한이 없습니다.
            </p>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              4. 동의 철회
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              회원은 언제든지 마케팅 수신 동의를 철회할 수 있으며, 계정 설정 또는
              고객 문의를 통해 변경 요청이 가능합니다.
            </p>
          </section>

          <section className="rounded-[24px] border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-lg font-extrabold text-amber-900">안내</h2>
            <p className="mt-3 text-sm leading-7 text-amber-900/90">
              마케팅 수신 동의는 선택 항목이며, 동의 여부와 관계없이 회원가입 및
              핵심 서비스 이용은 가능합니다.
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
