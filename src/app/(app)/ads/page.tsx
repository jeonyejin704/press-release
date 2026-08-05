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
  let thisYearTotal = 0;
  let lastYearTotal = 0;
  const byMedium = new Map<string, number>();
  for (const a of ads) {
    const fy = fiscalYearOf(new Date(a.executedAt));
    if (fy === thisYear) {
      thisYearTotal += a.amount;
      byMedium.set(a.medium, (byMedium.get(a.medium) ?? 0) + a.amount);
    } else if (fy === thisYear - 1) {
      lastYearTotal += a.amount;
    }
  }
  const mediums = Array.from(byMedium.entries())
    .map(([medium, amount]) => ({ medium, amount }))
    .sort((a, b) => b.amount - a.amount);

  // 대시보드 그래프에서 클릭한 월 (YYYY-MM)
  const sp = await searchParams;
  const focusMonth = sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : null;

  const restorable = await restorableCount();

  return (
    <AdsClient
      ads={JSON.parse(JSON.stringify(ads))}
      summary={{ thisYear, thisYearTotal, lastYearTotal, mediums, count: ads.length }}
      focusMonth={focusMonth}
      restorable={restorable}
    />
  );
}
