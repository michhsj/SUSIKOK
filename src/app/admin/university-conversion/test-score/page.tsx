"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
  grade: string;
  achievement: string;
  enrolledStudentCount: string;
  achievementARatio: string;
  achievementBRatio: string;
  achievementCRatio: string;
};

type EditableGradeField = Exclude<keyof GradeRow, "id">;

type AttendanceForm = {
  absenceDays: string;
  lateness: string;
  earlyLeave: string;
  outing: string;
};

type SubjectGroupOption = {
  id?: string;
  name: string;
  isActive?: boolean;
};

type CompletionTypeOption = {
  id?: string;
  name: string;
  isActive?: boolean;
};

type RawSubjectCatalogItem = {
  id?: string;
  subjectGroup?: string;
  subjectGroupName?: string;
  completionType?: string;
  completionTypeName?: string;
  subjectName?: string;
};

type SubjectCatalogItem = {
  id?: string;
  subjectGroup: string;
  completionType: string;
  subjectName: string;
};

type OptionsResponse = {
  success: boolean;
  subjectGroups?: SubjectGroupOption[];
  completionTypes?: CompletionTypeOption[];
  subjectCatalog?: RawSubjectCatalogItem[];
  message?: string;
};

type SavedGradeRowResponse = {
  academicTerm?: string;
  subjectGroup?: string;
  completionType?: string;
  subjectName?: string;
  credits?: string;
  rawScore?: string;
  averageScore?: string;
  standardDeviation?: string;
  grade?: string;
  achievement?: string;
  enrolledStudentCount?: string;
  achievementARatio?: string;
  achievementBRatio?: string;
  achievementCRatio?: string;
};

type AttendanceResponse = {
  absenceDays?: string;
  lateness?: string;
  earlyLeave?: string;
  outing?: string;
} | null;

type TestScoreGetResponse = {
  success: boolean;
  testSetId?: string | null;
  testSetName?: string;
  rows?: SavedGradeRowResponse[];
  attendance?: AttendanceResponse;
  message?: string;
};

type TestScoreSaveResponse = {
  success: boolean;
  message?: string;
  testSetId?: string;
  testSetName?: string;
  savedCount?: number;
};

type PageMessage = {
  type: "success" | "error" | "info";
  text: string;
};

const INITIAL_ROW_COUNT = 50;

const ACADEMIC_TERMS = [
  "1학년 1학기",
  "1학년 2학기",
  "2학년 1학기",
  "2학년 2학기",
  "3학년 1학기",
  "3학년 2학기",
] as const;

const ACHIEVEMENTS = ["A", "B", "C", "D", "E", "P"] as const;

function createRowId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createEmptyRow(): GradeRow {
  return {
    id: createRowId(),
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

function createInitialRows(count = INITIAL_ROW_COUNT): GradeRow[] {
  return Array.from({ length: count }, () => createEmptyRow());
}

function ensureMinimumRows(rows: GradeRow[], min = INITIAL_ROW_COUNT) {
  if (rows.length >= min) {
    return rows;
  }

  return [...rows, ...createInitialRows(min - rows.length)];
}

function isFilledRow(row: GradeRow) {
  return (
    row.academicTerm.trim() !== "" ||
    row.subjectGroup.trim() !== "" ||
    row.completionType.trim() !== "" ||
    row.subjectName.trim() !== "" ||
    row.credits.trim() !== "" ||
    row.rawScore.trim() !== "" ||
    row.averageScore.trim() !== "" ||
    row.standardDeviation.trim() !== "" ||
    row.grade.trim() !== "" ||
    row.achievement.trim() !== "" ||
    row.enrolledStudentCount.trim() !== "" ||
    row.achievementARatio.trim() !== "" ||
    row.achievementBRatio.trim() !== "" ||
    row.achievementCRatio.trim() !== ""
  );
}

function dedupeStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalizeSubjectCatalogItems(
  items: RawSubjectCatalogItem[] | undefined
): SubjectCatalogItem[] {
  return (items ?? [])
    .map((item) => ({
      id: item.id,
      subjectGroup: (item.subjectGroup ?? item.subjectGroupName ?? "").trim(),
      completionType: (
        item.completionType ??
        item.completionTypeName ??
        ""
      ).trim(),
      subjectName: (item.subjectName ?? "").trim(),
    }))
    .filter(
      (item) =>
        item.subjectGroup !== "" &&
        item.completionType !== "" &&
        item.subjectName !== ""
    );
}

function getAvailableCompletionTypes(
  subjectGroup: string,
  subjectCatalog: SubjectCatalogItem[]
) {
  if (!subjectGroup) {
    return [];
  }

  return dedupeStrings(
    subjectCatalog
      .filter((item) => item.subjectGroup === subjectGroup)
      .map((item) => item.completionType)
  ).sort((a, b) => a.localeCompare(b, "ko"));
}

function getAvailableSubjectNames(
  subjectGroup: string,
  completionType: string,
  subjectCatalog: SubjectCatalogItem[]
) {
  if (!subjectGroup || !completionType) {
    return [];
  }

  return dedupeStrings(
    subjectCatalog
      .filter(
        (item) =>
          item.subjectGroup === subjectGroup &&
          item.completionType === completionType
      )
      .map((item) => item.subjectName)
  ).sort((a, b) => a.localeCompare(b, "ko"));
}

function normalizeRowsForSave(rows: GradeRow[]) {
  return rows.filter(isFilledRow).map((row) => ({
    academicTerm: row.academicTerm.trim(),
    subjectGroup: row.subjectGroup.trim(),
    completionType: row.completionType.trim(),
    subjectName: row.subjectName.trim(),
    credits: row.credits.trim(),
    rawScore: row.rawScore.trim(),
    averageScore: row.averageScore.trim(),
    standardDeviation: row.standardDeviation.trim(),
    grade: row.grade.trim(),
    achievement: row.achievement.trim(),
    enrolledStudentCount: row.enrolledStudentCount.trim(),
    achievementARatio: row.achievementARatio.trim(),
    achievementBRatio: row.achievementBRatio.trim(),
    achievementCRatio: row.achievementCRatio.trim(),
  }));
}

function validateRows(rows: GradeRow[]) {
  const filledRows = rows.filter(isFilledRow);

  if (filledRows.length === 0) {
    return "저장할 테스트 성적이 없습니다.";
  }

  for (let index = 0; index < filledRows.length; index += 1) {
    const row = filledRows[index];
    const rowNumber = index + 1;

    if (!row.academicTerm.trim()) {
      return `${rowNumber}행: 학년학기를 선택해주세요.`;
    }

    if (!row.subjectGroup.trim()) {
      return `${rowNumber}행: 교과를 선택해주세요.`;
    }

    if (!row.completionType.trim()) {
      return `${rowNumber}행: 이수구분을 선택해주세요.`;
    }

    if (!row.subjectName.trim()) {
      return `${rowNumber}행: 과목명을 선택해주세요.`;
    }

    if (!row.credits.trim()) {
      return `${rowNumber}행: 학점을 입력해주세요.`;
    }

    if (!row.achievement.trim()) {
      return `${rowNumber}행: 성취도를 선택해주세요.`;
    }
  }

  return null;
}

function buildRowsFromSaved(rows: SavedGradeRowResponse[] | undefined) {
  if (!rows || rows.length === 0) {
    return createInitialRows();
  }

  const mapped = rows.map((row) => ({
    id: createRowId(),
    academicTerm: row.academicTerm ?? "",
    subjectGroup: row.subjectGroup ?? "",
    completionType: row.completionType ?? "",
    subjectName: row.subjectName ?? "",
    credits: row.credits ?? "",
    rawScore: row.rawScore ?? "",
    averageScore: row.averageScore ?? "",
    standardDeviation: row.standardDeviation ?? "",
    grade: row.grade ?? "",
    achievement: row.achievement ?? "",
    enrolledStudentCount: row.enrolledStudentCount ?? "",
    achievementARatio: row.achievementARatio ?? "",
    achievementBRatio: row.achievementBRatio ?? "",
    achievementCRatio: row.achievementCRatio ?? "",
  }));

  return ensureMinimumRows(mapped);
}

function messageClassName(type: PageMessage["type"]) {
  switch (type) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "error":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function inputBaseClassName(disabled = false) {
  return [
    "h-9 w-full rounded-lg border px-2.5 text-[12px] text-slate-700 outline-none transition",
    "border-slate-200 bg-white",
    "placeholder:text-slate-400",
    "focus:border-slate-400 focus:ring-2 focus:ring-slate-200",
    disabled ? "cursor-not-allowed bg-slate-100 text-slate-400" : "",
  ].join(" ");
}

function sectionCardClassName() {
  return "rounded-[24px] border border-slate-200 bg-white shadow-sm";
}

export default function UniversityConversionTestScorePage() {
  const [testSetId, setTestSetId] = useState("");
  const [testSetName, setTestSetName] = useState("기본 테스트셋");
  const [rows, setRows] = useState<GradeRow[]>(() => createInitialRows());
  const [includeAttendance, setIncludeAttendance] = useState(false);
  const [attendance, setAttendance] = useState<AttendanceForm>({
    absenceDays: "",
    lateness: "",
    earlyLeave: "",
    outing: "",
  });

  const [subjectGroups, setSubjectGroups] = useState<SubjectGroupOption[]>([]);
  const [completionTypes, setCompletionTypes] = useState<CompletionTypeOption[]>(
    []
  );
  const [subjectCatalog, setSubjectCatalog] = useState<SubjectCatalogItem[]>([]);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingSavedData, setLoadingSavedData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<PageMessage | null>(null);

  const filledRowCount = useMemo(() => rows.filter(isFilledRow).length, [rows]);

  const resolvedSubjectGroups = useMemo(() => {
    if (subjectGroups.length > 0) {
      return dedupeStrings(subjectGroups.map((item) => item.name)).sort((a, b) =>
        a.localeCompare(b, "ko")
      );
    }

    return dedupeStrings(subjectCatalog.map((item) => item.subjectGroup)).sort(
      (a, b) => a.localeCompare(b, "ko")
    );
  }, [subjectCatalog, subjectGroups]);

  const resolvedCompletionTypes = useMemo(() => {
    if (completionTypes.length > 0) {
      return dedupeStrings(completionTypes.map((item) => item.name)).sort(
        (a, b) => a.localeCompare(b, "ko")
      );
    }

    return dedupeStrings(subjectCatalog.map((item) => item.completionType)).sort(
      (a, b) => a.localeCompare(b, "ko")
    );
  }, [completionTypes, subjectCatalog]);

  useEffect(() => {
    let isMounted = true;

    async function loadPageData() {
      setLoadingOptions(true);
      setLoadingSavedData(true);
      setMessage(null);

      try {
        const [optionsResponse, savedResponse] = await Promise.all([
          fetch("/api/student-records/options", {
            method: "GET",
            cache: "no-store",
          }),
          fetch("/api/admin/university-conversion/test-score", {
            method: "GET",
            cache: "no-store",
          }),
        ]);

        const optionsJson = (await optionsResponse.json()) as OptionsResponse;
        const savedJson = (await savedResponse.json()) as TestScoreGetResponse;

        if (!optionsResponse.ok || !optionsJson.success) {
          throw new Error(
            optionsJson.message || "과목 옵션 데이터를 불러오지 못했습니다."
          );
        }

        if (!savedResponse.ok || !savedJson.success) {
          throw new Error(
            savedJson.message || "저장된 테스트 성적 데이터를 불러오지 못했습니다."
          );
        }

        if (!isMounted) {
          return;
        }

        setSubjectGroups(optionsJson.subjectGroups ?? []);
        setCompletionTypes(optionsJson.completionTypes ?? []);
        setSubjectCatalog(normalizeSubjectCatalogItems(optionsJson.subjectCatalog));

        setTestSetId(savedJson.testSetId ?? "");
        setTestSetName(savedJson.testSetName?.trim() || "기본 테스트셋");
        setRows(buildRowsFromSaved(savedJson.rows));

        if (savedJson.attendance) {
          setIncludeAttendance(true);
          setAttendance({
            absenceDays: savedJson.attendance.absenceDays ?? "",
            lateness: savedJson.attendance.lateness ?? "",
            earlyLeave: savedJson.attendance.earlyLeave ?? "",
            outing: savedJson.attendance.outing ?? "",
          });
        } else {
          setIncludeAttendance(false);
          setAttendance({
            absenceDays: "",
            lateness: "",
            earlyLeave: "",
            outing: "",
          });
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setMessage({
          type: "error",
          text:
            error instanceof Error
              ? error.message
              : "페이지 데이터를 불러오는 중 오류가 발생했습니다.",
        });
      } finally {
        if (!isMounted) {
          return;
        }

        setLoadingOptions(false);
        setLoadingSavedData(false);
      }
    }

    loadPageData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (message?.type !== "success") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setMessage((current) => (current?.type === "success" ? null : current));
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [message]);

  const handleRowChange = (
    rowId: string,
    field: EditableGradeField,
    value: string
  ) => {
    setRows((currentRows) =>
      currentRows.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

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

        return {
          ...row,
          [field]: value,
        };
      })
    );
  };

  const handleAttendanceChange = (
    field: keyof AttendanceForm,
    value: string
  ) => {
    setAttendance((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleAddRow = () => {
    setRows((currentRows) => [...currentRows, createEmptyRow()]);
  };

  const handleDeleteRow = (rowId: string) => {
    setRows((currentRows) => {
      const filtered = currentRows.filter((row) => row.id !== rowId);
      return ensureMinimumRows(filtered);
    });
  };

  const handleReset = () => {
    setRows(createInitialRows());
    setIncludeAttendance(false);
    setAttendance({
      absenceDays: "",
      lateness: "",
      earlyLeave: "",
      outing: "",
    });
    setMessage({
      type: "info",
      text: "입력 폼을 50행 기준으로 초기화했습니다.",
    });
  };

  const handleSave = async () => {
    setMessage(null);

    const validationMessage = validateRows(rows);

    if (validationMessage) {
      setMessage({
        type: "error",
        text: validationMessage,
      });
      return;
    }

    const trimmedTestSetName = testSetName.trim() || "기본 테스트셋";
    const normalizedRows = normalizeRowsForSave(rows);

    setSaving(true);

    try {
      const response = await fetch("/api/admin/university-conversion/test-score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testSetId: testSetId || undefined,
          testSetName: trimmedTestSetName,
          rows: normalizedRows,
          attendance: includeAttendance ? attendance : null,
        }),
      });

      const json = (await response.json()) as TestScoreSaveResponse;

      if (!response.ok || !json.success) {
        throw new Error(json.message || "테스트 성적 저장에 실패했습니다.");
      }

      setTestSetId(json.testSetId ?? "");
      setTestSetName(json.testSetName ?? trimmedTestSetName);
      setMessage({
        type: "success",
        text: "테스트 성적이 저장되었습니다",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "테스트 성적 저장 중 오류가 발생했습니다.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-3 py-4 md:px-5">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <header className={sectionCardClassName()}>
          <div className="flex flex-col gap-4 px-4 py-4 md:px-5 md:py-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <Link
                href="/admin/university-conversion"
                className="inline-flex items-center text-sm font-medium text-slate-500 transition hover:text-slate-700"
              >
                ← 대학별 환산규칙 설정으로 돌아가기
              </Link>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
                  테스트용 성적 직접 입력
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  저장된 테스트 성적은 대학별 환산규칙 검증에 사용할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <div className="text-[11px] font-medium text-slate-500">
                  전체 행 수
                </div>
                <div className="mt-1 text-base font-semibold text-slate-900">
                  {rows.length}행
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <div className="text-[11px] font-medium text-slate-500">
                  입력된 행 수
                </div>
                <div className="mt-1 text-base font-semibold text-slate-900">
                  {filledRowCount}행
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <div className="text-[11px] font-medium text-slate-500">
                  저장 상태
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-900">
                  {testSetId ? "기존 테스트셋 수정 모드" : "신규 테스트셋 생성 모드"}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <div className="text-[11px] font-medium text-slate-500">
                  옵션 로딩
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-900">
                  {loadingOptions || loadingSavedData ? "불러오는 중" : "준비 완료"}
                </div>
              </div>
            </div>
          </div>
        </header>

        {message && message.type !== "success" ? (
          <div
            className={`rounded-xl border px-3 py-2.5 text-sm font-medium ${messageClassName(
              message.type
            )}`}
          >
            {message.text}
          </div>
        ) : null}

        <section className={sectionCardClassName()}>
          <div className="border-b border-slate-200 px-4 py-4 md:px-5">
            <h2 className="text-base font-semibold text-slate-900 md:text-lg">
              테스트셋 기본 정보
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              저장된 테스트셋 ID를 기반으로 기존 데이터를 수정하거나 새 테스트셋을 생성합니다.
            </p>
          </div>

          <div className="grid gap-4 px-4 py-4 md:px-5 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                테스트셋 이름
              </label>
              <input
                value={testSetName}
                onChange={(event) => setTestSetName(event.target.value)}
                placeholder="예: 2026 수시 검증용 테스트셋"
                className={inputBaseClassName()}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                저장된 테스트셋 ID
              </label>
              <input
                value={testSetId}
                readOnly
                placeholder="저장 후 자동 생성"
                className={inputBaseClassName(true)}
              />
            </div>
          </div>
        </section>

        <section className={sectionCardClassName()}>
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 md:px-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 md:text-lg">
                성적 입력 표
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                학생 성적 직접 입력과 동일한 항목 구조로 테스트 성적을 입력합니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                행 추가
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                50행 초기화
              </button>
            </div>
          </div>

          <div className="px-4 py-4 md:px-5">
            <div className="space-y-3 xl:hidden">
              {rows.map((row, index) => {
                const availableCompletionTypes = row.subjectGroup
                  ? getAvailableCompletionTypes(row.subjectGroup, subjectCatalog)
                  : resolvedCompletionTypes;

                const availableSubjectNames = getAvailableSubjectNames(
                  row.subjectGroup,
                  row.completionType,
                  subjectCatalog
                );

                const completionDisabled = !row.subjectGroup;
                const subjectDisabled = !row.subjectGroup || !row.completionType;

                return (
                  <div
                    key={row.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-500">
                        {index + 1}행
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(row.id)}
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                      >
                        삭제
                      </button>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">
                          학년학기
                        </label>
                        <select
                          value={row.academicTerm}
                          onChange={(event) =>
                            handleRowChange(
                              row.id,
                              "academicTerm",
                              event.target.value
                            )
                          }
                          className={inputBaseClassName()}
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
                          value={row.subjectGroup}
                          onChange={(event) =>
                            handleRowChange(
                              row.id,
                              "subjectGroup",
                              event.target.value
                            )
                          }
                          className={inputBaseClassName()}
                        >
                          <option value="">선택</option>
                          {resolvedSubjectGroups.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">
                          이수구분
                        </label>
                        <select
                          value={row.completionType}
                          onChange={(event) =>
                            handleRowChange(
                              row.id,
                              "completionType",
                              event.target.value
                            )
                          }
                          disabled={completionDisabled}
                          className={inputBaseClassName(completionDisabled)}
                        >
                          <option value="">선택</option>
                          {availableCompletionTypes.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[11px] font-bold text-slate-500">
                          과목명
                        </label>
                        <select
                          value={row.subjectName}
                          onChange={(event) =>
                            handleRowChange(
                              row.id,
                              "subjectName",
                              event.target.value
                            )
                          }
                          disabled={subjectDisabled}
                          className={inputBaseClassName(subjectDisabled)}
                        >
                          <option value="">
                            {subjectDisabled ? "교과/이수구분 선택" : "선택"}
                          </option>
                          {availableSubjectNames.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">
                          학점
                        </label>
                        <input
                          value={row.credits}
                          onChange={(event) =>
                            handleRowChange(row.id, "credits", event.target.value)
                          }
                          inputMode="decimal"
                          placeholder="학점"
                          className={inputBaseClassName()}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">
                          원점수
                        </label>
                        <input
                          value={row.rawScore}
                          onChange={(event) =>
                            handleRowChange(row.id, "rawScore", event.target.value)
                          }
                          inputMode="decimal"
                          placeholder="원점수"
                          className={inputBaseClassName()}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">
                          평균
                        </label>
                        <input
                          value={row.averageScore}
                          onChange={(event) =>
                            handleRowChange(
                              row.id,
                              "averageScore",
                              event.target.value
                            )
                          }
                          inputMode="decimal"
                          placeholder="평균"
                          className={inputBaseClassName()}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">
                          표준편차
                        </label>
                        <input
                          value={row.standardDeviation}
                          onChange={(event) =>
                            handleRowChange(
                              row.id,
                              "standardDeviation",
                              event.target.value
                            )
                          }
                          inputMode="decimal"
                          placeholder="표준편차"
                          className={inputBaseClassName()}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">
                          등급
                        </label>
                        <input
                          value={row.grade}
                          onChange={(event) =>
                            handleRowChange(row.id, "grade", event.target.value)
                          }
                          inputMode="decimal"
                          placeholder="등급"
                          className={inputBaseClassName()}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">
                          성취도
                        </label>
                        <select
                          value={row.achievement}
                          onChange={(event) =>
                            handleRowChange(
                              row.id,
                              "achievement",
                              event.target.value
                            )
                          }
                          className={inputBaseClassName()}
                        >
                          <option value="">선택</option>
                          {ACHIEVEMENTS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">
                          재적수
                        </label>
                        <input
                          value={row.enrolledStudentCount}
                          onChange={(event) =>
                            handleRowChange(
                              row.id,
                              "enrolledStudentCount",
                              event.target.value
                            )
                          }
                          inputMode="numeric"
                          placeholder="재적수"
                          className={inputBaseClassName()}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">
                          A비율
                        </label>
                        <input
                          value={row.achievementARatio}
                          onChange={(event) =>
                            handleRowChange(
                              row.id,
                              "achievementARatio",
                              event.target.value
                            )
                          }
                          inputMode="decimal"
                          placeholder="A비율"
                          className={inputBaseClassName()}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">
                          B비율
                        </label>
                        <input
                          value={row.achievementBRatio}
                          onChange={(event) =>
                            handleRowChange(
                              row.id,
                              "achievementBRatio",
                              event.target.value
                            )
                          }
                          inputMode="decimal"
                          placeholder="B비율"
                          className={inputBaseClassName()}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">
                          C비율
                        </label>
                        <input
                          value={row.achievementCRatio}
                          onChange={(event) =>
                            handleRowChange(
                              row.id,
                              "achievementCRatio",
                              event.target.value
                            )
                          }
                          inputMode="decimal"
                          placeholder="C비율"
                          className={inputBaseClassName()}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden xl:block">
              <table className="w-full table-fixed border-collapse text-[11px] leading-4">
                <colgroup>
                  <col className="w-[7%]" />
                  <col className="w-[7%]" />
                  <col className="w-[8%]" />
                  <col className="w-[13%]" />
                  <col className="w-[5%]" />
                  <col className="w-[6%]" />
                  <col className="w-[6%]" />
                  <col className="w-[7%]" />
                  <col className="w-[5%]" />
                  <col className="w-[5%]" />
                  <col className="w-[7%]" />
                  <col className="w-[6%]" />
                  <col className="w-[6%]" />
                  <col className="w-[6%]" />
                  <col className="w-[6%]" />
                </colgroup>

                <thead className="bg-slate-50">
                  <tr className="text-left font-semibold text-slate-700">
                    <th className="border-b border-slate-200 px-1.5 py-2">
                      학년학기
                    </th>
                    <th className="border-b border-slate-200 px-1.5 py-2">교과</th>
                    <th className="border-b border-slate-200 px-1.5 py-2">
                      이수구분
                    </th>
                    <th className="border-b border-slate-200 px-1.5 py-2">
                      과목명
                    </th>
                    <th className="border-b border-slate-200 px-1.5 py-2">학점</th>
                    <th className="border-b border-slate-200 px-1.5 py-2">
                      원점수
                    </th>
                    <th className="border-b border-slate-200 px-1.5 py-2">평균</th>
                    <th className="border-b border-slate-200 px-1.5 py-2">
                      표준편차
                    </th>
                    <th className="border-b border-slate-200 px-1.5 py-2">등급</th>
                    <th className="border-b border-slate-200 px-1.5 py-2">
                      성취도
                    </th>
                    <th className="border-b border-slate-200 px-1.5 py-2">
                      재적수
                    </th>
                    <th className="border-b border-slate-200 px-1.5 py-2">
                      A비율
                    </th>
                    <th className="border-b border-slate-200 px-1.5 py-2">
                      B비율
                    </th>
                    <th className="border-b border-slate-200 px-1.5 py-2">
                      C비율
                    </th>
                    <th className="border-b border-slate-200 px-1.5 py-2">관리</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row) => {
                    const availableCompletionTypes = row.subjectGroup
                      ? getAvailableCompletionTypes(row.subjectGroup, subjectCatalog)
                      : resolvedCompletionTypes;

                    const availableSubjectNames = getAvailableSubjectNames(
                      row.subjectGroup,
                      row.completionType,
                      subjectCatalog
                    );

                    const completionDisabled = !row.subjectGroup;
                    const subjectDisabled =
                      !row.subjectGroup || !row.completionType;

                    return (
                      <tr
                        key={row.id}
                        className="align-top odd:bg-white even:bg-slate-50/60"
                      >
                        <td className="border-b border-slate-100 px-1.5 py-1.5">
                          <select
                            value={row.academicTerm}
                            onChange={(event) =>
                              handleRowChange(
                                row.id,
                                "academicTerm",
                                event.target.value
                              )
                            }
                            className={inputBaseClassName()}
                          >
                            <option value="">선택</option>
                            {ACADEMIC_TERMS.map((term) => (
                              <option key={term} value={term}>
                                {term}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="border-b border-slate-100 px-1.5 py-1.5">
                          <select
                            value={row.subjectGroup}
                            onChange={(event) =>
                              handleRowChange(
                                row.id,
                                "subjectGroup",
                                event.target.value
                              )
                            }
                            className={inputBaseClassName()}
                          >
                            <option value="">선택</option>
                            {resolvedSubjectGroups.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="border-b border-slate-100 px-1.5 py-1.5">
                          <select
                            value={row.completionType}
                            onChange={(event) =>
                              handleRowChange(
                                row.id,
                                "completionType",
                                event.target.value
                              )
                            }
                            disabled={completionDisabled}
                            className={inputBaseClassName(completionDisabled)}
                          >
                            <option value="">선택</option>
                            {availableCompletionTypes.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="border-b border-slate-100 px-1.5 py-1.5">
                          <select
                            value={row.subjectName}
                            onChange={(event) =>
                              handleRowChange(
                                row.id,
                                "subjectName",
                                event.target.value
                              )
                            }
                            disabled={subjectDisabled}
                            className={inputBaseClassName(subjectDisabled)}
                          >
                            <option value="">
                              {subjectDisabled ? "교과/이수구분 선택" : "선택"}
                            </option>
                            {availableSubjectNames.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="border-b border-slate-100 px-1.5 py-1.5">
                          <input
                            value={row.credits}
                            onChange={(event) =>
                              handleRowChange(
                                row.id,
                                "credits",
                                event.target.value
                              )
                            }
                            inputMode="decimal"
                            placeholder="학점"
                            className={inputBaseClassName()}
                          />
                        </td>

                        <td className="border-b border-slate-100 px-1.5 py-1.5">
                          <input
                            value={row.rawScore}
                            onChange={(event) =>
                              handleRowChange(
                                row.id,
                                "rawScore",
                                event.target.value
                              )
                            }
                            inputMode="decimal"
                            placeholder="원점수"
                            className={inputBaseClassName()}
                          />
                        </td>

                        <td className="border-b border-slate-100 px-1.5 py-1.5">
                          <input
                            value={row.averageScore}
                            onChange={(event) =>
                              handleRowChange(
                                row.id,
                                "averageScore",
                                event.target.value
                              )
                            }
                            inputMode="decimal"
                            placeholder="평균"
                            className={inputBaseClassName()}
                          />
                        </td>

                        <td className="border-b border-slate-100 px-1.5 py-1.5">
                          <input
                            value={row.standardDeviation}
                            onChange={(event) =>
                              handleRowChange(
                                row.id,
                                "standardDeviation",
                                event.target.value
                              )
                            }
                            inputMode="decimal"
                            placeholder="표준편차"
                            className={inputBaseClassName()}
                          />
                        </td>

                        <td className="border-b border-slate-100 px-1.5 py-1.5">
                          <input
                            value={row.grade}
                            onChange={(event) =>
                              handleRowChange(
                                row.id,
                                "grade",
                                event.target.value
                              )
                            }
                            inputMode="decimal"
                            placeholder="등급"
                            className={inputBaseClassName()}
                          />
                        </td>

                        <td className="border-b border-slate-100 px-1.5 py-1.5">
                          <select
                            value={row.achievement}
                            onChange={(event) =>
                              handleRowChange(
                                row.id,
                                "achievement",
                                event.target.value
                              )
                            }
                            className={inputBaseClassName()}
                          >
                            <option value="">선택</option>
                            {ACHIEVEMENTS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="border-b border-slate-100 px-1.5 py-1.5">
                          <input
                            value={row.enrolledStudentCount}
                            onChange={(event) =>
                              handleRowChange(
                                row.id,
                                "enrolledStudentCount",
                                event.target.value
                              )
                            }
                            inputMode="numeric"
                            placeholder="재적수"
                            className={inputBaseClassName()}
                          />
                        </td>

                        <td className="border-b border-slate-100 px-1.5 py-1.5">
                          <input
                            value={row.achievementARatio}
                            onChange={(event) =>
                              handleRowChange(
                                row.id,
                                "achievementARatio",
                                event.target.value
                              )
                            }
                            inputMode="decimal"
                            placeholder="A비율"
                            className={inputBaseClassName()}
                          />
                        </td>

                        <td className="border-b border-slate-100 px-1.5 py-1.5">
                          <input
                            value={row.achievementBRatio}
                            onChange={(event) =>
                              handleRowChange(
                                row.id,
                                "achievementBRatio",
                                event.target.value
                              )
                            }
                            inputMode="decimal"
                            placeholder="B비율"
                            className={inputBaseClassName()}
                          />
                        </td>

                        <td className="border-b border-slate-100 px-1.5 py-1.5">
                          <input
                            value={row.achievementCRatio}
                            onChange={(event) =>
                              handleRowChange(
                                row.id,
                                "achievementCRatio",
                                event.target.value
                              )
                            }
                            inputMode="decimal"
                            placeholder="C비율"
                            className={inputBaseClassName()}
                          />
                        </td>

                        <td className="border-b border-slate-100 px-1.5 py-1.5">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(row.id)}
                            className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-2 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-100"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                행 추가
              </button>
            </div>
          </div>
        </section>

        <section className={sectionCardClassName()}>
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 md:px-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900 md:text-lg">
                출결 정보
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                미인정만 입력하세요.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={includeAttendance}
              onClick={() => setIncludeAttendance((prev) => !prev)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                includeAttendance ? "bg-slate-900" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                  includeAttendance ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="grid gap-3 px-4 py-4 md:px-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                결석
              </label>
              <input
                value={attendance.absenceDays}
                onChange={(event) =>
                  handleAttendanceChange("absenceDays", event.target.value)
                }
                inputMode="decimal"
                placeholder="예: 0"
                disabled={!includeAttendance}
                className={inputBaseClassName(!includeAttendance)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">지각</label>
              <input
                value={attendance.lateness}
                onChange={(event) =>
                  handleAttendanceChange("lateness", event.target.value)
                }
                inputMode="decimal"
                placeholder="예: 0"
                disabled={!includeAttendance}
                className={inputBaseClassName(!includeAttendance)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">조퇴</label>
              <input
                value={attendance.earlyLeave}
                onChange={(event) =>
                  handleAttendanceChange("earlyLeave", event.target.value)
                }
                inputMode="decimal"
                placeholder="예: 0"
                disabled={!includeAttendance}
                className={inputBaseClassName(!includeAttendance)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">결과</label>
              <input
                value={attendance.outing}
                onChange={(event) =>
                  handleAttendanceChange("outing", event.target.value)
                }
                inputMode="decimal"
                placeholder="예: 0"
                disabled={!includeAttendance}
                className={inputBaseClassName(!includeAttendance)}
              />
            </div>
          </div>
        </section>

        <div className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              입력 초기화
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loadingOptions || loadingSavedData}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {saving ? "저장 중..." : "테스트 성적 저장"}
            </button>
          </div>

          {message?.type === "success" ? (
            <div className="text-sm font-medium text-emerald-600 sm:text-right">
              {message.text}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
