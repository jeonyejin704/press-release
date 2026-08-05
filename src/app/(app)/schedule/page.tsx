import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isManager } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";
import { REQUEST_TYPE_LABELS, type RequestType } from "@/lib/enums";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isManager(user)) redirect("/requests");

  const sp = await searchParams;
  const now = new Date();
  const year = sp.y ? parseInt(sp.y) : now.getFullYear();
  const month = sp.m ? parseInt(sp.m) - 1 : now.getMonth(); // 0-based

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);

  const items = await prisma.pressRequest.findMany({
    where: { expectedPublishDate: { gte: monthStart, lt: monthEnd } },
    select: { id: true, title: true, type: true, expectedPublishDate: true, status: true },
    orderBy: { expectedPublishDate: "asc" },
  });

  // 날짜별 그룹
  const byDay = new Map<number, typeof items>();
  for (const it of items) {
    const day = new Date(it.expectedPublishDate!).getDate();
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(it);
  }

  // 달력 셀 구성
  const firstWeekday = monthStart.getDay(); // 0=일
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const prev = new Date(year, month - 1, 1);
  const next = new Date(year, month + 1, 1);
  const href = (dt: Date) => `/schedule?y=${dt.getFullYear()}&m=${dt.getMonth() + 1}`;
  const isToday = (d: number) =>
    year === now.getFullYear() && month === now.getMonth() && d === now.getDate();

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-pgray-900">배포일정</h1>
          <p className="text-sm text-pgray-500">예상 배포일 기준 보도자료 달력입니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={href(prev)} className="rounded-lg border border-pgray-200 px-3 py-1.5 text-sm hover:bg-pgray-50">‹ 이전</Link>
          <span className="min-w-[7rem] text-center font-display text-lg text-brand-700">
            {year}년 {month + 1}월
          </span>
          <Link href={href(next)} className="rounded-lg border border-pgray-200 px-3 py-1.5 text-sm hover:bg-pgray-50">다음 ›</Link>
          <Link href="/schedule" className="ml-1 rounded-lg px-3 py-1.5 text-sm text-pgray-500 hover:bg-pgray-100">오늘</Link>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-7 border-b border-pgray-100 bg-pgray-50 text-center">
          {WEEKDAYS.map((w, i) => (
            <div key={w} className={`py-2 text-xs font-semibold ${i === 0 ? "text-brand-600" : i === 6 ? "text-accent-700" : "text-pgray-500"}`}>
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, i) => (
            <div
              key={i}
              className={`min-h-[104px] border-b border-r border-pgray-100 p-1.5 ${
                d === null ? "bg-pgray-50/40" : ""
              }`}
            >
              {d !== null && (
                <>
                  <div className={`mb-1 text-right text-xs ${isToday(d) ? "" : "text-pgray-400"}`}>
                    <span className={isToday(d) ? "rounded-full bg-brand-600 px-1.5 py-0.5 font-bold text-white" : ""}>{d}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {(byDay.get(d) ?? []).slice(0, 4).map((it) => (
                      <Link
                        key={it.id}
                        href={`/requests/${it.id}`}
                        title={it.title}
                        className="block truncate rounded-md bg-brand-50 px-1.5 py-1 text-[11px] font-medium text-brand-700 hover:bg-brand-100"
                      >
                        {it.title}
                      </Link>
                    ))}
                    {(byDay.get(d)?.length ?? 0) > 4 && (
                      <span className="px-1 text-[10px] text-pgray-400">+{byDay.get(d)!.length - 4}건 더</span>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-4">
        <div className="mb-2 text-sm font-bold text-pgray-800">이번 달 배포 예정 ({items.length}건)</div>
        {items.length === 0 ? (
          <p className="text-sm text-pgray-400">예정된 배포가 없습니다.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => (
              <Link key={it.id} href={`/requests/${it.id}`} className="flex items-center gap-2 rounded-xl border border-pgray-100 bg-white px-3 py-2 hover:bg-pgray-50">
                <span className="rounded-md bg-brand-600 px-2 py-1 text-xs font-bold text-white">
                  {new Date(it.expectedPublishDate!).getDate()}일
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-pgray-800">{it.title}</span>
                  <Badge>{REQUEST_TYPE_LABELS[it.type as RequestType]}</Badge>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
