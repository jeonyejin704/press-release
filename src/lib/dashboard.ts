import { prisma } from "@/lib/prisma";
import {
  ACTIVE_STATUSES,
  REQUEST_TYPE_LABELS,
  REQUEST_STATUS_LABELS,
  type RequestType,
  type RequestStatus,
} from "@/lib/enums";

export type DashboardRange = { from?: Date; to?: Date };

export type DashboardRequest = {
  id: string;
  title: string;
  type: RequestType;
  status: string;
  department: string | null;
  applicantName: string;
  createdAt: string;
  submittedAt: string | null;
  expectedPublishDate: string | null;
  updatedAt: string;
};

export async function getDashboardData(range: DashboardRange = {}) {
  const allRows = await prisma.pressRequest.findMany({
    include: {
      applicant: { select: { name: true } },
      releases: { where: { language: "KO" }, select: { subtitle: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // 기간 필터 (createdAt 기준). to는 해당 일자의 끝까지 포함.
  const fromT = range.from ? range.from.getTime() : -Infinity;
  const toT = range.to ? range.to.getTime() + 86400000 - 1 : Infinity;
  const inRange = allRows.filter((r) => {
    const t = new Date(r.createdAt).getTime();
    return t >= fromT && t <= toT;
  });

  const has = (arr: RequestStatus[], s: string) => arr.includes(s as RequestStatus);

  const total = inRange.length;
  const inProgress = inRange.filter((r) => has(ACTIVE_STATUSES, r.status)).length;
  const completed = inRange.filter((r) => r.status === "FINAL_COMPLETED").length;
  const distributed = inRange.filter((r) => r.status === "DISTRIBUTED").length;
  const onHold = inRange.filter((r) => r.status === "ON_HOLD").length;
  const rejected = inRange.filter((r) => r.status === "REJECTED").length;

  // ── KPI 3종(홍보신청/배포완료/진행보류) 연도별 비교 ─────────────────
  // 배포완료 = 최종완료 + 배포완료, 진행보류 = 진행 중 + 보류
  const nowY = new Date();
  const isDone = (s: string) => s === "FINAL_COMPLETED" || s === "DISTRIBUTED";
  const isHold = (s: string) => has(ACTIVE_STATUSES, s) || s === "ON_HOLD";
  const kpiCounts = (year: number) => {
    const rows = allRows.filter((r) => new Date(r.createdAt).getFullYear() === year);
    return {
      total: rows.length,
      done: rows.filter((r) => isDone(r.status)).length,
      hold: rows.filter((r) => isHold(r.status)).length,
    };
  };
  const kpi = {
    year: nowY.getFullYear(),
    thisYear: kpiCounts(nowY.getFullYear()),
    lastYear: kpiCounts(nowY.getFullYear() - 1),
  };

  // 유형별 (비율은 차트에서 Recharts가 계산 — 'percent' 키는 충돌하므로 사용하지 않음)
  const byType = Object.entries(REQUEST_TYPE_LABELS)
    .map(([key, label]) => {
      const count = inRange.filter((r) => r.type === key).length;
      return { key, label, count, ratio: total ? Math.round((count / total) * 100) : 0 };
    })
    .filter((t) => t.count > 0);

  // 학과별 (전년 대비): 최근 12개월(올해) vs 그 이전 12개월(전년), 기간필터와 무관
  const now = new Date();
  const winStart = new Date(now.getFullYear(), now.getMonth() - 11, 1).getTime();
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 23, 1).getTime();
  const deptThis = new Map<string, number>();
  const deptPrev = new Map<string, number>();
  for (const r of allRows) {
    const t = new Date(r.createdAt).getTime();
    const d = r.department ?? "기타";
    if (t >= winStart) deptThis.set(d, (deptThis.get(d) ?? 0) + 1);
    else if (t >= prevStart) deptPrev.set(d, (deptPrev.get(d) ?? 0) + 1);
  }
  const deptNames = new Set<string>([...deptThis.keys(), ...deptPrev.keys()]);
  const byDepartment = Array.from(deptNames)
    .map((label) => ({ label, thisYear: deptThis.get(label) ?? 0, lastYear: deptPrev.get(label) ?? 0 }))
    .sort((a, b) => b.thisYear - a.thisYear || b.lastYear - a.lastYear);

  // 상태별
  const byStatus = Object.entries(REQUEST_STATUS_LABELS)
    .map(([key, label]) => ({ key, label, count: inRange.filter((r) => r.status === key).length }))
    .filter((s) => s.count > 0);

  // 월별 추이 (전년 대비): 최근 12개월 각각에 대해 올해 count + 작년 동월 prevCount
  const monthKey = (d: Date) => d.getFullYear() * 12 + d.getMonth();
  const monthCount = new Map<number, number>();
  for (const r of allRows) {
    const k = monthKey(new Date(r.createdAt));
    monthCount.set(k, (monthCount.get(k) ?? 0) + 1);
  }
  // 학년도 시작(3월)부터 현재 월까지 — 시간이 지날수록 월이 늘어난다.
  const fyStart = now.getMonth() >= 2
    ? new Date(now.getFullYear(), 2, 1)       // 3~12월: 올해 3월 시작
    : new Date(now.getFullYear() - 1, 2, 1);  // 1~2월: 작년 3월 시작
  const monthsSince = (now.getFullYear() * 12 + now.getMonth()) - (fyStart.getFullYear() * 12 + fyStart.getMonth());
  const monthly: { month: string; count: number; prevCount: number }[] = [];
  for (let k = 0; k <= monthsSince; k++) {
    const d = new Date(fyStart.getFullYear(), fyStart.getMonth() + k, 1);
    const mk = monthKey(d);
    monthly.push({
      month: `${d.getMonth() + 1}월`,
      count: monthCount.get(mk) ?? 0,
      prevCount: monthCount.get(mk - 12) ?? 0,
    });
  }

  // 오늘 배포 예정 (기간과 무관하게 항상 표시)
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 86400000);
  const todayRelease = allRows
    .filter((r) => {
      if (!r.expectedPublishDate) return false;
      const d = new Date(r.expectedPublishDate);
      return d >= startOfDay && d < endOfDay;
    })
    .map((r) => ({
      id: r.id,
      title: r.title,
      subtitle: r.releases[0]?.subtitle ?? "",
      type: r.type as RequestType,
      department: r.department,
      status: r.status,
    }));

  // 처리 대기 목록 (기간과 무관)
  const materialNeeded = allRows.filter((r) => r.status === "MATERIAL_REQUESTED");
  const applicantReview = allRows.filter((r) => r.status === "APPLICANT_REVIEW");
  const englishReview = allRows.filter(
    (r) => r.status === "ENGLISH_DRAFTING" || r.status === "ENGLISH_REVIEW_REQUESTED",
  );
  const stale = allRows.filter((r) => {
    if (!has(ACTIVE_STATUSES, r.status)) return false;
    const days = (now.getTime() - new Date(r.updatedAt).getTime()) / 86400000;
    return days > 14;
  });

  const topDept = byDepartment[0]?.label ?? "-";

  // ── 광고비 집행 (학년도 3월~다음해 2월 기준, 월별 올해/전년 + 연간 합계) ──
  const ads = await prisma.adSpend.findMany({ select: { amount: true, executedAt: true } });
  // 학년도: 3월(월 index 2)~다음해 2월. 1·2월은 전년도 학년도에 속함.
  const fiscalYearOf = (d: Date) => (d.getMonth() >= 2 ? d.getFullYear() : d.getFullYear() - 1);
  const currentFY = fiscalYearOf(now);
  const adMonthYoY = new Map<number, number>(); // monthKey -> 합계
  let adThisYearTotal = 0;
  let adLastYearTotal = 0;
  for (const a of ads) {
    const dt = new Date(a.executedAt);
    adMonthYoY.set(monthKey(dt), (adMonthYoY.get(monthKey(dt)) ?? 0) + a.amount);
    const fy = fiscalYearOf(dt);
    if (fy === currentFY) adThisYearTotal += a.amount;
    else if (fy === currentFY - 1) adLastYearTotal += a.amount;
  }
  // 학년도 월 순서: 3,4,…,12,1,2 (i=0 → 3월). 1·2월은 학년도+1 달력연도.
  const monthOfFiscalPos = (i: number) => (2 + i) % 12; // 0-indexed month
  const calYearForFiscal = (fyStart: number, i: number) => (monthOfFiscalPos(i) >= 2 ? fyStart : fyStart + 1);
  const adMonthly: { month: string; thisYear: number; lastYear: number; ymThis: string; ymLast: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const mi = monthOfFiscalPos(i);
    const yThis = calYearForFiscal(currentFY, i);
    const yLast = calYearForFiscal(currentFY - 1, i);
    const mm = String(mi + 1).padStart(2, "0");
    adMonthly.push({
      month: `${mm}월`,
      thisYear: adMonthYoY.get(yThis * 12 + mi) ?? 0,
      lastYear: adMonthYoY.get(yLast * 12 + mi) ?? 0,
      ymThis: `${yThis}-${mm}`,
      ymLast: `${yLast}-${mm}`,
    });
  }

  return {
    metrics: { total, inProgress, completed, distributed, onHold, rejected, topDept },
    kpi,
    byType,
    byDepartment,
    byStatus,
    monthly,
    todayRelease,
    adSpend: {
      monthly: adMonthly,
      thisYearTotal: adThisYearTotal,
      lastYearTotal: adLastYearTotal,
      fiscalYear: currentFY,
      count: ads.length,
    },
    requests: inRange.map(serialize), // 기간 필터된 전체(현황 목록용)
    lists: {
      materialNeeded: materialNeeded.map(serialize),
      applicantReview: applicantReview.map(serialize),
      englishReview: englishReview.map(serialize),
      stale: stale.map(serialize),
    },
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function serialize(r: any): DashboardRequest {
  return {
    id: r.id,
    title: r.title,
    type: r.type as RequestType,
    status: r.status,
    department: r.department,
    applicantName: r.applicant?.name ?? "",
    createdAt: r.createdAt,
    submittedAt: r.submittedAt,
    expectedPublishDate: r.expectedPublishDate,
    updatedAt: r.updatedAt,
  };
}

// 최상위급 학술지 (연구성과 저널 상세)
export const TOP_TIER_JOURNALS = ["Nature", "Science", "Cell"];

export async function getJournalStats() {
  const rows = await prisma.researchDetail.findMany({
    where: { journalName: { not: null } },
    select: { journalName: true, pressRequest: { select: { department: true } } },
  });
  const map = new Map<string, number>();
  for (const r of rows) {
    const j = (r.journalName ?? "").trim();
    if (!j) continue;
    map.set(j, (map.get(j) ?? 0) + 1);
  }
  const all = Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  const topTier = TOP_TIER_JOURNALS.map((name) => ({ name, count: map.get(name) ?? 0 }));
  const topTierTotal = topTier.reduce((s, t) => s + t.count, 0);
  return { all, topTier, topTierTotal, totalResearch: rows.length };
}

// KPI 카드(3종) → 현황 목록 버킷 정의
export const BUCKETS: Record<string, { label: string; match: (s: string) => boolean }> = {
  total: { label: "홍보신청", match: () => true },
  done: { label: "배포완료", match: (s) => s === "FINAL_COMPLETED" || s === "DISTRIBUTED" },
  hold: {
    label: "진행보류",
    match: (s) => ACTIVE_STATUSES.includes(s as RequestStatus) || s === "ON_HOLD",
  },
};
