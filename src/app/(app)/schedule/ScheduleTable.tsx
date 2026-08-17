"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Button, EmptyState } from "@/components/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */

type Row = {
  id: string;
  createdAt: string;
  corr: string;
  paper: string;
  journal: string;
  expectedPublishDate: string | null; // ISO or null
  suggested: string; // YYYY-MM-DD
};

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("ko-KR", { year: "2-digit", month: "2-digit", day: "2-digit" }) : "-";
}

const PAGE_SIZE = 10;

export function ScheduleTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [dates, setDates] = useState<Record<string, string>>(
    Object.fromEntries(rows.map((r) => [r.id, r.expectedPublishDate ? r.expectedPublishDate.slice(0, 10) : ""])),
  );
  const [savingAll, setSavingAll] = useState(false);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  async function save(id: string, value: string) {
    setDates((d) => ({ ...d, [id]: value }));
    await fetch(`/api/press-requests/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ expectedPublishDate: value || null }),
    });
    router.refresh();
  }

  async function applyAllSuggested() {
    const targets = rows.filter((r) => !dates[r.id]); // 아직 배포일이 없는 건
    if (targets.length === 0) return;
    if (!confirm(`배포일이 비어있는 ${targets.length}건에 접수 순서대로 자동 배포일을 적용할까요?`)) return;
    setSavingAll(true);
    try {
      const next: Record<string, string> = { ...dates };
      for (const r of targets) {
        next[r.id] = r.suggested;
        await fetch(`/api/press-requests/${r.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ expectedPublishDate: r.suggested }),
        });
      }
      setDates(next);
      router.refresh();
    } finally {
      setSavingAll(false);
    }
  }

  if (rows.length === 0) return <EmptyState title="신청 내역이 없습니다." />;

  return (
    <Card className="overflow-hidden border-t-4 border-t-brand-600">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pgray-100 px-4 py-3">
        <span className="text-sm text-pgray-500">접수 순서대로 나열됩니다. 예상 배포일은 직접 입력·수정할 수 있어요.</span>
        <Button variant="secondary" disabled={savingAll} onClick={applyAllSuggested}>
          {savingAll ? "적용 중…" : "자동 배포일 일괄 적용"}
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="whitespace-nowrap px-4 py-2.5">신청일</th>
              <th className="whitespace-nowrap px-4 py-2.5">교신저자</th>
              <th className="px-4 py-2.5">논문명</th>
              <th className="whitespace-nowrap px-4 py-2.5">저널명</th>
              <th className="whitespace-nowrap px-4 py-2.5">예상 배포일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageRows.map((r) => {
              const hasDate = !!dates[r.id];
              return (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">
                    <Link href={`/requests/${r.id}`} className="block hover:underline">{fmtDate(r.createdAt)}</Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <Link href={`/requests/${r.id}`} className="font-medium text-brand-700 hover:underline">{r.corr}</Link>
                  </td>
                  <td className="px-4 py-2.5 text-slate-700">
                    <Link href={`/requests/${r.id}`} className="block hover:underline">{r.paper}</Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">
                    <Link href={`/requests/${r.id}`} className="block hover:underline">{r.journal}</Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="date"
                        value={dates[r.id] || ""}
                        placeholder={r.suggested}
                        onChange={(e) => save(r.id, e.target.value)}
                        className={`rounded-lg border px-2 py-1 text-sm ${hasDate ? "border-pgray-300 text-pgray-800" : "border-accent-300 text-pgray-400"}`}
                      />
                      {!hasDate && (
                        <button
                          onClick={() => save(r.id, r.suggested)}
                          title={`자동 제안: ${r.suggested}`}
                          className="rounded-md bg-accent-100 px-1.5 py-1 text-[11px] font-medium text-accent-800 hover:bg-accent-200"
                        >
                          자동 {r.suggested.slice(5)}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 border-t border-pgray-100 px-4 py-3 text-sm">
          <span className="text-pgray-400">
            총 {rows.length}건 · {safePage}/{totalPages} 페이지
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="rounded-lg border border-pgray-200 px-3 py-1.5 hover:bg-pgray-50 disabled:opacity-40"
            >
              ‹ 이전
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="rounded-lg border border-pgray-200 px-3 py-1.5 hover:bg-pgray-50 disabled:opacity-40"
            >
              다음 ›
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
