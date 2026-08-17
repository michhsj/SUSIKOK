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

export default function MarketingPage() {
  const router = useRouter();

  const handleAgree = () => {
    const flowId = getFlowIdFromLocation();
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
            마케팅 정보 수신 동의
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
            수시KOK는 회원에게 서비스 소식, 기능 업데이트, 이벤트, 혜택 및
            입시 관련 정보를 안내할 수 있습니다. 본 동의서는 광고성 정보 수신에
            관한 내용을 안내하며, 동의하지 않더라도 회원가입 및 기본 서비스
            이용에는 제한이 없습니다.
          </p>
          <div className="mt-4 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
            시행일: 2026년 8월 15일
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-7 lg:p-8">
          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              1. 수신 목적
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              수시KOK는 다음 목적을 위하여 마케팅 정보를 발송할 수 있습니다.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>신규 서비스 및 기능 업데이트 안내</li>
              <li>이벤트, 프로모션, 혜택 정보 제공</li>
              <li>
                입시 일정, 분석 기능, 서비스 활용 팁 등 유용한 정보 제공
              </li>
              <li>
                회원 대상 설문조사, 만족도 조사 및 서비스 개선을 위한 안내
              </li>
              <li>기타 수시KOK 서비스 이용 활성화를 위한 정보 제공</li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              2. 수신 항목
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              마케팅 정보 발송을 위해 다음 정보를 이용할 수 있습니다.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>이메일</li>
              <li>휴대전화번호</li>
              <li>앱 푸시 수신 정보(모바일 앱 제공 시)</li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              3. 수신 방법
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              회사는 다음과 같은 방법으로 마케팅 정보를 발송할 수 있습니다.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>이메일</li>
              <li>문자메시지(SMS/LMS)</li>
              <li>앱 푸시 알림(모바일 앱 제공 시)</li>
              <li>서비스 내 알림 또는 배너</li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              4. 보유 및 이용 기간
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              마케팅 정보 수신 동의에 따른 개인정보 이용 기간은 다음과
              같습니다.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>
                회원이 마케팅 정보 수신에 동의한 날로부터 동의 철회 또는 회원
                탈퇴 시까지
              </li>
              <li>
                관계 법령에 따라 별도 보관이 필요한 경우에는 해당 기간까지
              </li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              5. 동의 거부 권리 및 불이익
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>회원은 마케팅 정보 수신에 동의하지 않을 권리가 있습니다.</li>
              <li>
                마케팅 정보 수신에 동의하지 않더라도 회원가입 및 기본 서비스
                이용에는 제한이 없습니다.
              </li>
              <li>
                다만, 이벤트, 혜택, 신규 기능 안내 등 일부 유용한 정보를
                받아보지 못할 수 있습니다.
              </li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              6. 동의 철회 방법
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              회원은 언제든지 다음 방법을 통해 마케팅 정보 수신 동의를 철회할
              수 있습니다.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>마이페이지 내 수신 동의 설정 변경</li>
              <li>고객센터 또는 문의 이메일을 통한 철회 요청</li>
              <li>각 이메일 또는 문자메시지에 포함된 수신거부 절차 이용</li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              7. 유의사항
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>
                서비스 운영, 계정 보안, 약관 변경, 결제 또는 중요 공지와 같이
                회원에게 반드시 안내가 필요한 정보는 마케팅 수신 동의 여부와
                관계없이 발송될 수 있습니다.
              </li>
              <li>
                마케팅 정보는 수시KOK의 서비스 안내 및 혜택 제공을 위한 목적으로만
                활용됩니다.
              </li>
              <li>
                회사는 관련 법령을 준수하여 광고성 정보 발송 시 필요한 고지사항을
                함께 제공합니다.
              </li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              8. 동의 문구
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              본인은 수시KOK가 이메일, 문자메시지, 앱 푸시 등의 방법으로 서비스
              소식, 이벤트, 혜택, 입시 관련 정보 등 마케팅 정보를 발송하는 것에
              동의합니다.
            </p>
          </section>

          <section className="rounded-[24px] border border-indigo-100 bg-indigo-50 p-5">
            <h2 className="text-lg font-extrabold text-indigo-950">부칙</h2>
            <p className="mt-3 text-sm leading-7 text-indigo-950/90">
              본 동의서는 2026년 8월 15일부터 적용합니다.
            </p>
          </section>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-5 py-5 sm:px-7 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-slate-600">
              내용을 모두 확인했다면 아래 버튼을 눌러 회원가입 페이지에 동의
              상태를 반영하세요.
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
