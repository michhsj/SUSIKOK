'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

type HakjongFitDomainSummary = {
  domain: string;
  rawScore: number;
  convertedScore: number;
  rawMaxScore: number;
  convertedMaxScore: number;
};

type HakjongFitSummaryPayload =
  | {
      success: true;
      hasResult: true;
      submissionId: string;
      version?: string;
      totalQuestionCount: number;
      completedQuestionCount: number;
      completedAt?: string | null;
      resultSummary: {
        domains: HakjongFitDomainSummary[];
      };
    }
  | {
      success: true;
      hasResult: false;
    }
  | {
      success: false;
      message: string;
    };

type HakjongFitStartPayload =
  | {
      success: true;
      submissionId: string;
      version?: string;
      totalQuestionCount: number;
      currentQuestionOrder: number;
      completedQuestionCount: number;
      completed?: boolean;
      reused?: boolean;
      locked?: boolean;
    }
  | {
      success: false;
      message: string;
    };

type CurrentQuestion = {
  displayOrder: number;
  questionText: string;
  choice1Label: string;
  choice2Label: string;
  choice3Label: string;
  choice4Label: string;
  choice5Label: string;
};

type HakjongFitCurrentPayload =
  | {
      success: true;
      completed?: boolean;
      submissionId?: string;
      totalQuestionCount?: number;
      currentQuestionOrder?: number;
      completedQuestionCount?: number;
      progress?: {
        totalQuestionCount?: number;
        currentQuestionOrder?: number;
        completedQuestionCount?: number;
      };
      currentQuestion?: Partial<CurrentQuestion>;
      question?: Partial<CurrentQuestion>;
      resultSummary?: {
        domains: HakjongFitDomainSummary[];
      };
    }
  | {
      success: false;
      message: string;
    };

type HakjongFitAnswerPayload =
  | {
      success: true;
      completed: boolean;
      currentQuestionOrder?: number;
      completedQuestionCount?: number;
    }
  | {
      success: false;
      message: string;
    };

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function formatScore(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '-';
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function formatDateTime(value?: string | null): string {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function extractMessage(payload: unknown, fallback: string) {
  if (
    payload &&
    typeof payload === 'object' &&
    'message' in payload &&
    typeof (payload as { message?: unknown }).message === 'string'
  ) {
    return (payload as { message: string }).message;
  }

  return fallback;
}

function normalizeCurrentQuestion(payload: HakjongFitCurrentPayload): CurrentQuestion | null {
  if (!payload || typeof payload !== 'object' || !('success' in payload) || payload.success !== true) {
    return null;
  }

  const source = payload.currentQuestion ?? payload.question;
  if (!source) return null;

  const displayOrder =
    toNumber(source.displayOrder) ??
    toNumber(payload.currentQuestionOrder) ??
    toNumber(payload.progress?.currentQuestionOrder) ??
    1;

  const questionText = String(source.questionText ?? '').trim();
  const choice1Label = String(source.choice1Label ?? '').trim();
  const choice2Label = String(source.choice2Label ?? '').trim();
  const choice3Label = String(source.choice3Label ?? '').trim();
  const choice4Label = String(source.choice4Label ?? '').trim();
  const choice5Label = String(source.choice5Label ?? '').trim();

  if (!questionText) return null;

  return {
    displayOrder,
    questionText,
    choice1Label,
    choice2Label,
    choice3Label,
    choice4Label,
    choice5Label,
  };
}

function ProgressCard({
  totalQuestionCount,
  completedQuestionCount,
  currentQuestionOrder,
  isCompleted,
}: {
  totalQuestionCount: number;
  completedQuestionCount: number;
  currentQuestionOrder: number;
  isCompleted: boolean;
}) {
  const safeTotal = totalQuestionCount > 0 ? totalQuestionCount : 100;
  const safeCompleted = clamp(completedQuestionCount, 0, safeTotal);
  const progressPercent = clamp((safeCompleted / safeTotal) * 100, 0, 100);
  const displayOrder = clamp(currentQuestionOrder, 1, safeTotal);

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">검사 진행률</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">
            {safeCompleted} / {safeTotal}
          </h2>
        </div>

        <div
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold ${
            isCompleted
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-blue-50 text-blue-700'
          }`}
        >
          {isCompleted ? '검사 완료' : `${displayOrder}번 문항 진행 중`}
        </div>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#2563eb_0%,#60a5fa_100%)] transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>진행률 {progressPercent.toFixed(0)}%</span>
        <span>{isCompleted ? '최종 완료 결과' : '문항 응답 진행 중'}</span>
      </div>
    </section>
  );
}

function ResultChart({
  domains,
}: {
  domains: HakjongFitDomainSummary[];
}) {
  const hasData = domains.length > 0;

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-500">학종 적합성 결과 그래프</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">
            영역별 결과
          </h2>
        </div>

        <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
          최종 완료 결과
        </div>
      </div>

      <div className="mt-6">
        {hasData ? (
          <div className="flex h-[230px] gap-3 sm:h-[250px]">
            <div className="flex h-full w-8 shrink-0 flex-col justify-between pb-5 text-[11px] font-semibold text-slate-400">
              {[100, 80, 60, 40, 20, 0].map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>

            <div className="relative min-w-0 flex-1">
              {[0, 20, 40, 60, 80, 100].map((line) => (
                <div
                  key={line}
                  className="absolute inset-x-0 border-t border-slate-200"
                  style={{ top: `${100 - line}%` }}
                />
              ))}

              <div className="relative flex h-full items-end justify-between gap-2 px-1 sm:gap-4 sm:px-2">
                {domains.map((item) => {
                  const ratio =
                    item.convertedMaxScore > 0
                      ? (item.convertedScore / item.convertedMaxScore) * 100
                      : 0;

                  const barHeight = clamp(ratio, 0, 100);

                  return (
                    <div
                      key={item.domain}
                      className="flex flex-1 flex-col items-center justify-end"
                    >
                      <div className="mb-2 text-[11px] font-extrabold text-blue-700">
                        {formatScore(item.convertedScore)}
                      </div>

                      <div className="relative flex h-[168px] w-full max-w-[74px] items-end overflow-hidden rounded-t-[18px] bg-slate-100 shadow-inner sm:h-[180px] sm:max-w-[88px]">
                        <div
                          className="w-full rounded-t-[18px] bg-[linear-gradient(180deg,#bfdbfe_0%,#60a5fa_28%,#2563eb_62%,#1d4ed8_100%)] transition-all duration-500"
                          style={{ height: `${barHeight}%` }}
                        />
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-white/20" />
                      </div>

                      <div className="mt-3 text-center">
                        <p className="break-keep text-[12px] font-extrabold text-slate-700">
                          {item.domain}
                        </p>
                        <p className="mt-1 text-[11px] font-semibold text-slate-400">
                          {formatScore(item.convertedScore)} / {formatScore(item.convertedMaxScore)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-[230px] items-center justify-center rounded-[20px] border border-dashed border-slate-300 bg-slate-50 text-sm font-semibold text-slate-500">
            표시할 결과 데이터가 없습니다.
          </div>
        )}
      </div>
    </section>
  );
}

function QuestionCard({
  question,
  selectedChoice,
  isSubmitting,
  onSelect,
}: {
  question: CurrentQuestion;
  selectedChoice: number | null;
  isSubmitting: boolean;
  onSelect: (choice: number) => void;
}) {
  const choices = [
    { value: 1, label: question.choice1Label },
    { value: 2, label: question.choice2Label },
    { value: 3, label: question.choice3Label },
    { value: 4, label: question.choice4Label },
    { value: 5, label: question.choice5Label },
  ];

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="mb-5">
        <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
          문항 {question.displayOrder}
        </div>

        <h2 className="mt-4 break-keep text-xl font-extrabold leading-8 tracking-tight text-slate-950 sm:text-2xl">
          {question.questionText}
        </h2>
      </div>

      <div className="space-y-3">
        {choices.map((choice) => {
          const isActive = selectedChoice === choice.value;

          return (
            <button
              key={choice.value}
              type="button"
              onClick={() => onSelect(choice.value)}
              disabled={isSubmitting}
              className={`flex w-full items-start gap-4 rounded-[20px] border px-4 py-4 text-left transition ${
                isActive
                  ? 'border-blue-600 bg-blue-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
              } ${isSubmitting ? 'cursor-not-allowed opacity-70' : ''}`}
            >
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {choice.value}
              </div>

              <div className="min-w-0">
                <p className="break-keep text-sm font-bold leading-6 text-slate-800 sm:text-[15px]">
                  {choice.label || `${choice.value}번 선택지`}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold leading-6 text-slate-500">
        보기를 선택하면 자동으로 다음 문항으로 이동합니다.
      </div>
    </section>
  );
}

export default function HakjongFitPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [submissionId, setSubmissionId] = useState<string>('');
  const [version, setVersion] = useState<string>('');
  const [totalQuestionCount, setTotalQuestionCount] = useState<number>(100);
  const [completedQuestionCount, setCompletedQuestionCount] = useState<number>(0);
  const [currentQuestionOrder, setCurrentQuestionOrder] = useState<number>(1);

  const [question, setQuestion] = useState<CurrentQuestion | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);

  const [isCompleted, setIsCompleted] = useState(false);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [domains, setDomains] = useState<HakjongFitDomainSummary[]>([]);

  const fetchSummary = useCallback(async (): Promise<HakjongFitSummaryPayload> => {
    const response = await fetch('/api/student/hakjong-fit/summary', {
      method: 'GET',
      cache: 'no-store',
    });

    const payload = (await response.json().catch(() => null)) as HakjongFitSummaryPayload | null;

    if (!response.ok) {
      throw new Error(
        extractMessage(payload, '학종 검사 결과를 불러오는 중 오류가 발생했습니다.'),
      );
    }

    if (!payload) {
      throw new Error('학종 검사 결과 응답을 확인할 수 없습니다.');
    }

    return payload;
  }, []);

  const applyCompletedSummary = useCallback((payload: HakjongFitSummaryPayload) => {
    if (
      payload &&
      typeof payload === 'object' &&
      'success' in payload &&
      payload.success === true &&
      'hasResult' in payload &&
      payload.hasResult
    ) {
      setIsCompleted(true);
      setSubmissionId(payload.submissionId);
      setVersion(payload.version ?? '');
      setTotalQuestionCount(payload.totalQuestionCount ?? 100);
      setCompletedQuestionCount(payload.completedQuestionCount ?? payload.totalQuestionCount ?? 100);
      setCurrentQuestionOrder(payload.totalQuestionCount ?? 100);
      setCompletedAt(payload.completedAt ?? null);
      setDomains(payload.resultSummary?.domains ?? []);
      setQuestion(null);
      setSelectedChoice(null);
    }
  }, []);

  const loadCurrentQuestion = useCallback(
    async (nextSubmissionId: string) => {
      const response = await fetch(
        `/api/student/hakjong-fit/current?submissionId=${encodeURIComponent(nextSubmissionId)}`,
        {
          method: 'GET',
          cache: 'no-store',
        },
      );

      const payload = (await response.json().catch(() => null)) as HakjongFitCurrentPayload | null;

      if (!response.ok) {
        throw new Error(
          extractMessage(payload, '현재 문항을 불러오는 중 오류가 발생했습니다.'),
        );
      }

      if (!payload || payload.success !== true) {
        throw new Error('현재 문항 응답 형식이 올바르지 않습니다.');
      }

      if (payload.completed) {
        const summaryPayload = await fetchSummary();

        if (
          summaryPayload &&
          typeof summaryPayload === 'object' &&
          'success' in summaryPayload &&
          summaryPayload.success === true &&
          'hasResult' in summaryPayload &&
          summaryPayload.hasResult
        ) {
          applyCompletedSummary(summaryPayload);
          return;
        }
      }

      const nextQuestion = normalizeCurrentQuestion(payload);

      if (!nextQuestion) {
        throw new Error('현재 문항 정보를 불러오지 못했습니다.');
      }

      const total =
        toNumber(payload.totalQuestionCount) ??
        toNumber(payload.progress?.totalQuestionCount) ??
        100;

      const currentOrder =
        toNumber(payload.currentQuestionOrder) ??
        toNumber(payload.progress?.currentQuestionOrder) ??
        nextQuestion.displayOrder ??
        1;

      const completedCount =
        toNumber(payload.completedQuestionCount) ??
        toNumber(payload.progress?.completedQuestionCount) ??
        Math.max(0, currentOrder - 1);

      setIsCompleted(false);
      setQuestion(nextQuestion);
      setSelectedChoice(null);
      setTotalQuestionCount(total);
      setCurrentQuestionOrder(currentOrder);
      setCompletedQuestionCount(completedCount);
    },
    [applyCompletedSummary, fetchSummary],
  );

  const bootstrap = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const summaryPayload = await fetchSummary();

      if (
        summaryPayload &&
        typeof summaryPayload === 'object' &&
        'success' in summaryPayload &&
        summaryPayload.success === true &&
        'hasResult' in summaryPayload &&
        summaryPayload.hasResult
      ) {
        applyCompletedSummary(summaryPayload);
        return;
      }

      const startResponse = await fetch('/api/student/hakjong-fit/start', {
        method: 'POST',
        cache: 'no-store',
      });

      const startPayload = (await startResponse.json().catch(() => null)) as HakjongFitStartPayload | null;

      if (!startResponse.ok) {
        throw new Error(
          extractMessage(startPayload, '학종 검사를 시작하는 중 오류가 발생했습니다.'),
        );
      }

      if (!startPayload || startPayload.success !== true) {
        throw new Error('검사 시작 응답 형식이 올바르지 않습니다.');
      }

      setSubmissionId(startPayload.submissionId);
      setVersion(startPayload.version ?? '');
      setTotalQuestionCount(startPayload.totalQuestionCount ?? 100);
      setCurrentQuestionOrder(startPayload.currentQuestionOrder ?? 1);
      setCompletedQuestionCount(startPayload.completedQuestionCount ?? 0);
      setCompletedAt(null);
      setDomains([]);
      setIsCompleted(false);

      await loadCurrentQuestion(startPayload.submissionId);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : '학종 적합성 검사를 불러오는 중 오류가 발생했습니다.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [applyCompletedSummary, fetchSummary, loadCurrentQuestion]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const progressPercent = useMemo(() => {
    if (!totalQuestionCount || totalQuestionCount <= 0) return 0;
    return clamp((completedQuestionCount / totalQuestionCount) * 100, 0, 100);
  }, [completedQuestionCount, totalQuestionCount]);

  const handleSelectChoice = useCallback(
    async (choice: number) => {
      if (!submissionId || isSubmitting || isCompleted) return;

      try {
        setIsSubmitting(true);
        setError(null);
        setSelectedChoice(choice);

        const response = await fetch('/api/student/hakjong-fit/answer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            submissionId,
            selectedChoice: choice,
          }),
        });

        const payload = (await response.json().catch(() => null)) as HakjongFitAnswerPayload | null;

        if (!response.ok) {
          throw new Error(
            extractMessage(payload, '응답을 저장하는 중 오류가 발생했습니다.'),
          );
        }

        if (!payload || payload.success !== true) {
          throw new Error('응답 저장 결과를 확인할 수 없습니다.');
        }

        if (typeof payload.completedQuestionCount === 'number') {
          setCompletedQuestionCount(payload.completedQuestionCount);
        }

        if (typeof payload.currentQuestionOrder === 'number') {
          setCurrentQuestionOrder(payload.currentQuestionOrder);
        }

        if (payload.completed) {
          const summaryPayload = await fetchSummary();

          if (
            summaryPayload &&
            typeof summaryPayload === 'object' &&
            'success' in summaryPayload &&
            summaryPayload.success === true &&
            'hasResult' in summaryPayload &&
            summaryPayload.hasResult
          ) {
            applyCompletedSummary(summaryPayload);
            return;
          }

          throw new Error('완료 결과를 불러오지 못했습니다.');
        }

        await loadCurrentQuestion(submissionId);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : '문항 응답 처리 중 오류가 발생했습니다.',
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [applyCompletedSummary, fetchSummary, isCompleted, isSubmitting, loadCurrentQuestion, submissionId],
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
          <div className="relative overflow-hidden border-b border-blue-950 bg-[linear-gradient(135deg,#0f172a_0%,#172554_45%,#1d4ed8_100%)] px-5 py-7 sm:px-7 sm:py-8 lg:px-10">
            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-white shadow-sm backdrop-blur-sm">
              Hakjong Fit Test
            </div>

            <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              학종 적합성 검사
            </h1>

            <p className="mt-3 text-sm leading-7 text-blue-50 sm:text-base">
              학업역량, 진로역량, 공동체역량을 바탕으로 나의 학종 적합성을 확인할 수 있습니다.
            </p>
          </div>

          <div className="p-5 sm:p-6 lg:p-8">
            {isLoading ? (
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-600">
                학종 적합성 검사 화면을 불러오는 중입니다...
              </div>
            ) : error ? (
              <div className="space-y-4">
                <div className="rounded-[24px] border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700">
                  {error}
                </div>

                <button
                  type="button"
                  onClick={() => void bootstrap()}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  다시 불러오기
                </button>
              </div>
            ) : isCompleted ? (
              <div className="space-y-6">
                <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 sm:p-6">
                  <div className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-800">
                    최종 완료 안내
                  </div>

                  <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-950">
                    검사가 완료되었습니다.
                  </h2>

                  <div className="mt-4 inline-flex items-center rounded-full bg-amber-100 px-4 py-2 text-sm font-extrabold text-amber-800">
                    본 검사는 최종 완료 후 재검사가 불가능합니다.
                  </div>

                  <p className="mt-4 break-keep text-sm leading-7 text-slate-700 sm:text-[15px]">
                    학종 적합성 검사는 1회만 완료할 수 있으며, 완료된 이후에는 재검사를 할 수 없습니다.
                    현재 화면은 DB에 저장된 최종 검사 결과를 다시 불러와 표시하고 있습니다.
                  </p>

                  <div className="mt-4 text-xs font-semibold text-slate-500">
                    검사 완료일: {formatDateTime(completedAt)}
                  </div>
                </section>

                <ResultChart domains={domains} />

                <ProgressCard
                  totalQuestionCount={totalQuestionCount}
                  completedQuestionCount={completedQuestionCount}
                  currentQuestionOrder={currentQuestionOrder}
                  isCompleted
                />

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/student/dashboard"
                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    대시보드로 이동
                  </Link>

                  <Link
                    href="/student"
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    학생 홈으로 이동
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <ProgressCard
                  totalQuestionCount={totalQuestionCount}
                  completedQuestionCount={completedQuestionCount}
                  currentQuestionOrder={currentQuestionOrder}
                  isCompleted={false}
                />

                <section className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-[12px] font-semibold text-slate-600">
                  검사 도중 페이지를 나가면 미완료 응답은 최종 결과로 인정되지 않으며, 다시 진입 시 처음부터 새로 검사를 진행하게 됩니다.
                  현재 진행률: {progressPercent.toFixed(0)}%
                </section>

                {question ? (
                  <QuestionCard
                    question={question}
                    selectedChoice={selectedChoice}
                    isSubmitting={isSubmitting}
                    onSelect={(choice) => void handleSelectChoice(choice)}
                  />
                ) : (
                  <div className="rounded-[24px] border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-600">
                    현재 문항을 표시할 수 없습니다.
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {version ? (
          <div className="mt-4 text-center text-xs font-semibold text-slate-400">
            검사 버전: {version}
          </div>
        ) : null}
      </div>
    </main>
  );
}
