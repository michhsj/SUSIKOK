import fs from "node:fs";
import path from "node:path";
import iconv from "iconv-lite";
import { db } from "../src/lib/db";

function normalize(value: unknown) {
  return String(value ?? "").trim();
}

function decodeBuffer(buffer: Buffer) {
  const utf8 = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const utf16le = iconv.decode(buffer, "utf16-le").replace(/^\uFEFF/, "");
  const cp949 = iconv.decode(buffer, "cp949").replace(/^\uFEFF/, "");

  const candidates = [
    { name: "utf8", text: utf8 },
    { name: "utf16le", text: utf16le },
    { name: "cp949", text: cp949 },
  ];

  for (const candidate of candidates) {
    const firstLine = candidate.text.split(/\r?\n/, 1)[0] ?? "";
    if (
      firstLine.toLowerCase().includes("schoolname") &&
      (firstLine.toLowerCase().includes("sido") ||
        firstLine.toLowerCase().includes("do")) &&
      firstLine.toLowerCase().includes("schoolcode")
    ) {
      console.log(`감지된 인코딩: ${candidate.name}`);
      return candidate.text;
    }
  }

  console.log("인코딩 자동 판별 실패 → cp949로 진행");
  return cp949;
}

function detectDelimiter(headerLine: string) {
  const commaCount = (headerLine.match(/,/g) ?? []).length;
  const tabCount = (headerLine.match(/\t/g) ?? []).length;
  const semicolonCount = (headerLine.match(/;/g) ?? []).length;

  if (tabCount >= commaCount && tabCount >= semicolonCount) return "\t";
  if (semicolonCount >= commaCount && semicolonCount >= tabCount) return ";";
  return ",";
}

function splitLine(line: string, delimiter: string) {
  return line.split(delimiter).map((value) => value.trim());
}

async function main() {
  const filePath =
    process.argv[2] ||
    "C:\\Users\\나\\projects\\susikok\\resources\\excel\\schools\\raw\\schools_master.CSV";

  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`파일을 찾을 수 없습니다: ${resolvedPath}`);
  }

  console.log(`학교 파일 읽는 중: ${resolvedPath}`);

  const buffer = fs.readFileSync(resolvedPath);
  const text = decodeBuffer(buffer);

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\u0000/g, "").trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error("데이터 줄이 부족합니다.");
  }

  const headerLine = lines[0];
  const delimiter = detectDelimiter(headerLine);

  console.log("헤더 원문:", headerLine);
  console.log(
    `감지된 구분자: ${delimiter === "\t" ? "TAB" : delimiter === ";" ? "SEMICOLON" : "COMMA"}`
  );

  const headers = splitLine(headerLine, delimiter);
  console.log("분리된 헤더:", headers);

  const headerIndex = new Map<string, number>();
  headers.forEach((header, index) => {
    headerIndex.set(header.toLowerCase(), index);
  });

  const sidoIndex =
    headerIndex.get("sido") ??
    headerIndex.get("do") ??
    headerIndex.get("시도") ??
    headerIndex.get("시/도");

  const sigunguIndex =
    headerIndex.get("sigungu") ??
    headerIndex.get("시군구") ??
    headerIndex.get("시/군/구");

  const schoolNameIndex =
    headerIndex.get("schoolname") ??
    headerIndex.get("학교명");

  const schoolCodeIndex =
    headerIndex.get("schoolcode") ??
    headerIndex.get("학교코드") ??
    headerIndex.get("표준학교코드");

  if (
    sidoIndex === undefined ||
    sigunguIndex === undefined ||
    schoolNameIndex === undefined ||
    schoolCodeIndex === undefined
  ) {
    throw new Error(
      [
        "필수 헤더를 찾지 못했습니다.",
        `sidoIndex=${String(sidoIndex)}`,
        `sigunguIndex=${String(sigunguIndex)}`,
        `schoolNameIndex=${String(schoolNameIndex)}`,
        `schoolCodeIndex=${String(schoolCodeIndex)}`,
      ].join(" ")
    );
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (let i = 1; i < lines.length; i += 1) {
    const columns = splitLine(lines[i], delimiter);

    const sido = normalize(columns[sidoIndex]);
    const sigungu = normalize(columns[sigunguIndex]);
    const schoolName = normalize(columns[schoolNameIndex]);
    const schoolCode = normalize(columns[schoolCodeIndex]);

    if (!sido || !sigungu || !schoolName || !schoolCode) {
      skipped += 1;
      continue;
    }

    const existing = await db.school.findFirst({
      where: { schoolCode },
      select: { id: true },
    });

    if (existing) {
      await db.school.update({
        where: { id: existing.id },
        data: {
          sido,
          sigungu,
          schoolName,
          schoolCode,
        },
      });
      updated += 1;
    } else {
      await db.school.create({
        data: {
          sido,
          sigungu,
          schoolName,
          schoolCode,
        },
      });
      inserted += 1;
    }
  }

  const total = await db.school.count();

  console.log("학교 데이터 import 완료");
  console.log(`- inserted: ${inserted}`);
  console.log(`- updated: ${updated}`);
  console.log(`- skipped: ${skipped}`);
  console.log(`- school table total: ${total}`);
}

main()
  .catch((error) => {
    console.error("학교 데이터 import 실패");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
