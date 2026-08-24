import path from "node:path";
import dotenv from "dotenv";

type BackfillResult = {
  userId: string;
  ok: boolean;
  error?: string;
};

const DEFAULT_BATCH_SIZE = 100;

function toPositiveInt(value: string | undefined, fallback: number) {
  if (!value) return fallback;

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function loadEnvFiles() {
  const cwd = process.cwd();

  dotenv.config({ path: path.join(cwd, ".env.local") });
  dotenv.config({ path: path.join(cwd, ".env") });
}

async function run() {
  loadEnvFiles();

  const { db } = await import("../src/lib/db");
  const { upsertStudentAdmissionAnalysisForUser } = await import(
    "../src/lib/student/upsert-student-admission-analysis"
  );

  const batchSize = toPositiveInt(
    process.env.BACKFILL_BATCH_SIZE,
    DEFAULT_BATCH_SIZE
  );
  const onlyUserId = process.env.BACKFILL_USER_ID?.trim() || "";
  const dryRun = process.env.BACKFILL_DRY_RUN === "1";

  console.log("[backfill] start");
  console.log("[backfill] options:", {
    batchSize,
    onlyUserId: onlyUserId || null,
    dryRun,
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
  });

  const groupedUsers = await db.studentRecordSubmission.groupBy({
    by: ["userId"],
    where: {
      isLocked: true,
    },
  });

  let userIds: string[] = groupedUsers.map((row) => row.userId);

  if (onlyUserId) {
    userIds = userIds.filter((userId) => userId === onlyUserId);
  }

  console.log("[backfill] target users:", userIds.length);

  if (userIds.length === 0) {
    console.log("[backfill] no target users found");
    await db.$disconnect();
    return;
  }

  let successCount = 0;
  let failCount = 0;
  const failures: BackfillResult[] = [];

  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch: string[] = userIds.slice(i, i + batchSize);

    console.log(
      `[backfill] processing batch ${Math.floor(i / batchSize) + 1} / ${Math.ceil(
        userIds.length / batchSize
      )} (${batch.length} users)`
    );

    for (const userId of batch) {
      try {
        if (dryRun) {
          console.log("[backfill] dry-run skip:", { userId });
          successCount += 1;
          continue;
        }

        const result = await upsertStudentAdmissionAnalysisForUser(userId);

        console.log("[backfill] success:", {
          userId,
          result,
        });

        successCount += 1;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";

        console.error("[backfill] failed:", {
          userId,
          error,
        });

        failCount += 1;
        failures.push({
          userId,
          ok: false,
          error: message,
        });
      }
    }
  }

  console.log("[backfill] done");
  console.log("[backfill] summary:", {
    total: userIds.length,
    successCount,
    failCount,
  });

  if (failures.length > 0) {
    console.log("[backfill] failures:");
    for (const item of failures) {
      console.log(`- ${item.userId}: ${item.error}`);
    }
  }

  await db.$disconnect();
}

run().catch((error) => {
  console.error("[backfill] fatal error:", error);
  process.exitCode = 1;
});
