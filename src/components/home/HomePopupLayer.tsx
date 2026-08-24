"use client";

import { useEffect, useMemo, useState } from "react";

export type HomePopupItem = {
  id: string;
  enabled: boolean;
  imageUrl: string;
  width: number;
  height: number;
  positionX: number;
  positionY: number;
  todayHideEnabled: boolean;
  sortOrder: number;
  updatedAt: string;
};

type HomePopupLayerProps = {
  popups: HomePopupItem[];
};

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getRuntimeKey(popup: HomePopupItem) {
  return `${popup.id}:${popup.updatedAt}`;
}

function getHideTodayStorageKey(popup: HomePopupItem) {
  return `home-popup-hide:${popup.id}:${popup.updatedAt}:${getTodayString()}`;
}

export default function HomePopupLayer({ popups }: HomePopupLayerProps) {
  const [mounted, setMounted] = useState(false);
  const [hiddenRuntimeKeys, setHiddenRuntimeKeys] = useState<string[]>([]);

  useEffect(() => {
    const nextHiddenKeys: string[] = [];

    for (const popup of popups) {
      if (!popup.todayHideEnabled) continue;

      const storageKey = getHideTodayStorageKey(popup);
      const isHiddenToday = window.localStorage.getItem(storageKey) === "1";

      if (isHiddenToday) {
        nextHiddenKeys.push(getRuntimeKey(popup));
      }
    }

    setHiddenRuntimeKeys(nextHiddenKeys);
    setMounted(true);
  }, [popups]);

  function hideForSession(runtimeKey: string) {
    setHiddenRuntimeKeys((prev) => {
      if (prev.includes(runtimeKey)) return prev;
      return [...prev, runtimeKey];
    });
  }

  function hideForToday(popup: HomePopupItem) {
    const storageKey = getHideTodayStorageKey(popup);
    window.localStorage.setItem(storageKey, "1");
    hideForSession(getRuntimeKey(popup));
  }

  const visiblePopups = useMemo(() => {
    if (!mounted) return [];

    return popups.filter((popup) => {
      const runtimeKey = getRuntimeKey(popup);
      return !hiddenRuntimeKeys.includes(runtimeKey);
    });
  }, [mounted, popups, hiddenRuntimeKeys]);

  if (!mounted || visiblePopups.length === 0) {
    return null;
  }

  return (
    <>
      {visiblePopups.map((popup, index) => {
        const runtimeKey = getRuntimeKey(popup);

        return (
          <div
            key={runtimeKey}
            className="pointer-events-none fixed"
            style={{
              left: popup.positionX,
              top: popup.positionY,
              zIndex: 3000 + (visiblePopups.length - index),
            }}
          >
            <div
              className="pointer-events-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]"
              style={{
                width: popup.width,
                height: popup.height,
              }}
            >
              <div className="flex h-full flex-col">
                <div className="min-h-0 flex-1 bg-white">
                  <img
                    src={popup.imageUrl}
                    alt="메인 페이지 팝업"
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-white px-3 py-3">
                  {popup.todayHideEnabled ? (
                    <button
                      type="button"
                      onClick={() => hideForToday(popup)}
                      className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      오늘 하루 보지 않기
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => hideForSession(runtimeKey)}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
