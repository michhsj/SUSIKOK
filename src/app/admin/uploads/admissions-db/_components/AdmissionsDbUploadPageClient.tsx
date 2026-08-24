"use client";

import { useMemo, useState } from "react";

type UpdatedRowInfo = {
  rowNumber: number;
  reason: string;
};

type SkippedRowInfo = {
  rowNumber: number;
  reason: string;
};

type FailedRowInfo = {
  rowNumber: number;
  reason: string;
};

type UploadResult = {
  success: boolean;
  message: string;
  data?: {
    admissionYear: number;
    sourceFileName: string;
    sheetName: string;
    totalRows: number;
    deletedAdmissionResults: number;
    deletedAnalysisResults: number;
    deletedSavedRecruitmentUnits: number;
    inserted: number;
    updated: number;
    updatedRows?: UpdatedRowInfo[];
    skipped: number;
    skippedRows?: SkippedRowInfo[];
    failed: number;
    failedRows?: FailedRowInfo[];
    currentTotal: number;
  };
};

type Props = {
  admissionYear: number;
  currentCount: number;
};

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("서버 응답(JSON)을 해석할 수 없습니다.");
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export default function AdmissionsDbUploadPageClient({
  admissionYear,
  currentCount,
}: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedFileInfo = useMemo(() => {
    if (!selectedFile) return null;

    return {
      name: selectedFile.name,
      sizeText: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
    };
  }, [selectedFile]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setErrorMessage("업로드할 엑셀 파일을 선택해 주세요.");
      return;
    }

    const confirmed = window.confirm(
      `${admissionYear}학년도 수시 통합DB 기존 데이터를 먼저 삭제한 뒤 새 파일로 다시 업로드합니다. 계속하시겠습니까?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage("");
      setResult(null);

      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/admin/uploads/admissions-db", {
        method: "POST",
        body: formData,
      });

      const json = await parseJsonResponse<UploadResult>(response);

      if (!response.ok || !json.success) {
        throw new Error(json.message || "업로드 중 오류가 발생했습니다.");
      }

      setResult(json);
      setSelectedFile(null);

      const input = document.getElementById(
        "admissions-db-file-input"
      ) as HTMLInputElement | null;

      if (input) {
        input.value = "";
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "업로드 처리 중 알 수 없는 오류가 발생했습니다."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          Upload Flow
        </div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          엑셀 파일 선택 후 즉시 반영
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          현재{" "}
          <span className="font-semibold text-slate-900">
            {formatNumber(currentCount)}건
          </span>
          의 {admissionYear}학년도 데이터가 있습니다. 업로드를 실행하면 기존 데이터를
          삭제하고 새 파일 기준으로 다시 적재합니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-5">
          <label
            htmlFor="admissions-db-file-input"
            className="mb-3 block text-sm font-semibold text-slate-900"
          >
            수시 통합DB 엑셀 파일
          </label>

          <input
            id="admissions-db-file-input"
            type="file"
            accept=".xlsx,.xls"
            disabled={submitting}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setSelectedFile(file);
              setErrorMessage("");
              setResult(null);
            }}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700"
          />

          {selectedFileInfo ? (
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
              선택 파일: <span className="font-semibold">{selectedFileInfo.name}</span>{" "}
              <span className="text-blue-700">({selectedFileInfo.sizeText})</span>
            </div>
          ) : null}
        </div>

        <div className="rounded-[20px] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <div className="font-semibold">주의</div>
          <div className="mt-1">
            업로드 시 현재 {admissionYear}학년도 수시 통합DB와 연결된 분석 결과/저장
            데이터가 먼저 삭제된 뒤 새 파일 기준으로 다시 적재됩니다.
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={submitting || !selectedFile}
            className={`inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-bold shadow-sm transition ${
              submitting || !selectedFile
                ? "cursor-not-allowed bg-slate-200 text-slate-500"
                : "bg-blue-700 text-white hover:bg-blue-800"
            }`}
          >
            {submitting ? "업로드 처리 중..." : "기존 DB 삭제 후 업로드"}
          </button>
        </div>
      </form>

      {result?.data ? (
        <div className="mt-8 rounded-[24px] border border-emerald-200 bg-emerald-50/70 p-5">
          <div className="text-sm font-bold text-emerald-900">{result.message}</div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
              <div className="text-xs text-slate-500">업로드 파일</div>
              <div className="mt-1 break-all text-sm font-semibold text-slate-900">
                {result.data.sourceFileName}
              </div>
            </div>

            <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
              <div className="text-xs text-slate-500">시트명</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {result.data.sheetName}
              </div>
            </div>

            <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
              <div className="text-xs text-slate-500">총 데이터 행</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {formatNumber(result.data.totalRows)}건
              </div>
            </div>

            <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
              <div className="text-xs text-slate-500">삭제된 입결 데이터</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {formatNumber(result.data.deletedAdmissionResults)}건
              </div>
            </div>

            <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
              <div className="text-xs text-slate-500">삭제된 분석 결과</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {formatNumber(result.data.deletedAnalysisResults)}건
              </div>
            </div>

            <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
              <div className="text-xs text-slate-500">삭제된 저장 모집단위</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {formatNumber(result.data.deletedSavedRecruitmentUnits)}건
              </div>
            </div>

            <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
              <div className="text-xs text-slate-500">신규 입력</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {formatNumber(result.data.inserted)}건
              </div>
            </div>

            <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
              <div className="text-xs text-slate-500">업데이트</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {formatNumber(result.data.updated)}건
              </div>
            </div>

            <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
              <div className="text-xs text-slate-500">건너뜀</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {formatNumber(result.data.skipped)}건
              </div>
            </div>

            <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
              <div className="text-xs text-slate-500">실패</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {formatNumber(result.data.failed)}건
              </div>
            </div>

            <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
              <div className="text-xs text-slate-500">현재 최종 DB 건수</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {formatNumber(result.data.currentTotal)}건
              </div>
            </div>
          </div>

          {result.data.updatedRows && result.data.updatedRows.length > 0 ? (
            <div className="mt-5 rounded-[20px] border border-blue-200 bg-blue-50 p-4">
              <div className="text-sm font-bold text-blue-900">
                중복 업데이트 상세 내역
              </div>
              <div className="mt-1 text-sm text-blue-800">
                총 {formatNumber(result.data.updatedRows.length)}개 행이 엑셀 내부 중복 키로
                인해 앞선 행 데이터를 덮어썼습니다.
              </div>

              <div className="mt-3 max-h-80 overflow-y-auto rounded-xl border border-blue-200 bg-white">
                <div className="grid grid-cols-[120px_minmax(0,1fr)] border-b border-blue-100 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-900">
                  <div>행 번호</div>
                  <div>사유</div>
                </div>

                <div className="divide-y divide-slate-100">
                  {result.data.updatedRows.map((row) => (
                    <div
                      key={`updated-${row.rowNumber}-${row.reason}`}
                      className="grid grid-cols-[120px_minmax(0,1fr)] px-4 py-3 text-sm text-slate-700"
                    >
                      <div className="font-semibold text-slate-900">
                        {formatNumber(row.rowNumber)}행
                      </div>
                      <div className="break-words">{row.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {result.data.skippedRows && result.data.skippedRows.length > 0 ? (
            <div className="mt-5 rounded-[20px] border border-amber-200 bg-amber-50 p-4">
              <div className="text-sm font-bold text-amber-900">
                건너뜀 상세 내역
              </div>
              <div className="mt-1 text-sm text-amber-800">
                총 {formatNumber(result.data.skippedRows.length)}개 행이 건너뛰어졌습니다.
              </div>

              <div className="mt-3 max-h-80 overflow-y-auto rounded-xl border border-amber-200 bg-white">
                <div className="grid grid-cols-[120px_minmax(0,1fr)] border-b border-amber-100 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
                  <div>행 번호</div>
                  <div>사유</div>
                </div>

                <div className="divide-y divide-slate-100">
                  {result.data.skippedRows.map((row) => (
                    <div
                      key={`skipped-${row.rowNumber}-${row.reason}`}
                      className="grid grid-cols-[120px_minmax(0,1fr)] px-4 py-3 text-sm text-slate-700"
                    >
                      <div className="font-semibold text-slate-900">
                        {formatNumber(row.rowNumber)}행
                      </div>
                      <div className="break-words">{row.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {result.data.failedRows && result.data.failedRows.length > 0 ? (
            <div className="mt-5 rounded-[20px] border border-rose-200 bg-rose-50 p-4">
              <div className="text-sm font-bold text-rose-900">
                실패 상세 내역
              </div>
              <div className="mt-1 text-sm text-rose-800">
                총 {formatNumber(result.data.failedRows.length)}개 행에서 저장 실패가 발생했습니다.
              </div>

              <div className="mt-3 max-h-80 overflow-y-auto rounded-xl border border-rose-200 bg-white">
                <div className="grid grid-cols-[120px_minmax(0,1fr)] border-b border-rose-100 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-900">
                  <div>행 번호</div>
                  <div>사유</div>
                </div>

                <div className="divide-y divide-slate-100">
                  {result.data.failedRows.map((row) => (
                    <div
                      key={`failed-${row.rowNumber}-${row.reason}`}
                      className="grid grid-cols-[120px_minmax(0,1fr)] px-4 py-3 text-sm text-slate-700"
                    >
                      <div className="font-semibold text-slate-900">
                        {formatNumber(row.rowNumber)}행
                      </div>
                      <div className="break-words">{row.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
