"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type LoginFormState = {
  email: string;
  password: string;
};

type MessageTone = "success" | "error" | "info";

type PageMessage = {
  tone: MessageTone;
  text: string;
} | null;

const initialFormState: LoginFormState = {
  email: "",
  password: "",
};

const inputClassName =
  "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

export default function LoginForm() {
  const router = useRouter();

  const [form, setForm] = useState<LoginFormState>(initialFormState);
  const [pageMessage, setPageMessage] = useState<PageMessage>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (pageMessage?.tone === "error") {
      setPageMessage(null);
    }
  };

  const validateForm = (email: string, password: string) => {
    if (!email.trim()) {
      return "이메일을 입력해 주세요.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "올바른 이메일 형식을 입력해 주세요.";
    }

    if (!password) {
      return "비밀번호를 입력해 주세요.";
    }

    return "";
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    setPageMessage(null);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    const validationMessage = validateForm(email, password);
    if (validationMessage) {
      setPageMessage({
        tone: "error",
        text: validationMessage,
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || "로그인 처리 중 오류가 발생했습니다.");
      }

      setPageMessage({
        tone: "success",
        text: "로그인되었습니다. 개인 대시보드로 이동합니다.",
      });

      window.setTimeout(() => {
        router.push("/dashboard");
      }, 700);
    } catch (error) {
      setPageMessage({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "로그인 처리 중 오류가 발생했습니다.",
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
            SusiKOK Login
          </div>

          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
            로그인
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
            회원가입 시 사용한 이메일과 비밀번호를 입력해 주세요.
          </p>
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
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:p-6">
            <div className="mb-5">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-extrabold text-white shadow-sm">
                01
              </div>
              <h2 className="mt-3 text-lg font-extrabold text-slate-950">
                계정 정보 입력
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                이메일과 비밀번호를 입력한 뒤 로그인해 주세요.
              </p>
            </div>

            <div className="grid gap-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  이메일
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
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
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleInputChange}
                  placeholder="비밀번호를 입력해 주세요"
                  className={inputClassName}
                />
              </div>
            </div>
          </section>

          <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-base font-extrabold text-slate-950">
                  계정 정보를 확인한 뒤 로그인하세요
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  로그인 후 개인 대시보드로 이동합니다.
                </p>
              </div>

              <button
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#4f46e5_0%,#2563eb_100%)] px-6 text-sm font-extrabold text-white shadow-[0_16px_32px_rgba(37,99,235,0.22)] transition hover:translate-y-[-1px] hover:shadow-[0_20px_40px_rgba(37,99,235,0.28)] sm:w-auto sm:min-w-[180px]"
              >
                {isSubmitting ? "로그인 처리 중..." : "로그인"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
