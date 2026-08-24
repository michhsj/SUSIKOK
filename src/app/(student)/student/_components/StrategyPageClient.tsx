"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type DragEvent,
} from "react";
import AdmissionDetailContent from "./admissions/detail/AdmissionDetailContent";
import type { DetailItem } from "./admissions/detail/admission-detail-types";
import StrategyPrintButton from "./StrategyPrintButton";

type SavedStrategyListItem = {
  id: string;
  admissionResultId: string;
  priority: number;
  snapshotVersion: number;
  createdAt: string;
  updatedAt: string;
  savedAt: string;
  detail: DetailItem;
};

type GetSavedAdmissionsResponse = {
  success: boolean;
  message?: string;
  items: SavedStrategyListItem[];
  meta: {
    totalCount: number;
  };
};

type DeleteSavedAdmissionResponse = {
  success: boolean;
  message?: string;
  action?: string;
  deletedCount?: number;
  admissionResultId?: string;
};

type ReorderSavedAdmissionsResponse = {
  success: boolean;
  message?: string;
  items?: Array<{
    id: string;
    priority: number;
  }>;
};

type DropPosition = "top" | "bottom";

type DragOverState = {
  id: string;
  position: DropPosition;
} | null;

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function formatSavedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatPriority(priority: number) {
  return priority + 1;
}

function reorderItemsByPlacement(
  items: SavedStrategyListItem[],
  fromId: string,
  targetId: string,
  position: DropPosition,
): SavedStrategyListItem[] | null {
  if (fromId === targetId) return null;

  const fromIndex = items.findIndex((item) => item.id === fromId);
  const targetIndex = items.findIndex((item) => item.id === targetId);

  if (fromIndex === -1 || targetIndex === -1) return null;

  const copied = [...items];
  const [moved] = copied.splice(fromIndex, 1);

  const targetIndexAfterRemoval = copied.findIndex(
    (item) => item.id === targetId,
  );
  if (targetIndexAfterRemoval === -1) return null;

  const insertIndex =
    position === "top" ? targetIndexAfterRemoval : targetIndexAfterRemoval + 1;

  copied.splice(insertIndex, 0, moved);

  return copied.map((item, index) => ({
    ...item,
    priority: index,
  }));
}

function buildReorderPayload(items: SavedStrategyListItem[]) {
  return items.map((item, index) => ({
    id: item.id,
    priority: index,
  }));
}

const PLACEHOLDER_ITEMS: SavedStrategyListItem[] = [
  {
    id: "strategy-placeholder-1",
    admissionResultId: "placeholder-admission-result-1",
    priority: 0,
    snapshotVersion: 1,
    createdAt: "2026-08-23T15:30:00.000Z",
    updatedAt: "2026-08-23T15:30:00.000Z",
    savedAt: "2026-08-23T15:30:00.000Z",
    detail: {
      id: "detail-placeholder-1",
      identity: {
        region: "서울",
        universityName: "OO대학교",
        admissionType: "학생부교과",
        admissionName: "일반전형",
        track: "자연",
        collegeName: "공과대학",
        recruitmentUnit: "컴퓨터공학과",
      },
      recruitmentCount2027: {
        label: "2027 모집인원",
        shortLabel: "27인원",
        raw: "24",
        display: "24명",
      },
      summaryFields: [
        { label: "전형방법", value: "학생부 100%" },
        { label: "학생부반영", value: "국·영·수·과 반영" },
        { label: "최저학력기준", value: "-" },
        { label: "원서접수", value: "2026-09-09 ~ 2026-09-13" },
        { label: "1차합격", value: "-" },
        { label: "논술/면접", value: "-" },
        { label: "최종합격", value: "2026-12-13" },
      ],
      yearTable: {
        columns: [
          "학년도",
          "모집인원(명)",
          "지원인원(명)",
          "경쟁률",
          "충원",
          "최저충족률",
          "최저충족인원",
          "실질경쟁률",
          "성적50%(등급)",
          "성적70%(등급)",
          "환산50%",
          "환산70%",
        ],
        rows: [
          {
            year: "2025",
            recruitmentCount: "20",
            applicantCount: "160",
            competitionRate: "8.00",
            additionalPassCount: "5",
            minSatisfiedRate: "-",
            minSatisfiedCount: "-",
            actualCompetitionRate: "8.00",
            score50: "1.70",
            score70: "1.95",
            converted50: "95.10",
            converted70: "92.40",
          },
          {
            year: "2026",
            recruitmentCount: "22",
            applicantCount: "187",
            competitionRate: "8.50",
            additionalPassCount: "6",
            minSatisfiedRate: "-",
            minSatisfiedCount: "-",
            actualCompetitionRate: "8.50",
            score50: "1.68",
            score70: "1.90",
            converted50: "95.60",
            converted70: "93.10",
          },
        ],
      },
      charts: {
        competitionRate: {
          title: "경쟁률 추이",
          labels: ["2025", "2026"],
          series: [{ name: "경쟁률", data: [8.0, 8.5] }],
        },
        scoreTrend: {
          title: "점수 추이",
          labels: ["2025", "2026"],
          series: [
            { name: "환산70%", data: [92.4, 93.1] },
            { name: "환산50%", data: [95.1, 95.6] },
          ],
        },
        comprehensiveCompetency: null,
      },
      premium: {
        locked: false,
        title: "상세 정보",
        items: [
          { label: "내성적", description: "-", locked: false },
          { label: "지원가능성", description: "-", locked: false },
        ],
        saveAction: { label: "저장됨" },
      },
    },
  },
  {
    id: "strategy-placeholder-2",
    admissionResultId: "placeholder-admission-result-2",
    priority: 1,
    snapshotVersion: 1,
    createdAt: "2026-08-23T15:45:00.000Z",
    updatedAt: "2026-08-23T15:45:00.000Z",
    savedAt: "2026-08-23T15:45:00.000Z",
    detail: {
      id: "detail-placeholder-2",
      identity: {
        region: "경기",
        universityName: "OO대학교",
        admissionType: "학생부종합",
        admissionName: "학업우수형",
        track: "자연",
        collegeName: "소프트웨어융합대학",
        recruitmentUnit: "소프트웨어학부",
      },
      recruitmentCount2027: {
        label: "2027 모집인원",
        shortLabel: "27인원",
        raw: "18",
        display: "18명",
      },
      summaryFields: [
        { label: "전형방법", value: "서류 100%" },
        { label: "학생부반영", value: "교과·세특·출결 종합평가" },
        { label: "최저학력기준", value: "수능 최저 없음" },
        { label: "원서접수", value: "2026-09-09 ~ 2026-09-13" },
        { label: "1차합격", value: "-" },
        { label: "논술/면접", value: "면접 실시" },
        { label: "최종합격", value: "2026-12-13" },
        { label: "전형특기사항", value: "서류 기반 면접 진행" },
      ],
      yearTable: {
        columns: [
          "학년도",
          "모집인원(명)",
          "지원인원(명)",
          "경쟁률",
          "충원",
          "최저충족률",
          "최저충족인원",
          "실질경쟁률",
          "성적50%(등급)",
          "성적70%(등급)",
          "환산50%",
          "환산70%",
        ],
        rows: [
          {
            year: "2025",
            recruitmentCount: "16",
            applicantCount: "128",
            competitionRate: "8.00",
            additionalPassCount: "7",
            minSatisfiedRate: "-",
            minSatisfiedCount: "-",
            actualCompetitionRate: "8.00",
            score50: "-",
            score70: "-",
            converted50: "-",
            converted70: "-",
          },
          {
            year: "2026",
            recruitmentCount: "17",
            applicantCount: "153",
            competitionRate: "9.00",
            additionalPassCount: "9",
            minSatisfiedRate: "-",
            minSatisfiedCount: "-",
            actualCompetitionRate: "9.00",
            score50: "-",
            score70: "-",
            converted50: "-",
            converted70: "-",
          },
        ],
      },
      charts: {
        competitionRate: {
          title: "경쟁률 추이",
          labels: ["2025", "2026"],
          series: [{ name: "경쟁률", data: [8.0, 9.0] }],
        },
        scoreTrend: {
          title: "점수 추이",
          labels: ["2025", "2026"],
          series: [
            { name: "모집인원", data: [16, 17] },
            { name: "경쟁률", data: [8.0, 9.0] },
          ],
        },
        comprehensiveCompetency: {
          title: "대학별 종합전형 비율",
          subtitle: "학업 / 진로 / 공동체 역량 가중치 예시",
          locked: false,
          items: [
            {
              key: "academic",
              label: "학업",
              description: "교과 성취, 학업 수행",
              universityRatioPercent: 50,
              questionCount: 5,
              userScore: 18,
              userMaxScore: 25,
              userPercent: 72,
              weightedPercent: 36,
            },
            {
              key: "career",
              label: "진로",
              description: "전공 적합성, 활동 연계성",
              universityRatioPercent: 30,
              questionCount: 4,
              userScore: 11,
              userMaxScore: 15,
              userPercent: 73.33,
              weightedPercent: 22,
            },
            {
              key: "community",
              label: "공동체",
              description: "협업, 책임감, 참여도",
              universityRatioPercent: 20,
              questionCount: 3,
              userScore: 7,
              userMaxScore: 10,
              userPercent: 70,
              weightedPercent: 14,
            },
          ],
        },
      },
      premium: {
        locked: false,
        title: "상세 정보",
        items: [
          { label: "내성적", description: "-", locked: false },
          { label: "지원가능성", description: "-", locked: false },
        ],
        saveAction: { label: "저장됨" },
      },
    },
  },
];

function DragHandle({
  disabled,
  onDragStart,
  onDragEnd,
}: {
  disabled: boolean;
  onDragStart: (event: DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
}) {
  return (
    <button
      type="button"
      draggable={!disabled}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      disabled={disabled}
      aria-label="우선순위 드래그 정렬"
      title="드래그해서 순서 변경"
      className={cn(
        "strategy-print-hide inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm font-bold shadow-sm transition",
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
          : "cursor-grab border-slate-200 bg-white text-slate-600 hover:bg-slate-50 active:cursor-grabbing",
      )}
    >
      ⠿
    </button>
  );
}

function DropIndicator({ position }: { position: DropPosition }) {
  return (
    <div
      className={cn(
        "strategy-print-drop-indicator pointer-events-none absolute left-3 right-3 z-20",
        position === "top"
          ? "top-0 -translate-y-1/2"
          : "bottom-0 translate-y-1/2",
      )}
    >
      <div className="relative h-0">
        <div className="absolute left-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-blue-600 shadow-sm" />
        <div className="ml-4 h-[3px] rounded-full bg-blue-600 shadow-[0_0_0_2px_rgba(191,219,254,0.9)]" />
      </div>
    </div>
  );
}

function StrategyCard({
  item,
  dragging,
  dragOverPosition,
  actionDisabled,
  deleting,
  onDelete,
  onHandleDragStart,
  onHandleDragEnd,
  onDragOverCard,
  onDropCard,
}: {
  item: SavedStrategyListItem;
  dragging: boolean;
  dragOverPosition: DropPosition | null;
  actionDisabled: boolean;
  deleting: boolean;
  onDelete: (admissionResultId: string) => void;
  onHandleDragStart: (
    savedId: string,
    event: DragEvent<HTMLButtonElement>,
  ) => void;
  onHandleDragEnd: () => void;
  onDragOverCard: (savedId: string, event: DragEvent<HTMLElement>) => void;
  onDropCard: (savedId: string, event: DragEvent<HTMLElement>) => void;
}) {
  return (
    <article
      onDragOver={(event) => onDragOverCard(item.id, event)}
      onDrop={(event) => onDropCard(item.id, event)}
      className={cn(
        "strategy-print-card relative rounded-xl border bg-white shadow-sm transition",
        dragging
          ? "border-blue-300 opacity-60 ring-2 ring-blue-200"
          : "border-slate-200",
        dragOverPosition ? "ring-2 ring-blue-100" : "",
      )}
    >
      {dragOverPosition ? <DropIndicator position={dragOverPosition} /> : null}

      <div className="strategy-print-card-inner">
        <div className="border-b border-slate-200 px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <DragHandle
                  disabled={actionDisabled}
                  onDragStart={(event) => onHandleDragStart(item.id, event)}
                  onDragEnd={onHandleDragEnd}
                />

                <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-800">
                  우선순위 {formatPriority(item.priority)}
                </span>

                <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                  저장됨
                </span>
              </div>

              <div className="mt-2 text-base font-bold text-slate-900">
                {item.detail.identity.universityName}
              </div>

              <div className="mt-1 text-sm text-slate-600">
                {item.detail.identity.admissionType} ·{" "}
                {item.detail.identity.admissionName} ·{" "}
                {item.detail.identity.recruitmentUnit}
              </div>

              <div className="mt-1 text-[12px] text-slate-500">
                {item.detail.identity.region}
                {item.detail.identity.track
                  ? ` · ${item.detail.identity.track}`
                  : ""}
                {item.detail.identity.collegeName
                  ? ` · ${item.detail.identity.collegeName}`
                  : ""}
                {item.savedAt ? ` · 저장 ${formatSavedAt(item.savedAt)}` : ""}
              </div>
            </div>

            <div className="strategy-print-hide flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={actionDisabled}
                onClick={() => onDelete(item.admissionResultId)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-[12px] font-bold shadow-sm transition",
                  actionDisabled
                    ? "cursor-not-allowed border-rose-100 bg-rose-50 text-rose-300"
                    : "border-rose-200 bg-white text-rose-600 hover:bg-rose-50",
                )}
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>

        <div className="strategy-print-card-body px-3 py-3">
          <AdmissionDetailContent detail={item.detail} />
        </div>
      </div>
    </article>
  );
}

export default function StrategyPageClient() {
  const [items, setItems] = useState<SavedStrategyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingAdmissionResultId, setDeletingAdmissionResultId] = useState<
    string | null
  >(null);
  const [reordering, setReordering] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverState, setDragOverState] = useState<DragOverState>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [usePlaceholder, setUsePlaceholder] = useState(false);

  const hasBusyAction = deletingAdmissionResultId !== null || reordering;

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.priority - b.priority);
  }, [items]);

  const fetchSavedStrategies = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;

      if (!silent) {
        setLoading(true);
      }

      setErrorMessage("");

      try {
        const response = await fetch("/api/student/admissions/save", {
          method: "GET",
          cache: "no-store",
        });

        const data = (await response.json()) as GetSavedAdmissionsResponse;

        if (!response.ok || !data.success) {
          throw new Error(data.message ?? "저장 전략 목록을 불러오지 못했습니다.");
        }

        setItems(data.items ?? []);
        setUsePlaceholder(false);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "저장 전략 목록을 불러오지 못했습니다.";

        setErrorMessage(message);

        if (!silent) {
          setItems(PLACEHOLDER_ITEMS);
          setUsePlaceholder(true);
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void fetchSavedStrategies();
  }, [fetchSavedStrategies]);

  const handleDelete = useCallback(
    async (admissionResultId: string) => {
      if (usePlaceholder) return;

      const confirmed = window.confirm(
        "이 모집단위를 저장 목록에서 삭제하시겠습니까?",
      );
      if (!confirmed) return;

      setDeletingAdmissionResultId(admissionResultId);
      setErrorMessage("");

      try {
        const response = await fetch("/api/student/admissions/save", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ admissionResultId }),
        });

        const data = (await response.json()) as DeleteSavedAdmissionResponse;

        if (!response.ok || !data.success) {
          throw new Error(data.message ?? "저장 해제 처리에 실패했습니다.");
        }

        await fetchSavedStrategies({ silent: true });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "저장 해제 처리에 실패했습니다.";
        setErrorMessage(message);
      } finally {
        setDeletingAdmissionResultId(null);
      }
    },
    [fetchSavedStrategies, usePlaceholder],
  );

  const commitReorder = useCallback(
    async (nextItems: SavedStrategyListItem[]) => {
      setReordering(true);
      setErrorMessage("");

      try {
        const response = await fetch("/api/student/admissions/save", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: buildReorderPayload(nextItems),
          }),
        });

        const data = (await response.json()) as ReorderSavedAdmissionsResponse;

        if (!response.ok || !data.success) {
          throw new Error(data.message ?? "우선순위 변경에 실패했습니다.");
        }

        await fetchSavedStrategies({ silent: true });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "우선순위 변경에 실패했습니다.";
        setErrorMessage(message);
        await fetchSavedStrategies({ silent: true });
      } finally {
        setReordering(false);
      }
    },
    [fetchSavedStrategies],
  );

  const handleHandleDragStart = useCallback(
    (savedId: string, event: DragEvent<HTMLButtonElement>) => {
      if (usePlaceholder || hasBusyAction) return;

      setDraggingId(savedId);
      setDragOverState(null);

      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", savedId);
    },
    [hasBusyAction, usePlaceholder],
  );

  const handleHandleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDragOverState(null);
  }, []);

  const handleDragOverCard = useCallback(
    (savedId: string, event: DragEvent<HTMLElement>) => {
      if (!draggingId || usePlaceholder || hasBusyAction) return;

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";

      const rect = event.currentTarget.getBoundingClientRect();
      const middleY = rect.top + rect.height / 2;
      const position: DropPosition = event.clientY < middleY ? "top" : "bottom";

      if (
        dragOverState?.id !== savedId ||
        dragOverState.position !== position
      ) {
        setDragOverState({
          id: savedId,
          position,
        });
      }
    },
    [dragOverState, draggingId, hasBusyAction, usePlaceholder],
  );

  const handleDropCard = useCallback(
    async (targetSavedId: string, event: DragEvent<HTMLElement>) => {
      event.preventDefault();

      if (!draggingId || !dragOverState || usePlaceholder || hasBusyAction) {
        setDraggingId(null);
        setDragOverState(null);
        return;
      }

      const nextItems = reorderItemsByPlacement(
        sortedItems,
        draggingId,
        targetSavedId,
        dragOverState.position,
      );

      setDraggingId(null);
      setDragOverState(null);

      if (!nextItems) return;

      setItems(nextItems);
      await commitReorder(nextItems);
    },
    [
      commitReorder,
      dragOverState,
      draggingId,
      hasBusyAction,
      sortedItems,
      usePlaceholder,
    ],
  );

  const hasSavedItems = sortedItems.length > 0;

  return (
    <div className="strategy-print-root space-y-4">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: A4 portrait;
              margin: 8mm;
            }

            @media print {
              html,
              body {
                background: #ffffff !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              .strategy-print-hide,
              .strategy-print-drop-indicator {
                display: none !important;
              }

              .strategy-print-root {
                width: auto !important;
                max-width: none !important;
                margin: 0 !important;
                padding: 0 !important;
              }

              .strategy-print-card-list {
                padding: 0 !important;
                gap: 0 !important;
              }

              .strategy-print-card {
                height: 88mm !important;
                margin: 0 0 3mm 0 !important;
                overflow: hidden !important;
                break-inside: avoid !important;
                page-break-inside: avoid !important;
                box-shadow: none !important;
              }

              .strategy-print-card:nth-of-type(3n + 2) {
                break-after: page;
                page-break-after: always;
                margin-bottom: 0 !important;
              }

              .strategy-print-card:last-of-type {
                break-after: auto !important;
                page-break-after: auto !important;
              }

              .strategy-print-card-inner {
                transform: scale(0.61);
                transform-origin: top left;
                width: calc(100% / 0.61) !important;
              }

              .strategy-print-card-body {
                padding: 12px !important;
              }
            }
          `,
        }}
      />

      {errorMessage ? (
        <section className="strategy-print-hide rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="font-semibold">처리 안내</div>
          <div className="mt-1">{errorMessage}</div>
          {usePlaceholder ? (
            <div className="mt-1 text-xs text-amber-700">
              현재는 placeholder 미리보기로 표시 중입니다.
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="strategy-print-hide border-b border-slate-200 px-4 py-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-[15px] font-semibold text-slate-700">
                나의 입시 전략{" "}
                <span className="font-black text-[#1652d8]">
                  {sortedItems.length}건
                </span>
              </div>
              <div className="mt-1 text-[12px] text-slate-500">
                저장한 모집단위를 전략 목록으로 보고, 핸들을 드래그해서 우선순위를 변경할 수 있습니다.
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                상세 기본 펼침
              </span>
              <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                핸들 드래그 정렬
              </span>

              <StrategyPrintButton />

              <button
                type="button"
                onClick={() => {
                  void fetchSavedStrategies();
                }}
                disabled={loading}
                className={cn(
                  "inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-bold",
                  loading
                    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                )}
              >
                {loading ? "불러오는 중..." : "새로고침"}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="px-4 py-12 text-center text-sm text-slate-500">
            저장한 전략을 불러오는 중입니다...
          </div>
        ) : hasSavedItems ? (
          <div className="strategy-print-card-list space-y-3 p-3">
            {sortedItems.map((item) => (
              <StrategyCard
                key={item.id}
                item={item}
                dragging={draggingId === item.id}
                dragOverPosition={
                  dragOverState?.id === item.id ? dragOverState.position : null
                }
                actionDisabled={usePlaceholder || hasBusyAction}
                deleting={deletingAdmissionResultId === item.admissionResultId}
                onDelete={handleDelete}
                onHandleDragStart={handleHandleDragStart}
                onHandleDragEnd={handleHandleDragEnd}
                onDragOverCard={handleDragOverCard}
                onDropCard={(savedId, event) => {
                  void handleDropCard(savedId, event);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="px-4 py-12 text-center text-sm text-slate-500">
            저장된 전략이 없습니다.
          </div>
        )}
      </section>
    </div>
  );
}
