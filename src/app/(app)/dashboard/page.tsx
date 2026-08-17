import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isManager } from "@/lib/session";
import { getDashboardData, BUCKETS, type DashboardRequest } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";
import { Card, StatusBadge, Badge, EmptyState } from "@/components/ui";
import { MonthlyTrend, DepartmentBar, AdSpendTrend } from "@/components/DashboardCharts";
import { TypeStats } from "./TypeStats";
import { DashboardNews } from "@/components/DashboardNews";
import { syncNaverNews } from "@/lib/news/sync";
import { readNewsImages } from "@/lib/news/images";
import { REQUEST_TYPE_LABELS, type RequestType } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isManager(user)) redirect("/requests");

  const sp = await searchParams;
  const from = sp.from ? new Date(sp.from) : undefined;
  const to = sp.to ? new Date(sp.to) : undefined;
  const bucket = sp.bucket && BUCKETS[sp.bucket] ? sp.bucket : undefined;

  const d = await getDashboardData({ from, to });
  // 대시보드 진입 시에도 최신 기사 수집(뉴스 페이지보다 길게 5분 스로틀 — 대시보드는 자주 열림)
  await syncNaverNews({ throttleMs: 5 * 60_000 }).catch(() => null);
  const [news, keywords, newsImages] = await Promise.all([
    prisma.newsItem.findMany({ orderBy: { publishedAt: "desc" }, take: 25 }),
    prisma.newsKeyword.findMany({ where: { active: true }, orderBy: { createdAt: "asc" } }),
    readNewsImages(),
  ]);
  const newsForCard = news.map((n) => ({ ...n, imageUrl: newsImages[n.url] || null }));

  // 기간 파라미터를 보존한 KPI 링크 생성
  const rangeQS = new URLSearchParams();
  if (sp.from) rangeQS.set("from", sp.from);
  if (sp.to) rangeQS.set("to", sp.to);
  const kpiHref = (key: string) => {
    const qs = new URLSearchParams(rangeQS);
    qs.set("bucket", key);
    return `/dashboard?${qs.toString()}`;
  };

  const bucketList = bucket
    ? d.requests.filter((r) => BUCKETS[bucket].match(r.status))
    : [];

  const kpis = [
    { key: "total", label: "홍보신청", value: d.kpi.thisYear.total, last: d.kpi.lastYear.total, tone: "brandDark" },
    { key: "done", label: "배포완료", value: d.kpi.thisYear.done, last: d.kpi.lastYear.done, tone: "brand" },
    { key: "hold", label: "진행보류", value: d.kpi.thisYear.hold, last: d.kpi.lastYear.hold, tone: "gray" },
  ];

  const rangeLabel = sp.from || sp.to ? `${sp.from ?? "처음"} ~ ${sp.to ?? "오늘"}` : "전체 기간";
  const ty = new Date().getFullYear();

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-pgray-900">
            <span className="text-brand-600">POSTECH</span> 언론 홍보 현황
          </h1>
          <p className="mt-0.5 text-sm text-pgray-500">
            안녕하세요, {user.name}님. 기간 <span className="font-semibold text-brand-600">{rangeLabel}</span> 기준 현황입니다.
          </p>
        </div>

        {/* 기간 설정 */}
        <form method="get" className="flex flex-wrap items-end gap-2">
          {bucket && <input type="hidden" name="bucket" value={bucket} />}
          <label className="text-xs text-pgray-500">
            시작
            <input type="date" name="from" defaultValue={sp.from ?? ""} className="ml-1 rounded-lg border border-pgray-300 px-2 py-1.5 text-sm" />
          </label>
          <label className="text-xs text-pgray-500">
            종료
            <input type="date" name="to" defaultValue={sp.to ?? ""} className="ml-1 rounded-lg border border-pgray-300 px-2 py-1.5 text-sm" />
          </label>
          <button className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700">
            기간 적용
          </button>
          {(sp.from || sp.to) && (
            <Link href="/dashboard" className="rounded-lg px-3 py-1.5 text-sm text-pgray-500 hover:bg-pgray-100">
              초기화
            </Link>
          )}
        </form>
      </div>

      {/* ── 1행: KPI 3종 (올해 / 작년 비교, 클릭 시 목록) ─────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {kpis.map((k) => (
          <Link key={k.key} href={kpiHref(k.key)}>
            <Card
              className={`border-t-4 border-t-brand-600 p-4 text-center transition hover:-translate-y-0.5 hover:shadow-md ${
                bucket === k.key ? "ring-2 ring-brand-500" : ""
              }`}
            >
              <div className="text-sm text-pgray-500">{k.label}</div>
              <div className={`mt-1 font-display text-[2.6rem] leading-none ${TONE[k.tone]}`}>{k.value}</div>
              <div className="mt-1 text-xs text-pgray-400">
                작년({d.kpi.year - 1}) <span className="font-semibold text-pgray-500">{k.last}</span>
              </div>
              <div className="mt-1.5 text-[11px] text-pgray-400">클릭하여 목록 보기</div>
            </Card>
          </Link>
        ))}
      </div>

      {/* 선택 현황 목록 */}
      {bucket && (
        <Card className="border-t-4 border-t-brand-600 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold text-pgray-900">
                {BUCKETS[bucket].label} 목록
              </span>
              <Badge color="bg-brand-100 text-brand-700">{bucketList.length}건</Badge>
              <span className="text-xs text-pgray-400">· {rangeLabel}</span>
            </div>
            <Link
              href={`/dashboard${rangeQS.toString() ? `?${rangeQS.toString()}` : ""}`}
              className="text-sm text-pgray-500 hover:underline"
            >
              닫기 ✕
            </Link>
          </div>
          <BucketTable items={bucketList} />
        </Card>
      )}

      {/* ── 2행: 유형별 건수(왼쪽) + 유형별 비율 도넛(오른쪽) ─────────── */}
      <TypeStats data={d.byType} />

      {/* ── 3행: 월별 신청 추이(왼쪽) + 학과별 신청 건수(오른쪽) ─────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-t-4 border-t-brand-600 p-5">
          <SectionTitle>
            월별 신청 추이
            <span className="ml-1 text-xs font-normal text-pgray-400">{d.kpi.year}학년도(3월~) · 작년 동월 비교</span>
          </SectionTitle>
          <MonthlyTrend data={d.monthly} />
        </Card>
        <Card className="flex flex-col border-t-4 border-t-brand-600 p-5">
          <SectionTitle>
            학과별 신청 건수 <span className="text-brand-600">TOP 5</span>
            <span className="ml-1 text-xs font-normal text-pgray-400">{ty} 기준 · {ty - 1} 비교</span>
          </SectionTitle>
          <div className="flex flex-1 items-center">
            <div className="w-full">
              {d.byDepartment.length ? <DepartmentBar data={d.byDepartment.slice(0, 5)} /> : <EmptyState title="데이터 없음" />}
            </div>
          </div>
        </Card>
      </div>

      {/* ── 광고비 집행 현황 ─────────────────────────── */}
      <Card className="border-t-4 border-t-brand-600 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <SectionTitle>광고비 집행 현황<span className="text-pgray-400">(최근 3개년)</span></SectionTitle>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[11px] text-pgray-400">{d.adSpend.fiscalYear}학년도 집행 합계</div>
              <div className="font-display text-xl text-brand-700">{manwon(d.adSpend.thisYearTotal)}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-pgray-400">{d.adSpend.fiscalYear - 1}학년도 집행 합계</div>
              <div className="font-display text-xl text-accent-600">{manwon(d.adSpend.lastYearTotal)}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-pgray-400">{d.adSpend.fiscalYear - 2}학년도 집행 합계</div>
              <div className="font-display text-xl text-pgray-600">{manwon(d.adSpend.twoYearsAgoTotal)}</div>
            </div>
            <Link href="/ads" className="text-xs font-medium text-brand-600 hover:underline">
              내역 관리 →
            </Link>
          </div>
        </div>
        <AdSpendTrend data={d.adSpend.monthly} fiscalYear={d.adSpend.fiscalYear} />
      </Card>

      {/* ── 관련 기사 · 뉴스 모니터링 (전체 너비) ─────────── */}
      <Card className="border-t-4 border-t-brand-600 p-5">
        <div className="mb-1 flex items-center justify-between">
          <SectionTitle>관련 기사 · 뉴스 모니터링</SectionTitle>
          <Link href="/news" className="text-xs font-medium text-brand-600 hover:underline">
            전체 보기 →
          </Link>
        </div>
        <DashboardNews news={JSON.parse(JSON.stringify(newsForCard))} keywords={keywords.map((k) => k.keyword)} />
      </Card>

      {/* 처리 대기 요약 (3분류) */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniList title="새로운 홍보 신청" hint="연구진 신청 · 확인 전" items={d.lists.newSubmissions} />
        <MiniList title="연구진 검토 대기" hint="초안 업로드됨 · 검토 전" items={d.lists.draftReview} />
        <MiniList title="보도자료 배포 예정" hint="최종본 확정 · 배포 대기" items={d.lists.awaitingDistribution} />
      </div>
    </div>
  );
}

const TONE: Record<string, string> = {
  brandDark: "text-brand-700",
  brand: "text-brand-500",
  accent: "text-accent-600",
  gray: "text-pgray-500",
  grayDark: "text-pgray-600",
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 text-base font-bold text-pgray-900">{children}</div>;
}

// 원 → 사람이 읽기 쉬운 금액 (억/만원)
function manwon(v: number): string {
  if (v >= 100000000) return `${(v / 100000000).toFixed(1)}억원`;
  if (v >= 10000) return `${Math.round(v / 10000).toLocaleString()}만원`;
  return `${v.toLocaleString()}원`;
}

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleDateString("ko-KR", { year: "2-digit", month: "2-digit", day: "2-digit" }) : "-";
}

function BucketTable({ items }: { items: DashboardRequest[] }) {
  if (items.length === 0) return <EmptyState title="해당 현황의 신청이 없습니다." />;
  return (
    <div className="max-h-[28rem] overflow-auto rounded-lg border border-pgray-100">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-pgray-50 text-left text-xs uppercase text-pgray-500">
          <tr>
            <th className="px-3 py-2">제목</th>
            <th className="px-3 py-2">유형</th>
            <th className="px-3 py-2">학과</th>
            <th className="px-3 py-2">신청자</th>
            <th className="px-3 py-2">상태</th>
            <th className="px-3 py-2">신청일</th>
            <th className="px-3 py-2">예상 배포일</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-pgray-100">
          {items.map((r) => (
            <tr key={r.id} className="hover:bg-pgray-50">
              <td className="px-3 py-2">
                <Link href={`/requests/${r.id}`} className="font-medium text-brand-700 hover:underline">
                  {r.title}
                </Link>
              </td>
              <td className="px-3 py-2 text-pgray-600">{REQUEST_TYPE_LABELS[r.type]}</td>
              <td className="px-3 py-2 text-pgray-600">{r.department ?? "-"}</td>
              <td className="px-3 py-2 text-pgray-600">{r.applicantName}</td>
              <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
              <td className="px-3 py-2 text-pgray-400">{fmt(r.createdAt)}</td>
              <td className="px-3 py-2 text-pgray-400">{fmt(r.expectedPublishDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MiniList({ title, hint, items }: { title: string; hint?: string; items: DashboardRequest[] }) {
  return (
    <Card className="border-t-4 border-t-brand-600 p-4">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-bold text-pgray-800">{title}</span>
        <Badge color={items.length ? "bg-accent-100 text-accent-800" : "bg-pgray-100 text-pgray-500"}>
          {items.length}
        </Badge>
      </div>
      {hint && <p className="mb-2 text-[11px] text-pgray-400">{hint}</p>}
      {items.length === 0 ? (
        <p className="py-3 text-center text-xs text-pgray-400">없음</p>
      ) : (
        <ul className="space-y-0.5">
          {items.slice(0, 7).map((r) => (
            <li key={r.id}>
              <Link href={`/requests/${r.id}`} className="flex items-center justify-between gap-2 rounded px-1.5 py-1.5 text-sm text-pgray-700 hover:bg-pgray-50">
                <span className="truncate">{r.title}</span>
                <span className="shrink-0 text-[11px] text-pgray-400">{r.department ?? ""}</span>
              </Link>
            </li>
          ))}
          {items.length > 7 && <li className="px-1.5 pt-1 text-[11px] text-pgray-400">외 {items.length - 7}건</li>}
        </ul>
      )}
    </Card>
  );
}
