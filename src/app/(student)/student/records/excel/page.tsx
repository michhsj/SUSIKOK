"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

type GradeRow = {
  id: string;
  academicTerm: string;
  subjectGroup: string;
  completionType: string;
  subjectName: string;
  credits: string;
  rawScore: string;
  averageScore: string;
  standardDeviation: string;
  achievement: string;
  grade: string;
};

type SavedGradeRow = Partial<GradeRow>;

const TEMPLATE_HEADERS = [
  "학년학기",
  "교과",
  "이수구분",
  "과목명",
  "학점(단위수)",
  "원점수",
  "평균",
  "표준편차",
  "성취도",
  "등급",
] as const;

const HEADER_ROW_INDEX = 3;
const DATA_START_ROW_INDEX = 4;
const REDIRECT_DELAY_MS = 3000;

export default function StudentRecordsExcelPage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoadingSavedRows, setIsLoadingSavedRows] = useState(true);
  const [lockedInputMethod, setLockedInputMethod] = useState<
    "EXCEL" | "MANUAL" | null
  >(null);

  const isUploadLocked = isConfirmed || isLoadingSavedRows;

  useEffect(() => {
    let isMounted = true;

    async function loadSavedRows() {
      try {
        setIsLoadingSavedRows(true);
        setUploadError(null);

        const response = await fetch("/api/student-records/excel", {
          method: "GET",
          cache: "no-store",
        });

        const result = await response.json().catch(() => null);

        if (!response.ok || !result?.success) {
          throw new Error(
            result?.message || "기존 엑셀 업로드 성적을 불러오지 못했습니다."
          );
        }

        if (!isMounted) return;

        if (result.exists) {
          const inputMethod = result.inputMethod ?? null;
          const confirmed = !!result.isConfirmed;

          setLockedInputMethod(inputMethod);
          setIsConfirmed(confirmed);

          if (inputMethod === "EXCEL" && Array.isArray(result.rows)) {
            setRows(
              result.rows.map((row: SavedGradeRow, index: number) => ({
                id: String(row.id ?? index + 1),
                academicTerm: String(row.academicTerm ?? ""),
                subjectGroup: String(row.subjectGroup ?? ""),
                completionType: String(row.completionType ?? ""),
                subjectName: String(row.subjectName ?? ""),
                credits: String(row.credits ?? ""),
                rawScore: String(row.rawScore ?? ""),
                averageScore: String(row.averageScore ?? ""),
                standardDeviation: String(row.standardDeviation ?? ""),
                achievement: String(row.achievement ?? ""),
                grade: String(row.grade ?? ""),
              }))
            );
          } else {
            setRows([]);
          }
        } else {
          setRows([]);
        }
      } catch (error) {
        if (!isMounted) return;

        const message =
          error instanceof Error
            ? error.message
            : "기존 엑셀 업로드 성적을 불러오는 중 오류가 발생했습니다.";

        setUploadError(message);
      } finally {
        if (isMounted) {
          setIsLoadingSavedRows(false);
        }
      }
    }

    loadSavedRows();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (isUploadLocked) return;

    const selected = e.currentTarget.files?.[0] ?? null;
    setFile(selected);
    setUploadError(null);
    setSaveMessage(null);
    setRows([]);
  }

  async function handleUpload() {
    if (!file || isUploading || isUploadLocked) return;

    setIsUploading(true);
    setUploadError(null);
    setSaveMessage(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        throw new Error("첫 번째 시트를 찾을 수 없습니다.");
      }

      const worksheet = workbook.Sheets[firstSheetName];

      const sheetRows = XLSX.utils.sheet_to_json<(string | number | null)[]>(
        worksheet,
        { header: 1, defval: "" }
      );

      if (sheetRows.length <= HEADER_ROW_INDEX) {
        throw new Error("엑셀 파일에서 4행 헤더를 찾을 수 없습니다.");
      }

      const headerRow = (sheetRows[HEADER_ROW_INDEX] ?? []).map((value) =>
        String(value ?? "").trim()
      );

      const missingHeaders = TEMPLATE_HEADERS.filter(
        (header) => !headerRow.includes(header)
      );

      if (missingHeaders.length > 0) {
        throw new Error(
          `템플릿 필수 항목이 누락되었습니다: ${missingHeaders.join(", ")}`
        );
      }

      const headerIndexMap = Object.fromEntries(
        headerRow.map((header, index) => [header, index])
      ) as Record<string, number>;

      const parsedRows: GradeRow[] = sheetRows
        .slice(DATA_START_ROW_INDEX)
        .map((row, index) => {
          const getValue = (header: (typeof TEMPLATE_HEADERS)[number]) => {
            const cellIndex = headerIndexMap[header];
            return String(row?.[cellIndex] ?? "").trim();
          };

          return {
            id: `${index + 1}`,
            academicTerm: getValue("학년학기"),
            subjectGroup: getValue("교과"),
            completionType: getValue("이수구분"),
            subjectName: getValue("과목명"),
            credits: getValue("학점(단위수)"),
            rawScore: getValue("원점수"),
            averageScore: getValue("평균"),
            standardDeviation: getValue("표준편차"),
            achievement: getValue("성취도"),
            grade: getValue("등급"),
          };
        })
        .filter(
          (row) =>
            row.academicTerm ||
            row.subjectGroup ||
            row.completionType ||
            row.subjectName ||
            row.credits ||
            row.rawScore ||
            row.averageScore ||
            row.standardDeviation ||
            row.achievement ||
            row.grade
        );

      if (!parsedRows.length) {
        throw new Error("업로드된 파일에 표시할 성적 데이터가 없습니다.");
      }

      setRows(parsedRows);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "엑셀 파일을 읽는 중 오류가 발생했습니다.";
      setUploadError(message);
      setRows([]);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleConfirm() {
    if (!rows.length || isSaving || isConfirmed) return;

    setIsSaving(true);
    setUploadError(null);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/student-records/excel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file?.name ?? "",
          rows: rows.map((row) => ({
            academicTerm: row.academicTerm,
            subjectGroup: row.subjectGroup,
            completionType: row.completionType,
            subjectName: row.subjectName,
            credits: row.credits,
            rawScore: row.rawScore,
            averageScore: row.averageScore,
            standardDeviation: row.standardDeviation,
            achievement: row.achievement,
            grade: row.grade,
          })),
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "성적 저장에 실패했습니다.");
      }

      setIsConfirmed(true);
      setLockedInputMethod("EXCEL");
      setUploadError("");
      setSaveMessage("성적이 저장되었습니다.");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      window.setTimeout(() => {
        router.push("/dashboard");
      }, REDIRECT_DELAY_MS);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "성적 저장 중 오류가 발생했습니다.";
      setUploadError(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex items-center gap-3">
          <Link
            href="/student/records"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
          >
            ← 뒤로
          </Link>

          <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            내신성적 입력 · 엑셀 업로드
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <div className="flex min-w-max items-center gap-4 whitespace-nowrap">
            <h1 className="text-2xl font-extrabold text-slate-950">
              엑셀 파일로 내신 성적 업로드
            </h1>

            <p className="text-sm leading-6 text-slate-600">
              지정된 템플릿에 성적을 입력한 뒤 파일을 업로드하세요. 성적 확인
              후에는 대학별 성적 환산이 시작되므로, 성적 수정을 할 수 없습니다.
            </p>
          </div>
        </div>

        {isConfirmed && lockedInputMethod === "EXCEL" && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            성적 확인이 완료되었습니다. 이후에는 성적 수정이 불가능한 상태로
            처리됩니다.
          </div>
        )}
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="overflow-x-auto">
          <div className="flex min-w-max items-center gap-4 whitespace-nowrap">
            <h2 className="text-lg font-extrabold text-slate-950">
              1단계 · 템플릿 다운로드
            </h2>

            <p className="text-sm leading-6 text-slate-600">
              아래 버튼으로 성적 입력용 엑셀 템플릿을 다운로드하세요.
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="flex min-w-max items-center gap-4 whitespace-nowrap rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <a
              href="/api/student-record-template"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
            >
              📥 성적 입력 템플릿 다운로드
            </a>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">
                템플릿 필수 항목
              </span>

              {TEMPLATE_HEADERS.map((item) => (
                <span
                  key={item}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          현재 템플릿 기준: <span className="font-bold">4행은 헤더</span>,
          <span className="font-bold"> 5행부터 성적 데이터</span>를 입력합니다.
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="overflow-x-auto">
          <div className="flex min-w-max items-center gap-4 whitespace-nowrap">
            <h2 className="text-lg font-extrabold text-slate-950">
              2단계 · 파일 업로드
            </h2>

            <p className="text-sm leading-6 text-slate-600">
              작성한 엑셀 파일을 선택한 뒤 업로드 버튼을 눌러주세요.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <label className="block flex-1">
              <span className="sr-only">파일 선택</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                disabled={isUploadLocked}
                onChange={handleFileChange}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </label>

            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || isUploading || isUploadLocked}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_100%)] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isUploading ? "업로드 중..." : "📤 업로드"}
            </button>
          </div>

          {file && !isConfirmed && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              선택된 파일: <span className="font-bold">{file.name}</span>
            </div>
          )}

          {isConfirmed && lockedInputMethod === "EXCEL" && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              이미 저장된 내신 성적이 있어 엑셀 재업로드는 불가능합니다.
            </div>
          )}

          {isConfirmed && lockedInputMethod === "MANUAL" && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              이미 직접입력으로 최종 확정된 내신 성적이 있어 엑셀 업로드를
              사용할 수 없습니다.
            </div>
          )}

          {uploadError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {uploadError}
            </div>
          )}

          {!!rows.length && !uploadError && !isConfirmed && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              ✅ 파일이 업로드되었습니다. 아래에서 입력 성적을 확인해 주세요.
            </div>
          )}
        </div>
      </section>

      {!!rows.length && (
        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">
                3단계 · 입력 성적 확인
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {isConfirmed && lockedInputMethod === "EXCEL"
                  ? `이전에 저장한 성적 ${rows.length}건입니다.`
                  : `업로드한 성적 ${rows.length}건을 확인한 뒤 성적 확인 버튼을 눌러주세요.`}
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-[1320px] w-full border-collapse text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-700">
                  <th className="border-b border-slate-200 px-4 py-3 font-bold">
                    학년학기
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 font-bold">
                    교과
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 font-bold">
                    이수구분
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 font-bold">
                    과목명
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 font-bold">
                    학점
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 font-bold">
                    원점수
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 font-bold">
                    평균
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 font-bold">
                    표준편차
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 font-bold">
                    성취도
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 font-bold">
                    등급
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="odd:bg-white even:bg-slate-50/60">
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-700">
                      {row.academicTerm || "-"}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-700">
                      {row.subjectGroup || "-"}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-700">
                      {row.completionType || "-"}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-900">
                      {row.subjectName || "-"}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-700">
                      {row.credits || "-"}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-700">
                      {row.rawScore || "-"}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-700">
                      {row.averageScore || "-"}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-700">
                      {row.standardDeviation || "-"}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-700">
                      {row.achievement || "-"}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-700">
                      {row.grade || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {saveMessage && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                {saveMessage}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-h-[24px] text-sm font-semibold text-amber-700">
                성적 확인 후에는 대학별 성적 환산이 시작되므로, 성적 수정을 할 수
                없습니다.
              </div>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={isConfirmed || isSaving || isLoadingSavedRows}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-amber-400 bg-amber-400 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isConfirmed
                  ? "확인 완료"
                  : isSaving
                  ? "저장 중..."
                  : "성적 확인"}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
