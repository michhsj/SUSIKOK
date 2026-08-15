import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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

  // 혹시 공백/표기 흔들림이 있어도 최대한 흡수
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

  const domains = RESULT_DOMAIN_ORDER.map((domain) => {
    const rawScore = roundToOneDecimal(totals[domain]);
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
  };
}

export async function GET() {
  try {
    const user = await getAuthorizedUser();

    if (!user) {
      return jsonError("로그인이 필요합니다.", 401);
    }

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
        completedAt: true,
      },
    });

    if (!latestCompletedSubmission) {
      return NextResponse.json({
        success: true,
        hasResult: false,
      });
    }

    const resultSummary = await buildCompletedResultSummary(
      latestCompletedSubmission.id
    );

    return NextResponse.json({
      success: true,
      hasResult: true,
      submissionId: latestCompletedSubmission.id,
      version: latestCompletedSubmission.version,
      totalQuestionCount: latestCompletedSubmission.totalQuestionCount,
      completedQuestionCount: latestCompletedSubmission.completedQuestionCount,
      completedAt: latestCompletedSubmission.completedAt,
      resultSummary,
    });
  } catch (error) {
    console.error("[GET] /api/student/hakjong-fit/summary", error);
    return jsonError("학종 검사 결과를 불러오는 중 오류가 발생했습니다.", 500);
  }
}
