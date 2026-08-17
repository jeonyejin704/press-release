import Link from "next/link";
import { getCurrentUser, isManager } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { StatusBadge, Badge, Card, LinkButton, EmptyState } from "@/components/ui";
import { Pagination } from "@/components/Pagination";
import {
  REQUEST_TYPE_LABELS,
  REQUEST_TYPES,
  STATUS_PHASE_ORDER,
  PHASE_TO_STATUSES,
  type RequestType,
  type StatusPhase,
} from "@/lib/enums";
import { getLang } from "@/lib/i18n-server";
import { makeT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = (await getCurrentUser())!;
  const manager = isManager(user);
  const sp = await searchParams;
  const lang = await getLang();
  const tr = makeT(lang);

  const where: Record<string, unknown> = {};
  if (!manager) where.applicantId = user.id;
  if (sp.type) where.type = sp.type;
  // 상태 필터: 4단계 묶음(phase) 기준. 하위 호환으로 개별 status 파라미터도 허용.
  if (sp.phase && PHASE_TO_STATUSES[sp.phase as StatusPhase]) {
    where.status = { in: PHASE_TO_STATUSES[sp.phase as StatusPhase] };
  } else if (sp.status) {
    where.status = sp.status;
  }
  if (sp.department) where.department = sp.department;
  if (sp.applicant) where.applicantId = sp.applicant;
  if (sp.q) where.title = { contains: sp.q };

  // 페이지네이션
  const PAGE_SIZE = 20;
  const totalCount = await prisma.pressRequest.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const page = Math.min(Math.max(1, parseInt(sp.page ?? "1") || 1), totalPages);

  const requests = await prisma.pressRequest.findMany({
    where,
    include: { applicant: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  // 필터를 유지한 페이지 링크
  const buildQs = () => {
    const qs = new URLSearchParams();
    if (sp.q) qs.set("q", sp.q);
    if (sp.type) qs.set("type", sp.type);
    if (sp.phase) qs.set("phase", sp.phase);
    if (sp.status) qs.set("status", sp.status);
    if (sp.department) qs.set("department", sp.department);
    if (sp.applicant) qs.set("applicant", sp.applicant);
    return qs;
  };
  const pageHref = (pg: number) => {
    const qs = buildQs();
    if (pg > 1) qs.set("page", String(pg));
    const s = qs.toString();
    return `/requests${s ? `?${s}` : ""}`;
  };

  // 필터를 유지한 엑셀 내려받기 링크
  const exportHref = (() => {
    const s = buildQs().toString();
    return `/api/press-requests/export${s ? `?${s}` : ""}`;
  })();

  const departments = manager
    ? (await prisma.pressRequest.findMany({ select: { department: true }, distinct: ["department"] }))
        .map((r) => r.department)
        .filter(Boolean)
    : [];

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-pgray-900">
            {manager ? tr("req.title.manager") : tr("req.title.applicant")}
          </h1>
          <p className="text-sm text-pgray-500">
            {tr("req.total.prefix")} <span className="font-semibold text-brand-600">{totalCount}</span>
            {tr("req.total.suffix")} · {page}/{totalPages}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {manager && (
            <a
              href={exportHref}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
            >
              {tr("req.export")}
            </a>
          )}
          <LinkButton href="/requests/new">{tr("req.new")}</LinkButton>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-4 p-3">
        <form className="flex flex-wrap items-end gap-2" method="get">
          <input
            name="q"
            defaultValue={sp.q}
            placeholder={tr("req.search")}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
          <select name="type" defaultValue={sp.type ?? ""} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
            <option value="">{tr("req.filter.type")}</option>
            {REQUEST_TYPES.map((t) => (
              <option key={t} value={t}>
                {REQUEST_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <select name="phase" defaultValue={sp.phase ?? ""} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
            <option value="">{tr("req.filter.status")}</option>
            {STATUS_PHASE_ORDER.map((p) => (
              <option key={p} value={p}>
                {tr(`phase.${p}`)}
              </option>
            ))}
          </select>
          {manager && departments.length > 0 && (
            <select name="department" defaultValue={sp.department ?? ""} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
              <option value="">{tr("req.filter.dept")}</option>
              {departments.map((d) => (
                <option key={d} value={d!}>
                  {d}
                </option>
              ))}
            </select>
          )}
          <button className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white">
            {tr("req.apply")}
          </button>
          <Link href="/requests" className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100">
            {tr("req.reset")}
          </Link>
        </form>
      </Card>

      {requests.length === 0 ? (
        <EmptyState title={tr("req.empty")} hint={tr("req.empty.hint")} />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">{tr("req.col.title")}</th>
                  <th className="whitespace-nowrap px-4 py-2.5">{tr("req.col.type")}</th>
                  {manager && <th className="whitespace-nowrap px-4 py-2.5">{tr("req.col.dept")}</th>}
                  {manager && <th className="whitespace-nowrap px-4 py-2.5">{tr("req.col.applicant")}</th>}
                  <th className="whitespace-nowrap px-4 py-2.5">{tr("req.col.status")}</th>
                  <th className="whitespace-nowrap px-4 py-2.5">{tr("req.col.publish")}</th>
                  <th className="whitespace-nowrap px-4 py-2.5">{tr("req.col.updated")}</th>
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
                        <Badge color="ml-2 bg-accent-100 text-accent-800">긴급</Badge>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {REQUEST_TYPE_LABELS[r.type as RequestType] ?? r.type}
                    </td>
                    {manager && <td className="whitespace-nowrap px-4 py-3 text-slate-600">{r.department ?? "-"}</td>}
                    {manager && <td className="whitespace-nowrap px-4 py-3 text-slate-600">{r.applicant.name}</td>}
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={r.status} lang={lang} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {r.expectedPublishDate ? fmt(r.expectedPublishDate) : "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-400">{fmtDT(r.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Pagination page={page} totalPages={totalPages} hrefFn={pageHref} />
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

// 날짜 + 시간 (수정일용)
function fmtDT(d: Date) {
  return new Date(d).toLocaleString("ko-KR", {
    year: "2-digit", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}
