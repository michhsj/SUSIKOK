import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionToken,
} from "@/lib/auth/admin-session";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody;

    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "이메일과 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    const adminEmail = process.env.ADMIN_LOGIN_EMAIL;
    const adminPassword = process.env.ADMIN_LOGIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { success: false, message: "관리자 계정이 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    if (email !== adminEmail || password !== adminPassword) {
      return NextResponse.json(
        { success: false, message: "관리자 로그인 정보가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    const token = createAdminSessionToken(adminEmail);

    const response = NextResponse.json({
      success: true,
      message: "관리자 로그인에 성공했습니다.",
    });

    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("[API] /api/admin/login 오류:", error);

    return NextResponse.json(
      { success: false, message: "관리자 로그인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
