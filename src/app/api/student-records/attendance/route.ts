import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/auth/session";

type AttendanceInput = {
  includeAttendance?: unknown;
  absence?: unknown;
  lateness?: unknown;
  earlyLeave?: unknown;
  outing?: unknown;
};

type NormalizedAttendance = {
  includeAttendance: boolean;
  absence: string;
  lateness: string;
  earlyLeave: string;
  outing: string;
};

function toTrimmedString(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value).trim();
  }

  return "";
}

function parseOptionalIntegerValue(value: string) {
  if (!value) {
    return null;
  }

  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function jsonError(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status }
  );
}

async function getCurrentUser() {
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

function normalizeAttendanceInput(body: unknown): NormalizedAttendance | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const input = body as AttendanceInput;

  return {
    includeAttendance: input.includeAttendance === true,
    absence: toTrimmedString(input.absence),
    lateness: toTrimmedString(input.lateness),
    earlyLeave: toTrimmedString(input.earlyLeave),
    outing: toTrimmedString(input.outing),
  };
}

function mapAttendanceToResponse(attendance: {
  id: string;
  includeAttendance: boolean;
  absence: number | null;
  lateness: number | null;
  earlyLeave: number | null;
  outing: number | null;
}) {
  return {
    id: attendance.id,
    includeAttendance: attendance.includeAttendance,
    absence:
      attendance.absence !== null && attendance.absence !== undefined
        ? String(attendance.absence)
        : "",
    lateness:
      attendance.lateness !== null && attendance.lateness !== undefined
        ? String(attendance.lateness)
        : "",
    earlyLeave:
      attendance.earlyLeave !== null && attendance.earlyLeave !== undefined
        ? String(attendance.earlyLeave)
        : "",
    outing:
      attendance.outing !== null && attendance.outing !== undefined
        ? String(attendance.outing)
        : "",
  };
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return jsonError("로그인이 필요합니다.", 401);
    }

    const attendance = await db.studentRecordAttendance.findUnique({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        includeAttendance: true,
        absence: true,
        lateness: true,
        earlyLeave: true,
        outing: true,
      },
    });

    if (!attendance) {
      return NextResponse.json({
        success: true,
        exists: false,
        attendance: {
          includeAttendance: false,
          absence: "",
          lateness: "",
          earlyLeave: "",
          outing: "",
        },
      });
    }

    return NextResponse.json({
      success: true,
      exists: true,
      attendance: mapAttendanceToResponse(attendance),
    });
  } catch (error) {
    console.error("[GET] /api/student-records/attendance", error);

    return NextResponse.json(
      {
        success: false,
        message: "출결 정보 조회 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return jsonError("로그인이 필요합니다.", 401);
    }

    const body = await request.json().catch(() => null);
    const normalized = normalizeAttendanceInput(body);

    if (!normalized) {
      return jsonError("출결 저장 요청 형식이 올바르지 않습니다.", 400);
    }

    const absence = normalized.absence
      ? parseOptionalIntegerValue(normalized.absence)
      : null;
    const lateness = normalized.lateness
      ? parseOptionalIntegerValue(normalized.lateness)
      : null;
    const earlyLeave = normalized.earlyLeave
      ? parseOptionalIntegerValue(normalized.earlyLeave)
      : null;
    const outing = normalized.outing
      ? parseOptionalIntegerValue(normalized.outing)
      : null;

    if (normalized.absence && absence === null) {
      return jsonError("결석 값은 0 이상의 정수여야 합니다.", 400);
    }

    if (normalized.lateness && lateness === null) {
      return jsonError("지각 값은 0 이상의 정수여야 합니다.", 400);
    }

    if (normalized.earlyLeave && earlyLeave === null) {
      return jsonError("조퇴 값은 0 이상의 정수여야 합니다.", 400);
    }

    if (normalized.outing && outing === null) {
      return jsonError("결과 값은 0 이상의 정수여야 합니다.", 400);
    }

    const saved = await db.studentRecordAttendance.upsert({
      where: {
        userId: user.id,
      },
      update: {
        includeAttendance: normalized.includeAttendance,
        absence,
        lateness,
        earlyLeave,
        outing,
      },
      create: {
        userId: user.id,
        includeAttendance: normalized.includeAttendance,
        absence,
        lateness,
        earlyLeave,
        outing,
      },
      select: {
        id: true,
        includeAttendance: true,
        absence: true,
        lateness: true,
        earlyLeave: true,
        outing: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "출결 정보가 저장되었습니다.",
      exists: true,
      attendance: mapAttendanceToResponse(saved),
    });
  } catch (error) {
    console.error("[POST] /api/student-records/attendance", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "출결 정보 저장 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
