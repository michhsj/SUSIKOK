import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/auth/session";

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function toTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function sortKorean(a: string, b: string) {
  return a.localeCompare(b, "ko");
}

function dedupeByName<T extends { name: string }>(items: T[]): T[] {
  const map = new Map<string, T>();

  for (const item of items) {
    const name = toTrimmedString(item.name);
    if (!name) {
      continue;
    }

    if (!map.has(name)) {
      map.set(name, {
        ...item,
        name,
      });
    }
  }

  return [...map.values()].sort((a, b) => sortKorean(a.name, b.name));
}

function dedupeCatalog<
  T extends {
    id: string;
    subjectGroup: string;
    completionType: string;
    subjectName: string;
  }
>(items: T[]): T[] {
  const map = new Map<string, T>();

  for (const item of items) {
    const subjectGroup = toTrimmedString(item.subjectGroup);
    const completionType = toTrimmedString(item.completionType);
    const subjectName = toTrimmedString(item.subjectName);

    if (!subjectGroup || !completionType || !subjectName) {
      continue;
    }

    const key = `${subjectGroup}__${completionType}__${subjectName}`;

    if (!map.has(key)) {
      map.set(key, {
        ...item,
        subjectGroup,
        completionType,
        subjectName,
      });
    }
  }

  return [...map.values()].sort((a, b) => {
    const byGroup = sortKorean(a.subjectGroup, b.subjectGroup);
    if (byGroup !== 0) return byGroup;

    const byCompletionType = sortKorean(
      a.completionType,
      b.completionType
    );
    if (byCompletionType !== 0) return byCompletionType;

    return sortKorean(a.subjectName, b.subjectName);
  });
}

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    throw new ApiError(401, "로그인이 필요합니다.");
  }

  const session = await verifySessionToken(token);

  if (!session?.userId) {
    throw new ApiError(401, "유효하지 않은 세션입니다.");
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      isActive: true,
    },
  });

  if (!user) {
    throw new ApiError(401, "사용자 정보를 찾을 수 없습니다.");
  }

  if (!user.isActive) {
    throw new ApiError(403, "비활성화된 계정입니다.");
  }

  return user;
}

function toErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: error.status }
    );
  }

  console.error("[/api/student-records/options]", error);

  return NextResponse.json(
    {
      success: false,
      message: "과목 옵션 데이터를 불러오는 중 오류가 발생했습니다.",
    },
    { status: 500 }
  );
}

export async function GET() {
  try {
    await getCurrentUser();

    const [subjectGroupOptionsRaw, completionTypeOptionsRaw, subjectCatalogRaw] =
      await Promise.all([
        db.subjectGroupOption.findMany({
          where: {
            isActive: true,
          },
          orderBy: [
            { displayOrder: "asc" },
            { name: "asc" },
          ],
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        }),
        db.completionTypeOption.findMany({
          where: {
            isActive: true,
          },
          orderBy: [
            { displayOrder: "asc" },
            { name: "asc" },
          ],
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        }),
        db.studentRecordSubjectCatalog.findMany({
          where: {
            isActive: true,
          },
          orderBy: [
            { displayOrder: "asc" },
            { subjectGroup: "asc" },
            { completionType: "asc" },
            { subjectName: "asc" },
          ],
          select: {
            id: true,
            subjectGroup: true,
            completionType: true,
            subjectName: true,
          },
        }),
      ]);

    const subjectCatalog = dedupeCatalog(
      subjectCatalogRaw.map((item) => ({
        id: item.id,
        subjectGroup: item.subjectGroup,
        completionType: item.completionType,
        subjectName: item.subjectName,
      }))
    );

    if (subjectCatalog.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "과목 카탈로그 데이터가 비어 있습니다. subject catalog 원천 데이터 또는 DB 적재 상태를 확인해 주세요.",
        },
        { status: 503 }
      );
    }

    const subjectGroupsFromCatalog = dedupeByName(
      [...new Set(subjectCatalog.map((item) => item.subjectGroup))].map(
        (name) => ({
          id: `catalog-subject-group-${name}`,
          name,
          isActive: true,
        })
      )
    );

    const completionTypesFromCatalog = dedupeByName(
      [...new Set(subjectCatalog.map((item) => item.completionType))].map(
        (name) => ({
          id: `catalog-completion-type-${name}`,
          name,
          isActive: true,
        })
      )
    );

    const subjectGroups = dedupeByName([
      ...subjectGroupOptionsRaw.map((item) => ({
        id: item.id,
        name: item.name,
        isActive: item.isActive,
      })),
      ...subjectGroupsFromCatalog,
    ]);

    const completionTypes = dedupeByName([
      ...completionTypeOptionsRaw.map((item) => ({
        id: item.id,
        name: item.name,
        isActive: item.isActive,
      })),
      ...completionTypesFromCatalog,
    ]);

    return NextResponse.json({
      success: true,
      subjectGroups,
      completionTypes,
      subjectCatalog,
      meta: {
        subjectGroupOptionCount: subjectGroupOptionsRaw.length,
        completionTypeOptionCount: completionTypeOptionsRaw.length,
        subjectCatalogCount: subjectCatalog.length,
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
