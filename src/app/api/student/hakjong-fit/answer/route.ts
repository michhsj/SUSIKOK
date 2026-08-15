import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/auth/session";

function error(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status }
  );
}

function toTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseSelectedChoice(value: unknown) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
    throw new Error("선택한 답변 값이 올바르지 않습니다.");
  }

  return parsed;
}

function getEarnedScore(
  selectedChoice: number,
  question: {
    choice1Score: number;
    choice2Score: number;
    choice3Score: number;
    choice4Score: number;
    choice5Score: number;
  }
) {
  switch (selectedChoice) {
    case 1:
      return question.choice1Score;
    case 2:
      return question.choice2Score;
    case 3:
      return question.choice3Score;
    case 4:
      return question.choice4Score;
    case 5:
      return question.choice5Score;
    default:
      throw new Error("선택 점수를 계산할 수 없습니다.");
  }
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

export async function POST(request: Request) {
  try {
    const user = await getAuthorizedUser();

    if (!user) {
      return error("로그인이 필요합니다.", 401);
    }

    const body = (await request.json()) as Record<string, unknown>;

    const submissionId = toTrimmedString(body.submissionId);
    if (!submissionId) {
      return error("submissionId가 필요합니다.", 400);
    }

    const selectedChoice = parseSelectedChoice(body.selectedChoice);

    const result = await db.$transaction(async (tx) => {
      const submission = await tx.hakjongFitSubmission.findFirst({
        where: {
          id: submissionId,
          userId: user.id,
        },
        select: {
          id: true,
          status: true,
          version: true,
          totalQuestionCount: true,
          currentQuestionOrder: true,
          completedQuestionCount: true,
        },
      });

      if (!submission) {
        throw new Error("검사 세션을 찾을 수 없습니다.");
      }

      const totalQuestionCount = submission.totalQuestionCount;
      const currentQuestionOrder = submission.currentQuestionOrder;
      const completedQuestionCount = submission.completedQuestionCount;

      if (submission.status !== "IN_PROGRESS") {
        return {
          completed: true,
          submissionId: submission.id,
          currentQuestionOrder,
          totalQuestionCount,
        };
      }

      const submissionQuestion = await tx.hakjongFitSubmissionQuestion.findFirst({
        where: {
          submissionId: submission.id,
          displayOrder: currentQuestionOrder,
        },
        select: {
          displayOrder: true,
          question: {
            select: {
              id: true,
              questionNumber: true,
              domain: true,
              choice1Score: true,
              choice2Score: true,
              choice3Score: true,
              choice4Score: true,
              choice5Score: true,
            },
          },
        },
      });

      if (!submissionQuestion) {
        throw new Error("현재 답변할 문항을 찾을 수 없습니다.");
      }

      const earnedScore = getEarnedScore(selectedChoice, submissionQuestion.question);

      await tx.hakjongFitAnswer.upsert({
        where: {
          submissionId_questionId: {
            submissionId: submission.id,
            questionId: submissionQuestion.question.id,
          },
        },
        update: {
          selectedChoice,
          earnedScore,
          displayOrder: submissionQuestion.displayOrder,
          questionNumberSnapshot: submissionQuestion.question.questionNumber,
          domainSnapshot: submissionQuestion.question.domain,
          versionSnapshot: submission.version,
        },
        create: {
          submissionId: submission.id,
          questionId: submissionQuestion.question.id,
          displayOrder: submissionQuestion.displayOrder,
          selectedChoice,
          earnedScore,
          questionNumberSnapshot: submissionQuestion.question.questionNumber,
          domainSnapshot: submissionQuestion.question.domain,
          versionSnapshot: submission.version,
        },
      });

      const nextCompletedCount = Math.max(
        completedQuestionCount,
        currentQuestionOrder
      );

      const isLastQuestion = currentQuestionOrder >= totalQuestionCount;

      if (isLastQuestion) {
        await tx.hakjongFitSubmission.update({
          where: {
            id: submission.id,
          },
          data: {
            status: "COMPLETED",
            completedQuestionCount: totalQuestionCount,
            completedAt: new Date(),
          },
        });

        return {
          completed: true,
          submissionId: submission.id,
          currentQuestionOrder: totalQuestionCount,
          totalQuestionCount,
        };
      }

      const nextQuestionOrder = currentQuestionOrder + 1;

      await tx.hakjongFitSubmission.update({
        where: {
          id: submission.id,
        },
        data: {
          currentQuestionOrder: nextQuestionOrder,
          completedQuestionCount: nextCompletedCount,
        },
      });

      return {
        completed: false,
        submissionId: submission.id,
        currentQuestionOrder: nextQuestionOrder,
        totalQuestionCount,
      };
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (caughtError) {
    console.error("[POST] /api/student/hakjong-fit/answer", caughtError);

    if (caughtError instanceof Error) {
      if (
        [
          "선택한 답변 값이 올바르지 않습니다.",
          "검사 세션을 찾을 수 없습니다.",
          "현재 답변할 문항을 찾을 수 없습니다.",
        ].includes(caughtError.message)
      ) {
        return error(caughtError.message, 400);
      }

      return error(caughtError.message, 500);
    }

    return error("답변 저장 중 오류가 발생했습니다.", 500);
  }
}
