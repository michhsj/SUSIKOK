import { db } from "@/lib/db";
import {
  EntitlementFeatureCode,
  EntitlementStatus,
} from "@prisma/client";

export async function getActiveAnalysisEntitlement(userId: string) {
  const now = new Date();

  return db.userEntitlement.findFirst({
    where: {
      userId,
      featureCode: EntitlementFeatureCode.ANALYSIS_30D,
      status: EntitlementStatus.ACTIVE,
      startsAt: {
        lte: now,
      },
      expiresAt: {
        gt: now,
      },
    },
    orderBy: {
      expiresAt: "desc",
    },
  });
}

export async function hasActiveAnalysisMembership(userId: string) {
  const entitlement = await getActiveAnalysisEntitlement(userId);
  return Boolean(entitlement);
}
