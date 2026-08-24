import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/auth/admin-session";

type HomePopupRecord = {
  id: string;
  title: string;
  enabled: boolean;
  imageUrl: string | null;
  width: number;
  height: number;
  positionX: number;
  positionY: number;
  todayHideEnabled: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

type HomePopupSelect = {
  id?: boolean;
  title?: boolean;
  enabled?: boolean;
  imageUrl?: boolean;
  width?: boolean;
  height?: boolean;
  positionX?: boolean;
  positionY?: boolean;
  todayHideEnabled?: boolean;
  sortOrder?: boolean;
  createdAt?: boolean;
  updatedAt?: boolean;
};

type PopupOrderInput = {
  id?: unknown;
  sortOrder?: unknown;
};

type NormalizedPopupOrderItem = {
  id: string;
  sortOrder: number;
};

type HomePopupDelegate = {
  findMany: (args?: {
    orderBy?:
      | Array<{
          sortOrder?: "asc" | "desc";
          updatedAt?: "asc" | "desc";
          createdAt?: "asc" | "desc";
        }>
      | {
          sortOrder?: "asc" | "desc";
          updatedAt?: "asc" | "desc";
          createdAt?: "asc" | "desc";
        };
    select?: HomePopupSelect;
    where?: {
      enabled?: boolean;
      imageUrl?: {
        not?: null;
      };
    };
  }) => Promise<HomePopupRecord[]>;
  findUnique: (args: {
    where: { id: string };
    select?: HomePopupSelect;
  }) => Promise<HomePopupRecord | null>;
  findFirst: (args?: {
    orderBy?:
      | Array<{
          sortOrder?: "asc" | "desc";
          updatedAt?: "asc" | "desc";
          createdAt?: "asc" | "desc";
        }>
      | {
          sortOrder?: "asc" | "desc";
          updatedAt?: "asc" | "desc";
          createdAt?: "asc" | "desc";
        };
    select?: HomePopupSelect;
  }) => Promise<HomePopupRecord | null>;
  create: (args: {
    data: {
      title: string;
      enabled: boolean;
      imageUrl: string | null;
      width: number;
      height: number;
      positionX: number;
      positionY: number;
      todayHideEnabled: boolean;
      sortOrder: number;
    };
    select?: HomePopupSelect;
  }) => Promise<HomePopupRecord>;
  update: (args: {
    where: { id: string };
    data: {
      title?: string;
      enabled?: boolean;
      imageUrl?: string | null;
      width?: number;
      height?: number;
      positionX?: number;
      positionY?: number;
      todayHideEnabled?: boolean;
      sortOrder?: number;
    };
    select?: HomePopupSelect;
  }) => Promise<HomePopupRecord>;
  delete: (args: {
    where: { id: string };
    select?: HomePopupSelect;
  }) => Promise<HomePopupRecord>;
};

function getHomePopupDelegate(): HomePopupDelegate | null {
  const client = prisma as unknown as { homePopup?: HomePopupDelegate };
  return client.homePopup ?? null;
}

const popupSelect = {
  id: true,
  title: true,
  enabled: true,
  imageUrl: true,
  width: true,
  height: true,
  positionX: true,
  positionY: true,
  todayHideEnabled: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} satisfies HomePopupSelect;

function clampInt(
  value: unknown,
  min: number,
  max: number,
  fallback: number
): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  const int = Math.trunc(num);
  return Math.min(max, Math.max(min, int));
}

function toStringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminSessionToken(token);
}

async function getNextSortOrder(homePopup: HomePopupDelegate) {
  const lastItem = await homePopup.findFirst({
    orderBy: [
      { sortOrder: "desc" },
      { updatedAt: "desc" },
      { createdAt: "desc" },
    ],
    select: {
      sortOrder: true,
    },
  });

  return typeof lastItem?.sortOrder === "number" ? lastItem.sortOrder + 1 : 1;
}

async function getOrderedItems(homePopup: HomePopupDelegate) {
  return homePopup.findMany({
    orderBy: [
      { sortOrder: "asc" },
      { updatedAt: "desc" },
      { createdAt: "desc" },
    ],
    select: popupSelect,
  });
}

async function normalizeSortOrders(homePopup: HomePopupDelegate) {
  const items = await getOrderedItems(homePopup);

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];

    if (item.sortOrder !== index + 1) {
      await homePopup.update({
        where: { id: item.id },
        data: {
          sortOrder: index + 1,
        },
      });
    }
  }

  return getOrderedItems(homePopup);
}

export async function GET() {
  try {
    const adminSession = await verifyAdmin();

    if (!adminSession) {
      return NextResponse.json(
        { success: false, message: "관리자 인증이 필요합니다." },
        { status: 401 }
      );
    }

    const homePopup = getHomePopupDelegate();

    if (!homePopup) {
      return NextResponse.json(
        {
          success: false,
          message:
            "HomePopup 모델이 Prisma Client에 반영되지 않았습니다. prisma generate를 먼저 실행해 주세요.",
        },
        { status: 500 }
      );
    }

    const items = await getOrderedItems(homePopup);

    return NextResponse.json({
      success: true,
      items,
    });
  } catch (error) {
    console.error("[api/admin/home-popup] GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "팝업 목록을 불러오는 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminSession = await verifyAdmin();

    if (!adminSession) {
      return NextResponse.json(
        { success: false, message: "관리자 인증이 필요합니다." },
        { status: 401 }
      );
    }

    const homePopup = getHomePopupDelegate();

    if (!homePopup) {
      return NextResponse.json(
        {
          success: false,
          message:
            "HomePopup 모델이 Prisma Client에 반영되지 않았습니다. prisma generate를 먼저 실행해 주세요.",
        },
        { status: 500 }
      );
    }

    const body = await req.json();

    const id =
      typeof body.id === "string" && body.id.trim().length > 0
        ? body.id.trim()
        : null;

    const title = toStringValue(body.title, "").trim() || "메인 팝업";
    const imageUrl = toStringValue(body.imageUrl, "").trim() || null;

    const payload = {
      title,
      enabled: Boolean(body.enabled),
      imageUrl,
      width: clampInt(body.width, 200, 1200, 420),
      height: clampInt(body.height, 200, 1400, 560),
      positionX: clampInt(body.positionX, 0, 3000, 24),
      positionY: clampInt(body.positionY, 0, 3000, 24),
      todayHideEnabled: Boolean(body.todayHideEnabled),
    };

    let saved: HomePopupRecord;

    if (id) {
      const existing = await homePopup.findUnique({
        where: { id },
        select: {
          id: true,
          sortOrder: true,
        },
      });

      if (existing) {
        saved = await homePopup.update({
          where: { id },
          data: {
            ...payload,
            sortOrder: existing.sortOrder,
          },
          select: popupSelect,
        });
      } else {
        saved = await homePopup.create({
          data: {
            ...payload,
            sortOrder: await getNextSortOrder(homePopup),
          },
          select: popupSelect,
        });
      }
    } else {
      saved = await homePopup.create({
        data: {
          ...payload,
          sortOrder: await getNextSortOrder(homePopup),
        },
        select: popupSelect,
      });
    }

    const items = await getOrderedItems(homePopup);

    return NextResponse.json({
      success: true,
      message: "팝업이 설정되었습니다.",
      item: saved,
      items,
    });
  } catch (error) {
    console.error("[api/admin/home-popup] POST error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "팝업 저장 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminSession = await verifyAdmin();

    if (!adminSession) {
      return NextResponse.json(
        { success: false, message: "관리자 인증이 필요합니다." },
        { status: 401 }
      );
    }

    const homePopup = getHomePopupDelegate();

    if (!homePopup) {
      return NextResponse.json(
        {
          success: false,
          message:
            "HomePopup 모델이 Prisma Client에 반영되지 않았습니다. prisma generate를 먼저 실행해 주세요.",
        },
        { status: 500 }
      );
    }

    const body = (await req.json()) as {
      items?: PopupOrderInput[];
    };

    const rawItems: PopupOrderInput[] = Array.isArray(body.items)
      ? body.items
      : [];

    if (rawItems.length === 0) {
      return NextResponse.json(
        { success: false, message: "정렬할 팝업 목록이 비어 있습니다." },
        { status: 400 }
      );
    }

    const normalizedItems: NormalizedPopupOrderItem[] = rawItems
      .map(
        (item: PopupOrderInput, index: number): NormalizedPopupOrderItem => ({
          id:
            typeof item.id === "string" && item.id.trim().length > 0
              ? item.id.trim()
              : "",
          sortOrder:
            typeof item.sortOrder === "number" &&
            Number.isFinite(item.sortOrder)
              ? Math.max(1, Math.trunc(item.sortOrder))
              : index + 1,
        })
      )
      .filter((item: NormalizedPopupOrderItem) => item.id.length > 0);

    if (normalizedItems.length === 0) {
      return NextResponse.json(
        { success: false, message: "유효한 팝업 ID가 없습니다." },
        { status: 400 }
      );
    }

    for (let index = 0; index < normalizedItems.length; index += 1) {
      const item: NormalizedPopupOrderItem = normalizedItems[index];

      await homePopup.update({
        where: { id: item.id },
        data: {
          sortOrder: index + 1,
        },
      });
    }

    const items = await getOrderedItems(homePopup);

    return NextResponse.json({
      success: true,
      message: "팝업 순서가 변경되었습니다.",
      items,
    });
  } catch (error) {
    console.error("[api/admin/home-popup] PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "팝업 순서 저장 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const adminSession = await verifyAdmin();

    if (!adminSession) {
      return NextResponse.json(
        { success: false, message: "관리자 인증이 필요합니다." },
        { status: 401 }
      );
    }

    const homePopup = getHomePopupDelegate();

    if (!homePopup) {
      return NextResponse.json(
        {
          success: false,
          message:
            "HomePopup 모델이 Prisma Client에 반영되지 않았습니다. prisma generate를 먼저 실행해 주세요.",
        },
        { status: 500 }
      );
    }

    const id = req.nextUrl.searchParams.get("id")?.trim() ?? "";

    if (!id) {
      return NextResponse.json(
        { success: false, message: "삭제할 팝업 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const existing = await homePopup.findUnique({
      where: { id },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "삭제할 팝업을 찾지 못했습니다." },
        { status: 404 }
      );
    }

    await homePopup.delete({
      where: { id },
    });

    const items = await normalizeSortOrders(homePopup);

    return NextResponse.json({
      success: true,
      message: "팝업이 삭제되었습니다.",
      items,
    });
  } catch (error) {
    console.error("[api/admin/home-popup] DELETE error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "팝업 삭제 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
