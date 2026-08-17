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
            개인정보처리방침
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
            수시KOK는 회원의 개인정보를 중요하게 생각하며, 관련 법령에 따라
            개인정보를 안전하게 처리하고 보호하기 위해 노력합니다. 본
            개인정보처리방침은 수시KOK 서비스 이용 과정에서 수집되는 개인정보의
            처리 목적, 항목, 보유 기간 및 이용자의 권리 등에 대해 안내합니다.
          </p>
          <div className="mt-4 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
            시행일: 2026년 8월 15일
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-7 lg:p-8">
          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              1. 개인정보의 처리 목적
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              수시KOK는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고
              있는 개인정보는 다음 목적 이외의 용도로는 이용되지 않으며, 이용
              목적이 변경되는 경우 관련 법령에 따라 별도의 동의를 받거나 필요한
              조치를 이행합니다.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>회원가입 및 본인 식별</li>
              <li>로그인 및 계정 관리</li>
              <li>학교 및 학년 기반 서비스 제공</li>
              <li>학생부 성적 입력, 저장, 대학별 환산점수 계산 및 지원 가능성 분석</li>
              <li>분석 결과 제공 및 이용 이력 관리</li>
              <li>고객 문의 대응 및 서비스 운영 관리</li>
              <li>부정 이용 방지, 보안 점검 및 서비스 안정성 확보</li>
              <li>서비스 품질 개선 및 통계 분석</li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              2. 처리하는 개인정보 항목
            </h2>
            <p className="mt-3 text-sm font-bold leading-7 text-slate-800">
              수시KOK는 다음과 같은 개인정보를 처리할 수 있습니다.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  가. 회원가입 시
                </h3>
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-sm font-bold text-slate-800">필수 항목</p>
                    <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
                      <li>이름</li>
                      <li>이메일</li>
                      <li>비밀번호</li>
                      <li>학교 정보(시도, 시군구, 학교명, 학교 식별값)</li>
                      <li>학년</li>
                      <li>이용약관 동의 여부</li>
                      <li>개인정보 수집·이용 동의 여부</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">선택 항목</p>
                    <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
                      <li>연락처(휴대전화번호)</li>
                      <li>마케팅 정보 수신 동의 여부</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  나. 서비스 이용 시 회원이 직접 입력하는 정보
                </h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
                  <li>학생부 성적 정보</li>
                  <li>과목 정보</li>
                  <li>학기별 성적 정보</li>
                  <li>대학 선택 정보</li>
                  <li>전형/모집단위 선택 정보</li>
                  <li>분석 결과 및 조회 이력</li>
                </ul>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  다. 서비스 이용 과정에서 자동 생성될 수 있는 정보
                </h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
                  <li>접속 일시</li>
                  <li>접속 IP</li>
                  <li>브라우저 및 기기 정보</li>
                  <li>서비스 이용 기록</li>
                  <li>로그인 기록</li>
                  <li>쿠키 및 세션 정보</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              3. 개인정보의 처리 및 보유 기간
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              회사는 법령에 따른 개인정보 보유·이용 기간 또는 정보주체로부터
              개인정보를 수집 시 동의받은 보유·이용 기간 내에서 개인정보를 처리
              및 보유합니다.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>회원가입 및 서비스 제공을 위한 개인정보는 회원 탈퇴 시까지 보유합니다.</li>
              <li>
                다만, 다음의 경우에는 관련 법령에서 정한 기간 동안 개인정보를
                보관할 수 있습니다.
              </li>
              <li>계약 또는 청약철회 등에 관한 기록</li>
              <li>대금결제 및 재화·서비스 공급에 관한 기록</li>
              <li>소비자 불만 또는 분쟁처리에 관한 기록</li>
              <li>접속 로그 등 통신사실확인자료</li>
              <li>
                관계 법령상 별도 보관 의무가 없는 경우에도 부정 이용 방지, 분쟁
                대응 및 서비스 안정성 확보를 위하여 필요한 범위에서 일정 기간
                보관할 수 있습니다.
              </li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              4. 개인정보의 제3자 제공
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              수시KOK는 원칙적으로 정보주체의 개인정보를 외부에 제공하지
              않습니다.
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              다만, 다음의 경우에는 예외적으로 제공될 수 있습니다.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>정보주체가 사전에 동의한 경우</li>
              <li>법령에 특별한 규정이 있거나 법적 의무를 준수하기 위해 필요한 경우</li>
              <li>수사기관 등 관계기관의 적법한 요청이 있는 경우</li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              5. 개인정보 처리의 위탁
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              회사는 원활한 서비스 제공을 위하여 필요한 경우 일부 업무를 외부
              전문업체에 위탁할 수 있습니다.
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              회사는 위탁계약 체결 시 관련 법령에 따라 개인정보가 안전하게
              처리되도록 필요한 사항을 계약에 반영하고 관리·감독합니다.
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              위탁업무의 내용이나 수탁자가 변경되는 경우 본 개인정보처리방침 또는
              별도 공지를 통해 안내합니다.
            </p>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              6. 정보주체의 권리·의무 및 행사방법
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>
                정보주체는 언제든지 회사에 대해 자신의 개인정보에 대한 열람,
                정정, 삭제, 처리정지 요청을 할 수 있습니다.
              </li>
              <li>
                회원은 마이페이지, 고객센터 또는 별도 문의 채널을 통해 개인정보
                관련 권리를 행사할 수 있습니다.
              </li>
              <li>법령에 따라 일부 정보는 삭제 또는 처리정지가 제한될 수 있습니다.</li>
              <li>
                정보주체는 개인정보를 최신의 상태로 유지해야 하며, 부정확한 정보
                입력으로 인한 불이익은 본인에게 있을 수 있습니다.
              </li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              7. 개인정보의 파기 절차 및 방법
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>
                회사는 개인정보 보유기간의 경과, 처리 목적 달성 등 개인정보가
                불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.
              </li>
              <li>
                전자적 파일 형태의 정보는 복구 또는 재생이 불가능한 방법으로
                삭제합니다.
              </li>
              <li>
                종이 문서에 기록·저장된 개인정보는 분쇄하거나 소각하는 방법으로
                파기합니다.
              </li>
              <li>
                법령에 따라 별도로 보관해야 하는 경우에는 해당 정보를 다른
                개인정보와 분리하여 안전하게 보관합니다.
              </li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              8. 개인정보의 안전성 확보조치
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              수시KOK는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고
              있습니다.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>개인정보 접근 권한의 최소화</li>
              <li>비밀번호 등 중요 정보의 안전한 저장 및 관리</li>
              <li>접근 통제 및 인증 절차 운영</li>
              <li>보안 점검 및 취약점 대응</li>
              <li>개인정보 처리 시스템의 모니터링 및 로그 관리</li>
              <li>내부 관리계획 수립 및 운영</li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              9. 쿠키의 설치·운영 및 거부
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>
                회사는 서비스 이용 편의성 향상, 로그인 유지, 이용자 맞춤형
                서비스 제공 등을 위하여 쿠키를 사용할 수 있습니다.
              </li>
              <li>
                이용자는 브라우저 설정을 통해 쿠키 저장을 거부하거나 삭제할 수
                있습니다.
              </li>
              <li>
                다만, 쿠키 저장을 거부할 경우 일부 서비스 이용에 제한이 있을 수
                있습니다.
              </li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              10. 아동 및 청소년의 개인정보 보호
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              수시KOK는 관련 법령을 준수하여 아동 및 청소년의 개인정보 보호를
              위해 노력합니다. 법정대리인의 동의가 필요한 경우에는 관계 법령에
              따라 적절한 절차를 마련할 수 있습니다.
            </p>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              11. 개인정보 보호책임자 및 문의처
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보
              처리와 관련한 정보주체의 불만 처리 및 피해구제를 위하여 아래와
              같이 개인정보 보호 문의 창구를 운영합니다.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>개인정보 보호책임자: 수시KOK 개인정보보호 담당자</li>
              <li>이메일: michhsj@naver.com</li>
              <li>문의 가능 시간: 평일 10:00 ~ 18:00</li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              12. 권익침해 구제방법
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              정보주체는 개인정보침해에 대한 신고나 상담이 필요한 경우 아래
              기관에 문의할 수 있습니다.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>
                개인정보침해신고센터 :{" "}
                <a
                  href="https://privacy.kisa.or.kr/main.do"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-indigo-600 underline underline-offset-2"
                >
                  https://privacy.kisa.or.kr/main.do
                </a>
              </li>
              <li>
                개인정보 분쟁조정위원회 :{" "}
                <a
                  href="https://www.kopico.go.kr/main/main.do"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-indigo-600 underline underline-offset-2"
                >
                  https://www.kopico.go.kr/main/main.do
                </a>
              </li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">
              13. 개인정보처리방침의 변경
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              본 개인정보처리방침은 법령, 서비스 정책 또는 보안 운영 기준의
              변경에 따라 수정될 수 있습니다. 내용이 변경되는 경우 서비스 내
              공지사항 또는 별도 안내를 통해 사전에 공지합니다.
            </p>
          </section>

          <section className="rounded-[24px] border border-indigo-100 bg-indigo-50 p-5">
            <h2 className="text-lg font-extrabold text-indigo-950">부칙</h2>
            <p className="mt-3 text-sm leading-7 text-indigo-950/90">
              본 개인정보처리방침은 2026년 8월 15일부터 시행합니다.
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
