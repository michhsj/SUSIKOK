import Link from "next/link";

export default function StudentRecordsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              내신성적 입력
            </div>
            <h1 className="mt-3 text-2xl font-extrabold text-slate-950">
              내신 성적 입력
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              엑셀 업로드와 직접 입력 중 하나를 선택하여 내신 성적을 등록합니다.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Link
            href="/student/records/excel"
            className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <h2 className="text-lg font-extrabold text-slate-950">
              엑셀 업로드
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              지정된 템플릿으로 내신 성적을 업로드하는 방식입니다.
            </p>
          </Link>

          <Link
            href="/student/records/manual"
            className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <h2 className="text-lg font-extrabold text-slate-950">
              직접 입력
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              학년학기, 교과, 이수구분, 과목명, 학점, 원점수, 평균, 표준편차,
              성취도, 등급을 직접 입력합니다.
            </p>
          </Link>
        </div>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          내신 성적은 <span className="font-bold">엑셀 업로드</span>와{" "}
          <span className="font-bold">직접 입력</span> 중{" "}
          <span className="font-bold">하나만 선택</span>하도록 설계하며,
          선택 후에는 다른 입력 방식은 잠금 처리되도록 구현할 예정입니다.
        </div>
      </section>
    </div>
  );
}
