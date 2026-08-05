import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isManager } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, Badge, StatusBadge } from "@/components/ui";
import { type RequestType } from "@/lib/enums";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 유형 앞머리 표시
const TYPE_PREFIX: Record<RequestType, string> = {
  RESEARCH: "연구",
  AWARD: "수상",
  EVENT: "행사/이벤트",
  APPOINTMENT: "위원선임",
  PERSONAL_NEWS: "동정",
  OTHER: "기타",
};

// 배포 완료(지난) 판단: 예상 배포일이 오늘 이전이면 '완료(회색)', 오늘 이후면 '예정(자주)'.
// 달력이므로 날짜만 기준으로 판단한다(아직 도래하지 않은 날짜는 항상 '예정').
function makeIsDone(startOfToday: number) {
  return (item: { status: string; expectedPublishDate: Date | null }) =>
    item.expectedPublishDate ? new Date(item.expectedPublishDate).getTime() < startOfToday : false;
}

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
  const month = sp.m ? parseInt(sp.m) - 1 : now.getMonth();
  const selectedDay = sp.d ? parseInt(sp.d) : null;

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);

  const items = await prisma.pressRequest.findMany({
    where: { expectedPublishDate: { gte: monthStart, lt: monthEnd } },
    select: { id: true, title: true, type: true, status: true, expectedPublishDate: true, department: true },
    orderBy: { expectedPublishDate: "asc" },
  });

  const byDay = new Map<number, typeof items>();
  for (const it of items) {
    const day = new Date(it.expectedPublishDate!).getDate();
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(it);
  }

  const firstWeekday = monthStart.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const prev = new Date(year, month - 1, 1);
  const next = new Date(year, month + 1, 1);
  const navHref = (dt: Date) => `/schedule?y=${dt.getFullYear()}&m=${dt.getMonth() + 1}`;
  const dayHref = (d: number) => `/schedule?y=${year}&m=${month + 1}&d=${d}`;
  const isToday = (d: number) =>
    year === now.getFullYear() && month === now.getMonth() && d === now.getDate();

  const selectedItems = selectedDay ? byDay.get(selectedDay) ?? [] : [];
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const isDone = makeIsDone(startOfToday);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl text-pgray-900">배포일정</h1>
          <p className="text-sm text-pgray-500">예상 배포일 기준 보도자료 달력입니다. 날짜를 클릭하면 아래에 상세가 표시됩니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={navHref(prev)} className="rounded-lg border border-pgray-200 px-3 py-1.5 text-sm hover:bg-pgray-50">‹ 이전</Link>
          <span className="min-w-[7rem] text-center font-display text-lg text-brand-700">{year}년 {month + 1}월</span>
          <Link href={navHref(next)} className="rounded-lg border border-pgray-200 px-3 py-1.5 text-sm hover:bg-pgray-50">다음 ›</Link>
          <Link href="/schedule" className="ml-1 rounded-lg px-3 py-1.5 text-sm text-pgray-500 hover:bg-pgray-100">오늘</Link>
        </div>
      </div>

      {/* 범례 */}
      <div className="mb-3 flex items-center gap-4 text-xs text-pgray-500">
        <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded bg-brand-500" />배포 예정</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded bg-pgray-300" />배포 완료</span>
      </div>

      <Card className="overflow-hidden border-t-4 border-t-brand-600 p-0">
        <div className="grid grid-cols-7 border-b border-pgray-100 bg-pgray-50 text-center">
          {WEEKDAYS.map((w, i) => (
            <div key={w} className={`py-2 text-xs font-semibold ${i === 0 ? "text-brand-600" : i === 6 ? "text-accent-700" : "text-pgray-500"}`}>{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            const dayItems = d !== null ? byDay.get(d) ?? [] : [];
            const selected = d !== null && d === selectedDay;
            return (
              <div key={i} className={`min-h-[108px] border-b border-r border-pgray-100 ${d === null ? "bg-pgray-50/40" : ""}`}>
                {d !== null && (
                  <Link href={dayHref(d)} className={`block h-full p-1.5 transition hover:bg-brand-50/40 ${selected ? "bg-brand-50" : ""}`}>
                    <div className="mb-1 text-right text-xs">
                      <span className={isToday(d) ? "rounded-full bg-brand-600 px-1.5 py-0.5 font-bold text-white" : "text-pgray-400"}>{d}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {dayItems.slice(0, 4).map((it) => (
                        <div
                          key={it.id}
                          title={it.title}
                          className={`truncate rounded-md px-1.5 py-1 text-[11px] font-medium ${
                            isDone(it) ? "bg-pgray-100 text-pgray-500" : "bg-brand-50 text-brand-700"
                          }`}
                        >
                          <span className="font-bold">[{TYPE_PREFIX[it.type as RequestType]}]</span> {it.title}
                        </div>
                      ))}
                      {dayItems.length > 4 && <span className="px-1 text-[10px] text-pgray-400">+{dayItems.length - 4}건 더</span>}
                    </div>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* 선택한 날짜 상세 */}
      {selectedDay && (
        <Card className="mt-4 border-t-4 border-t-brand-600 p-5">
          <div className="mb-3 text-base font-bold text-pgray-900">
            {year}년 {month + 1}월 {selectedDay}일 배포 예정
            <span className="ml-2 text-sm font-normal text-pgray-400">{selectedItems.length}건</span>
          </div>
          {selectedItems.length === 0 ? (
            <p className="py-4 text-center text-sm text-pgray-400">이 날짜에 배포 예정인 보도자료가 없습니다.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {selectedItems.map((it) => (
                <Link key={it.id} href={`/requests/${it.id}`} className="flex items-center justify-between gap-2 rounded-xl border border-pgray-100 bg-white px-4 py-3 hover:bg-pgray-50">
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <Badge color={isDone(it) ? "bg-pgray-100 text-pgray-500" : "bg-brand-100 text-brand-700"}>
                        [{TYPE_PREFIX[it.type as RequestType]}]
                      </Badge>
                      <span className="truncate font-medium text-pgray-800">{it.title}</span>
                    </span>
                    <span className="mt-1 block text-xs text-pgray-400">{it.department ?? ""}</span>
                  </span>
                  <StatusBadge status={it.status} />
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
