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

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = verifySessionToken(sessionToken);

    if (!session) {
      return error("로그인이 필요합니다.", 401);
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return error("유효한 사용자 정보를 찾을 수 없습니다.", 403);
    }

    const [subjectGroups, completionTypes, subjectCatalog] =
      await Promise.all([
        db.subjectGroupOption.findMany({
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
          },
        }),
        db.completionTypeOption.findMany({
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
          },
        }),
        db.studentRecordSubjectCatalog.findMany({
          select: {
            id: true,
            subjectGroup: true,
            completionType: true,
            subjectName: true,
          },
        }),
      ]);

    return NextResponse.json({
      success: true,
      subjectGroups,
      completionTypes,
      subjectCatalog,
    });
  } catch (error) {
    console.error("[GET] /api/student-records/options", error);

    return NextResponse.json(
      {
        success: false,
        message: "직접입력 옵션 조회 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
