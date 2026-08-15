import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";

const filePath =
  process.argv[2] ||
  "C:\\Users\\나\\projects\\susikok\\resources\\excel\\schools\\raw\\schools_master.CSV";

const resolvedPath = path.resolve(filePath);

if (!fs.existsSync(resolvedPath)) {
  throw new Error(`파일을 찾을 수 없습니다: ${resolvedPath}`);
}

const workbook = XLSX.readFile(resolvedPath, {
  raw: false,
  codepage: 949,
});

const firstSheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[firstSheetName];
const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
  defval: "",
});

console.log("file:", resolvedPath);
console.log("sheet:", firstSheetName);
console.log("row count:", rows.length);
console.log("headers:", rows[0] ? Object.keys(rows[0]) : []);
console.log("first 3 rows:", rows.slice(0, 3));
