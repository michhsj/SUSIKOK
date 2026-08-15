import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function jsonSuccess(data: unknown) {
  return NextResponse.json({
    success: true,
    data,
  });
}

function jsonError(message: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      message,
      data: [],
    },
    { status }
  );
}

function normalizeParam(value: string | null) {
  return String(value ?? "").trim();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const type = normalizeParam(searchParams.get("type"));
  const sido = normalizeParam(searchParams.get("sido"));
  const sigungu = normalizeParam(searchParams.get("sigungu"));

  try {
    if (type === "sido") {
      const sidoList = await db.school.findMany({
        select: { sido: true },
        distinct: ["sido"],
        orderBy: { sido: "asc" },
      });

      const data = sidoList
        .map((item) => String(item.sido ?? "").trim())
        .filter((value) => value.length > 0);

      return jsonSuccess(data);
    }

    if (type === "sigungu") {
      if (!sido) {
        return jsonError("시/도 값이 필요합니다.", 400);
      }

      const sigunguList = await db.school.findMany({
        where: { sido },
        select: { sigungu: true },
        distinct: ["sigungu"],
        orderBy: { sigungu: "asc" },
      });

      const data = sigunguList
        .map((item) => String(item.sigungu ?? "").trim())
        .filter((value) => value.length > 0);

      return jsonSuccess(data);
    }

    if (type === "schools") {
      if (!sido || !sigungu) {
        return jsonError("시/도와 시/군/구 값이 필요합니다.", 400);
      }

      const schools = await db.school.findMany({
        where: {
          sido,
          sigungu,
        },
        select: {
          id: true,
          sido: true,
          sigungu: true,
          schoolName: true,
          schoolCode: true,
        },
        orderBy: { schoolName: "asc" },
      });

      const data = schools
        .map((school) => ({
          schoolId: String(school.id ?? "").trim(),
          sido: String(school.sido ?? "").trim(),
          sigungu: String(school.sigungu ?? "").trim(),
          schoolName: String(school.schoolName ?? "").trim(),
          schoolCode: String(school.schoolCode ?? "").trim(),
        }))
        .filter((school) => school.schoolName.length > 0);

      return jsonSuccess(data);
    }

    return jsonError("올바른 요청 파라미터가 필요합니다.", 400);
  } catch (error) {
    console.error("[API] /api/schools 오류:", error);

    return jsonError(
      "학교 정보를 불러오는 중 오류가 발생했습니다.",
      500
    );
  }
}
