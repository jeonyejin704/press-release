"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, EmptyState, StatusBadge } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { TypePie } from "@/components/DashboardCharts";
import { REQUEST_TYPE_LABELS, type RequestType } from "@/lib/enums";

/* eslint-disable @typescript-eslint/no-explicit-any */

type TypeRow = { key: string; label: string; count: number; ratio: number };

const PIE_COLORS = ["#a61955", "#f6a700", "#7a7772", "#cd527d", "#fcc74c", "#b7b4b0"];

// 홍보 유형별 신청 건수(목록)와 비율(도넛)을 렌더링하고,
// 유형을 클릭하면 페이지 이동 대신 팝업(모달)으로 해당 유형의 신청 목록을 보여준다.
export function TypeStats({ data }: { data: TypeRow[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const total = data.reduce((s, t) => s + t.count, 0);
  const selectedRow = data.find((t) => t.key === selected) ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* 유형별 건수 */}
      <Card className="flex flex-col border-t-4 border-t-brand-600 p-5">
        <div className="mb-1 text-base font-bold text-pgray-900">홍보 유형별 신청 건수</div>
        <p className="mb-1 text-[11px] text-pgray-400">유형을 클릭하면 팝업으로 신청 목록을 볼 수 있어요.</p>
        {data.length ? (
          <div className="mt-1 flex flex-1 flex-col justify-center divide-y divide-pgray-100">
            {data.map((t, i) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setSelected(t.key)}
                className="flex items-center justify-between py-2.5 text-left hover:bg-pgray-50"
              >
                <span className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-sm font-medium text-pgray-700">{t.label}</span>
                </span>
                <span className="text-sm text-pgray-500">
                  <span className="font-display text-lg text-pgray-800">{t.count}</span>건
                  <span className="ml-1.5 text-xs text-pgray-400">({t.ratio}%)</span>
                </span>
              </button>
            ))}
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm font-bold text-pgray-700">합계</span>
              <span className="text-sm text-pgray-500">
                <span className="font-display text-lg text-brand-700">{total}</span>건
              </span>
            </div>
          </div>
        ) : (
          <EmptyState title="데이터 없음" />
        )}
      </Card>

      {/* 유형별 비율 도넛 */}
      <Card className="border-t-4 border-t-brand-600 p-5">
        <div className="mb-1 text-base font-bold text-pgray-900">홍보 유형별 비율</div>
        <p className="mb-2 text-[11px] text-pgray-400">각 조각을 클릭하면 팝업으로 상세 현황을 볼 수 있어요.</p>
        {data.length ? (
          <TypePie data={data} onSlice={(key) => setSelected(key)} />
        ) : (
          <EmptyState title="데이터 없음" />
        )}
      </Card>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selectedRow ? `${selectedRow.label} · ${selectedRow.count}건 (${selectedRow.ratio}%)` : ""}
      >
        {selected && <TypeRequestList typeKey={selected} onNavigate={() => setSelected(null)} />}
      </Modal>
    </div>
  );
}

function TypeRequestList({ typeKey, onNavigate }: { typeKey: string; onNavigate: () => void }) {
  const [items, setItems] = useState<any[] | null>(null);

  useEffect(() => {
    let alive = true;
    setItems(null);
    fetch(`/api/press-requests?type=${typeKey}`)
      .then((r) => r.json())
      .then((d) => { if (alive) setItems(d.requests ?? []); })
      .catch(() => { if (alive) setItems([]); });
    return () => { alive = false; };
  }, [typeKey]);

  return (
    <div>
      {items === null ? (
        <p className="py-8 text-center text-sm text-pgray-400">불러오는 중…</p>
      ) : items.length === 0 ? (
        <EmptyState title="해당 유형의 신청 내역이 없습니다." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-pgray-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">제목</th>
                <th className="whitespace-nowrap px-3 py-2">신청자</th>
                <th className="whitespace-nowrap px-3 py-2">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <Link href={`/requests/${r.id}`} onClick={onNavigate} className="font-medium text-brand-700 hover:underline">
                      {r.title}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-pgray-600">{r.applicant?.name ?? "-"}</td>
                  <td className="whitespace-nowrap px-3 py-2"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-end gap-3 text-sm">
        {typeKey === "RESEARCH" && (
          <Link href="/dashboard/journals" onClick={onNavigate} className="font-medium text-brand-600 hover:underline">
            저널별 상세 보기 →
          </Link>
        )}
        <Link href={`/requests?type=${typeKey}`} onClick={onNavigate} className="font-medium text-brand-600 hover:underline">
          {REQUEST_TYPE_LABELS[typeKey as RequestType] ?? "전체"} 목록에서 보기 →
        </Link>
      </div>
    </div>
  );
}
