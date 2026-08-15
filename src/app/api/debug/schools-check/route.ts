import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function normalize(value: unknown) {
  return String(value ?? "").trim();
}

function takeTopEntries(map: Map<string, number>, limit = 20) {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko-KR"))
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

export async function GET() {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { success: false, message: "운영 환경에서는 사용할 수 없습니다." },
        { status: 404 }
      );
    }

    const schools = await db.school.findMany({
      select: {
        id: true,
        sido: true,
        sigungu: true,
        schoolName: true,
        schoolCode: true,
      },
      orderBy: [
        { sido: "asc" },
        { sigungu: "asc" },
        { schoolName: "asc" },
      ],
    });

    const totalCount = schools.length;

    let emptySidoCount = 0;
    let emptySigunguCount = 0;
    let emptySchoolNameCount = 0;
    let emptySchoolCodeCount = 0;

    let sidoTrimMismatchCount = 0;
    let sigunguTrimMismatchCount = 0;
    let schoolNameTrimMismatchCount = 0;

    const sidoMap = new Map<string, number>();
    const sigunguMap = new Map<string, number>();
    const regionKeyMap = new Map<string, number>();
    const schoolNameMap = new Map<string, number>();

    const suspiciousRows: Array<{
      id: string;
      sidoRaw: string;
      sidoTrimmed: string;
      sigunguRaw: string;
      sigunguTrimmed: string;
      schoolNameRaw: string;
      schoolNameTrimmed: string;
      schoolCode: string;
    }> = [];

    for (const school of schools) {
      const sidoRaw = String(school.sido ?? "");
      const sigunguRaw = String(school.sigungu ?? "");
      const schoolNameRaw = String(school.schoolName ?? "");
      const schoolCodeRaw = String(school.schoolCode ?? "");

      const sido = normalize(school.sido);
      const sigungu = normalize(school.sigungu);
      const schoolName = normalize(school.schoolName);
      const schoolCode = normalize(school.schoolCode);

      if (!sido) emptySidoCount += 1;
      if (!sigungu) emptySigunguCount += 1;
      if (!schoolName) emptySchoolNameCount += 1;
      if (!schoolCode) emptySchoolCodeCount += 1;

      if (sidoRaw !== sido) sidoTrimMismatchCount += 1;
      if (sigunguRaw !== sigungu) sigunguTrimMismatchCount += 1;
      if (schoolNameRaw !== schoolName) schoolNameTrimMismatchCount += 1;

      if (sido) {
        sidoMap.set(sido, (sidoMap.get(sido) ?? 0) + 1);
      }

      if (sigungu) {
        sigunguMap.set(sigungu, (sigunguMap.get(sigungu) ?? 0) + 1);
      }

      if (sido && sigungu) {
        const regionKey = `${sido} / ${sigungu}`;
        regionKeyMap.set(regionKey, (regionKeyMap.get(regionKey) ?? 0) + 1);
      }

      if (schoolName) {
        schoolNameMap.set(schoolName, (schoolNameMap.get(schoolName) ?? 0) + 1);
      }

      if (
        suspiciousRows.length < 50 &&
        (sidoRaw !== sido || sigunguRaw !== sigungu || schoolNameRaw !== schoolName)
      ) {
        suspiciousRows.push({
          id: String(school.id),
          sidoRaw,
          sidoTrimmed: sido,
          sigunguRaw,
          sigunguTrimmed: sigungu,
          schoolNameRaw,
          schoolNameTrimmed: schoolName,
          schoolCode,
        });
      }
    }

    const duplicateSchoolNames = Array.from(schoolNameMap.entries())
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko-KR"))
      .slice(0, 30)
      .map(([schoolName, count]) => ({ schoolName, count }));

    return NextResponse.json({
      success: true,
      summary: {
        totalCount,
        emptySidoCount,
        emptySigunguCount,
        emptySchoolNameCount,
        emptySchoolCodeCount,
        sidoTrimMismatchCount,
        sigunguTrimMismatchCount,
        schoolNameTrimMismatchCount,
        distinctSidoCount: sidoMap.size,
        distinctSigunguCount: sigunguMap.size,
        distinctRegionCount: regionKeyMap.size,
      },
      topSido: takeTopEntries(sidoMap, 20),
      topSigungu: takeTopEntries(sigunguMap, 30),
      topRegions: takeTopEntries(regionKeyMap, 30),
      duplicateSchoolNames,
      suspiciousRows,
      sample: schools.slice(0, 20).map((school) => ({
        id: String(school.id),
        sido: normalize(school.sido),
        sigungu: normalize(school.sigungu),
        schoolName: normalize(school.schoolName),
        schoolCode: normalize(school.schoolCode),
      })),
    });
  } catch (error) {
    console.error("[API] /api/debug/schools-check 오류:", error);

    return NextResponse.json(
      {
        success: false,
        message: "학교 데이터 점검 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
