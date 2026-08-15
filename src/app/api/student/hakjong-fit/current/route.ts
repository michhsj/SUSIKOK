import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/auth/session";

type DomainKey = "학업역량" | "진로역량" | "공동체역량";

const RESULT_DOMAIN_ORDER: DomainKey[] = [
  "학업역량",
  "진로역량",
  "공동체역량",
];

function jsonError(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status }
  );
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function normalizeDomain(raw: unknown): DomainKey | null {
  const value = normalizeText(raw);

  if (!value) return null;

  if (value === "학업역량") return "학업역량";
  if (value === "진로역량") return "진로역량";
  if (value === "공동체역량") return "공동체역량";

  const compact = value.replace(/\s+/g, "");

  if (compact === "학업역량") return "학업역량";
  if (compact === "진로역량") return "진로역량";
  if (compact === "공동체역량") return "공동체역량";

  return null;
}

async function getAuthorizedUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(sessionToken);

  if (!session) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return user;
}

async function buildCompletedResultSummary(submissionId: string) {
  const answers = await db.hakjongFitAnswer.findMany({
    where: {
      submissionId,
    },
    select: {
      domainSnapshot: true,
      earnedScore: true,
    },
  });

  const totals: Record<DomainKey, number> = {
    학업역량: 0,
    진로역량: 0,
    공동체역량: 0,
  };

  for (const answer of answers) {
    const domain = normalizeDomain(answer.domainSnapshot);
    if (!domain) continue;

    const score =
      typeof answer.earnedScore === "number" && Number.isFinite(answer.earnedScore)
        ? answer.earnedScore
        : 0;

    totals[domain] += score;
  }

  return {
    domains: RESULT_DOMAIN_ORDER.map((domain) => {
      const rawScore = roundToOneDecimal(totals[domain]);
      const convertedScore = roundToOneDecimal((rawScore / 3) * 2);

      return {
        domain,
        rawScore,
        convertedScore,
        rawMaxScore: 150,
        convertedMaxScore: 100,
      };
    }),
  };
}

async function findTargetSubmission(userId: string, submissionId: string | null) {
  if (submissionId) {
    return db.hakjongFitSubmission.findFirst({
      where: {
        id: submissionId,
        userId,
      },
      select: {
        id: true,
        userId: true,
        version: true,
        status: true,
        totalQuestionCount: true,
        currentQuestionOrder: true,
        completedQuestionCount: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
      },
    });
  }

  const inProgress = await db.hakjongFitSubmission.findFirst({
    where: {
      userId,
      status: "IN_PROGRESS",
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      userId: true,
      version: true,
      status: true,
      totalQuestionCount: true,
      currentQuestionOrder: true,
      completedQuestionCount: true,
      startedAt: true,
      completedAt: true,
      createdAt: true,
    },
  });

  if (inProgress) {
    return inProgress;
  }

  return db.hakjongFitSubmission.findFirst({
    where: {
      userId,
      status: "COMPLETED",
    },
    orderBy: [
      { completedAt: "desc" },
      { createdAt: "desc" },
    ],
    select: {
      id: true,
      userId: true,
      version: true,
      status: true,
      totalQuestionCount: true,
      currentQuestionOrder: true,
      completedQuestionCount: true,
      startedAt: true,
      completedAt: true,
      createdAt: true,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthorizedUser();

    if (!user) {
      return jsonError("로그인이 필요합니다.", 401);
    }

    const { searchParams } = new URL(request.url);
    const submissionId = normalizeText(searchParams.get("submissionId")) || null;

    const submission = await findTargetSubmission(user.id, submissionId);

    if (!submission) {
      return jsonError("조회할 학종 검사 정보가 없습니다.", 404);
    }

    const safeTotal =
      typeof submission.totalQuestionCount === "number" &&
      Number.isFinite(submission.totalQuestionCount) &&
      submission.totalQuestionCount > 0
        ? submission.totalQuestionCount
        : 100;

    const safeCompleted =
      typeof submission.completedQuestionCount === "number" &&
      Number.isFinite(submission.completedQuestionCount) &&
      submission.completedQuestionCount >= 0
        ? submission.completedQuestionCount
        : 0;

    const safeCurrentOrder =
      typeof submission.currentQuestionOrder === "number" &&
      Number.isFinite(submission.currentQuestionOrder) &&
      submission.currentQuestionOrder > 0
        ? submission.currentQuestionOrder
        : 1;

    const isCompleted =
      submission.status === "COMPLETED" ||
      safeCompleted >= safeTotal ||
      safeCurrentOrder > safeTotal;

    if (isCompleted) {
      const resultSummary = await buildCompletedResultSummary(submission.id);

      return NextResponse.json({
        success: true,
        completed: true,
        submissionId: submission.id,
        version: submission.version,
        totalQuestionCount: safeTotal,
        currentQuestionOrder: safeTotal,
        completedQuestionCount: safeTotal,
        completedAt: submission.completedAt,
        progress: {
          totalQuestionCount: safeTotal,
          currentQuestionOrder: safeTotal,
          completedQuestionCount: safeTotal,
        },
        resultSummary,
      });
    }

    const targetDisplayOrder = Math.min(Math.max(safeCurrentOrder, 1), safeTotal);

    const currentSubmissionQuestion = await db.hakjongFitSubmissionQuestion.findFirst({
      where: {
        submissionId: submission.id,
        displayOrder: targetDisplayOrder,
      },
      select: {
        displayOrder: true,
        question: {
          select: {
            questionText: true,
            choice1Label: true,
            choice2Label: true,
            choice3Label: true,
            choice4Label: true,
            choice5Label: true,
          },
        },
      },
    });

    if (!currentSubmissionQuestion || !currentSubmissionQuestion.question) {
      return jsonError("현재 문항 정보를 찾을 수 없습니다.", 404);
    }

    return NextResponse.json({
      success: true,
      completed: false,
      submissionId: submission.id,
      version: submission.version,
      totalQuestionCount: safeTotal,
      currentQuestionOrder: targetDisplayOrder,
      completedQuestionCount: safeCompleted,
      progress: {
        totalQuestionCount: safeTotal,
        currentQuestionOrder: targetDisplayOrder,
        completedQuestionCount: safeCompleted,
      },
      currentQuestion: {
        displayOrder: currentSubmissionQuestion.displayOrder,
        questionText: normalizeText(currentSubmissionQuestion.question.questionText),
        choice1Label: normalizeText(currentSubmissionQuestion.question.choice1Label),
        choice2Label: normalizeText(currentSubmissionQuestion.question.choice2Label),
        choice3Label: normalizeText(currentSubmissionQuestion.question.choice3Label),
        choice4Label: normalizeText(currentSubmissionQuestion.question.choice4Label),
        choice5Label: normalizeText(currentSubmissionQuestion.question.choice5Label),
      },
    });
  } catch (error) {
    console.error("[GET] /api/student/hakjong-fit/current", error);
    return jsonError("현재 학종 검사 정보를 불러오는 중 오류가 발생했습니다.", 500);
  }
}
