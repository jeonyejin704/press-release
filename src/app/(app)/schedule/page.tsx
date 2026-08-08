import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isManager } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, Badge, StatusBadge } from "@/components/ui";
import { type RequestType } from "@/lib/enums";
import { getHolidays } from "@/lib/holidays";

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

// 배포 예정 = 유형별 컬러, 배포 완료(지난) = 모두 회색.
const DONE_STYLE = "bg-pgray-100 text-pgray-400";
const TYPE_COLOR: Record<RequestType, { chip: string; dot: string }> = {
  RESEARCH:      { chip: "bg-brand-100 text-brand-700",     dot: "bg-brand-500" },   // 붉은색
  AWARD:         { chip: "bg-accent-100 text-accent-800",   dot: "bg-accent-500" },  // 노란/주황
  EVENT:         { chip: "bg-blue-100 text-blue-700",       dot: "bg-blue-500" },    // 푸른색
  APPOINTMENT:   { chip: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" }, // 초록색
  PERSONAL_NEWS: { chip: "bg-purple-100 text-purple-700",   dot: "bg-purple-500" },  // 보라색
  OTHER:         { chip: "bg-teal-100 text-teal-700",       dot: "bg-teal-500" },    // 청록색
};

// 배포 완료(지난) 판단: 예상 배포일이 오늘 이전이면 '완료(회색)', 오늘 이후면 '예정(자주)'.
// 달력이므로 날짜만 기준으로 판단한다(아직 도래하지 않은 날짜는 항상 '예정').
function makeIsDone(startOfToday: number) {
  return (item: { status: string; expectedPublishDate: Date | null }) =>
    item.expectedPublishDate ? new Date(item.expectedPublishDate).getTime() < startOfToday : false;
}

// 유형별 '주인공' 이름 추출 (없으면 신청자 이름으로 대체)
/* eslint-disable @typescript-eslint/no-explicit-any */
function personOf(it: any): string {
  const byType =
    it.type === "RESEARCH"
      ? it.research?.correspondingAuthorName || it.research?.firstAuthorName
      : it.type === "AWARD"
        ? it.award?.awardeeName
        : it.type === "APPOINTMENT"
          ? it.appointment?.appointeeName
          : it.type === "PERSONAL_NEWS"
            ? it.personalNews?.subjectName
            : it.type === "EVENT"
              ? it.event?.who || it.event?.host
              : null;
  // 이름 정보가 없거나 '미상'이면 '전예진'으로 통일해 항상 사람 이름이 보이도록 함
  const name = (byType || it.applicant?.name || "").trim();
  return !name || name === "미상" ? "전예진" : name;
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
    select: {
      id: true, title: true, type: true, status: true, expectedPublishDate: true, department: true, note: true,
      applicant: { select: { name: true } },
      research: { select: { correspondingAuthorName: true, firstAuthorName: true } },
      award: { select: { awardeeName: true } },
      appointment: { select: { appointeeName: true } },
      personalNews: { select: { subjectName: true } },
      event: { select: { who: true, host: true } },
    },
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

  // 공휴일(해당 연·월) + 요일 판별
  const holidays = getHolidays(year);
  const holidayOf = (d: number) => holidays[`${month + 1}-${d}`] ?? null;
  const weekdayOf = (d: number) => new Date(year, month, d).getDay(); // 0=일,6=토

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

      {/* 범례 (유형별 색상) */}
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-pgray-500">
        <span className="font-semibold text-pgray-600">배포 예정</span>
        {(Object.keys(TYPE_PREFIX) as RequestType[]).map((t) => (
          <span key={t} className="flex items-center gap-1.5">
            <span className={`inline-block h-3 w-3 rounded ${TYPE_COLOR[t].dot}`} />
            {TYPE_PREFIX[t]}
          </span>
        ))}
        <span className="ml-2 flex items-center gap-1.5 text-pgray-400">
          <span className="inline-block h-3 w-3 rounded bg-pgray-300" />배포 완료(회색)
        </span>
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
            const wd = d !== null ? weekdayOf(d) : -1;
            const holiday = d !== null ? holidayOf(d) : null;
            const isRest = wd === 0 || !!holiday; // 일요일·공휴일 = 빨강
            const isSat = wd === 6;
            // 배경: 공휴일/일요일 옅은 빨강, 토요일 옅은 파랑, 빈칸 회색
            const cellBg = d === null ? "bg-pgray-50/40" : isRest ? "bg-brand-50/30" : isSat ? "bg-blue-50/40" : "";
            const numColor = isToday(d as number)
              ? "rounded-full bg-brand-600 px-1.5 py-0.5 font-bold text-white"
              : isRest ? "font-semibold text-brand-600" : isSat ? "font-semibold text-blue-600" : "text-pgray-400";
            return (
              <div key={i} className={`min-h-[108px] border-b border-r border-pgray-100 ${cellBg}`}>
                {d !== null && (
                  <Link href={dayHref(d)} className={`block h-full p-1.5 transition hover:bg-brand-50/40 ${selected ? "bg-brand-50" : ""}`}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      {holiday ? <span className="truncate text-[10px] font-semibold text-brand-600">{holiday}</span> : <span />}
                      <span className={numColor}>{d}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {dayItems.slice(0, 4).map((it) => {
                        const person = personOf(it);
                        const t = it.type as RequestType;
                        const c = TYPE_COLOR[t];
                        return (
                          <div
                            key={it.id}
                            title={it.note || `[${TYPE_PREFIX[t]}] ${it.title} · ${person}`}
                            className={`flex items-center gap-1 truncate rounded-md px-1.5 py-1 text-[11px] font-medium ${
                              isDone(it) ? DONE_STYLE : c.chip
                            }`}
                          >
                            <span className="shrink-0 font-bold">[{TYPE_PREFIX[t]}]</span>
                            <span className="min-w-0 flex-1 truncate">{person}</span>
                          </div>
                        );
                      })}
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
                      <Badge color={isDone(it) ? DONE_STYLE : TYPE_COLOR[it.type as RequestType].chip}>
                        [{TYPE_PREFIX[it.type as RequestType]}]
                      </Badge>
                      <span className="truncate font-medium text-pgray-800">{it.title}</span>
                    </span>
                    <span className="mt-1 block text-xs text-pgray-400">
                      {[personOf(it), it.department].filter(Boolean).join(" · ")}
                    </span>
                    {it.note && <span className="mt-1 block truncate text-xs text-pgray-500">{it.note}</span>}
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
