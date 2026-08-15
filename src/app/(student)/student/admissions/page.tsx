import { redirect } from "next/navigation";
import { EntitlementFeatureCode, EntitlementStatus } from "@prisma/client";
import AdmissionsPageClient from "../_components/AdmissionsPageClient";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export default async function AdmissionsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const now = new Date();

  const entitlement = await prisma.userEntitlement.findFirst({
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
    },
  });

  const premiumUnlocked = Boolean(entitlement);

  return <AdmissionsPageClient premiumUnlocked={premiumUnlocked} />;
}
