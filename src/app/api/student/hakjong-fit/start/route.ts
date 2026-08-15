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

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

const RESULT_DOMAIN_ORDER = [
  "학업역량",
  "진로역량",
  "공동체역량",
] as const;

type ResultDomainLabel = (typeof RESULT_DOMAIN_ORDER)[number];

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

function shuffleArray<T>(items: T[]) {
  const array = [...items];

  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

async function getCompletedResultSummary(submissionId: string) {
  const answers = await db.hakjongFitAnswer.findMany({
    where: {
      submissionId,
    },
    select: {
      domainSnapshot: true,
      earnedScore: true,
    },
  });

  const rawScoreMap: Record<ResultDomainLabel, number> = {
    학업역량: 0,
    진로역량: 0,
    공동체역량: 0,
  };

  for (const answer of answers) {
    const domain = String(answer.domainSnapshot ?? "").trim() as ResultDomainLabel;

    if (domain in rawScoreMap) {
      rawScoreMap[domain] += Number(answer.earnedScore ?? 0);
    }
  }

  const domains = RESULT_DOMAIN_ORDER.map((domain) => {
    const rawScore = rawScoreMap[domain];
    const convertedScore = roundToOneDecimal((rawScore / 3) * 2);

    return {
      domain,
      rawScore,
      convertedScore,
      rawMaxScore: 150,
      convertedMaxScore: 100,
    };
  });

  return {
    domains,
    formula: "(영역점수 / 3) * 2",
  };
}

async function deleteInProgressSubmissions(userId: string) {
  const inProgressSubmissions = await db.hakjongFitSubmission.findMany({
    where: {
      userId,
      status: "IN_PROGRESS",
    },
    select: {
      id: true,
    },
  });

  if (inProgressSubmissions.length === 0) {
    return;
  }

  const submissionIds = inProgressSubmissions.map((item) => item.id);

  await db.$transaction(async (tx) => {
    await tx.hakjongFitAnswer.deleteMany({
      where: {
        submissionId: {
          in: submissionIds,
        },
      },
    });

    await tx.hakjongFitSubmissionQuestion.deleteMany({
      where: {
        submissionId: {
          in: submissionIds,
        },
      },
    });

    await tx.hakjongFitSubmission.deleteMany({
      where: {
        id: {
          in: submissionIds,
        },
      },
    });
  });
}

export async function POST() {
  try {
    const user = await getAuthorizedUser();

    if (!user) {
      return error("로그인이 필요합니다.", 401);
    }

    // 1) 완료된 검사가 있으면 새 검사 생성 금지, 결과만 반환
    const latestCompletedSubmission = await db.hakjongFitSubmission.findFirst({
      where: {
        userId: user.id,
        status: "COMPLETED",
      },
      orderBy: [
        { completedAt: "desc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        version: true,
        totalQuestionCount: true,
        completedQuestionCount: true,
      },
    });

    if (latestCompletedSubmission) {
      const resultSummary = await getCompletedResultSummary(
        latestCompletedSubmission.id
      );

      return NextResponse.json({
        success: true,
        completed: true,
        submissionId: latestCompletedSubmission.id,
        version: latestCompletedSubmission.version,
        totalQuestionCount: latestCompletedSubmission.totalQuestionCount,
        currentQuestionOrder: latestCompletedSubmission.totalQuestionCount,
        completedQuestionCount:
          latestCompletedSubmission.completedQuestionCount,
        resultSummary,
        reused: true,
        locked: true,
      });
    }

    // 2) 미완료 검사는 이어서 하지 않고 전부 삭제
    await deleteInProgressSubmissions(user.id);

    // 3) 활성 문항 검증
    const activeQuestions = await db.hakjongFitQuestion.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { version: "asc" },
        { questionNumber: "asc" },
      ],
      select: {
        id: true,
        version: true,
      },
    });

    if (activeQuestions.length !== 100) {
      return error(
        `활성 문항 수가 100개가 아닙니다. 현재 ${activeQuestions.length}개입니다.`,
        400
      );
    }

    const versions = [...new Set(activeQuestions.map((question) => question.version))];

    if (versions.length !== 1) {
      return error(
        `활성 문항 버전이 하나로 통일되어 있지 않습니다. 현재 버전: ${versions.join(", ")}`,
        400
      );
    }

    const version = versions[0];
    const shuffledQuestions = shuffleArray(activeQuestions);

    // 4) 새 검사 생성
    const submission = await db.$transaction(async (tx) => {
      const createdSubmission = await tx.hakjongFitSubmission.create({
        data: {
          userId: user.id,
          version,
          status: "IN_PROGRESS",
          totalQuestionCount: 100,
          currentQuestionOrder: 1,
          completedQuestionCount: 0,
        },
        select: {
          id: true,
          version: true,
          totalQuestionCount: true,
          currentQuestionOrder: true,
          completedQuestionCount: true,
        },
      });

      await tx.hakjongFitSubmissionQuestion.createMany({
        data: shuffledQuestions.map((question, index) => ({
          submissionId: createdSubmission.id,
          questionId: question.id,
          displayOrder: index + 1,
        })),
      });

      return createdSubmission;
    });

    return NextResponse.json({
      success: true,
      completed: false,
      submissionId: submission.id,
      version: submission.version,
      totalQuestionCount: submission.totalQuestionCount,
      currentQuestionOrder: submission.currentQuestionOrder,
      completedQuestionCount: submission.completedQuestionCount,
      reused: false,
      locked: false,
    });
  } catch (caughtError) {
    console.error("[POST] /api/student/hakjong-fit/start", caughtError);
    return error("검사를 시작하는 중 오류가 발생했습니다.", 500);
  }
}
