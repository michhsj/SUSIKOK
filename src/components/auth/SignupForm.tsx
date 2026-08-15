"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

type InitialSidoOption = {
  label: string;
  value: string;
};

type SignupFormProps = {
  initialSidoOptions: InitialSidoOption[];
};

type Option = {
  label: string;
  value: string;
};

type SchoolItem = {
  schoolId: string;
  sido: string;
  sigungu: string;
  schoolName: string;
  schoolCode: string;
};

type SignupFormState = {
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  sido: string;
  sigungu: string;
  gradeLevel: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  termsConsent: boolean;
  privacyConsent: boolean;
  marketingConsent: boolean;
};

type MessageTone = "success" | "error" | "info";

type PageMessage = {
  tone: MessageTone;
  text: string;
} | null;

type ApiEnvelope = {
  success?: boolean;
  data?: unknown;
  items?: unknown;
  results?: unknown;
  schools?: unknown;
  sigunguList?: unknown;
  options?: unknown;
  message?: string;
  [key: string]: unknown;
};

const LEGACY_CONSENT_STORAGE_KEY = "susikok_signup_consents";
const SIGNUP_FLOW_QUERY_KEY = "flow";
const SIGNUP_DRAFT_STORAGE_KEY_PREFIX = "susikok_signup_draft";

const initialFormState: SignupFormState = {
  schoolId: "",
  schoolName: "",
  schoolCode: "",
  sido: "",
  sigungu: "",
  gradeLevel: "",
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  termsConsent: false,
  privacyConsent: false,
  marketingConsent: false,
};

const inputClassName =
  "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

const sectionClassName =
  "rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:p-6";

function toTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function extractArrayPayload(input: unknown, preferredKeys: string[] = []): unknown[] {
  if (Array.isArray(input)) {
    return input;
  }

  if (!input || typeof input !== "object") {
    return [];
  }

  const obj = input as Record<string, unknown>;
  const candidateKeys = [
    ...preferredKeys,
    "data",
    "items",
    "results",
    "schools",
    "sigunguList",
    "options",
    "list",
  ];

  for (const key of candidateKeys) {
    const candidate = obj[key];

    if (Array.isArray(candidate)) {
      return candidate;
    }

    if (candidate && typeof candidate === "object") {
      const nested = extractArrayPayload(candidate, preferredKeys);
      if (nested.length > 0) {
        return nested;
      }
    }
  }

  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) {
      return value;
    }
  }

  for (const value of Object.values(obj)) {
    if (value && typeof value === "object") {
      const nested = extractArrayPayload(value, preferredKeys);
      if (nested.length > 0) {
        return nested;
      }
    }
  }

  return [];
}

function normalizeOptionArray(input: unknown): Option[] {
  const items = extractArrayPayload(input);

  return items
    .map((item) => {
      if (typeof item === "string") {
        const value = item.trim();
        if (!value) return null;
        return { label: value, value };
      }

      if (!item || typeof item !== "object") {
        return null;
      }

      const obj = item as Record<string, unknown>;

      const value = toTrimmedString(
        obj.value ?? obj.label ?? obj.sigungu ?? obj.name ?? obj.text
      );
      const label = toTrimmedString(
        obj.label ?? obj.value ?? obj.sigungu ?? obj.name ?? obj.text ?? value
      );

      if (!value || !label) return null;

      return {
        label,
        value,
      };
    })
    .filter((item): item is Option => item !== null);
}

function normalizeSchoolArray(input: unknown): SchoolItem[] {
  const items = extractArrayPayload(input);

  return items
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const obj = item as Record<string, unknown>;

      const schoolId = toTrimmedString(
        obj.schoolId ?? obj.id ?? obj.value
      );
      const sido = toTrimmedString(obj.sido ?? obj.sidoName);
      const sigungu = toTrimmedString(obj.sigungu ?? obj.sigunguName);
      const schoolName = toTrimmedString(
        obj.schoolName ?? obj.name ?? obj.label
      );
      const schoolCode = toTrimmedString(
        obj.schoolCode ?? obj.school_code ?? obj.code
      );

      if (!schoolId || !schoolName) return null;

      return {
        schoolId,
        sido,
        sigungu,
        schoolName,
        schoolCode,
      };
    })
    .filter((item): item is SchoolItem => item !== null);
}

async function fetchApi(url: string): Promise<unknown> {
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  const json = (await response.json().catch(() => null)) as ApiEnvelope | unknown;

  if (!response.ok) {
    const message =
      json && typeof json === "object" && "message" in json
        ? toTrimmedString((json as ApiEnvelope).message)
        : "";
    throw new Error(message || "데이터를 불러오지 못했습니다.");
  }

  if (json && typeof json === "object" && "success" in json) {
    const envelope = json as ApiEnvelope;

    if (envelope.success === false) {
      throw new Error(envelope.message || "데이터를 불러오지 못했습니다.");
    }
  }

  return json;
}

function createSignupFlowId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `signup_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function getSignupDraftStorageKey(flowId: string) {
  return `${SIGNUP_DRAFT_STORAGE_KEY_PREFIX}:${flowId}`;
}

function normalizeStoredDraft(input: unknown): SignupFormState | null {
  if (!input || typeof input !== "object") return null;

  const obj = input as Record<string, unknown>;

  return {
    schoolId: String(obj.schoolId ?? ""),
    schoolName: String(obj.schoolName ?? ""),
    schoolCode: String(obj.schoolCode ?? ""),
    sido: String(obj.sido ?? ""),
    sigungu: String(obj.sigungu ?? ""),
    gradeLevel: String(obj.gradeLevel ?? ""),
    name: String(obj.name ?? ""),
    email: String(obj.email ?? ""),
    password: String(obj.password ?? ""),
    confirmPassword: String(obj.confirmPassword ?? ""),
    termsConsent: obj.termsConsent === true,
    privacyConsent: obj.privacyConsent === true,
    marketingConsent: obj.marketingConsent === true,
  };
}

function readStoredDraft(flowId: string): SignupFormState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(getSignupDraftStorageKey(flowId));
    if (!raw) return null;

    return normalizeStoredDraft(JSON.parse(raw));
  } catch {
    return null;
  }
}

export default function SignupForm({ initialSidoOptions }: SignupFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentFlowId = searchParams.get(SIGNUP_FLOW_QUERY_KEY)?.trim() ?? "";

  const [flowId, setFlowId] = useState(currentFlowId);
  const [draftReadyFlowId, setDraftReadyFlowId] = useState("");

  const [form, setForm] = useState<SignupFormState>(initialFormState);
  const [pageMessage, setPageMessage] = useState<PageMessage>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [sigunguOptions, setSigunguOptions] = useState<Option[]>([]);
  const [schoolOptions, setSchoolOptions] = useState<SchoolItem[]>([]);

  const [isLoadingSigungu, setIsLoadingSigungu] = useState(false);
  const [isLoadingSchools, setIsLoadingSchools] = useState(false);

  const [sigunguError, setSigunguError] = useState("");
  const [schoolError, setSchoolError] = useState("");

  const sidoRef = useRef<HTMLSelectElement | null>(null);

  const termsHref = flowId
    ? `/terms?${SIGNUP_FLOW_QUERY_KEY}=${encodeURIComponent(flowId)}`
    : "/terms";
  const privacyHref = flowId
    ? `/privacy?${SIGNUP_FLOW_QUERY_KEY}=${encodeURIComponent(flowId)}`
    : "/privacy";
  const marketingHref = flowId
    ? `/marketing?${SIGNUP_FLOW_QUERY_KEY}=${encodeURIComponent(flowId)}`
    : "/marketing";

  useLayoutEffect(() => {
    const domSido = sidoRef.current?.value?.trim() ?? "";

    if (!domSido) {
      return;
    }

    setForm((prev) => {
      if (prev.sido === domSido) {
        return prev;
      }

      return {
        ...prev,
        sido: domSido,
        sigungu: "",
        schoolId: "",
        schoolName: "",
        schoolCode: "",
      };
    });
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LEGACY_CONSENT_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (currentFlowId) {
      setFlowId(currentFlowId);
      return;
    }

    const nextFlowId = createSignupFlowId();
    setFlowId(nextFlowId);
    router.replace(
      `/signup?${SIGNUP_FLOW_QUERY_KEY}=${encodeURIComponent(nextFlowId)}`,
      { scroll: false }
    );
  }, [currentFlowId, router]);

  useEffect(() => {
    if (!flowId) return;

    const storedDraft = readStoredDraft(flowId);

    setDraftReadyFlowId("");
    setForm(storedDraft ?? initialFormState);
    setDraftReadyFlowId(flowId);
  }, [flowId]);

  useEffect(() => {
    if (!flowId || draftReadyFlowId !== flowId || typeof window === "undefined") {
      return;
    }

    try {
      window.sessionStorage.setItem(
        getSignupDraftStorageKey(flowId),
        JSON.stringify(form)
      );
    } catch {
      // ignore storage write failure
    }
  }, [draftReadyFlowId, flowId, form]);

  useEffect(() => {
    if (!form.sido) {
      setSigunguOptions([]);
      setSchoolOptions([]);
      setSigunguError("");
      setSchoolError("");
      setIsLoadingSigungu(false);
      setIsLoadingSchools(false);
      return;
    }

    let cancelled = false;

    async function loadSigungu() {
      setIsLoadingSigungu(true);
      setSigunguError("");
      setSigunguOptions([]);
      setSchoolOptions([]);
      setSchoolError("");
      setIsLoadingSchools(false);

      try {
        const raw = await fetchApi(
          `/api/schools?type=sigungu&sido=${encodeURIComponent(form.sido)}`
        );

        if (cancelled) return;

        const options = normalizeOptionArray(raw);
        setSigunguOptions(options);

        if (options.length === 0) {
          setSigunguError("해당 시/도에 대한 시/군/구 정보가 없습니다.");
        }
      } catch (error) {
        if (cancelled) return;

        setSigunguError(
          error instanceof Error
            ? error.message
            : "시/군/구 정보를 불러오지 못했습니다."
        );
      } finally {
        if (!cancelled) {
          setIsLoadingSigungu(false);
        }
      }
    }

    void loadSigungu();

    return () => {
      cancelled = true;
    };
  }, [form.sido]);

  useEffect(() => {
    if (!form.sido || !form.sigungu) {
      setSchoolOptions([]);
      setSchoolError("");
      setIsLoadingSchools(false);
      return;
    }

    let cancelled = false;

    async function loadSchools() {
      setIsLoadingSchools(true);
      setSchoolError("");
      setSchoolOptions([]);

      try {
        const raw = await fetchApi(
          `/api/schools?type=schools&sido=${encodeURIComponent(
            form.sido
          )}&sigungu=${encodeURIComponent(form.sigungu)}`
        );

        if (cancelled) return;

        const schools = normalizeSchoolArray(raw);
        setSchoolOptions(schools);

        if (schools.length === 0) {
          setSchoolError("해당 지역의 학교 정보가 없습니다.");
        }
      } catch (error) {
        if (cancelled) return;

        setSchoolError(
          error instanceof Error
            ? error.message
            : "학교 정보를 불러오지 못했습니다."
        );
      } finally {
        if (!cancelled) {
          setIsLoadingSchools(false);
        }
      }
    }

    void loadSchools();

    return () => {
      cancelled = true;
    };
  }, [form.sido, form.sigungu]);

  const canSubmit = useMemo(() => {
    return (
      !!form.schoolId &&
      !!form.gradeLevel &&
      !!form.name.trim() &&
      !!form.email.trim() &&
      !!form.password &&
      !!form.confirmPassword &&
      form.termsConsent &&
      form.privacyConsent &&
      !isSubmitting
    );
  }, [form, isSubmitting]);

  const completionCount = useMemo(() => {
    let count = 0;
    if (form.schoolId) count += 1;
    if (form.gradeLevel) count += 1;
    if (form.name.trim()) count += 1;
    if (form.email.trim()) count += 1;
    if (form.password) count += 1;
    if (form.confirmPassword) count += 1;
    if (form.termsConsent) count += 1;
    if (form.privacyConsent) count += 1;
    return count;
  }, [form]);

  const handleSidoChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const nextSido = e.currentTarget.value;

    setForm((prev) => ({
      ...prev,
      sido: nextSido,
      sigungu: "",
      schoolId: "",
      schoolName: "",
      schoolCode: "",
    }));

    setPageMessage((prev) => (prev?.tone === "error" ? null : prev));
  };

  const handleSigunguChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const nextSigungu = e.currentTarget.value;

    setForm((prev) => ({
      ...prev,
      sigungu: nextSigungu,
      schoolId: "",
      schoolName: "",
      schoolCode: "",
    }));

    setPageMessage((prev) => (prev?.tone === "error" ? null : prev));
  };

  const handleSchoolChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const nextSchoolId = e.currentTarget.value;
    const school = schoolOptions.find((item) => item.schoolId === nextSchoolId);

    if (!school) {
      setForm((prev) => ({
        ...prev,
        schoolId: "",
        schoolName: "",
        schoolCode: "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      schoolId: school.schoolId,
      schoolName: school.schoolName,
      schoolCode: school.schoolCode,
      sido: school.sido || prev.sido,
      sigungu: school.sigungu || prev.sigungu,
    }));

    setPageMessage((prev) => (prev?.tone === "error" ? null : prev));
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    const name = target.name as keyof SignupFormState;

    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      setForm((prev) => ({
        ...prev,
        [name]: target.checked,
      }));

      if (pageMessage?.tone === "error") {
        setPageMessage(null);
      }
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: target.value,
    }));

    if (pageMessage?.tone === "error") {
      setPageMessage(null);
    }
  };

  const validateForm = () => {
    if (!form.schoolId) return "학교를 먼저 선택해 주세요.";
    if (!form.gradeLevel) return "학년을 선택해 주세요.";
    if (!form.name.trim()) return "이름을 입력해 주세요.";
    if (!form.email.trim()) return "이메일을 입력해 주세요.";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      return "올바른 이메일 형식을 입력해 주세요.";
    }

    if (!form.password) return "비밀번호를 입력해 주세요.";
    if (form.password.length < 8) return "비밀번호는 8자 이상 입력해 주세요.";
    if (!form.confirmPassword) return "비밀번호 확인을 입력해 주세요.";
    if (form.password !== form.confirmPassword) {
      return "비밀번호와 비밀번호 확인이 일치하지 않습니다.";
    }

    if (!form.termsConsent || !form.privacyConsent) {
      return "필수 약관에 동의해 주세요.";
    }

    return "";
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setPageMessage(null);

    const validationMessage = validateForm();
    if (validationMessage) {
      setPageMessage({
        tone: "error",
        text: validationMessage,
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schoolId: form.schoolId,
          gradeLevel: Number(form.gradeLevel),
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          passwordConfirm: form.confirmPassword,
          termsConsent: form.termsConsent,
          privacyConsent: form.privacyConsent,
          marketingConsent: form.marketingConsent,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || "회원가입 처리 중 오류가 발생했습니다.");
      }

      if (typeof window !== "undefined") {
        window.localStorage.removeItem(LEGACY_CONSENT_STORAGE_KEY);

        if (flowId) {
          window.sessionStorage.removeItem(getSignupDraftStorageKey(flowId));
        }
      }

      setPageMessage({
        tone: "success",
        text: "회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.",
      });

      setForm(initialFormState);
      setSigunguOptions([]);
      setSchoolOptions([]);
      setSigunguError("");
      setSchoolError("");

      window.setTimeout(() => {
        router.push("/login");
      }, 900);
    } catch (error) {
      setPageMessage({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "회원가입 처리 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-[36px] border border-slate-200/80 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
      <div className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(135deg,#eef4ff_0%,#f8fbff_45%,#f8fafc_100%)] px-5 py-7 sm:px-7 sm:py-8 lg:px-10">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-indigo-100/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-sky-100/40 blur-3xl" />

        <div className="relative">
          <div className="inline-flex items-center rounded-full border border-indigo-100 bg-white/90 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-indigo-600 shadow-sm">
            SusiKOK Membership
          </div>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                학생 회원가입 정보 입력
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                학교 정보와 기본 정보를 입력하고 약관에 동의하면 회원가입을 완료할 수 있습니다.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:min-w-[340px]">
              <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Step 1
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">학교 선택</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Step 2
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">기본 정보</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Step 3
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">약관 동의</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] p-5 sm:p-7 lg:p-8">
        {pageMessage ? (
          <div
            className={[
              "mb-6 rounded-2xl border px-4 py-4 text-sm font-semibold leading-6 shadow-sm",
              pageMessage.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : pageMessage.tone === "error"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-blue-200 bg-blue-50 text-blue-700",
            ].join(" ")}
          >
            {pageMessage.text}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className={sectionClassName}>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-extrabold text-white shadow-sm">
                  01
                </div>
                <h3 className="mt-3 text-lg font-extrabold text-slate-950">
                  학교 정보
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  시/도, 시/군/구, 학교를 순서대로 선택하고 현재 학년을 입력해 주세요.
                </p>
              </div>

              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
                <p className="font-bold">입력 진행 상태</p>
                <p className="mt-1 text-indigo-700">
                  필수 항목 {completionCount}/8 완료
                </p>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label htmlFor="sido" className="text-sm font-bold text-slate-700">
                    시/도
                  </label>
                  <select
                    ref={sidoRef}
                    id="sido"
                    value={form.sido}
                    onChange={handleSidoChange}
                    className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                  >
                    <option value="">
                      {initialSidoOptions.length > 0 ? "시/도 선택" : "시/도 정보 없음"}
                    </option>
                    {initialSidoOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="sigungu" className="text-sm font-bold text-slate-700">
                    시/군/구
                  </label>
                  <select
                    id="sigungu"
                    value={form.sigungu}
                    onChange={handleSigunguChange}
                    disabled={!form.sido}
                    className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition disabled:bg-slate-100 disabled:text-slate-400 focus:border-blue-500"
                  >
                    <option value="">
                      {!form.sido
                        ? "시/도를 먼저 선택하세요"
                        : isLoadingSigungu
                        ? "불러오는 중..."
                        : sigunguOptions.length > 0
                        ? "시/군/구 선택"
                        : "시/군/구 정보 없음"}
                    </option>
                    {sigunguOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {sigunguError ? (
                    <p className="text-xs font-medium text-rose-600">{sigunguError}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label htmlFor="school" className="text-sm font-bold text-slate-700">
                    학교
                  </label>
                  <select
                    id="school"
                    value={form.schoolId}
                    onChange={handleSchoolChange}
                    disabled={!form.sido || !form.sigungu}
                    className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition disabled:bg-slate-100 disabled:text-slate-400 focus:border-blue-500"
                  >
                    <option value="">
                      {!form.sido
                        ? "시/도를 먼저 선택하세요"
                        : !form.sigungu
                        ? "시/군/구를 먼저 선택하세요"
                        : isLoadingSchools
                        ? "불러오는 중..."
                        : schoolOptions.length > 0
                        ? "학교 선택"
                        : "학교 정보 없음"}
                    </option>
                    {schoolOptions.map((school) => (
                      <option key={school.schoolId} value={school.schoolId}>
                        {school.schoolName}
                      </option>
                    ))}
                  </select>
                  {schoolError ? (
                    <p className="text-xs font-medium text-rose-600">{schoolError}</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div>
                <label
                  htmlFor="gradeLevel"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  학년
                </label>
                <select
                  id="gradeLevel"
                  name="gradeLevel"
                  value={form.gradeLevel}
                  onChange={handleInputChange}
                  className={inputClassName}
                >
                  <option value="">학년 선택</option>
                  <option value="1">1학년</option>
                  <option value="2">2학년</option>
                  <option value="3">3학년</option>
                  <option value="4">N수/기타</option>
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    학교명
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {form.schoolName || "선택 전"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    지역
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {form.sido && form.sigungu
                      ? `${form.sido} / ${form.sigungu}`
                      : "선택 전"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    학교 코드
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {form.schoolCode || "-"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-5">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-extrabold text-white shadow-sm">
                02
              </div>
              <h3 className="mt-3 text-lg font-extrabold text-slate-950">
                기본 정보
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                로그인에 사용할 이메일과 비밀번호를 입력해 주세요.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-bold text-slate-700">
                  이름
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="이름을 입력해 주세요"
                  className={inputClassName}
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-700">
                  이메일
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleInputChange}
                  placeholder="example@email.com"
                  className={inputClassName}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  비밀번호
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleInputChange}
                  placeholder="8자 이상 입력"
                  className={inputClassName}
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  비밀번호 확인
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="비밀번호를 다시 입력해 주세요"
                  className={inputClassName}
                />
              </div>
            </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-5">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-extrabold text-white shadow-sm">
                03
              </div>
              <h3 className="mt-3 text-lg font-extrabold text-slate-950">
                약관 동의
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                각 상세 페이지에서 내용을 확인한 뒤 맨 아래의 동의하기 버튼을 눌러주세요.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <input
                  type="checkbox"
                  checked={form.termsConsent}
                  readOnly
                  disabled
                  className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 disabled:opacity-100"
                />
                <div className="min-w-0 overflow-x-auto">
                  <div className="flex items-center gap-2 whitespace-nowrap text-sm leading-6 text-slate-700">
                    <span>
                      <strong className="text-slate-900">[필수]</strong> 이용약관에 동의합니다.
                    </span>
                    <a
                      href={termsHref}
                      className="shrink-0 font-semibold text-indigo-600 hover:underline"
                    >
                      자세히 보기
                    </a>
                    <span
                      className={[
                        "shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold",
                        form.termsConsent
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600",
                      ].join(" ")}
                    >
                      {form.termsConsent ? "동의 완료" : "약관 페이지에서 동의 필요"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <input
                  type="checkbox"
                  checked={form.privacyConsent}
                  readOnly
                  disabled
                  className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 disabled:opacity-100"
                />
                <div className="min-w-0 overflow-x-auto">
                  <div className="flex items-center gap-2 whitespace-nowrap text-sm leading-6 text-slate-700">
                    <span>
                      <strong className="text-slate-900">[필수]</strong> 개인정보 수집·이용에 동의합니다.
                    </span>
                    <a
                      href={privacyHref}
                      className="shrink-0 font-semibold text-indigo-600 hover:underline"
                    >
                      자세히 보기
                    </a>
                    <span
                      className={[
                        "shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold",
                        form.privacyConsent
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600",
                      ].join(" ")}
                    >
                      {form.privacyConsent ? "동의 완료" : "안내 페이지에서 동의 필요"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <input
                  type="checkbox"
                  checked={form.marketingConsent}
                  readOnly
                  disabled
                  className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 disabled:opacity-100"
                />
                <div className="min-w-0 overflow-x-auto">
                  <div className="flex items-center gap-2 whitespace-nowrap text-sm leading-6 text-slate-700">
                    <span>
                      <strong className="text-slate-900">[선택]</strong> 마케팅 정보 수신에 동의합니다.
                    </span>
                    <a
                      href={marketingHref}
                      className="shrink-0 font-semibold text-indigo-600 hover:underline"
                    >
                      자세히 보기
                    </a>
                    <span
                      className={[
                        "shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold",
                        form.marketingConsent
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600",
                      ].join(" ")}
                    >
                      {form.marketingConsent ? "동의 완료" : "선택 사항"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-base font-extrabold text-slate-950">
                  회원가입 준비가 거의 완료되었습니다
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  필수 정보를 입력하고 약관에 동의하면 바로 가입할 수 있습니다.
                </p>
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#4f46e5_0%,#2563eb_100%)] px-6 text-sm font-extrabold text-white shadow-[0_16px_32px_rgba(37,99,235,0.22)] transition hover:translate-y-[-1px] hover:shadow-[0_20px_40px_rgba(37,99,235,0.28)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[200px]"
              >
                {isSubmitting ? "가입 처리 중..." : "회원가입 완료"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
