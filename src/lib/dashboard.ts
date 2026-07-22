import { prisma } from "@/lib/prisma";
import {
  ACTIVE_STATUSES,
  REQUEST_TYPE_LABELS,
  REQUEST_STATUS_LABELS,
  type RequestType,
  type RequestStatus,
} from "@/lib/enums";

export async function getDashboardData() {
  const all = await prisma.pressRequest.findMany({
    include: { applicant: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const total = all.length;
  const inProgress = all.filter((r) => ACTIVE_STATUSES.includes(r.status as RequestStatus)).length;
  const completed = all.filter((r) => r.status === "FINAL_COMPLETED").length;
  const distributed = all.filter((r) => r.status === "DISTRIBUTED").length;
  const onHold = all.filter((r) => r.status === "ON_HOLD").length;
  const rejected = all.filter((r) => r.status === "REJECTED").length;

  // By type
  const byType = Object.entries(REQUEST_TYPE_LABELS).map(([key, label]) => ({
    key,
    label,
    count: all.filter((r) => r.type === key).length,
  }));

  // By department
  const deptMap = new Map<string, number>();
  for (const r of all) {
    const d = r.department ?? "기타";
    deptMap.set(d, (deptMap.get(d) ?? 0) + 1);
  }
  const byDepartment = Array.from(deptMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  // By status
  const byStatus = Object.entries(REQUEST_STATUS_LABELS)
    .map(([key, label]) => ({ key, label, count: all.filter((r) => r.status === key).length }))
    .filter((s) => s.count > 0);

  // Monthly trend (last 6 months) based on createdAt
  const now = new Date();
  const monthly: { month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
    const count = all.filter((r) => {
      const c = new Date(r.createdAt);
      return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth();
    }).length;
    monthly.push({ month: label, count });
  }

  // Task lists for "today"
  const materialNeeded = all.filter((r) => r.status === "MATERIAL_REQUESTED");
  const applicantReview = all.filter((r) => r.status === "APPLICANT_REVIEW");
  const englishReview = all.filter(
    (r) => r.status === "ENGLISH_DRAFTING" || r.status === "ENGLISH_REVIEW_REQUESTED",
  );
  const soon = all.filter((r) => {
    if (!r.expectedPublishDate) return false;
    const days = (new Date(r.expectedPublishDate).getTime() - now.getTime()) / 86400000;
    return days >= 0 && days <= 7;
  });
  const stale = all.filter((r) => {
    if (!ACTIVE_STATUSES.includes(r.status as RequestStatus)) return false;
    const days = (now.getTime() - new Date(r.updatedAt).getTime()) / 86400000;
    return days > 7;
  });
  const recent = all.slice(0, 6);

  const topDept = byDepartment[0]?.label ?? "-";

  return {
    metrics: { total, inProgress, completed, distributed, onHold, rejected, topDept },
    byType: byType.filter((t) => t.count > 0),
    byDepartment,
    byStatus,
    monthly,
    lists: {
      materialNeeded: serialize(materialNeeded),
      applicantReview: serialize(applicantReview),
      englishReview: serialize(englishReview),
      soon: serialize(soon),
      stale: serialize(stale),
      recent: serialize(recent),
    },
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function serialize(rows: any[]) {
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type as RequestType,
    status: r.status,
    department: r.department,
    applicantName: r.applicant?.name ?? "",
    expectedPublishDate: r.expectedPublishDate,
    updatedAt: r.updatedAt,
  }));
}
