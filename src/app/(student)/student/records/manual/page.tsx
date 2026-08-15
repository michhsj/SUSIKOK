"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type GradeRow = {
  id: number;
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

type EditableGradeField = Exclude<keyof GradeRow, "id">;

type SavedGradeRow = Omit<GradeRow, "id">;

type PageMessage = {
  tone: "success" | "error";
  text: string;
};

type SubjectGroupOption = {
  id: string;
  name: string;
};

type CompletionTypeOption = {
  id: string;
  name: string;
};

type SubjectCatalogItem = {
  id: string;
  subjectGroup: string;
  completionType: string;
  subjectName: string;
};

const ACADEMIC_TERMS = [
  "1학년 1학기",
  "1학년 2학기",
  "2학년 1학기",
  "2학년 2학기",
  "3학년 1학기",
  "3학년 2학기",
];

const ACHIEVEMENTS = ["A", "B", "C", "D", "E", "P"];
const REDIRECT_DELAY_MS = 3000;
const INITIAL_ROW_COUNT = 50;

function createEmptyRow(id: number): GradeRow {
  return {
    id,
    academicTerm: "",
    subjectGroup: "",
    completionType: "",
    subjectName: "",
    credits: "",
    rawScore: "",
    averageScore: "",
    standardDeviation: "",
    achievement: "",
    grade: "",
  };
}

function createInitialRows(count: number) {
  return Array.from({ length: count }, (_, index) =>
    createEmptyRow(index + 1)
  );
}

function isFilledRow(row: GradeRow) {
  return (
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
}

export default function StudentRecordsManualPage() {
  const router = useRouter();

  const [rows, setRows] = useState<GradeRow[]>(() =>
    createInitialRows(INITIAL_ROW_COUNT)
  );
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSavedRows, setIsLoadingSavedRows] = useState(true);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [nextId, setNextId] = useState(INITIAL_ROW_COUNT + 1);
  const [pageMessage, setPageMessage] = useState<PageMessage | null>(null);
  const [lockedInputMethod, setLockedInputMethod] = useState<
    "MANUAL" | "EXCEL" | null
  >(null);

  const [subjectGroups, setSubjectGroups] = useState<SubjectGroupOption[]>([]);
  const [completionTypes, setCompletionTypes] = useState<
    CompletionTypeOption[]
  >([]);
  const [subjectCatalog, setSubjectCatalog] = useState<SubjectCatalogItem[]>(
    []
  );

  const filledRows = useMemo(() => rows.filter(isFilledRow), [rows]);

  const hasAnyInput = filledRows.length > 0;
  const isEditingLocked =
    lockedInputMethod === "EXCEL" ||
    isConfirmed ||
    isSubmitting ||
    isLoadingSavedRows ||
    isLoadingOptions;

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        setIsLoadingOptions(true);
        setIsLoadingSavedRows(true);
        setPageMessage(null);

        const [optionsResponse, savedResponse] = await Promise.all([
          fetch("/api/student-records/options", {
            method: "GET",
            cache: "no-store",
          }),
          fetch("/api/student-records/manual", {
            method: "GET",
            cache: "no-store",
          }),
        ]);

        const optionsResult = await optionsResponse.json().catch(() => null);
        const savedResult = await savedResponse.json().catch(() => null);

        if (!isMounted) return;

        if (optionsResponse.ok && optionsResult?.success) {
          setSubjectGroups(
            Array.isArray(optionsResult.subjectGroups)
              ? optionsResult.subjectGroups
              : []
          );
          setCompletionTypes(
            Array.isArray(optionsResult.completionTypes)
              ? optionsResult.completionTypes
              : []
          );
          setSubjectCatalog(
            Array.isArray(optionsResult.subjectCatalog)
              ? optionsResult.subjectCatalog
              : []
          );
        } else {
          setPageMessage({
            tone: "error",
            text:
              optionsResult?.message ||
              "직접입력 옵션 정보를 불러오지 못했습니다.",
          });
        }

        if (savedResponse.ok && savedResult?.success && savedResult.exists) {
          setLockedInputMethod(savedResult.inputMethod ?? null);
          setIsConfirmed(Boolean(savedResult.isConfirmed));

          if (Array.isArray(savedResult.rows) && savedResult.rows.length > 0) {
            setRows(
              savedResult.rows.map((row: SavedGradeRow, index: number) => ({
                id: index + 1,
                academicTerm: row.academicTerm ?? "",
                subjectGroup: row.subjectGroup ?? "",
                completionType: row.completionType ?? "",
                subjectName: row.subjectName ?? "",
                credits: String(row.credits ?? ""),
                rawScore: String(row.rawScore ?? ""),
                averageScore: String(row.averageScore ?? ""),
                standardDeviation: String(row.standardDeviation ?? ""),
                achievement: row.achievement ?? "",
                grade: String(row.grade ?? ""),
              }))
            );
            setNextId(savedResult.rows.length + 1);
          }
        } else if (!savedResponse.ok && savedResult?.message) {
          setPageMessage({
            tone: "error",
            text: savedResult.message,
          });
        }
      } catch (error) {
        if (!isMounted) return;

        setPageMessage({
          tone: "error",
          text:
            error instanceof Error
              ? error.message
              : "직접입력 페이지 정보를 불러오는 중 오류가 발생했습니다.",
        });
      } finally {
        if (isMounted) {
          setIsLoadingOptions(false);
          setIsLoadingSavedRows(false);
        }
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  function getAvailableSubjectNames(row: GradeRow) {
    if (!row.subjectGroup || !row.completionType) {
      return [];
    }

    const names = subjectCatalog
      .filter(
        (item) =>
          item.subjectGroup === row.subjectGroup &&
          item.completionType === row.completionType
      )
      .map((item) => item.subjectName);

    return Array.from(new Set(names));
  }

  function handleChange(id: number, field: EditableGradeField, value: string) {
    if (isEditingLocked) return;

    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;

        if (field === "subjectGroup") {
          return {
            ...row,
            subjectGroup: value,
            subjectName: "",
          };
        }

        if (field === "completionType") {
          return {
            ...row,
            completionType: value,
            subjectName: "",
          };
        }

        return { ...row, [field]: value };
      })
    );

    setPageMessage((prev) => (prev?.tone === "error" ? null : prev));
  }

  function handleAddRow() {
    if (isEditingLocked) return;
    setRows((prev) => [...prev, createEmptyRow(nextId)]);
    setNextId((prev) => prev + 1);
  }

  function handleDeleteRow(id: number) {
    if (isEditingLocked || rows.length === 1) return;
    setRows((prev) => prev.filter((row) => row.id !== id));
  }

  function validateRows(targetRows: GradeRow[]) {
    if (targetRows.length === 0) {
      return "최소 1개 이상의 성적 행을 입력해 주세요.";
    }

    for (let index = 0; index < targetRows.length; index += 1) {
      const row = targetRows[index];

      if (!row.academicTerm) {
        return `${index + 1}번째 입력 행의 학년학기를 선택해 주세요.`;
      }
      if (!row.subjectGroup) {
        return `${index + 1}번째 입력 행의 교과를 선택해 주세요.`;
      }
      if (!row.completionType) {
        return `${index + 1}번째 입력 행의 이수구분을 선택해 주세요.`;
      }
      if (!row.subjectName.trim()) {
        return `${index + 1}번째 입력 행의 과목명을 입력해 주세요.`;
      }
      if (!row.credits.trim()) {
        return `${index + 1}번째 입력 행의 학점을 입력해 주세요.`;
      }
      if (!row.achievement) {
        return `${index + 1}번째 입력 행의 성취도를 선택해 주세요.`;
      }
    }

    return null;
  }

  async function handleConfirm() {
    if (isEditingLocked) return;

    const validationMessage = validateRows(filledRows);

    if (validationMessage) {
      setPageMessage({
        tone: "error",
        text: validationMessage,
      });
      return;
    }

    setIsSubmitting(true);
    setPageMessage(null);

    try {
      const response = await fetch("/api/student-records/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rows: filledRows.map((row) => ({
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

      if (!response.ok) {
        throw new Error(
          result?.message || "직접 입력 성적 저장 중 오류가 발생했습니다."
        );
      }

      setIsConfirmed(true);
      setLockedInputMethod("MANUAL");
      setPageMessage({
        tone: "success",
        text: "성적이 저장되었습니다.",
      });

      window.setTimeout(() => {
        router.push("/dashboard");
      }, REDIRECT_DELAY_MS);
    } catch (error) {
      setPageMessage({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "직접 입력 성적 저장 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSubmitting(false);
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
            내신성적 입력 · 직접 입력
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <div className="flex min-w-max items-center gap-4 whitespace-nowrap">
            <h1 className="text-2xl font-extrabold text-slate-950">
              내신 성적 직접 입력
            </h1>

            <p className="text-sm leading-6 text-slate-600">
              학년학기, 교과, 이수구분, 과목명, 학점, 원점수, 평균, 표준편차,
              성취도, 등급을 직접 입력합니다. 성적 확인 후에는 대학별 성적
              환산이 시작되므로, 성적 수정을 할 수 없습니다.
            </p>
          </div>
        </div>

        {pageMessage?.tone === "error" && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {pageMessage.text}
          </div>
        )}

        {lockedInputMethod === "EXCEL" && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            이미 엑셀 업로드로 최종 확정된 내신 성적이 있어 직접 입력을 사용할
            수 없습니다.
          </div>
        )}

        {lockedInputMethod === "MANUAL" && isConfirmed && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            성적 확인이 완료되었습니다. 이후에는 성적 수정이 불가능한 상태로
            처리됩니다.
          </div>
        )}
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm lg:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-950">
            성적 입력 표
          </h2>

          {!isEditingLocked && (
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
            >
              + 행 추가
            </button>
          )}
        </div>

        <div className="mt-4 overflow-x-hidden">
          <table className="w-full table-fixed text-xs">
<colgroup>
  <col className="w-[10.5%]" />
  <col className="w-[10.5%]" />
  <col className="w-[9.5%]" />
  <col className="w-[15%]" />
  <col className="w-[7%]" />
  <col className="w-[7%]" />
  <col className="w-[8%]" />
  <col className="w-[9%]" />
  <col className="w-[7%]" />
  <col className="w-[7%]" />
  <col className="w-[9.5%]" />
</colgroup>

            <thead>
              <tr className="border-b border-slate-200">
                {[
                  "학년학기",
                  "교과",
                  "이수구분",
                  "과목명",
                  "학점",
                  "원점수",
                  "평균",
                  "표준편차",
                  "성취도",
                  "등급",
                  "",
                ].map((col) => (
                  <th
                    key={col}
                    className="whitespace-nowrap px-1.5 py-2 text-left text-[11px] font-bold tracking-tight text-slate-500"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const availableSubjectNames = getAvailableSubjectNames(row);
                const subjectNameDatalistId = `subject-name-options-${row.id}`;

                return (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-1.5 py-2">
                      <select
                        disabled={isEditingLocked}
                        value={row.academicTerm}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                          handleChange(
                            row.id,
                            "academicTerm",
                            e.currentTarget.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 disabled:bg-slate-50 disabled:text-slate-500"
                      >
                        <option value="">선택</option>
                        {ACADEMIC_TERMS.map((term) => (
                          <option key={term} value={term}>
                            {term}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-1.5 py-2">
                      <select
                        disabled={isEditingLocked}
                        value={row.subjectGroup}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                          handleChange(
                            row.id,
                            "subjectGroup",
                            e.currentTarget.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 disabled:bg-slate-50 disabled:text-slate-500"
                      >
                        <option value="">선택</option>
                        {subjectGroups.map((group) => (
                          <option key={group.id} value={group.name}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-1.5 py-2">
                      <select
                        disabled={isEditingLocked}
                        value={row.completionType}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                          handleChange(
                            row.id,
                            "completionType",
                            e.currentTarget.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 disabled:bg-slate-50 disabled:text-slate-500"
                      >
                        <option value="">선택</option>
                        {completionTypes.map((type) => (
                          <option key={type.id} value={type.name}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-1.5 py-2">
                      <input
                        type="text"
                        list={subjectNameDatalistId}
                        disabled={isEditingLocked}
                        value={row.subjectName}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleChange(
                            row.id,
                            "subjectName",
                            e.currentTarget.value
                          )
                        }
                        placeholder={
                          availableSubjectNames.length > 0
                            ? "선택 또는 직접 입력"
                            : "직접 입력"
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                      <datalist id={subjectNameDatalistId}>
                        {availableSubjectNames.map((subjectName) => (
                          <option key={subjectName} value={subjectName} />
                        ))}
                      </datalist>
                    </td>

                    <td className="px-1.5 py-2">
                      <input
                        type="number"
                        disabled={isEditingLocked}
                        value={row.credits}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleChange(row.id, "credits", e.currentTarget.value)
                        }
                        placeholder="3"
                        min={1}
                        max={10}
                        step={0.1}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </td>

                    <td className="px-1.5 py-2">
                      <input
                        type="number"
                        disabled={isEditingLocked}
                        value={row.rawScore}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleChange(
                            row.id,
                            "rawScore",
                            e.currentTarget.value
                          )
                        }
                        placeholder="선택 입력"
                        min={0}
                        max={100}
                        step={0.1}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </td>

                    <td className="px-1.5 py-2">
                      <input
                        type="number"
                        disabled={isEditingLocked}
                        value={row.averageScore}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleChange(
                            row.id,
                            "averageScore",
                            e.currentTarget.value
                          )
                        }
                        placeholder="선택 입력"
                        step={0.1}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </td>

                    <td className="px-1.5 py-2">
                      <input
                        type="number"
                        disabled={isEditingLocked}
                        value={row.standardDeviation}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleChange(
                            row.id,
                            "standardDeviation",
                            e.currentTarget.value
                          )
                        }
                        placeholder="선택 입력"
                        step={0.1}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </td>

                    <td className="px-1.5 py-2">
                      <select
                        disabled={isEditingLocked}
                        value={row.achievement}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                          handleChange(
                            row.id,
                            "achievement",
                            e.currentTarget.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 disabled:bg-slate-50 disabled:text-slate-500"
                      >
                        <option value="">선택</option>
                        {ACHIEVEMENTS.map((achievement) => (
                          <option key={achievement} value={achievement}>
                            {achievement}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-1.5 py-2">
                      <input
                        type="number"
                        disabled={isEditingLocked}
                        value={row.grade}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleChange(row.id, "grade", e.currentTarget.value)
                        }
                        placeholder="선택 입력"
                        min={1}
                        max={9}
                        step={0.1}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </td>

                    <td className="px-1.5 py-2">
                      {!isEditingLocked && rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(row.id)}
                          className="rounded-lg border border-red-100 bg-red-50 px-2 py-1.5 text-[11px] font-bold text-red-500 transition hover:bg-red-100"
                        >
                          삭제
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center">
            {!isEditingLocked && (
              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
              >
                + 행 추가
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            {pageMessage?.tone === "success" && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                {pageMessage.text}
              </div>
            )}

            <div className="min-h-[24px] text-sm font-semibold text-amber-700">
              성적 확인 후에는 대학별 성적 환산이 시작되므로, 성적 수정을 할 수
              없습니다.
            </div>

            {!isConfirmed && lockedInputMethod !== "EXCEL" && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={
                  !hasAnyInput ||
                  isSubmitting ||
                  isLoadingSavedRows ||
                  isLoadingOptions
                }
                className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_100%)] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting ? "저장 중..." : "성적 확인"}
              </button>
            )}

            {isConfirmed && (
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-2 rounded-xl border border-amber-400 bg-amber-400 px-5 py-2.5 text-sm font-bold text-white shadow-sm opacity-70"
              >
                확인 완료
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
