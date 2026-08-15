import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/auth/session";

function getGradeLabel(gradeLevel: number | null) {
  if (gradeLevel === 1) return "1학년";
  if (gradeLevel === 2) return "2학년";
  if (gradeLevel === 3) return "3학년";
  if (gradeLevel === 4) return "N수/기타";
  return "-";
}

function formatDate(date: Date | null) {
  if (!date) return "-";
  return date.toLocaleString("ko-KR");
}

export default async function MyPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(sessionToken);

  if (!session) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      gradeLevel: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
      school: {
        select: {
          schoolName: true,
          sido: true,
          sigungu: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
          내 정보
        </div>

        <h1 className="mt-3 text-2xl font-extrabold text-slate-950">
          내 정보
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          학교 정보와 계정 정보를 확인하는 페이지입니다.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              이름
            </p>
            <p className="mt-3 text-lg font-extrabold text-slate-950">
              {user.name}
            </p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              학교
            </p>
            <p className="mt-3 text-lg font-extrabold text-slate-950">
              {user.school?.schoolName || "-"}
            </p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              학년
            </p>
            <p className="mt-3 text-lg font-extrabold text-slate-950">
              {getGradeLabel(user.gradeLevel)}
            </p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              회원 유형
            </p>
            <p className="mt-3 text-lg font-extrabold text-slate-950">
              {user.role}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-slate-950">
            학교 정보
          </h2>

          <div className="mt-5 space-y-3 text-sm text-slate-700">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <span className="font-semibold text-slate-500">학교명</span>
              <span className="text-right font-bold text-slate-950">
                {user.school?.schoolName || "-"}
              </span>
            </div>

            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <span className="font-semibold text-slate-500">지역</span>
              <span className="text-right font-bold text-slate-950">
                {user.school
                  ? `${user.school.sido} / ${user.school.sigungu}`
                  : "-"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-slate-950">
            계정 정보
          </h2>

          <div className="mt-5 space-y-3 text-sm text-slate-700">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <span className="font-semibold text-slate-500">이메일</span>
              <span className="text-right font-bold text-slate-950 break-all">
                {user.email}
              </span>
            </div>

            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <span className="font-semibold text-slate-500">가입일</span>
              <span className="text-right font-bold text-slate-950">
                {formatDate(user.createdAt)}
              </span>
            </div>

            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <span className="font-semibold text-slate-500">최근 로그인</span>
              <span className="text-right font-bold text-slate-950">
                {formatDate(user.lastLoginAt)}
              </span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <span className="font-semibold text-slate-500">회원 ID</span>
              <span className="text-right font-bold text-slate-950 break-all">
                {user.id}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
