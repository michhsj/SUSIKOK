export const SUPPORT_LEVEL_VALUES = [
  "CHALLENGE",
  "UPWARD",
  "STABLE",
  "FIT",
  "DOWNWARD",
] as const;

export type SupportLevel = (typeof SUPPORT_LEVEL_VALUES)[number];

export const SUPPORT_LEVEL_LABEL: Record<SupportLevel, string> = {
  CHALLENGE: "도전",
  UPWARD: "상향",
  STABLE: "안정",
  FIT: "적정",
  DOWNWARD: "하향",
};

export const SUPPORT_LEVEL_TONE: Record<SupportLevel, string> = {
  CHALLENGE: "border-rose-200 bg-rose-50 text-rose-700",
  UPWARD: "border-amber-200 bg-amber-50 text-amber-700",
  STABLE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  FIT: "border-blue-200 bg-blue-50 text-blue-700",
  DOWNWARD: "border-slate-200 bg-slate-100 text-slate-700",
};

export function isSupportLevel(value: unknown): value is SupportLevel {
  return (
    typeof value === "string" &&
    (SUPPORT_LEVEL_VALUES as readonly string[]).includes(value)
  );
}

export function getSupportLevelLabel(level?: string | null): string {
  if (!isSupportLevel(level)) return "-";
  return SUPPORT_LEVEL_LABEL[level];
}

export function getSupportLevelTone(level?: string | null): string {
  if (!isSupportLevel(level)) {
    return "border-slate-200 bg-slate-100 text-slate-500";
  }

  return SUPPORT_LEVEL_TONE[level];
}

export function getSupportLevelOptions() {
  return SUPPORT_LEVEL_VALUES.map((value) => ({
    value,
    label: SUPPORT_LEVEL_LABEL[value],
  }));
}
