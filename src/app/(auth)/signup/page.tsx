export const dynamic = "force-dynamic";

import SignupForm from "@/components/auth/SignupForm";
import { db } from "@/lib/db";

type InitialSidoOption = {
  label: string;
  value: string;
};

async function getInitialSidoOptions(): Promise<InitialSidoOption[]> {
  try {
    const sidoList: Array<{ sido: string | null }> = await db.school.findMany({
      select: { sido: true },
      distinct: ["sido"],
      orderBy: { sido: "asc" },
    });

    return sidoList
      .map((item: { sido: string | null }) => String(item.sido ?? "").trim())
      .filter((value: string) => value.length > 0)
      .map((value: string) => ({
        label: value,
        value,
      }));
  } catch (error) {
    console.error("[signup] failed to load sido options", error);
    return [];
  }
}

export default async function SignupPage() {
  const initialSidoOptions = await getInitialSidoOptions();

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f9fc_0%,#eef3ff_50%,#f8fafc_100%)] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto w-full max-w-4xl">
        <SignupForm initialSidoOptions={initialSidoOptions} />
      </div>
    </main>
  );
}
