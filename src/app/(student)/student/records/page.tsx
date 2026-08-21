"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AttendanceFieldKey = "absence" | "lateness" | "earlyLeave" | "outing";

type AttendanceValues = Record<AttendanceFieldKey, string>;

type AttendanceApiResponse = {
  success: boolean;
  exists?: boolean;
  attendance?: {
    id?: string;
    includeAttendance: boolean;
    absence: string;
    lateness: string;
    earlyLeave: string;
    outing: string;
  };
  message?: string;
};

type PageMessage = {
  tone: "success" | "error";
  text: string;
} | null;

const initialAttendanceValues: AttendanceValues = {
  absence: "",
  lateness: "",
  earlyLeave: "",
  outing: "",
};

const attendanceFields: {
  key: AttendanceFieldKey;
  label: string;
  placeholder: string;
}[] = [
  { key: "absence", label: "결석", placeholder: "0" },
  { key: "lateness", label: "지각", placeholder: "0" },
  { key: "earlyLeave", label: "조퇴", placeholder: "0" },
  { key: "outing", label: "결과", placeholder: "0" },
];

export default function StudentRecordsPage() {
  const [includeAttendance, setIncludeAttendance] = useState(false);
  const [attendanceValues, setAttendanceValues] = useState<AttendanceValues>(
    initialAttendanceValues
  );
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(true);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [pageMessage, setPageMessage] = useState<PageMessage>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAttendance() {
      try {
        setIsLoadingAttendance(true);

        const response = await fetch("/api/student-records/attendance", {
          method: "GET",
          cache: "no-store",
        });

        const result =
          ((await response.json().catch(() => null)) as AttendanceApiResponse | null);

        if (!isMounted) return;

        if (!response.ok || !result?.success) {
          setPageMessage({
            tone: "error",
            text: result?.message || "출결 정보를 불러오지 못했습니다.",
          });
          return;
        }

        setIncludeAttendance(Boolean(result.attendance?.includeAttendance));
        setAttendanceValues({
          absence: result.attendance?.absence ?? "",
          lateness: result.attendance?.lateness ?? "",
          earlyLeave: result.attendance?.earlyLeave ?? "",
          outing: result.attendance?.outing ?? "",
        });
      } catch (error) {
        if (!isMounted) return;

        setPageMessage({
          tone: "error",
          text:
            error instanceof Error
              ? error.message
              : "출결 정보를 불러오는 중 오류가 발생했습니다.",
        });
      } finally {
        if (isMounted) {
          setIsLoadingAttendance(false);
        }
      }
    }

    loadAttendance();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleChangeAttendanceValue(
    key: AttendanceFieldKey,
    value: string
  ) {
    const sanitizedValue = value.replace(/[^\d]/g, "");

    setAttendanceValues((prev) => ({
      ...prev,
      [key]: sanitizedValue,
    }));

    setPageMessage((prev) => (prev?.tone === "error" ? null : prev));
  }

  async function handleSaveAttendance() {
    try {
      setIsSavingAttendance(true);
      setPageMessage(null);

      const response = await fetch("/api/student-records/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          includeAttendance,
          absence: attendanceValues.absence,
          lateness: attendanceValues.lateness,
          earlyLeave: attendanceValues.earlyLeave,
          outing: attendanceValues.outing,
        }),
      });

      const result =
        ((await response.json().catch(() => null)) as AttendanceApiResponse | null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "출결 정보 저장 중 오류가 발생했습니다.");
      }

      setIncludeAttendance(Boolean(result.attendance?.includeAttendance));
      setAttendanceValues({
        absence: result.attendance?.absence ?? "",
        lateness: result.attendance?.lateness ?? "",
        earlyLeave: result.attendance?.earlyLeave ?? "",
        outing: result.attendance?.outing ?? "",
      });

      setPageMessage({
        tone: "success",
        text: "저장되었습니다.",
      });
    } catch (error) {
      setPageMessage({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "출결 정보 저장 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSavingAttendance(false);
    }
  }

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

        <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-950">
                출결 정보
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                미인정만 입력하세요
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={includeAttendance}
              aria-label="출결 정보 포함"
              onClick={() => setIncludeAttendance((prev) => !prev)}
              disabled={isLoadingAttendance || isSavingAttendance}
              className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition ${
                includeAttendance ? "bg-slate-900" : "bg-slate-300"
              } ${
                isLoadingAttendance || isSavingAttendance
                  ? "cursor-not-allowed opacity-60"
                  : ""
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition ${
                  includeAttendance ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {attendanceFields.map((field) => (
              <label key={field.key} className="block">
                <div className="mb-2 text-sm font-semibold text-slate-700">
                  {field.label}
                </div>
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={attendanceValues[field.key]}
                  onChange={(event) =>
                    handleChangeAttendanceValue(field.key, event.target.value)
                  }
                  placeholder={field.placeholder}
                  disabled={
                    !includeAttendance || isLoadingAttendance || isSavingAttendance
                  }
                  className={`h-12 w-full rounded-full border bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 ${
                    !includeAttendance || isLoadingAttendance || isSavingAttendance
                      ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                      : "border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                  }`}
                />
              </label>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-500">
              {isLoadingAttendance
                ? "출결 정보를 불러오는 중입니다."
                : "저장 버튼을 누르면 출결 정보가 DB에 저장됩니다."}
            </div>

            <button
              type="button"
              onClick={handleSaveAttendance}
              disabled={isLoadingAttendance || isSavingAttendance}
              className={`inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-bold text-white transition ${
                isLoadingAttendance || isSavingAttendance
                  ? "cursor-not-allowed bg-slate-300"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSavingAttendance ? "저장 중..." : "저장"}
            </button>
          </div>

          {pageMessage ? (
            <div
              className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                pageMessage.tone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {pageMessage.text}
            </div>
          ) : null}
        </section>
      </section>
    </div>
  );
}
