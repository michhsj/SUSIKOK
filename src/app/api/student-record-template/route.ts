import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "templates",
      "student-record-template.xlsx"
    );

    const fileBuffer = await fs.readFile(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="student-record-template.xlsx"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[API] /api/student-record-template 오류:", error);

    return NextResponse.json(
      {
        success: false,
        message: "템플릿 파일을 찾을 수 없습니다.",
      },
      { status: 404 }
    );
  }
}
