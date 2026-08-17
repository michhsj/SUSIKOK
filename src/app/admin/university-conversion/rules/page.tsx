"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type RuleStatus = "active" | "inactive" | "draft" | "review_requested";

type RuleHistoryItem = {
  id: string;
  region: string;
  university: string;
  admissionType: string;
  admissionName: string;
  track: string;
  status: RuleStatus;
  versionLabel: string;
  updatedAt: string;
};

type RuleHistoryApiRow = {
  ruleId: string;
  ruleGroupKey: string;
  version: number;
  previousRuleId: string | null;
  region: string;
  university: string;
  admissionType: string;
  admissionName: string;
  track: string;
  collegeName: string;
  recruitmentUnit: string;
  mode: "create" | "edit";
  action: "draft" | "review" | "activate";
  status: "draft" | "review_requested" | "active" | "inactive";
  isActive: boolean;
  linkedTestSetId: string | null;
  linkedTestSetName: string | null;
  linkedTestRowCount: number;
  attendanceIncluded: boolean;
  calculatedFinalScore: number | null;
  createdAt: string;
  updatedAt: string;
  activatedAt: string | null;
};

type RuleHistoryApiResponse = {
  success: boolean;
  message?: string;
  data?: {
    total: number;
    rows: RuleHistoryApiRow[];
  };
};

async function fetchJsonSafely<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") ?? "";
  const rawText = await response.text();
  const trimmed = rawText.trim();

  const looksLikeJson =
    contentType.includes("application/json") ||
    trimmed.startsWith("{") ||
    trimmed.startsWith("[");

  if (!looksLikeJson) {
    const preview = trimmed.slice(0, 180).replace(/\s+/g, " ");
    throw new Error(
      `서버가 JSON 대신 HTML/텍스트를 반환했습니다. (status: ${response.status}) ${preview}`
    );
  }

  let data: T;

  try {
    data = JSON.parse(rawText) as T;
  } catch {
    throw new Error(`JSON 파싱에 실패했습니다. (status: ${response.status})`);
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message?: unknown }).message === "string"
        ? (data as { message: string }).message
        : `요청에 실패했습니다. (status: ${response.status})`;

    throw new Error(message);
  }

  return data;
}

function formatDateTime(value: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function mapApiRowToHistoryItem(row: RuleHistoryApiRow): RuleHistoryItem {
  return {
    id: row.ruleId,
    region: row.region,
    university: row.university,
    admissionType: row.admissionType,
    admissionName: row.admissionName,
    track: row.track,
    status: row.status,
    versionLabel: `v${row.version}`,
    updatedAt: formatDateTime(row.updatedAt),
  };
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-5 md:px-6">
      <div className="mx-auto max-w-[1600px] space-y-5">{children}</div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  right,
  children,
}: {
  title: string;
  description?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-[18px] font-semibold tracking-tight text-slate-900">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
        {right ? <div>{right}</div> : null}
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

function ActionChip({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "blue" | "emerald" | "amber" | "rose";
}) {
  const toneClass =
    tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : tone === "rose"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${toneClass}`}
    >
      {children}
    </span>
  );
}

function TextField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-11 w-full rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
    />
  );
}

export default function RuleHistoryPage() {
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | RuleStatus>("all");
  const [historyRows, setHistoryRows] = useState<RuleHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadRuleHistory() {
      setLoading(true);
      setErrorMessage("");

      try {
        const json = await fetchJsonSafely<RuleHistoryApiResponse>(
          "/api/admin/university-conversion",
          {
            method: "GET",
          }
        );

        if (!json.success) {
          throw new Error(json.message || "전체 규칙 이력을 불러오지 못했습니다.");
        }

        if (!mounted) return;

        const rows = (json.data?.rows ?? []).map(mapApiRowToHistoryItem);
        setHistoryRows(rows);
      } catch (error) {
        if (!mounted) return;

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "전체 규칙 이력을 불러오지 못했습니다."
        );
        setHistoryRows([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    loadRuleHistory();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredHistory = useMemo(() => {
    return historyRows.filter((row) => {
      const normalizedKeyword = keyword.trim();

      const matchesKeyword =
        !normalizedKeyword ||
        row.university.includes(normalizedKeyword) ||
        row.admissionType.includes(normalizedKeyword) ||
        row.admissionName.includes(normalizedKeyword) ||
        row.track.includes(normalizedKeyword);

      const matchesStatus =
        statusFilter === "all" ? true : row.status === statusFilter;

      return matchesKeyword && matchesStatus;
    });
  }, [historyRows, keyword, statusFilter]);

  const activeCount = historyRows.filter((row) => row.status === "active").length;
  const inactiveCount = historyRows.filter((row) => row.status === "inactive").length;

  return (
    <PageShell>
      <header className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 px-6 py-5">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link href="/admin" className="transition hover:text-slate-700">
              관리자 홈
            </Link>
            <span className="text-slate-300">/</span>
            <Link
              href="/admin/university-conversion"
              className="transition hover:text-slate-700"
            >
              대학별 환산규칙 설정
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-medium text-slate-700">전체 규칙 이력</span>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-[24px] font-bold tracking-tight text-slate-900">
                전체 규칙 이력
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                활성/비활성 포함 전체 규칙을 조회하는 페이지입니다. 수정은 활성 규칙 목록에서 각 행의 수정 버튼으로 진입합니다.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/admin/university-conversion/active-rules"
                className="inline-flex h-10 items-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                활성 규칙 목록
              </Link>
              <Link
                href="/admin/university-conversion/rules"
                className="inline-flex h-10 items-center rounded-full bg-slate-900 px-4 text-sm font-semibold text-yellow-300 transition hover:bg-slate-800"
              >
                전체 규칙 이력
              </Link>
            </div>
          </div>
        </div>
      </header>

      <SectionCard
        title="검색 및 필터"
        description="저장된 전체 규칙 이력을 불러와 검색 및 상태 필터에 사용합니다."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <ActionChip tone="emerald">활성 {activeCount}건</ActionChip>
            <ActionChip tone="slate">비활성 {inactiveCount}건</ActionChip>
            <ActionChip tone="blue">검색 결과 {filteredHistory.length}건</ActionChip>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_140px]">
          <TextField
            value={keyword}
            onChange={setKeyword}
            placeholder="대학명, 전형유형, 전형명, 계열 검색"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "all" | RuleStatus)
            }
            className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            <option value="all">전체 상태</option>
            <option value="active">활성만</option>
            <option value="inactive">비활성만</option>
            <option value="review_requested">검수요청만</option>
            <option value="draft">임시저장만</option>
          </select>
        </div>
      </SectionCard>

      <SectionCard
        title="전체 규칙 이력 목록"
        description="저장 이력, 활성 전환 이력, 수정 이력 등이 이 목록에 표시됩니다."
      >
        <div className="overflow-x-auto">
          <div className="min-w-[1080px]">
            <div className="grid grid-cols-[120px_180px_160px_220px_120px_100px_120px_140px] gap-3 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <div>지역</div>
              <div>대학명</div>
              <div>전형유형</div>
              <div>전형명</div>
              <div>계열</div>
              <div>상태</div>
              <div>버전</div>
              <div>수정일</div>
            </div>

            {loading ? (
              <div className="mt-4 rounded-[24px] border border-slate-200 bg-white px-6 py-10 text-center text-sm font-medium text-slate-500">
                전체 규칙 이력을 불러오는 중입니다.
              </div>
            ) : errorMessage ? (
              <div className="mt-4 rounded-[24px] border border-rose-200 bg-rose-50 px-6 py-10 text-center">
                <div className="text-base font-semibold text-rose-700">
                  전체 규칙 이력을 불러오지 못했습니다.
                </div>
                <p className="mt-2 text-sm leading-6 text-rose-600">
                  {errorMessage}
                </p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="mt-4 rounded-[24px] border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
                <div className="text-base font-semibold text-slate-800">
                  현재 표시할 규칙 이력이 없습니다.
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  저장된 규칙 이력이 없거나, 현재 검색 조건에 맞는 결과가 없습니다.
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {filteredHistory.map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-[120px_180px_160px_220px_120px_100px_120px_140px] gap-3 rounded-[20px] border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700"
                  >
                    <div>{row.region}</div>
                    <div className="font-semibold text-slate-900">{row.university}</div>
                    <div>{row.admissionType}</div>
                    <div>{row.admissionName}</div>
                    <div>{row.track}</div>
                    <div>
                      <ActionChip
                        tone={
                          row.status === "active"
                            ? "emerald"
                            : row.status === "review_requested"
                            ? "amber"
                            : row.status === "draft"
                            ? "blue"
                            : "slate"
                        }
                      >
                        {row.status === "active"
                          ? "활성"
                          : row.status === "inactive"
                          ? "비활성"
                          : row.status === "review_requested"
                          ? "검수요청"
                          : "임시저장"}
                      </ActionChip>
                    </div>
                    <div>{row.versionLabel}</div>
                    <div>{row.updatedAt}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SectionCard>
    </PageShell>
  );
}
