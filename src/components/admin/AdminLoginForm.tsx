"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type MessageTone = "success" | "error" | "info";
type PageMessage = {
  tone: MessageTone;
  text: string;
} | null;

export default function AdminLoginForm() {
  const router = useRouter();

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageMessage, setPageMessage] = useState<PageMessage>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!loginId.trim() || !password.trim()) {
      setPageMessage({
        tone: "error",
        text: "아이디와 비밀번호를 모두 입력해주세요.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setPageMessage(null);

      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ loginId, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setPageMessage({
          tone: "error",
          text: result.message ?? "관리자 로그인에 실패했습니다.",
        });
        return;
      }

      setPageMessage({
        tone: "success",
        text: "관리자 로그인에 성공했습니다. 이동 중입니다.",
      });

      setTimeout(() => {
        router.push("/admin");
      }, 500);
    } catch (error) {
      console.error("[AdminLoginForm] 로그인 오류:", error);
      setPageMessage({
        tone: "error",
        text: "로그인 처리 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
    >
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold tracking-[0.18em] text-slate-500">
          ADMIN
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          관리자 로그인
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          관리자 전용 페이지입니다. 미리 설정된 계정으로만 접근할 수 있습니다.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            관리자 아이디
          </label>
          <input
            type="text"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
            placeholder="관리자 아이디"
            autoComplete="username"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            비밀번호
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
            placeholder="비밀번호"
            autoComplete="current-password"
          />
        </div>
      </div>

      {pageMessage && (
        <div
          className={`mt-5 rounded-xl px-4 py-3 text-sm ${
            pageMessage.tone === "success"
              ? "bg-emerald-50 text-emerald-700"
              : pageMessage.tone === "error"
              ? "bg-rose-50 text-rose-700"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {pageMessage.text}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? "로그인 중..." : "관리자 로그인"}
      </button>
    </form>
  );
}
