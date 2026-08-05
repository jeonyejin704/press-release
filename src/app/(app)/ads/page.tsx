import { redirect } from "next/navigation";
import { getCurrentUser, isManager } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AdsClient } from "./AdsClient";

export const dynamic = "force-dynamic";

export default async function AdsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isManager(user)) redirect("/requests");

  const ads = await prisma.adSpend.findMany({ orderBy: { executedAt: "desc" } });

  const now = new Date();
  const thisYear = now.getFullYear();
  let thisYearTotal = 0;
  let lastYearTotal = 0;
  const byMedium = new Map<string, number>();
  for (const a of ads) {
    const y = new Date(a.executedAt).getFullYear();
    if (y === thisYear) {
      thisYearTotal += a.amount;
      byMedium.set(a.medium, (byMedium.get(a.medium) ?? 0) + a.amount);
    } else if (y === thisYear - 1) {
      lastYearTotal += a.amount;
    }
  }
  const mediums = Array.from(byMedium.entries())
    .map(([medium, amount]) => ({ medium, amount }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <AdsClient
      ads={JSON.parse(JSON.stringify(ads))}
      summary={{ thisYear, thisYearTotal, lastYearTotal, mediums, count: ads.length }}
    />
  );
}
