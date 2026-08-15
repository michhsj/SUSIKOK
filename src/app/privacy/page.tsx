"use client";

import { useRouter } from "next/navigation";

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

function getFlowIdFromLocation() {
  if (typeof window === "undefined") return "";

  const params = new URLSearchParams(window.location.search);
  return params.get(SIGNUP_FLOW_QUERY_KEY)?.trim() ?? "";
}

export default function PrivacyPage() {
  const router = useRouter();

  const handleAgree = () => {
    const flowId = getFlowIdFromLocation();
    const activeFlowId = flowId || createSignupFlowId();

    updateStoredConsent(activeFlowId, { privacyConsent: true });

    router.push(
      `/signup?${SIGNUP_FLOW_QUERY_KEY}=${encodeURIComponent(activeFlowId)}`
    );
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f9fc_0%,#eef3ff_50%,#f8fafc_100%)] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#f8fbff_0%,#eef4ff_55%,#f8fafc_100%)] px-5 py-6 sm:px-7 sm:py-7 lg:px-8">
          <div className="inline-flex items-center rounded-full border border-indigo-100 bg-white/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-indigo-600 shadow-sm">
            Privacy Policy
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
            개인정보 수집·이용 안내
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
            회원가입 및 서비스 제공을 위해 필요한 개인정보의 수집 목적, 항목,
            보관기간을 안내합니다.
          </p>
        </div>

        <div className="space-y-6 p-5 sm:p-7 lg:p-8">
          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              1. 수집 항목
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>이름</li>
              <li>이메일 주소</li>
              <li>학교 정보 및 학년</li>
              <li>서비스 이용 기록 및 접속 로그</li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              2. 수집 목적
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>회원 식별 및 계정 관리</li>
              <li>서비스 제공 및 맞춤형 기능 운영</li>
              <li>고객 문의 대응 및 서비스 품질 개선</li>
              <li>부정 이용 방지 및 보안 관리</li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              3. 보관 기간
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              회원 탈퇴 시 원칙적으로 지체 없이 파기합니다. 다만 관련 법령에 따라
              일정 기간 보존이 필요한 경우 해당 기간 동안 안전하게 보관합니다.
            </p>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              4. 제3자 제공 및 처리 위탁
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.
              다만 서비스 운영을 위해 필요한 범위 내에서 법령에 따라 처리 위탁이
              발생할 수 있습니다.
            </p>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              5. 이용자의 권리
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>개인정보 열람, 수정, 삭제 요청 가능</li>
              <li>동의 철회 및 회원 탈퇴 요청 가능</li>
              <li>개인정보 처리 관련 문의 가능</li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-lg font-extrabold text-amber-900">안내</h2>
            <p className="mt-3 text-sm leading-7 text-amber-900/90">
              본 문서는 서비스 개발 단계 기준의 개인정보 안내 초안입니다. 실제
              운영 시 개인정보처리방침 전문으로 확장하고 법률 검토를 거쳐 최종
              확정하는 것을 권장합니다.
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
