import Link from "next/link";
import { getCurrentUser, isManager } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { StatusBadge, Badge, Card, LinkButton, EmptyState } from "@/components/ui";
import {
  REQUEST_TYPE_LABELS,
  REQUEST_TYPES,
  REQUEST_STATUSES,
  REQUEST_STATUS_LABELS,
  type RequestType,
} from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = (await getCurrentUser())!;
  const manager = isManager(user);
  const sp = await searchParams;

  const where: Record<string, unknown> = {};
  if (!manager) where.applicantId = user.id;
  if (sp.type) where.type = sp.type;
  if (sp.status) where.status = sp.status;
  if (sp.department) where.department = sp.department;
  if (sp.urgent === "1") where.isUrgent = true;
  if (sp.q) where.title = { contains: sp.q };

  const requests = await prisma.pressRequest.findMany({
    where,
    include: { applicant: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const departments = manager
    ? (await prisma.pressRequest.findMany({ select: { department: true }, distinct: ["department"] }))
        .map((r) => r.department)
        .filter(Boolean)
    : [];

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-pgray-900">
            {manager ? "전체 신청 관리" : "내 홍보 신청"}
          </h1>
          <p className="text-sm text-pgray-500">
            총 <span className="font-semibold text-brand-600">{requests.length}</span>건
            {manager ? " (전체)" : ""}
          </p>
        </div>
        <LinkButton href="/requests/new">＋ 새 홍보 신청</LinkButton>
      </div>

      {/* Filters */}
      <Card className="mb-4 p-3">
        <form className="flex flex-wrap items-end gap-2" method="get">
          <input
            name="q"
            defaultValue={sp.q}
            placeholder="제목 검색"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
          <select name="type" defaultValue={sp.type ?? ""} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
            <option value="">유형 전체</option>
            {REQUEST_TYPES.map((t) => (
              <option key={t} value={t}>
                {REQUEST_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <select name="status" defaultValue={sp.status ?? ""} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
            <option value="">상태 전체</option>
            {REQUEST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {REQUEST_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          {manager && departments.length > 0 && (
            <select name="department" defaultValue={sp.department ?? ""} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
              <option value="">학과 전체</option>
              {departments.map((d) => (
                <option key={d} value={d!}>
                  {d}
                </option>
              ))}
            </select>
          )}
          <label className="flex items-center gap-1 text-sm text-slate-600">
            <input type="checkbox" name="urgent" value="1" defaultChecked={sp.urgent === "1"} />
            긴급만
          </label>
          <button className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white">
            적용
          </button>
          <Link href="/requests" className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100">
            초기화
          </Link>
        </form>
      </Card>

      {requests.length === 0 ? (
        <EmptyState title="신청 내역이 없습니다." hint="새 홍보 신청을 만들어 보세요." />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">제목</th>
                <th className="px-4 py-2.5">유형</th>
                {manager && <th className="px-4 py-2.5">학과</th>}
                {manager && <th className="px-4 py-2.5">신청자</th>}
                <th className="px-4 py-2.5">상태</th>
                <th className="px-4 py-2.5">예상 배포일</th>
                <th className="px-4 py-2.5">수정일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/requests/${r.id}`} className="font-medium text-brand-700 hover:underline">
                      {r.title}
                    </Link>
                    {r.isUrgent && (
                      <Badge color="ml-2 bg-red-100 text-red-700">긴급</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {REQUEST_TYPE_LABELS[r.type as RequestType] ?? r.type}
                  </td>
                  {manager && <td className="px-4 py-3 text-slate-600">{r.department ?? "-"}</td>}
                  {manager && <td className="px-4 py-3 text-slate-600">{r.applicant.name}</td>}
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {r.expectedPublishDate ? fmt(r.expectedPublishDate) : "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{fmt(r.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function fmt(d: Date) {
  return new Date(d).toLocaleDateString("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });
}
