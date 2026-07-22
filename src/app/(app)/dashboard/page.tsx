import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isManager } from "@/lib/session";
import { getDashboardData } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";
import { Card, StatusBadge, Badge, EmptyState } from "@/components/ui";
import { MonthlyTrend, TypePie, DepartmentBar } from "@/components/DashboardCharts";
import { DashboardNews } from "@/components/DashboardNews";
import { REQUEST_TYPE_LABELS, type RequestType } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isManager(user)) redirect("/requests");

  const d = await getDashboardData();
  const [news, keywords] = await Promise.all([
    prisma.newsItem.findMany({ orderBy: { publishedAt: "desc" }, take: 30 }),
    prisma.newsKeyword.findMany({ where: { active: true }, orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-pgray-900">홍보 현황 대시보드</h1>
        <p className="mt-0.5 text-sm text-pgray-500">
          안녕하세요, {user.name}님. 오늘 배포 예정 보도자료와 전체 현황을 확인하세요.
        </p>
      </div>

      {/* ── 1행: KPI ─────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Kpi label="전체 신청" value={d.metrics.total} tone="brand" />
        <Kpi label="진행 중" value={d.metrics.inProgress} tone="accent" />
        <Kpi label="최종 완료" value={d.metrics.completed} tone="green" />
        <Kpi label="배포 완료" value={d.metrics.distributed} tone="green" />
        <Kpi label="보류" value={d.metrics.onHold} tone="gray" />
        <Kpi label="반려" value={d.metrics.rejected} tone="gray" />
      </div>

      {/* ── 2행: 그래프 ──────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <SectionTitle>월별 신청 추이</SectionTitle>
          <MonthlyTrend data={d.monthly} />
        </Card>
        <Card className="p-5">
          <SectionTitle>홍보 유형별 비율</SectionTitle>
          {d.byType.length ? <TypePie data={d.byType} /> : <EmptyState title="데이터 없음" />}
        </Card>
        <Card className="p-5">
          <SectionTitle>
            학과별 신청 건수
            <span className="ml-1 text-xs font-normal text-pgray-400">최다: {d.metrics.topDept}</span>
          </SectionTitle>
          {d.byDepartment.length ? <DepartmentBar data={d.byDepartment} /> : <EmptyState title="데이터 없음" />}
        </Card>
      </div>

      {/* ── 3행: 오늘 배포 보도자료 + 관련 기사 ──────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-t-4 border-t-brand-600 p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-lg font-extrabold text-pgray-900">📣 오늘 배포 보도자료</span>
            <Badge color="bg-brand-100 text-brand-700">{d.todayRelease.length}건</Badge>
          </div>
          {d.todayRelease.length === 0 ? (
            <p className="py-6 text-center text-sm text-pgray-400">오늘 배포 예정인 보도자료가 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {d.todayRelease.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/requests/${r.id}`}
                    className="block rounded-lg border border-pgray-100 bg-pgray-50 px-4 py-3 transition hover:border-brand-200 hover:bg-brand-50"
                  >
                    <div className="flex items-center gap-2">
                      <Badge color="bg-white text-pgray-500">{REQUEST_TYPE_LABELS[r.type]}</Badge>
                      <span className="text-base font-bold text-pgray-900">{r.title}</span>
                    </div>
                    {r.subtitle && <p className="mt-0.5 text-sm text-pgray-500">{r.subtitle}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-1 flex items-center justify-between">
            <SectionTitle>관련 기사 · 뉴스 모니터링</SectionTitle>
            <Link href="/news" className="text-xs font-medium text-brand-600 hover:underline">
              전체 보기 →
            </Link>
          </div>
          <DashboardNews news={JSON.parse(JSON.stringify(news))} keywords={keywords.map((k) => k.keyword)} />
        </Card>
      </div>

      {/* 처리 대기 요약 (보조) */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MiniList title="자료 보완 필요" items={d.lists.materialNeeded} />
        <MiniList title="연구진 검토 대기" items={d.lists.applicantReview} />
        <MiniList title="영문본 검토 대기" items={d.lists.englishReview} />
        <MiniList title="장기 미처리 (7일+)" items={d.lists.stale} />
      </div>
    </div>
  );
}

const TONE: Record<string, string> = {
  brand: "text-brand-600",
  accent: "text-accent-600",
  green: "text-green-600",
  gray: "text-pgray-500",
};

function Kpi({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <Card className="p-4">
      <div className="text-sm text-pgray-500">{label}</div>
      <div className={`mt-1 text-3xl font-extrabold ${TONE[tone]}`}>{value}</div>
    </Card>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 text-base font-bold text-pgray-900">{children}</div>;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function MiniList({ title, items }: { title: string; items: any[] }) {
  return (
    <Card className="p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-pgray-700">{title}</span>
        <Badge color={items.length ? "bg-accent-100 text-accent-800" : "bg-pgray-100 text-pgray-500"}>
          {items.length}
        </Badge>
      </div>
      {items.length === 0 ? (
        <p className="py-2 text-center text-xs text-pgray-400">없음</p>
      ) : (
        <ul className="space-y-1">
          {items.slice(0, 4).map((r) => (
            <li key={r.id}>
              <Link href={`/requests/${r.id}`} className="block truncate rounded px-1.5 py-1 text-sm text-pgray-700 hover:bg-pgray-50">
                {r.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
