type CompanyInfoSectionProps = {
  logoSrc?: string;
  ceoName?: string;
  businessNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
  hours?: string;
};

const InfoIcon = ({ children }: { children: React.ReactNode }) => {
  return (
    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-800">
      {children}
    </span>
  );
};

export default function CompanyInfoSection({
  logoSrc = "/logo/newplanedu-logo.png",
  ceoName = "홍 성 진",
  businessNumber = "561 - 22 - 01321",
  address = "인천시 계양구 장제로708, 한샘프라자 404호",
  phone = "1877 - 9379",
  email = "michhsj@naver.com",
  hours = "10:00~18:00",
}: CompanyInfoSectionProps) {
  return (
    <section id="company-info" className="bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="grid lg:grid-cols-[280px_1fr]">
            {/* 왼쪽 로고 영역 */}
            <div className="flex flex-col items-center justify-center border-b border-slate-200 px-8 py-10 text-center lg:border-b-0 lg:border-r">
              <img
                src={logoSrc}
                alt="뉴플랜에듀 로고"
                className="h-auto w-full max-w-[200px] object-contain"
              />

              <div className="mt-8 w-full border-t border-slate-100 pt-6">
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-4 w-4"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                  <span>{hours}</span>
                </div>
              </div>
            </div>

            {/* 오른쪽 표 영역 */}
            <div className="grid grid-cols-1">
              {/* 1행 */}
              <div className="grid sm:grid-cols-2">
                <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
                  <div className="flex items-start gap-4">
                    <InfoIcon>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                      >
                        <path d="M20 21a8 8 0 0 0-16 0" />
                        <circle cx="12" cy="8" r="4" />
                      </svg>
                    </InfoIcon>

                    <div className="min-w-0">
                      <p className="text-base font-bold text-slate-900">
                        대표자명
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-500">
                        {ceoName}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-b border-slate-200 px-6 py-6 sm:border-l sm:px-8">
                  <div className="flex items-start gap-4">
                    <InfoIcon>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                      >
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <path d="M7 9h10M7 13h6" />
                      </svg>
                    </InfoIcon>

                    <div className="min-w-0">
                      <p className="text-base font-bold text-slate-900">
                        사업자등록번호
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-500">
                        {businessNumber}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2행 */}
              <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
                <div className="flex items-start gap-4">
                  <InfoIcon>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-5 w-5"
                    >
                      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                  </InfoIcon>

                  <div className="min-w-0">
                    <p className="text-base font-bold text-slate-900">
                      사업장 주소
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-500">
                      {address}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3행 */}
              <div className="grid sm:grid-cols-2">
                <div className="px-6 py-6 sm:px-8">
                  <div className="flex items-start gap-4">
                    <InfoIcon>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.35 1.78.68 2.61a2 2 0 0 1-.45 2.11L8.1 9.91a16 16 0 0 0 6 6l1.47-1.24a2 2 0 0 1 2.11-.45c.83.33 1.71.56 2.61.68A2 2 0 0 1 22 16.92Z" />
                      </svg>
                    </InfoIcon>

                    <div className="min-w-0">
                      <p className="text-base font-bold text-slate-900">
                        연락처
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-500">
                        {phone}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 px-6 py-6 sm:border-l sm:border-t-0 sm:px-8">
                  <div className="flex items-start gap-4">
                    <InfoIcon>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                      >
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <path d="m4 7 8 6 8-6" />
                      </svg>
                    </InfoIcon>

                    <div className="min-w-0">
                      <p className="text-base font-bold text-slate-900">
                        이메일
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-500">
                        {email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* 오른쪽 표 영역 끝 */}
          </div>
        </div>
      </div>
    </section>
  );
}
