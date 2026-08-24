"use client";

import { useMemo, useState } from "react";

type UploadResponse = {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
};

type RowIssueItem = {
  rowNumber: number;
  reason: string;
};

type UploadCardProps = {
  id: string;
  title: string;
  description: string;
  endpoint: string;
  accept?: string;
  dangerNote?: string;
  extraOptions?: React.ReactNode;
  buildFormData?: (file: File, state: Record<string, boolean>) => FormData;
  toggleState?: Record<string, boolean>;
  setToggleState?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
};

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  return JSON.parse(text) as T;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return "-";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function isRowIssueItem(value: unknown): value is RowIssueItem {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.rowNumber === "number" &&
    Number.isFinite(candidate.rowNumber) &&
    typeof candidate.reason === "string"
  );
}

function isRowIssueArray(value: unknown): value is RowIssueItem[] {
  return Array.isArray(value) && value.every(isRowIssueItem);
}

function IssueRowsView({
  title,
  tone,
  rows,
  description,
}: {
  title: string;
  tone: "blue" | "amber" | "rose";
  rows: RowIssueItem[];
  description: string;
}) {
  const toneClass =
    tone === "blue"
      ? {
          wrapper: "border-blue-200 bg-blue-50",
          title: "text-blue-900",
          description: "text-blue-800",
          tableBorder: "border-blue-200",
          tableHeader: "border-blue-100 bg-blue-50 text-blue-900",
        }
      : tone === "amber"
      ? {
          wrapper: "border-amber-200 bg-amber-50",
          title: "text-amber-900",
          description: "text-amber-800",
          tableBorder: "border-amber-200",
          tableHeader: "border-amber-100 bg-amber-50 text-amber-900",
        }
      : {
          wrapper: "border-rose-200 bg-rose-50",
          title: "text-rose-900",
          description: "text-rose-800",
          tableBorder: "border-rose-200",
          tableHeader: "border-rose-100 bg-rose-50 text-rose-900",
        };

  return (
    <div className={`mt-5 rounded-[20px] border p-4 ${toneClass.wrapper}`}>
      <div className={`text-sm font-bold ${toneClass.title}`}>{title}</div>
      <div className={`mt-1 text-sm ${toneClass.description}`}>{description}</div>

      <div
        className={`mt-3 max-h-80 overflow-y-auto rounded-xl border bg-white ${toneClass.tableBorder}`}
      >
        <div
          className={`grid grid-cols-[120px_minmax(0,1fr)] border-b px-4 py-3 text-xs font-semibold ${toneClass.tableHeader}`}
        >
          <div>행 번호</div>
          <div>사유</div>
        </div>

        <div className="divide-y divide-slate-100">
          {rows.map((row) => (
            <div
              key={`${title}-${row.rowNumber}-${row.reason}`}
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
  );
}

function UploadResultView({
  result,
  tone = "success",
}: {
  result: UploadResponse;
  tone?: "success" | "error";
}) {
  if (!result.data) return null;

  const updatedRows = isRowIssueArray(result.data.updatedRows)
    ? result.data.updatedRows
    : [];
  const skippedRows = isRowIssueArray(result.data.skippedRows)
    ? result.data.skippedRows
    : [];
  const failedRows = isRowIssueArray(result.data.failedRows)
    ? result.data.failedRows
    : [];

  const summaryEntries = Object.entries(result.data).filter(
    ([key]) =>
      key !== "updatedRows" &&
      key !== "skippedRows" &&
      key !== "failedRows"
  );

  const wrapperClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50/70"
      : "border-rose-200 bg-rose-50/70";

  const messageClass =
    tone === "success" ? "text-emerald-900" : "text-rose-900";

  return (
    <div className={`mt-4 rounded-2xl border p-4 ${wrapperClass}`}>
      <div className={`text-sm font-bold ${messageClass}`}>{result.message}</div>

      {summaryEntries.length > 0 ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {summaryEntries.map(([key, value]) => (
            <div key={key} className="rounded-xl bg-white px-4 py-3 shadow-sm">
              <div className="text-xs text-slate-500">{key}</div>
              {typeof value === "object" && value !== null ? (
                <pre className="mt-1 whitespace-pre-wrap break-all text-xs text-slate-900">
                  {formatValue(value)}
                </pre>
              ) : (
                <div className="mt-1 break-all text-sm font-semibold text-slate-900">
                  {formatValue(value)}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {updatedRows.length > 0 ? (
        <IssueRowsView
          title="중복 업데이트 상세 내역"
          tone="blue"
          rows={updatedRows}
          description={`총 ${formatNumber(updatedRows.length)}개 행이 엑셀 내부 중복 키로 인해 앞선 행 데이터를 덮어썼습니다.`}
        />
      ) : null}

      {skippedRows.length > 0 ? (
        <IssueRowsView
          title="건너뜀 상세 내역"
          tone="amber"
          rows={skippedRows}
          description={`총 ${formatNumber(skippedRows.length)}개 행이 건너뛰어졌습니다.`}
        />
      ) : null}

      {failedRows.length > 0 ? (
        <IssueRowsView
          title="실패 상세 내역"
          tone="rose"
          rows={failedRows}
          description={`총 ${formatNumber(failedRows.length)}개 행에서 저장 실패가 발생했습니다.`}
        />
      ) : null}
    </div>
  );
}

function UploadCard({
  id,
  title,
  description,
  endpoint,
  accept = ".xlsx,.xls",
  dangerNote,
  extraOptions,
  buildFormData,
  toggleState = {},
}: UploadCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [resultTone, setResultTone] = useState<"success" | "error">("success");
  const [error, setError] = useState("");

  const fileInfo = useMemo(() => {
    if (!file) return null;
    return {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    };
  }, [file]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("업로드할 파일을 선택해 주세요.");
      setResult(null);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);
      setResultTone("success");

      const formData = buildFormData
        ? buildFormData(file, toggleState)
        : new FormData();

      if (!buildFormData) {
        formData.append("file", file);
      }

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const json = await parseJsonResponse<UploadResponse>(response);

      if (!response.ok || !json.success) {
        setError(json.message || "업로드 처리 중 오류가 발생했습니다.");
        setResult(json);
        setResultTone("error");
        return;
      }

      setResult(json);
      setResultTone("success");
      setFile(null);

      const input = document.getElementById(
        `${id}-file`
      ) as HTMLInputElement | null;

      if (input) {
        input.value = "";
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "업로드 처리 중 알 수 없는 오류가 발생했습니다."
      );
      setResult(null);
      setResultTone("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id={id}
      className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm scroll-mt-24"
    >
      <div className="mb-5">
        <h3 className="text-xl font-bold tracking-tight text-slate-900">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label
            htmlFor={`${id}-file`}
            className="mb-2 block text-sm font-semibold text-slate-900"
          >
            업로드 파일
          </label>
          <input
            id={`${id}-file`}
            type="file"
            accept={accept}
            disabled={loading}
            onChange={(event) => {
              const nextFile = event.target.files?.[0] ?? null;
              setFile(nextFile);
              setError("");
              setResult(null);
              setResultTone("success");
            }}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700"
          />
          {fileInfo ? (
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
              선택 파일: <span className="font-semibold">{fileInfo.name}</span>{" "}
              <span className="text-blue-700">({fileInfo.size})</span>
            </div>
          ) : null}
        </div>

        {extraOptions ? extraOptions : null}

        {dangerNote ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            {dangerNote}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading || !file}
          className={`inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-bold shadow-sm transition ${
            loading || !file
              ? "cursor-not-allowed bg-slate-200 text-slate-500"
              : "bg-blue-700 text-white hover:bg-blue-800"
          }`}
        >
          {loading ? "업로드 처리 중..." : "업로드 실행"}
        </button>
      </form>

      {result ? <UploadResultView result={result} tone={resultTone} /> : null}
    </section>
  );
}

export default function AdminUploadCenter() {
  const [toggleState, setToggleState] = useState<Record<string, boolean>>({
    subjectReset: true,
  });

  return (
    <section className="rounded-[30px] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
      <div className="mb-6">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          Upload Center
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          관리자 통합 업로드
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          이 페이지에서 바로 5가지 업로드를 실행할 수 있습니다. 업로드마다
          처리 범위가 다르므로 안내 문구를 확인한 뒤 실행해 주세요.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <UploadCard
          id="upload-admissions-db"
          title="수시 통합DB 업로드"
          description="2027학년도 수시 통합DB를 업로드합니다. 기존 2027 데이터와 연결된 분석/저장 데이터는 먼저 삭제한 뒤 새 파일로 다시 적재합니다."
          endpoint="/api/admin/uploads/admissions-db"
          dangerNote="주의: 현재 2027학년도 AdmissionResult / StudentAdmissionAnalysisResult / StudentSavedRecruitmentUnit 연결 데이터가 먼저 삭제됩니다."
        />

        <UploadCard
          id="upload-hakjong-fit-questions"
          title="학종 적합성 평가 문항 업로드"
          description="학종 적합성 평가 문항 엑셀을 업로드합니다. 업로드된 버전(version)의 기존 문항은 삭제 후 재등록됩니다."
          endpoint="/api/admin/uploads/hakjong-fit-questions"
          dangerNote="주의: 업로드 파일에 포함된 version 기준으로 기존 hakjongFitQuestion 데이터가 교체됩니다."
        />

        <UploadCard
          id="upload-subject-catalog"
          title="교과 · 과목 업로드"
          description="교과 / 이수구분 / 과목명 엑셀을 업로드합니다. reset 옵션을 켜면 catalog 전체를 비우고 다시 반영합니다."
          endpoint="/api/admin/uploads/subject-catalog"
          extraOptions={
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={toggleState.subjectReset ?? true}
                onChange={(event) =>
                  setToggleState((prev) => ({
                    ...prev,
                    subjectReset: event.target.checked,
                  }))
                }
              />
              <span>기존 교과 · 과목 catalog 전체 초기화 후 반영</span>
            </label>
          }
          buildFormData={(file, state) => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("reset", state.subjectReset ? "Y" : "N");
            return formData;
          }}
          toggleState={toggleState}
          setToggleState={setToggleState}
        />

        <UploadCard
          id="upload-students"
          title="학생 DB업로드"
          description="학생 업로드 템플릿 기준으로 email / password / name / schoolCode 등의 정보를 업로드합니다. 기존 이메일이 있으면 학생 계정을 업데이트하고, 없으면 신규 생성합니다."
          endpoint="/api/admin/uploads/students"
          dangerNote="주의: 기존 관리자/상담사/학부모 계정 이메일과 충돌하는 경우 해당 행은 실패 처리됩니다."
        />

        <UploadCard
          id="upload-university-comprehensive-ratios"
          title="대학별 종합전형 비율 업로드"
          description="학종 역량 비율 엑셀을 업로드합니다. 업로드된 비율은 학종 적합성 평가 결과의 역량별 반영 계산에 사용됩니다."
          endpoint="/api/admin/uploads/university-comprehensive-ratios"
          dangerNote="주의: 검증을 모두 통과한 경우에만 현재 2027학년도 학종 역량 비율 데이터가 교체됩니다."
        />
      </div>
    </section>
  );
}
