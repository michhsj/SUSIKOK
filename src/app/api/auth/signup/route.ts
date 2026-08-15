import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { signupSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message ?? "입력 값을 확인해주세요.";

      return NextResponse.json(
        { success: false, message: firstError },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      password,
      schoolId,
      gradeLevel,
      termsConsent,
      privacyConsent,
      marketingConsent,
    } = parsed.data;

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "이미 사용 중인 이메일입니다." },
        { status: 409 }
      );
    }

    const school = await db.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return NextResponse.json(
        { success: false, message: "선택한 학교 정보를 찾을 수 없습니다." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const newUser = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        schoolId,
        gradeLevel: gradeLevel ?? null,
        termsConsent,
        privacyConsent,
        marketingConsent: marketingConsent ?? false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "회원가입이 완료되었습니다.",
        data: { userId: newUser.id },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] /api/auth/signup 오류:", error);

    return NextResponse.json(
      {
        success: false,
        message: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}
