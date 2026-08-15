// src/components/sections/home/FaqSection.tsx

"use client";

import { useState } from "react";

const faqItems = [
  {
    id: "faq-01",
    question: "학생부 성적은 어떻게 입력하나요?",
    answer:
      "엑셀 업로드 또는 직접 입력 방식을 통해 등록할 수 있습니다. 엑셀 파일은 안내된 양식에 맞게 작성 후 업로드하면 자동으로 파싱되며, 직접 입력은 학년·학기·과목별로 개별 입력이 가능합니다.",
  },
  {
    id: "faq-02",
    question: "모든 대학의 환산점수를 제공하나요?",
    answer:
      "서비스에 등록된 대학과 전형 기준에 따라 환산점수와 비교 결과를 제공합니다. 현재 전국 주요 대학을 중심으로 지속적으로 확대하고 있으며, 등록되지 않은 대학의 경우 순차적으로 반영될 예정입니다.",
  },
  {
    id: "faq-03",
    question: "분석 결과는 얼마나 신뢰할 수 있나요?",
    answer:
      "대학별 반영 기준과 발표 자료를 바탕으로 분석하며, 지원 전략 수립을 위한 참고 자료로 활용할 수 있습니다. 분석 결과는 실제 합격 여부를 보장하지 않으며, 대학별 전형 요소와 지원 상황에 따라 달라질 수 있습니다.",
  },
  {
    id: "faq-04",
    question: "이용 요금은 어떻게 되나요?",
    answer:
      "이용 범위와 서비스 정책에 따라 안내될 예정이며, 상세 내용은 공지사항 또는 고객센터를 통해 확인할 수 있습니다. 현재 기본 서비스는 무료로 제공되고 있으며, 추가 기능에 대한 안내는 별도 공지를 통해 제공됩니다.",
  },
  {
    id: "faq-05",
    question: "입력한 성적 데이터는 안전하게 보관되나요?",
    answer:
      "개인정보와 성적 데이터는 안전하게 암호화되어 보관됩니다. 개인정보처리방침에 따라 수집된 데이터는 서비스 제공 목적 외에 사용되지 않으며, 계정 삭제 시 관련 데이터도 함께 처리됩니다.",
  },
  {
    id: "faq-06",
    question: "상담교사나 학원에서도 이용할 수 있나요?",
    answer:
      "학생 상담 및 지도에 활용 가능한 구조로 설계되어 있습니다. 여러 학생의 성적 데이터를 체계적으로 관리하고 비교 분석하는 기능은 향후 상담 전용 기능 확장을 통해 더욱 편리하게 이용할 수 있도록 개선될 예정입니다.",
  },
];

function FaqItem({
  item,
  isOpen,
  onToggle,
}: {
  item: (typeof faqItems)[0];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
        aria-expanded={isOpen}
      >
        <span className="text-[15px] font-bold text-slate-950 sm:text-base">
          {item.question}
        </span>

        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition ${
            isOpen
              ? "border-blue-200 bg-blue-700 text-white"
              : "border-slate-200 bg-slate-100 text-slate-600"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            className={`h-4 w-4 transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </button>

      <div
        className={`transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden`}
      >
        <div className="border-t border-slate-100 px-6 pb-6 pt-5">
          <p className="text-sm leading-8 text-slate-600 sm:text-[15px]">
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FaqSection() {
  const [openId, setOpenId] = useState<string | null>("faq-01");

  const handleToggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      id="faq"
      className="border-y border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.07),_transparent_28%),linear-gradient(to_bottom,_#f8fbff,_#ffffff_60%)]"
    >
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">

          {/* 좌측 설명 */}
          <div className="max-w-xl">
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-800">
              FAQ
            </span>

            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              자주 묻는 질문
            </h2>

            <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">
              수시KOK 서비스 이용 전 자주 문의하시는 내용을 모아 정리했습니다.
            </p>

            <div className="mt-8 rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.07)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Customer Support
              </p>

              <h3 className="mt-3 text-xl font-bold text-slate-950">
                추가 문의사항이 있으신가요?
              </h3>

              <p className="mt-4 text-sm leading-7 text-slate-600">
                원하시는 답변을 찾지 못하셨다면 고객센터로 문의해 주세요.
                담당자가 빠르게 안내해드립니다.
              </p>

              <div className="mt-5 space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">이메일</span>{" "}
                  help@susikok.kr
                </p>
                <p>
                  <span className="font-semibold">전화</span>{" "}
                  02-1234-5678
                </p>
                <p>
                  <span className="font-semibold">운영시간</span>{" "}
                  평일 09:00 - 18:00
                </p>
              </div>

              <a
                href="/support"
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-slate-950 via-blue-900 to-blue-700 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(30,64,175,0.16)] transition hover:translate-y-[-1px]"
              >
                고객센터 바로가기
              </a>
            </div>
          </div>

          {/* 우측 아코디언 */}
          <div className="flex flex-col gap-4">
            {faqItems.map((item) => (
              <FaqItem
                key={item.id}
                item={item}
                isOpen={openId === item.id}
                onToggle={() => handleToggle(item.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
