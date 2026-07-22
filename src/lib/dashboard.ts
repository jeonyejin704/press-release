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
  const monthly: { month: string; count: number; prevCount: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const k = monthKey(d);
    monthly.push({
      month: `${String(d.getMonth() + 1).padStart(2, "0")}월`,
      count: monthCount.get(k) ?? 0,
      prevCount: monthCount.get(k - 12) ?? 0,
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

  return {
    metrics: { total, inProgress, completed, distributed, onHold, rejected, topDept },
    byType,
    byDepartment,
    byStatus,
    monthly,
    todayRelease,
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

// KPI 카드 → 현황 목록 버킷 정의
export const BUCKETS: Record<string, { label: string; match: (s: string) => boolean }> = {
  total: { label: "전체 신청", match: () => true },
  inProgress: { label: "진행 중", match: (s) => ACTIVE_STATUSES.includes(s as RequestStatus) },
  completed: { label: "최종 완료", match: (s) => s === "FINAL_COMPLETED" },
  distributed: { label: "배포 완료", match: (s) => s === "DISTRIBUTED" },
  onHold: { label: "보류", match: (s) => s === "ON_HOLD" },
  rejected: { label: "반려", match: (s) => s === "REJECTED" },
};
