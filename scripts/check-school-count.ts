import { db } from "../src/lib/db";

async function main() {
  const count = await db.school.count();
  console.log("school table count:", count);

  const sample = await db.school.findMany({
    take: 5,
    select: {
      id: true,
      sido: true,
      sigungu: true,
      schoolName: true,
      schoolCode: true,
    },
  });

  console.log("sample:", sample);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
