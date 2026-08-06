import { redirect } from "next/navigation";
import { getCurrentUser, isManager } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { restorableCount } from "@/lib/ads-backup";
import { AdsClient } from "./AdsClient";

export const dynamic = "force-dynamic";

export default async function AdsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isManager(user)) redirect("/requests");

  const ads = await prisma.adSpend.findMany({ orderBy: { executedAt: "desc" } });

  const now = new Date();
  // 학년도: 3월(월 index 2)~다음해 2월. 1·2월은 전년도 학년도.
  const fiscalYearOf = (d: Date) => (d.getMonth() >= 2 ? d.getFullYear() : d.getFullYear() - 1);
  const thisYear = fiscalYearOf(now);

  // 데이터 구조: title = 매체명(예: 조선일보), medium = 광고 유형(예: 신문/온라인).
  // 학년도별 집행 합계
  const yearTotal = new Map<number, number>();
  // 올해 '매체명(title)'별 집행액
  const byName = new Map<string, number>();
  // 매체명 × 학년도 (증감 비교용)
  const yearsSet = new Set<number>();
  const mediaYearMap = new Map<string, Map<number, number>>();
  for (const a of ads) {
    const fy = fiscalYearOf(new Date(a.executedAt));
    yearsSet.add(fy);
    yearTotal.set(fy, (yearTotal.get(fy) ?? 0) + a.amount);
    if (fy === thisYear) byName.set(a.title, (byName.get(a.title) ?? 0) + a.amount);
    if (!mediaYearMap.has(a.title)) mediaYearMap.set(a.title, new Map());
    const mm = mediaYearMap.get(a.title)!;
    mm.set(fy, (mm.get(fy) ?? 0) + a.amount);
  }

  const mediaByName = Array.from(byName.entries())
    .map(([medium, amount]) => ({ medium, amount }))
    .sort((a, b) => b.amount - a.amount);

  // 요약 카드에 표시할 최근 3개 학년도(올해/작년/재작년)
  const cardYears = [thisYear, thisYear - 1, thisYear - 2];
  const yearTotals = cardYears.map((y) => ({ year: y, total: yearTotal.get(y) ?? 0 }));

  const years = Array.from(yearsSet).sort((x, y) => x - y);
  const latestYear = years[years.length - 1];
  const mediaYoY = Array.from(mediaYearMap.entries())
    .map(([medium, ym]) => {
      const byYear: Record<string, number> = {};
      for (const y of years) byYear[String(y)] = ym.get(y) ?? 0;
      return { medium, byYear };
    })
    .sort((a, b) => (b.byYear[String(latestYear)] ?? 0) - (a.byYear[String(latestYear)] ?? 0));

  // 대시보드 그래프에서 클릭한 월 (YYYY-MM)
  const sp = await searchParams;
  const focusMonth = sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : null;

  const restorable = await restorableCount();

  return (
    <AdsClient
      ads={JSON.parse(JSON.stringify(ads))}
      summary={{ thisYear, yearTotals, mediums: mediaByName, count: ads.length }}
      mediaYoY={mediaYoY}
      years={years}
      focusMonth={focusMonth}
      restorable={restorable}
    />
  );
}
