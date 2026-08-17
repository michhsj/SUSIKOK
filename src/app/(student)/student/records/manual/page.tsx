//src\app\(student)\student\records\manual\page.tsx
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
  grade: string;
  achievement: string;
  enrolledStudentCount: string;
  achievementARatio: string;
  achievementBRatio: string;
  achievementCRatio: string;
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

type ManualGetResponse = {
  success: boolean;
  exists?: boolean;
  isConfirmed?: boolean;
  inputMethod?: "MANUAL" | "EXCEL" | null;
  rows?: SavedGradeRow[];
  message?: string;
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
    grade: "",
    achievement: "",
    enrolledStudentCount: "",
    achievementARatio: "",
    achievementBRatio: "",
    achievementCRatio: "",
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
    row.grade ||
    row.achievement ||
    row.enrolledStudentCount ||
    row.achievementARatio ||
    row.achievementBRatio ||
    row.achievementCRatio
  );
}

function dedupeStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function getAvailableCompletionTypesBySubjectGroup(
  subjectGroup: string,
  completionTypes: CompletionTypeOption[],
  subjectCatalog: SubjectCatalogItem[]
) {
  if (!subjectGroup) {
    return completionTypes.map((item) => item.name);
  }

  const names = subjectCatalog
    .filter((item) => item.subjectGroup === subjectGroup)
    .map((item) => item.completionType);

  return dedupeStrings(names);
}

function buildRowsFromSaved(savedRows: SavedGradeRow[]) {
  return savedRows.map((row, index) => ({
    id: index + 1,
    academicTerm: row.academicTerm ?? "",
    subjectGroup: row.subjectGroup ?? "",
    completionType: row.completionType ?? "",
    subjectName: row.subjectName ?? "",
    credits: String(row.credits ?? ""),
    rawScore: String(row.rawScore ?? ""),
    averageScore: String(row.averageScore ?? ""),
    standardDeviation: String(row.standardDeviation ?? ""),
    grade: String(row.grade ?? ""),
    achievement: row.achievement ?? "",
    enrolledStudentCount: String(row.enrolledStudentCount ?? ""),
    achievementARatio: String(row.achievementARatio ?? ""),
    achievementBRatio: String(row.achievementBRatio ?? ""),
    achievementCRatio: String(row.achievementCRatio ?? ""),
  }));
}

function compactInputClassName(disabled = false) {
  return [
    "w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[12px] text-slate-800 placeholder:text-slate-400",
    disabled ? "disabled:bg-slate-50 disabled:text-slate-500" : "",
  ].join(" ");
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
        const savedResult =
          ((await savedResponse.json().catch(() => null)) as ManualGetResponse | null);

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
          const inputMethod = savedResult.inputMethod ?? null;

          setLockedInputMethod(inputMethod);
          setIsConfirmed(Boolean(savedResult.isConfirmed));

          if (
            inputMethod === "MANUAL" &&
            Array.isArray(savedResult.rows) &&
            savedResult.rows.length > 0
          ) {
            const mappedRows = buildRowsFromSaved(savedResult.rows);
            setRows(mappedRows);
            setNextId(mappedRows.length + 1);
          } else {
            setRows(createInitialRows(INITIAL_ROW_COUNT));
            setNextId(INITIAL_ROW_COUNT + 1);
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
            completionType: "",
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
            grade: row.grade,
            achievement: row.achievement,
            enrolledStudentCount: row.enrolledStudentCount,
            achievementARatio: row.achievementARatio,
            achievementBRatio: row.achievementBRatio,
            achievementCRatio: row.achievementCRatio,
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
      setRows((prev) => prev.filter(isFilledRow));

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
    <div className="space-y-5">
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm lg:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/student/records"
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-100"
            >
              ← 뒤로
            </Link>

            <div className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
              내신성적 입력 · 직접 입력
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-950 lg:text-2xl">
            내신 성적 직접 입력
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            학년학기, 교과, 이수구분, 과목명, 학점, 원점수, 평균, 표준편차,
            등급, 성취도, 재적수, A비율, B비율, C비율을 직접 입력합니다.
            성적 확인 후에는 대학별 성적 환산이 시작되므로, 성적 수정을 할 수
            없습니다.
          </p>
        </div>

        {pageMessage?.tone === "error" && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">
            {pageMessage.text}
          </div>
        )}

        {lockedInputMethod === "EXCEL" && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-800">
            이미 엑셀 업로드로 최종 확정된 내신 성적이 있어 직접 입력을 사용할
            수 없습니다.
          </div>
        )}

        {lockedInputMethod === "MANUAL" && isConfirmed && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-800">
            성적 확인이 완료되었습니다. 이후에는 성적 수정이 불가능한 상태로
            처리됩니다.
          </div>
        )}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-extrabold text-slate-950 lg:text-lg">
            성적 입력 표
          </h2>

          {!isEditingLocked && (
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex w-fit items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[11px] font-bold text-blue-700 transition hover:bg-blue-100"
            >
              + 행 추가
            </button>
          )}
        </div>

        <div className="mt-3 xl:hidden">
          <div className="space-y-3">
            {rows.map((row, index) => {
              const availableCompletionTypes =
                getAvailableCompletionTypesBySubjectGroup(
                  row.subjectGroup,
                  completionTypes,
                  subjectCatalog
                );
              const availableSubjectNames = getAvailableSubjectNames(row);
              const subjectNameDatalistId = `subject-name-options-${row.id}`;

              return (
                <div
                  key={row.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-500">
                      {index + 1}행
                    </div>

                    {!isEditingLocked && rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(row.id)}
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-red-100 bg-red-50 px-2.5 text-xs font-bold text-red-500 transition hover:bg-red-100"
                      >
                        삭제
                      </button>
                    )}
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">
                        학년학기
                      </label>
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
                        className={compactInputClassName(isEditingLocked)}
                      >
                        <option value="">선택</option>
                        {ACADEMIC_TERMS.map((term) => (
                          <option key={term} value={term}>
                            {term}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">
                        교과
                      </label>
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
                        className={compactInputClassName(isEditingLocked)}
                      >
                        <option value="">선택</option>
                        {subjectGroups.map((group) => (
                          <option key={group.id} value={group.name}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">
                        이수구분
                      </label>
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
                        className={compactInputClassName(isEditingLocked)}
                      >
                        <option value="">선택</option>
                        {availableCompletionTypes.map((typeName) => (
                          <option key={typeName} value={typeName}>
                            {typeName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-500">
                        과목명
                      </label>
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
                            ? "선택/직접입력"
                            : "직접 입력"
                        }
                        className={compactInputClassName(isEditingLocked)}
                      />
                      <datalist id={subjectNameDatalistId}>
                        {availableSubjectNames.map((subjectName) => (
                          <option key={subjectName} value={subjectName} />
                        ))}
                      </datalist>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">
                        학점
                      </label>
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
                        className={compactInputClassName(isEditingLocked)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">
                        원점수
                      </label>
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
                        placeholder="선택"
                        min={0}
                        max={100}
                        step={0.1}
                        className={compactInputClassName(isEditingLocked)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">
                        평균
                      </label>
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
                        placeholder="선택"
                        step={0.1}
                        className={compactInputClassName(isEditingLocked)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">
                        표준편차
                      </label>
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
                        placeholder="선택"
                        step={0.1}
                        className={compactInputClassName(isEditingLocked)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">
                        등급
                      </label>
                      <input
                        type="number"
                        disabled={isEditingLocked}
                        value={row.grade}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleChange(row.id, "grade", e.currentTarget.value)
                        }
                        placeholder="선택"
                        min={1}
                        max={9}
                        step={0.1}
                        className={compactInputClassName(isEditingLocked)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">
                        성취도
                      </label>
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
                        className={compactInputClassName(isEditingLocked)}
                      >
                        <option value="">선택</option>
                        {ACHIEVEMENTS.map((achievement) => (
                          <option key={achievement} value={achievement}>
                            {achievement}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">
                        재적수
                      </label>
                      <input
                        type="number"
                        disabled={isEditingLocked}
                        value={row.enrolledStudentCount}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleChange(
                            row.id,
                            "enrolledStudentCount",
                            e.currentTarget.value
                          )
                        }
                        placeholder="선택"
                        min={0}
                        step={1}
                        className={compactInputClassName(isEditingLocked)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">
                        A비율
                      </label>
                      <input
                        type="number"
                        disabled={isEditingLocked}
                        value={row.achievementARatio}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleChange(
                            row.id,
                            "achievementARatio",
                            e.currentTarget.value
                          )
                        }
                        placeholder="선택"
                        min={0}
                        max={100}
                        step={0.1}
                        className={compactInputClassName(isEditingLocked)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">
                        B비율
                      </label>
                      <input
                        type="number"
                        disabled={isEditingLocked}
                        value={row.achievementBRatio}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleChange(
                            row.id,
                            "achievementBRatio",
                            e.currentTarget.value
                          )
                        }
                        placeholder="선택"
                        min={0}
                        max={100}
                        step={0.1}
                        className={compactInputClassName(isEditingLocked)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">
                        C비율
                      </label>
                      <input
                        type="number"
                        disabled={isEditingLocked}
                        value={row.achievementCRatio}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleChange(
                            row.id,
                            "achievementCRatio",
                            e.currentTarget.value
                          )
                        }
                        placeholder="선택"
                        min={0}
                        max={100}
                        step={0.1}
                        className={compactInputClassName(isEditingLocked)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 hidden rounded-2xl border border-slate-200 xl:block">
          <table className="w-full table-fixed text-[10px] leading-tight lg:text-[11px]">
            <colgroup>
              <col className="w-[8%]" />
              <col className="w-[8%]" />
              <col className="w-[8%]" />
              <col className="w-[13%]" />
              <col className="w-[5.5%]" />
              <col className="w-[5.5%]" />
              <col className="w-[6.5%]" />
              <col className="w-[7%]" />
              <col className="w-[5.5%]" />
              <col className="w-[5.5%]" />
              <col className="w-[6.5%]" />
              <col className="w-[5.5%]" />
              <col className="w-[5.5%]" />
              <col className="w-[5.5%]" />
              <col className="w-[5%]" />
            </colgroup>

            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {[
                  "학년학기",
                  "교과",
                  "이수구분",
                  "과목명",
                  "학점",
                  "원점수",
                  "평균",
                  "표준편차",
                  "등급",
                  "성취도",
                  "재적수",
                  "A비율",
                  "B비율",
                  "C비율",
                  "",
                ].map((col, index) => (
                  <th
                    key={`${col}-${index}`}
                    className="whitespace-nowrap px-1 py-2 text-left text-[10px] font-bold tracking-tight text-slate-500"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const availableCompletionTypes =
                  getAvailableCompletionTypesBySubjectGroup(
                    row.subjectGroup,
                    completionTypes,
                    subjectCatalog
                  );
                const availableSubjectNames = getAvailableSubjectNames(row);
                const subjectNameDatalistId = `subject-name-options-${row.id}`;

                return (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-1 py-1.5 align-top">
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
                        className="w-full rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[10px] text-slate-800 disabled:bg-slate-50 disabled:text-slate-500"
                      >
                        <option value="">선택</option>
                        {ACADEMIC_TERMS.map((term) => (
                          <option key={term} value={term}>
                            {term}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-1 py-1.5 align-top">
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
                        className="w-full rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[10px] text-slate-800 disabled:bg-slate-50 disabled:text-slate-500"
                      >
                        <option value="">선택</option>
                        {subjectGroups.map((group) => (
                          <option key={group.id} value={group.name}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-1 py-1.5 align-top">
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
                        className="w-full rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[10px] text-slate-800 disabled:bg-slate-50 disabled:text-slate-500"
                      >
                        <option value="">선택</option>
                        {availableCompletionTypes.map((typeName) => (
                          <option key={typeName} value={typeName}>
                            {typeName}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-1 py-1.5 align-top">
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
                            ? "선택/직접입력"
                            : "직접 입력"
                        }
                        className="w-full rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[10px] text-slate-800 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                      <datalist id={subjectNameDatalistId}>
                        {availableSubjectNames.map((subjectName) => (
                          <option key={subjectName} value={subjectName} />
                        ))}
                      </datalist>
                    </td>

                    <td className="px-1 py-1.5 align-top">
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
                        className="w-full rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[10px] text-slate-800 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </td>

                    <td className="px-1 py-1.5 align-top">
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
                        placeholder="선택"
                        min={0}
                        max={100}
                        step={0.1}
                        className="w-full rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[10px] text-slate-800 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </td>

                    <td className="px-1 py-1.5 align-top">
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
                        placeholder="선택"
                        step={0.1}
                        className="w-full rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[10px] text-slate-800 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </td>

                    <td className="px-1 py-1.5 align-top">
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
                        placeholder="선택"
                        step={0.1}
                        className="w-full rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[10px] text-slate-800 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </td>

                    <td className="px-1 py-1.5 align-top">
                      <input
                        type="number"
                        disabled={isEditingLocked}
                        value={row.grade}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleChange(row.id, "grade", e.currentTarget.value)
                        }
                        placeholder="선택"
                        min={1}
                        max={9}
                        step={0.1}
                        className="w-full rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[10px] text-slate-800 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </td>

                    <td className="px-1 py-1.5 align-top">
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
                        className="w-full rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[10px] text-slate-800 disabled:bg-slate-50 disabled:text-slate-500"
                      >
                        <option value="">선택</option>
                        {ACHIEVEMENTS.map((achievement) => (
                          <option key={achievement} value={achievement}>
                            {achievement}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-1 py-1.5 align-top">
                      <input
                        type="number"
                        disabled={isEditingLocked}
                        value={row.enrolledStudentCount}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleChange(
                            row.id,
                            "enrolledStudentCount",
                            e.currentTarget.value
                          )
                        }
                        placeholder="선택"
                        min={0}
                        step={1}
                        className="w-full rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[10px] text-slate-800 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </td>

                    <td className="px-1 py-1.5 align-top">
                      <input
                        type="number"
                        disabled={isEditingLocked}
                        value={row.achievementARatio}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleChange(
                            row.id,
                            "achievementARatio",
                            e.currentTarget.value
                          )
                        }
                        placeholder="선택"
                        min={0}
                        max={100}
                        step={0.1}
                        className="w-full rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[10px] text-slate-800 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </td>

                    <td className="px-1 py-1.5 align-top">
                      <input
                        type="number"
                        disabled={isEditingLocked}
                        value={row.achievementBRatio}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleChange(
                            row.id,
                            "achievementBRatio",
                            e.currentTarget.value
                          )
                        }
                        placeholder="선택"
                        min={0}
                        max={100}
                        step={0.1}
                        className="w-full rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[10px] text-slate-800 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </td>

                    <td className="px-1 py-1.5 align-top">
                      <input
                        type="number"
                        disabled={isEditingLocked}
                        value={row.achievementCRatio}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleChange(
                            row.id,
                            "achievementCRatio",
                            e.currentTarget.value
                          )
                        }
                        placeholder="선택"
                        min={0}
                        max={100}
                        step={0.1}
                        className="w-full rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[10px] text-slate-800 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </td>

                    <td className="px-1 py-1.5 align-top">
                      {!isEditingLocked && rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(row.id)}
                          className="w-full rounded-md border border-red-100 bg-red-50 px-1.5 py-1 text-[10px] font-bold text-red-500 transition hover:bg-red-100"
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

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center">
            {!isEditingLocked && (
              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[11px] font-bold text-blue-700 transition hover:bg-blue-100"
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
