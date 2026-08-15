import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { EntitlementFeatureCode, EntitlementStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

type SaveRequestBody = {
  admissionResultId?: string;
};

function toStringValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function badRequest(message: string) {
  return NextResponse.json({ success: false, message }, { status: 400 });
}

function unauthorized(message = "로그인이 필요합니다.") {
  return NextResponse.json({ success: false, message }, { status: 401 });
}

function forbidden(message: string) {
  return NextResponse.json({ success: false, message }, { status: 403 });
}

function notFound(message: string) {
  return NextResponse.json({ success: false, message }, { status: 404 });
}

async function getOptionalCurrentUser() {
  try {
    return await getCurrentUser();
  } catch (error) {
    console.error("[student/admissions/save] getCurrentUser failed:", error);
    return null;
  }
}

async function parseBody(request: NextRequest): Promise<SaveRequestBody> {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object") {
      return {};
    }
    return body as SaveRequestBody;
  } catch (error) {
    console.error("[student/admissions/save] parse body failed:", error);
    return {};
  }
}

function revalidateAdmissionRelatedPaths() {
  revalidatePath("/student/admissions");
  revalidatePath("/student/payment");
  revalidatePath("/student/strategy");
}

export async function POST(request: NextRequest) {
  try {
    const user = await getOptionalCurrentUser();

    if (!user?.id) {
      return unauthorized();
    }

    const body = await parseBody(request);
    const admissionResultId = toStringValue(body.admissionResultId);

    if (!admissionResultId) {
      return badRequest("admissionResultId가 필요합니다.");
    }

    const now = new Date();

    const [admissionResult, entitlement] = await Promise.all([
      prisma.admissionResult.findFirst({
        where: {
          id: admissionResultId,
          isActive: true,
        },
        select: {
          id: true,
          universityName: true,
          admissionName: true,
          recruitmentUnit: true,
        },
      }),
      prisma.userEntitlement.findFirst({
        where: {
          userId: user.id,
          featureCode: EntitlementFeatureCode.ANALYSIS_30D,
          status: EntitlementStatus.ACTIVE,
          expiresAt: {
            gt: now,
          },
        },
        select: {
          id: true,
          expiresAt: true,
        },
      }),
    ]);

    if (!admissionResult) {
      return notFound("저장할 모집단위 정보를 찾을 수 없습니다.");
    }

    if (!entitlement) {
      return forbidden("유효한 이용권이 없어 저장할 수 없습니다.");
    }

    const saved = await prisma.studentSavedRecruitmentUnit.upsert({
      where: {
        userId_admissionResultId: {
          userId: user.id,
          admissionResultId: admissionResult.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        admissionResultId: admissionResult.id,
      },
      select: {
        id: true,
        userId: true,
        admissionResultId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    revalidateAdmissionRelatedPaths();

    return NextResponse.json({
      success: true,
      message: "모집단위를 저장했습니다.",
      action: "saved",
      saved,
      item: {
        id: admissionResult.id,
        universityName: admissionResult.universityName,
        admissionName: admissionResult.admissionName,
        recruitmentUnit: admissionResult.recruitmentUnit,
      },
    });
  } catch (error) {
    console.error("[student/admissions/save] POST error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "저장 처리 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getOptionalCurrentUser();

    if (!user?.id) {
      return unauthorized();
    }

    const body = await parseBody(request);
    const admissionResultId = toStringValue(body.admissionResultId);

    if (!admissionResultId) {
      return badRequest("admissionResultId가 필요합니다.");
    }

    const deleted = await prisma.studentSavedRecruitmentUnit.deleteMany({
      where: {
        userId: user.id,
        admissionResultId,
      },
    });

    revalidateAdmissionRelatedPaths();

    return NextResponse.json({
      success: true,
      message: deleted.count > 0 ? "저장한 모집단위를 해제했습니다." : "이미 저장 해제된 상태입니다.",
      action: "removed",
      deletedCount: deleted.count,
      admissionResultId,
    });
  } catch (error) {
    console.error("[student/admissions/save] DELETE error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "저장 해제 처리 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
