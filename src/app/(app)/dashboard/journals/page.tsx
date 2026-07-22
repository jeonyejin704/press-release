import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isManager } from "@/lib/session";
import { getJournalStats, TOP_TIER_JOURNALS } from "@/lib/dashboard";
import { Card, Badge, EmptyState } from "@/components/ui";
import { JournalBar } from "@/components/DashboardCharts";

export const dynamic = "force-dynamic";

export default async function JournalsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isManager(user)) redirect("/requests");

  const stats = await getJournalStats();
  const otherTopTierRatio = stats.totalResearch
    ? Math.round((stats.topTierTotal / stats.totalResearch) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard" className="text-sm text-pgray-400 hover:text-pgray-600">
          ← 대시보드
        </Link>
        <h1 className="mt-1 font-display text-2xl text-pgray-900">연구성과 저널 게재 현황</h1>
        <p className="mt-0.5 text-sm text-pgray-500">
          연구성과 홍보 {stats.totalResearch}건의 게재 저널 분포입니다.
        </p>
      </div>

      {/* 최상위급 저널 (Nature / Science / Cell) */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="text-base font-bold text-pgray-900">최상위급 학술지 (CNS)</span>
          <Badge color="bg-brand-100 text-brand-700">
            총 {stats.topTierTotal}건 · 전체의 {otherTopTierRatio}%
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {stats.topTier.map((t) => (
            <Card key={t.name} className="p-5 text-center">
              <div className="text-lg font-bold text-pgray-800">{t.name}</div>
              <div className="mt-1 text-4xl font-extrabold text-brand-600">{t.count}</div>
              <div className="text-xs text-pgray-400">게재 건</div>
            </Card>
          ))}
        </div>
      </div>

      {/* 전체 저널별 게재 건수 */}
      <Card className="p-5">
        <div className="mb-2 text-base font-bold text-pgray-900">저널별 게재 건수</div>
        {stats.all.length === 0 ? (
          <EmptyState title="저널 데이터가 없습니다." />
        ) : (
          <JournalBar data={stats.all} topTier={TOP_TIER_JOURNALS} />
        )}
        <p className="mt-2 text-xs text-pgray-400">
          <span className="font-semibold text-brand-600">빨간색</span> = 최상위급(Nature·Science·Cell),{" "}
          <span className="font-semibold text-accent-600">주황색</span> = 그 외 저널
        </p>
      </Card>
    </div>
  );
}
