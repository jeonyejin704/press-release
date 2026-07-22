import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isManager } from "@/lib/session";
import { getDashboardData } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";
import { Card, StatCard, StatusBadge, Badge, EmptyState } from "@/components/ui";
import { MonthlyTrend, TypePie, DepartmentBar } from "@/components/DashboardCharts";
import { REQUEST_TYPE_LABELS, type RequestType } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isManager(user)) redirect("/requests");

  const d = await getDashboardData();
  const recentNews = await prisma.newsItem.findMany({
    orderBy: { publishedAt: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">홍보 현황 대시보드</h1>
        <p className="text-sm text-slate-500">오늘 처리해야 할 일과 전체 현황을 한눈에.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="전체 신청" value={d.metrics.total} />
        <StatCard label="진행 중" value={d.metrics.inProgress} accent="text-indigo-600" />
        <StatCard label="최종 완료" value={d.metrics.completed} accent="text-green-600" />
        <StatCard label="배포 완료" value={d.metrics.distributed} accent="text-emerald-600" />
        <StatCard label="보류" value={d.metrics.onHold} accent="text-yellow-600" />
        <StatCard label="반려" value={d.metrics.rejected} accent="text-red-600" />
      </div>

      {/* Today's tasks */}
      <div className="grid gap-4 lg:grid-cols-3">
        <TaskList title="자료 보완 필요" color="bg-amber-100 text-amber-800" items={d.lists.materialNeeded} />
        <TaskList title="연구진 검토 대기" color="bg-purple-100 text-purple-700" items={d.lists.applicantReview} />
        <TaskList title="영문본 검토 대기" color="bg-sky-100 text-sky-800" items={d.lists.englishReview} />
        <TaskList title="배포 임박 (7일 내)" color="bg-emerald-100 text-emerald-800" items={d.lists.soon} showDate />
        <TaskList title="장기 미처리 (7일+)" color="bg-red-100 text-red-700" items={d.lists.stale} />
        <TaskList title="최근 신청" color="bg-blue-100 text-blue-700" items={d.lists.recent} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-2 text-sm font-semibold text-slate-700">월별 신청 추이</div>
          <MonthlyTrend data={d.monthly} />
        </Card>
        <Card className="p-5">
          <div className="mb-2 text-sm font-semibold text-slate-700">홍보 유형별 비율</div>
          {d.byType.length ? <TypePie data={d.byType} /> : <EmptyState title="데이터 없음" />}
        </Card>
        <Card className="p-5">
          <div className="mb-2 text-sm font-semibold text-slate-700">
            학과별 신청 건수 (가장 활발: {d.metrics.topDept})
          </div>
          {d.byDepartment.length ? <DepartmentBar data={d.byDepartment} /> : <EmptyState title="데이터 없음" />}
        </Card>
        <Card className="p-5">
          <div className="mb-3 text-sm font-semibold text-slate-700">상태별 신청 현황</div>
          <div className="flex flex-wrap gap-2">
            {d.byStatus.map((s) => (
              <div key={s.key} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5">
                <StatusBadge status={s.key} />
                <span className="text-sm font-semibold text-slate-700">{s.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 mb-2 text-sm font-semibold text-slate-700">최근 언론 보도</div>
          <ul className="space-y-1.5 text-sm">
            {recentNews.map((n) => (
              <li key={n.id} className="flex items-center gap-2">
                {n.isImportant && <span className="text-amber-500">★</span>}
                <a href={n.url} target="_blank" className="truncate text-brand-700 hover:underline">
                  {n.title}
                </a>
                <span className="shrink-0 text-xs text-slate-400">{n.mediaName}</span>
              </li>
            ))}
          </ul>
          <Link href="/news" className="mt-2 inline-block text-xs text-brand-600 hover:underline">
            전체 뉴스 모니터링 →
          </Link>
        </Card>
      </div>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function TaskList({
  title,
  color,
  items,
  showDate,
}: {
  title: string;
  color: string;
  items: any[];
  showDate?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">{title}</span>
        <Badge color={color}>{items.length}</Badge>
      </div>
      {items.length === 0 ? (
        <p className="py-3 text-center text-xs text-slate-400">항목 없음</p>
      ) : (
        <ul className="space-y-1.5">
          {items.slice(0, 5).map((r) => (
            <li key={r.id}>
              <Link href={`/requests/${r.id}`} className="block rounded-lg px-2 py-1.5 hover:bg-slate-50">
                <div className="truncate text-sm font-medium text-slate-700">{r.title}</div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span>{REQUEST_TYPE_LABELS[r.type as RequestType]}</span>
                  {r.department && <span>· {r.department}</span>}
                  {showDate && r.expectedPublishDate && (
                    <span>· {new Date(r.expectedPublishDate).toLocaleDateString("ko-KR")}</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
