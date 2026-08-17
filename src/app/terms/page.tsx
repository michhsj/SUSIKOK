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

export default function TermsPage() {
  const router = useRouter();

  const handleAgree = () => {
    const flowId = getFlowIdFromLocation();
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
            수시KOK 이용과 관련한 기본적인 권리, 의무 및 책임사항을
            안내합니다. 본 약관은 수시KOK 서비스 이용을 위한 기본 계약
            내용이며, 회원가입 시 동의한 내용에 적용됩니다.
          </p>
          <div className="mt-4 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
            시행일: 2026년 8월 15일
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-7 lg:p-8">
          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">제1조 목적</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              이 약관은 수시KOK(이하 “회사”)가 제공하는 대학별 환산점수 분석
              및 수시 지원 참고 서비스(이하 “서비스”)의 이용과 관련하여 회사와
              회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을
              목적으로 합니다.
            </p>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              제2조 용어의 정의
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>
                “서비스”란 회사가 제공하는 학생부 성적 입력, 학교 정보 선택,
                대학별 환산점수 계산, 지원 가능성 분석, 분석 결과 확인, 회원정보
                저장 및 기타 관련 부가 기능 일체를 의미합니다.
              </li>
              <li>
                “회원”이란 본 약관에 동의하고 회사와 이용계약을 체결한 자로서,
                회사가 제공하는 서비스를 이용하는 자를 말합니다.
              </li>
              <li>
                “계정”이란 회원의 식별과 서비스 이용을 위하여 회원이 등록한
                이메일 주소, 비밀번호 등 로그인 수단을 의미합니다.
              </li>
              <li>
                “학생부 데이터”란 회원이 직접 입력하거나 업로드한 성적, 학교,
                학년, 과목 및 기타 입시 분석 관련 정보를 의미합니다.
              </li>
              <li>
                “분석 결과”란 회원이 입력한 정보와 회사가 설정한 기준을 바탕으로
                제공되는 대학별 환산점수, 비교 결과, 지원 가능성 참고 정보 등을
                의미합니다.
              </li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              제3조 약관의 효력 및 변경
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>
                본 약관은 회원이 회원가입 과정에서 동의함으로써 효력이
                발생합니다.
              </li>
              <li>
                회사는 관련 법령을 위반하지 않는 범위에서 본 약관을 변경할 수
                있습니다.
              </li>
              <li>
                회사가 약관을 변경하는 경우 적용일자 및 변경 사유를 서비스 내
                공지사항 또는 회원이 확인할 수 있는 방식으로 사전에 안내합니다.
              </li>
              <li>
                회원이 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고
                회원탈퇴를 요청할 수 있습니다.
              </li>
              <li>
                변경된 약관 공지 이후에도 회원이 서비스를 계속 이용하는 경우에는
                변경 내용에 동의한 것으로 봅니다.
              </li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              제4조 서비스의 제공
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              회사는 회원에게 다음과 같은 서비스를 제공합니다.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>회원가입, 로그인, 로그아웃 및 계정 관리</li>
              <li>학교 선택, 학년 설정 및 회원정보 관리</li>
              <li>학생부 성적 입력, 저장 및 관리</li>
              <li>대학별 환산점수 계산</li>
              <li>대학 및 전형 기준에 따른 지원 가능성 참고 분석</li>
              <li>분석 결과 조회 및 관련 부가 기능</li>
              <li>기타 회사가 추가 개발하거나 제휴 등을 통해 제공하는 서비스</li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              제5조 회원가입 및 이용계약의 성립
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              이용계약은 회원이 약관에 동의하고, 회사가 정한 절차에 따라
              회원가입을 신청한 후 회사가 이를 승낙함으로써 성립합니다.
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              회사는 다음 각 호의 경우 회원가입 신청을 승낙하지 않거나 사후에
              이용계약을 해지할 수 있습니다.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>허위 정보를 기재하거나 타인의 정보를 도용한 경우</li>
              <li>이미 가입된 이메일 등 중복된 정보로 신청한 경우</li>
              <li>관련 법령 또는 본 약관을 위반할 목적으로 신청한 경우</li>
              <li>서비스 운영을 현저히 저해할 우려가 있는 경우</li>
            </ul>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              회원은 가입 시 정확하고 최신의 정보를 입력하여야 하며, 변경사항이
              있는 경우 이를 즉시 수정하여야 합니다.
            </p>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              제6조 회원정보 및 계정 관리
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>
                회원은 본인의 계정을 직접 관리하여야 하며, 계정 정보의 관리
                소홀로 발생한 손해에 대하여 회사는 회사의 고의 또는 중대한
                과실이 없는 한 책임을 지지 않습니다.
              </li>
              <li>
                회원은 본인의 계정을 타인에게 양도, 대여, 공유할 수 없습니다.
              </li>
              <li>
                회원은 본인의 계정이 도용되었거나 제3자가 무단으로 사용하고
                있음을 인지한 경우 즉시 회사에 통지하여야 합니다.
              </li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              제7조 회원의 의무
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              회원은 다음 각 호의 행위를 하여서는 안 됩니다.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>허위 정보 입력 또는 타인의 정보 도용</li>
              <li>회사 또는 제3자의 권리, 명예, 신용을 침해하는 행위</li>
              <li>서비스의 정상적인 운영을 방해하는 행위</li>
              <li>
                회사가 제공하는 정보, 화면, 문구, 결과 등을 무단 복제·배포·판매·상업적으로
                이용하는 행위
              </li>
              <li>
                시스템에 과도한 부하를 유발하거나 비정상적인 접근을 시도하는
                행위
              </li>
              <li>법령 또는 공서양속에 반하는 행위</li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              제8조 회사의 의무
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>
                회사는 관련 법령과 본 약관이 정하는 바에 따라 지속적이고
                안정적으로 서비스를 제공하기 위해 노력합니다.
              </li>
              <li>
                회사는 회원의 개인정보를 관련 법령 및 개인정보처리방침에 따라
                보호합니다.
              </li>
              <li>
                회사는 회원의 의견 또는 불만이 정당하다고 인정되는 경우 이를
                처리하기 위해 노력합니다.
              </li>
              <li>
                회사는 서비스 품질 개선을 위해 기능, 화면, 운영정책을 조정할 수
                있습니다.
              </li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              제9조 서비스 이용의 제한 및 중단
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>
                회사는 시스템 점검, 유지보수, 설비 장애, 통신 장애, 불가항력
                등의 사유가 발생한 경우 서비스 제공을 일시적으로 중단할 수
                있습니다.
              </li>
              <li>
                회사는 회원이 본 약관 또는 관련 법령을 위반한 경우 서비스 이용을
                제한하거나 회원 자격을 제한할 수 있습니다.
              </li>
              <li>
                회사는 서비스 운영상 필요하다고 판단하는 경우 서비스의 일부 또는
                전부를 변경할 수 있습니다.
              </li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              제10조 분석 결과의 성격 및 책임 제한
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>
                수시KOK가 제공하는 환산점수 및 지원 가능성 분석 결과는 입시 전략
                수립을 위한 참고 자료입니다.
              </li>
              <li>
                회사는 회원이 입력한 정보, 대학별 기준, 내부 분석 로직 등을
                바탕으로 결과를 제공하나, 실제 전형 결과는 대학의 평가 기준,
                지원자 분포, 전형 변경 사항 등에 따라 달라질 수 있습니다.
              </li>
              <li>
                회사는 서비스 결과가 특정 대학의 합격 또는 불합격을 보장한다고
                보지 않습니다.
              </li>
              <li>
                회원은 분석 결과를 본인의 판단과 책임 아래 활용하여야 하며,
                회사는 회원의 최종 지원 의사결정에 대한 책임을 부담하지
                않습니다.
              </li>
              <li>
                회원이 입력한 정보의 오류, 누락 또는 부정확성으로 인해 발생한
                결과 차이에 대해서 회사는 책임을 지지 않습니다.
              </li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              제11조 지식재산권
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>
                서비스 및 서비스 내 제공되는 디자인, UI, 문구, 로고, 데이터
                구조, 분석 화면 등에 대한 권리는 회사에 귀속됩니다.
              </li>
              <li>
                회원은 회사의 사전 동의 없이 이를 복제, 수정, 배포, 판매, 전송,
                출판, 2차적 저작물 작성 등의 방식으로 이용할 수 없습니다.
              </li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              제12조 회원탈퇴 및 이용계약 해지
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>
                회원은 언제든지 회사가 정한 절차에 따라 회원탈퇴를 요청할 수
                있습니다.
              </li>
              <li>
                회원탈퇴 시 관련 법령에 따라 보관이 필요한 정보를 제외한
                회원정보는 삭제 또는 분리보관될 수 있습니다.
              </li>
              <li>
                회사는 회원이 본 약관 또는 법령을 위반하는 경우 상당한 기간을
                정하여 시정을 요청한 후 이용계약을 해지할 수 있습니다.
              </li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              제13조 손해배상
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              회사 또는 회원은 본 약관을 위반하여 상대방에게 손해를 입힌 경우
              관련 법령에 따라 손해배상 책임을 부담할 수 있습니다.
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              다만, 회사는 천재지변, 불가항력, 회원의 귀책사유 등 회사의 책임
              없는 사유로 발생한 손해에 대해서는 책임을 지지 않습니다.
            </p>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              제14조 분쟁 해결 및 준거법
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>본 약관은 대한민국 법령에 따라 해석되고 적용됩니다.</li>
              <li>
                서비스 이용과 관련하여 회사와 회원 간 분쟁이 발생한 경우, 회사와
                회원은 성실히 협의하여 해결하도록 노력합니다.
              </li>
              <li>
                협의로 해결되지 않는 분쟁은 관련 법령에 따른 관할 법원을 제1심
                관할 법원으로 합니다.
              </li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-indigo-100 bg-indigo-50 p-5">
            <h2 className="text-lg font-extrabold text-indigo-950">부칙</h2>
            <p className="mt-3 text-sm leading-7 text-indigo-950/90">
              본 약관은 2026년 8월 15일부터 시행합니다.
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
