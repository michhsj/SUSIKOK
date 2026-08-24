"use client";

import { useEffect } from "react";

export default function StrategyPrintActions({
  autoPrint,
}: {
  autoPrint?: boolean;
}) {
  useEffect(() => {
    if (!autoPrint) return;

    const timer = window.setTimeout(() => {
      window.print();
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [autoPrint]);

  return (
    <div className="print:hidden sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1100px] items-center justify-between px-4 py-3">
        <div>
          <div className="text-sm font-bold text-slate-900">나의 입시 전략 PDF 미리보기</div>
          <div className="text-xs text-slate-500">1페이지 대시보드 + 이후 페이지 저장 대학 3개씩</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center rounded-md border border-slate-200 bg-slate-900 px-3 py-1.5 text-sm font-bold text-white shadow-sm"
          >
            PDF로 출력
          </button>
          <button
            type="button"
            onClick={() => window.close()}
            className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 shadow-sm"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
