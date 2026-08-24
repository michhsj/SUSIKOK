"use client";

import { useEffect, useMemo, useState } from "react";

type PopupItem = {
  id: string;
  title: string;
  enabled: boolean;
  imageUrl: string | null;
  width: number;
  height: number;
  positionX: number;
  positionY: number;
  todayHideEnabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type PopupForm = {
  id: string | null;
  title: string;
  enabled: boolean;
  imageUrl: string;
  width: number;
  height: number;
  positionX: number;
  positionY: number;
  todayHideEnabled: boolean;
};

type PopupListResponse = {
  success: boolean;
  message?: string;
  items?: PopupItem[];
};

type PopupSaveResponse = {
  success: boolean;
  message?: string;
  item?: PopupItem;
  items?: PopupItem[];
};

type PopupOrderSaveResponse = {
  success: boolean;
  message?: string;
  items?: PopupItem[];
};

type PopupDeleteResponse = {
  success: boolean;
  message?: string;
  items?: PopupItem[];
};

type UploadResponse = {
  success: boolean;
  message?: string;
  url?: string;
  imageUrl?: string;
};

type OverlapPair = {
  sourceId: string;
  targetId: string;
};

const defaultForm: PopupForm = {
  id: null,
  title: "메인 팝업",
  enabled: false,
  imageUrl: "",
  width: 420,
  height: 560,
  positionX: 24,
  positionY: 24,
  todayHideEnabled: true,
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR");
}

function toNumber(value: string, fallback: number) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeSortOrder(items: PopupItem[]) {
  return items.map((item, index) => ({
    ...item,
    sortOrder: index + 1,
  }));
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function isRectOverlap(a: PopupItem, b: PopupItem) {
  return (
    a.positionX < b.positionX + b.width &&
    a.positionX + a.width > b.positionX &&
    a.positionY < b.positionY + b.height &&
    a.positionY + a.height > b.positionY
  );
}

export default function HomePopupAdminPanel() {
  const [form, setForm] = useState<PopupForm>(defaultForm);
  const [items, setItems] = useState<PopupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      const aTime = new Date(a.updatedAt).getTime();
      const bTime = new Date(b.updatedAt).getTime();
      return bTime - aTime;
    });
  }, [items]);

  const overlapState = useMemo(() => {
    const activeItems = sortedItems.filter((item) => item.enabled);
    const overlapPairs: OverlapPair[] = [];
    const overlapMap = new Map<string, string[]>();

    for (let i = 0; i < activeItems.length; i += 1) {
      for (let j = i + 1; j < activeItems.length; j += 1) {
        const source = activeItems[i];
        const target = activeItems[j];

        if (!isRectOverlap(source, target)) continue;

        overlapPairs.push({
          sourceId: source.id,
          targetId: target.id,
        });

        const sourceConflicts = overlapMap.get(source.id) ?? [];
        sourceConflicts.push(target.title);
        overlapMap.set(source.id, sourceConflicts);

        const targetConflicts = overlapMap.get(target.id) ?? [];
        targetConflicts.push(source.title);
        overlapMap.set(target.id, targetConflicts);
      }
    }

    return {
      overlapPairs,
      overlapMap,
    };
  }, [sortedItems]);

  function updateForm<K extends keyof PopupForm>(key: K, value: PopupForm[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function applyItemToForm(item: PopupItem) {
    setForm({
      id: item.id,
      title: item.title ?? "메인 팝업",
      enabled: item.enabled,
      imageUrl: item.imageUrl ?? "",
      width: item.width,
      height: item.height,
      positionX: item.positionX,
      positionY: item.positionY,
      todayHideEnabled: item.todayHideEnabled,
    });
    setMessage("");
    setError("");
  }

  function resetForm() {
    setForm(defaultForm);
    setMessage("");
    setError("");
  }

  function syncAfterDelete(nextItems: PopupItem[], deletedId: string) {
    setItems(nextItems);

    if (form.id === deletedId) {
      if (nextItems.length > 0) {
        applyItemToForm(nextItems[0]);
      } else {
        resetForm();
      }
    }
  }

  async function loadPopupList(selectFirst = false) {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/admin/home-popup", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await res.json()) as PopupListResponse;

      if (!res.ok || !data.success) {
        throw new Error(data.message || "팝업 목록을 불러오지 못했습니다.");
      }

      const nextItems = Array.isArray(data.items) ? data.items : [];
      setItems(nextItems);

      if (selectFirst && nextItems.length > 0) {
        applyItemToForm(nextItems[0]);
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "팝업 목록을 불러오는 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPopupList(true);
  }, []);

  async function handleImageUpload(file: File) {
    try {
      setUploading(true);
      setMessage("");
      setError("");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/uploads/image", {
        method: "POST",
        body: formData,
      });

      const data = (await res.json()) as UploadResponse;

      if (!res.ok || !data.success) {
        throw new Error(data.message || "이미지 업로드에 실패했습니다.");
      }

      const uploadedUrl =
        typeof data.url === "string" && data.url
          ? data.url
          : typeof data.imageUrl === "string" && data.imageUrl
          ? data.imageUrl
          : "";

      if (!uploadedUrl) {
        throw new Error("업로드 결과에서 이미지 URL을 찾지 못했습니다.");
      }

      setForm((prev) => ({
        ...prev,
        imageUrl: uploadedUrl,
      }));

      setMessage("이미지가 업로드되었습니다.");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "이미지 업로드 중 오류가 발생했습니다."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      const res = await fetch("/api/admin/home-popup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = (await res.json()) as PopupSaveResponse;

      if (!res.ok || !data.success) {
        throw new Error(data.message || "팝업 저장에 실패했습니다.");
      }

      const nextItems = Array.isArray(data.items) ? data.items : [];
      setItems(nextItems);

      if (data.item) {
        applyItemToForm(data.item);
      }

      setMessage(data.message || "팝업이 설정되었습니다.");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "팝업 저장 중 오류가 발생했습니다."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: PopupItem) {
    const confirmed = window.confirm(
      `"${item.title}" 팝업을 삭제하시겠습니까?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(item.id);
      setMessage("");
      setError("");

      const res = await fetch(
        `/api/admin/home-popup?id=${encodeURIComponent(item.id)}`,
        {
          method: "DELETE",
        }
      );

      const data = (await res.json()) as PopupDeleteResponse;

      if (!res.ok || !data.success) {
        throw new Error(data.message || "팝업 삭제에 실패했습니다.");
      }

      const nextItems = Array.isArray(data.items) ? data.items : [];
      syncAfterDelete(nextItems, item.id);
      setMessage(data.message || "팝업이 삭제되었습니다.");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "팝업 삭제 중 오류가 발생했습니다."
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function persistOrder(nextItems: PopupItem[]) {
    try {
      setOrdering(true);
      setError("");
      setMessage("");

      const payload = nextItems.map((item, index) => ({
        id: item.id,
        sortOrder: index + 1,
      }));

      const res = await fetch("/api/admin/home-popup", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: payload,
        }),
      });

      const data = (await res.json()) as PopupOrderSaveResponse;

      if (!res.ok || !data.success) {
        throw new Error(data.message || "팝업 순서 저장에 실패했습니다.");
      }

      setItems(Array.isArray(data.items) ? data.items : nextItems);
      setMessage(data.message || "팝업 순서가 변경되었습니다.");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "팝업 순서 저장 중 오류가 발생했습니다."
      );
    } finally {
      setOrdering(false);
    }
  }

  function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }

    const fromIndex = sortedItems.findIndex((item) => item.id === draggingId);
    const toIndex = sortedItems.findIndex((item) => item.id === targetId);

    if (fromIndex < 0 || toIndex < 0) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }

    const movedItems = moveItem(sortedItems, fromIndex, toIndex);
    const normalizedItems = normalizeSortOrder(movedItems);

    setItems(normalizedItems);
    setDraggingId(null);
    setDragOverId(null);
    void persistOrder(normalizedItems);
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              메인 페이지 팝업 설정
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              저장 시 DB에 반영되며, 목록은 드래그앤드롭으로 순서를 바꿀 수 있습니다.
            </p>
          </div>

          <button
            type="button"
            onClick={resetForm}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            새 팝업 작성
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                팝업 제목
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                placeholder="메인 팝업"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                팝업 이미지 업로드
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    void handleImageUpload(file);
                  }
                }}
                className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700"
              />
              <p className="mt-2 text-xs text-slate-500">
                업로드 완료 후 이미지 URL이 자동 반영됩니다.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                이미지 URL
              </label>
              <input
                type="text"
                value={form.imageUrl}
                onChange={(e) => updateForm("imageUrl", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                placeholder="/uploads/home-popup/example.png"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  가로 크기
                </label>
                <input
                  type="number"
                  value={form.width}
                  onChange={(e) =>
                    updateForm("width", toNumber(e.target.value, 420))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  세로 크기
                </label>
                <input
                  type="number"
                  value={form.height}
                  onChange={(e) =>
                    updateForm("height", toNumber(e.target.value, 560))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  위치 X
                </label>
                <input
                  type="number"
                  value={form.positionX}
                  onChange={(e) =>
                    updateForm("positionX", toNumber(e.target.value, 24))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  위치 Y
                </label>
                <input
                  type="number"
                  value={form.positionY}
                  onChange={(e) =>
                    updateForm("positionY", toNumber(e.target.value, 24))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => updateForm("enabled", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                팝업 활성화
              </label>

              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.todayHideEnabled}
                  onChange={(e) =>
                    updateForm("todayHideEnabled", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />
                오늘 하루 보지 않기 사용
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || uploading || ordering || deletingId !== null}
                className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {saving ? "저장 중..." : "팝업 설정 저장"}
              </button>

              {uploading ? (
                <span className="text-sm text-slate-500">
                  이미지 업로드 중...
                </span>
              ) : null}

              {ordering ? (
                <span className="text-sm text-slate-500">
                  팝업 순서 저장 중...
                </span>
              ) : null}

              {deletingId ? (
                <span className="text-sm text-slate-500">팝업 삭제 중...</span>
              ) : null}
            </div>

            {message ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {message}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            ) : null}

            {overlapState.overlapPairs.length > 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                활성화된 팝업 중 서로 겹치는 항목이 {overlapState.overlapPairs.length}
                건 있습니다. 목록에서 빨간 경고 표시를 확인하세요.
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                현재 활성 팝업 간 좌표 겹침은 없습니다.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-sm font-bold text-slate-900">현재 편집 미리보기</h3>

            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-800">제목:</span>{" "}
                {form.title || "메인 팝업"}
              </p>
              <p>
                <span className="font-semibold text-slate-800">상태:</span>{" "}
                {form.enabled ? "활성" : "비활성"}
              </p>
              <p>
                <span className="font-semibold text-slate-800">크기:</span>{" "}
                {form.width} × {form.height}
              </p>
              <p>
                <span className="font-semibold text-slate-800">위치:</span> X{" "}
                {form.positionX}, Y {form.positionY}
              </p>
              <p>
                <span className="font-semibold text-slate-800">
                  오늘 하루 보지 않기:
                </span>{" "}
                {form.todayHideEnabled ? "사용" : "미사용"}
              </p>
              <p>
                <span className="font-semibold text-slate-800">수정 모드:</span>{" "}
                {form.id ? "기존 팝업 수정" : "새 팝업 작성"}
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-4">
              {form.imageUrl ? (
                <img
                  src={form.imageUrl}
                  alt="팝업 미리보기"
                  className="max-h-[360px] w-auto rounded-xl border border-slate-200 object-contain"
                />
              ) : (
                <div className="flex h-[240px] items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-400">
                  업로드된 이미지가 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="border-b border-slate-100 pb-5">
          <h3 className="text-lg font-bold text-slate-900">
            현재 설정된 팝업 목록
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            모든 팝업이 표시되며, 드래그앤드롭으로 순서를 저장할 수 있습니다.
          </p>
        </div>

        {loading ? (
          <div className="py-10 text-sm text-slate-500">
            팝업 목록을 불러오는 중...
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="py-10 text-sm text-slate-500">
            저장된 팝업이 없습니다.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {sortedItems.map((item, index) => {
              const conflictTitles = overlapState.overlapMap.get(item.id) ?? [];
              const hasOverlap = conflictTitles.length > 0;
              const isDeleting = deletingId === item.id;

              return (
                <div
                  key={item.id}
                  draggable={!isDeleting && !ordering}
                  onDragStart={() => setDraggingId(item.id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverId(item.id);
                  }}
                  onDragLeave={() => {
                    if (dragOverId === item.id) {
                      setDragOverId(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(item.id);
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDragOverId(null);
                  }}
                  className={[
                    "rounded-2xl border bg-slate-50 p-4 transition",
                    dragOverId === item.id
                      ? "border-blue-400 ring-2 ring-blue-200"
                      : hasOverlap
                      ? "border-rose-300"
                      : "border-slate-200",
                    draggingId === item.id ? "opacity-60" : "",
                    isDeleting ? "opacity-60" : "",
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-24 w-10 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-xs font-semibold text-slate-500">
                        {index + 1}
                      </div>

                      <div className="h-24 w-24 overflow-hidden rounded-xl border border-slate-200 bg-white">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                            이미지 없음
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 text-sm text-slate-600">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-base font-bold text-slate-900">
                            {item.title}
                          </div>

                          <span className="rounded-full bg-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700">
                            순서 {item.sortOrder}
                          </span>

                          {hasOverlap ? (
                            <span className="rounded-full bg-rose-100 px-2 py-1 text-[11px] font-semibold text-rose-700">
                              겹침 경고
                            </span>
                          ) : null}
                        </div>

                        <div>
                          상태:{" "}
                          <span
                            className={
                              item.enabled
                                ? "font-semibold text-emerald-600"
                                : "font-semibold text-slate-500"
                            }
                          >
                            {item.enabled ? "활성" : "비활성"}
                          </span>
                        </div>
                        <div>
                          크기: {item.width} × {item.height}
                        </div>
                        <div>
                          위치: X {item.positionX}, Y {item.positionY}
                        </div>
                        <div>
                          오늘 하루 보지 않기:{" "}
                          {item.todayHideEnabled ? "사용" : "미사용"}
                        </div>
                        <div>생성일: {formatDateTime(item.createdAt)}</div>
                        <div>수정일: {formatDateTime(item.updatedAt)}</div>

                        {hasOverlap ? (
                          <div className="pt-1 text-xs font-medium text-rose-700">
                            겹치는 팝업: {conflictTitles.join(", ")}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500">
                        드래그해서 순서 변경
                      </div>

                      <button
                        type="button"
                        onClick={() => applyItemToForm(item)}
                        disabled={isDeleting}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        수정하기
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDelete(item)}
                        disabled={isDeleting}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isDeleting ? "삭제 중..." : "삭제하기"}
                      </button>
                    </div>
                  </div>

                  {item.imageUrl ? (
                    <div className="mt-3 break-all text-xs text-slate-400">
                      {item.imageUrl}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
