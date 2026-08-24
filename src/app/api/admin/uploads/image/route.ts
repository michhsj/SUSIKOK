import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/auth/admin-session";

export const runtime = "nodejs";

function getExtensionFromMimeType(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "";
  }
}

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return token ? verifyAdminSessionToken(token) : null;
}

export async function POST(request: NextRequest) {
  try {
    const adminSession = await requireAdmin();

    if (!adminSession) {
      return NextResponse.json(
        { success: false, message: "관리자 인증이 필요합니다." },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "업로드할 파일이 없습니다." },
        { status: 400 },
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, message: "이미지 파일만 업로드할 수 있습니다." },
        { status: 400 },
      );
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { success: false, message: "이미지 용량은 5MB 이하만 가능합니다." },
        { status: 400 },
      );
    }

    const ext =
      getExtensionFromMimeType(file.type) ||
      file.name.split(".").pop()?.toLowerCase() ||
      "png";

    const fileName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "home-popup");
    const filePath = path.join(uploadDir, fileName);

    await mkdir(uploadDir, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      url: `/uploads/home-popup/${fileName}`,
    });
  } catch (error) {
    console.error("[api/admin/uploads/image] POST error:", error);
    return NextResponse.json(
      { success: false, message: "이미지 업로드 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
