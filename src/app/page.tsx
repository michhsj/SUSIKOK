import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import MainHeader from "@/components/layout/MainHeader";
import MainFooter from "@/components/layout/MainFooter";
import ServiceOverviewSection from "@/components/sections/home/ServiceOverviewSection";
import AnalysisGuideSection from "@/components/sections/home/AnalysisGuideSection";
import TargetUsersSection from "@/components/sections/home/TargetUsersSection";
import FinalCtaSection from "@/components/sections/home/FinalCtaSection";
import HomePopupLayer from "@/components/home/HomePopupLayer";

type HomePopupRecord = {
  id: string;
  enabled: boolean;
  imageUrl: string | null;
  width: number;
  height: number;
  positionX: number;
  positionY: number;
  todayHideEnabled: boolean;
  sortOrder: number;
  updatedAt: Date;
  createdAt: Date;
};

type HomePopupSelect = {
  id?: boolean;
  enabled?: boolean;
  imageUrl?: boolean;
  width?: boolean;
  height?: boolean;
  positionX?: boolean;
  positionY?: boolean;
  todayHideEnabled?: boolean;
  sortOrder?: boolean;
  updatedAt?: boolean;
  createdAt?: boolean;
};

type HomePopupDelegate = {
  findMany: (args?: {
    where?: {
      enabled?: boolean;
      imageUrl?: {
        not?: null;
      };
    };
    orderBy?:
      | {
          sortOrder?: "asc" | "desc";
          updatedAt?: "asc" | "desc";
          createdAt?: "asc" | "desc";
        }
      | Array<{
          sortOrder?: "asc" | "desc";
          updatedAt?: "asc" | "desc";
          createdAt?: "asc" | "desc";
        }>;
    select?: HomePopupSelect;
  }) => Promise<HomePopupRecord[]>;
};

function getHomePopupDelegate(): HomePopupDelegate | null {
  const client = prisma as unknown as { homePopup?: HomePopupDelegate };
  return client.homePopup ?? null;
}

type HomePopupViewItem = {
  id: string;
  enabled: boolean;
  imageUrl: string;
  width: number;
  height: number;
  positionX: number;
  positionY: number;
  todayHideEnabled: boolean;
  sortOrder: number;
  updatedAt: string;
};

export default async function HomePage() {
  noStore();

  let popupsData: HomePopupViewItem[] = [];

  try {
    const homePopup = getHomePopupDelegate();

    if (homePopup) {
      const popups = await homePopup.findMany({
        where: {
          enabled: true,
          imageUrl: {
            not: null,
          },
        },
        orderBy: [
          { sortOrder: "asc" },
          { updatedAt: "desc" },
          { createdAt: "desc" },
        ],
        select: {
          id: true,
          enabled: true,
          imageUrl: true,
          width: true,
          height: true,
          positionX: true,
          positionY: true,
          todayHideEnabled: true,
          sortOrder: true,
          updatedAt: true,
          createdAt: true,
        },
      });

      popupsData = popups
        .filter(
          (
            popup
          ): popup is HomePopupRecord & {
            imageUrl: string;
          } => Boolean(popup.imageUrl)
        )
        .map((popup) => ({
          id: popup.id,
          enabled: popup.enabled,
          imageUrl: popup.imageUrl,
          width: popup.width,
          height: popup.height,
          positionX: popup.positionX,
          positionY: popup.positionY,
          todayHideEnabled: popup.todayHideEnabled,
          sortOrder: popup.sortOrder,
          updatedAt: popup.updatedAt.toISOString(),
        }));
    }
  } catch (error) {
    console.error("[app/page] home popup load error:", error);
  }

  return (
    <>
      {popupsData.length > 0 ? <HomePopupLayer popups={popupsData} /> : null}

      <MainHeader />

      <main id="main-content" className="bg-white text-slate-900">
        <FinalCtaSection />
        <ServiceOverviewSection />
        <TargetUsersSection />
        <AnalysisGuideSection />
      </main>

      <MainFooter />
    </>
  );
}
