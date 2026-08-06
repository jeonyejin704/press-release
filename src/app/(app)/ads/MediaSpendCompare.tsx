"use client";

import { useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";
import { Card } from "@/components/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */

type MediaRow = { medium: string; byYear: Record<string, number> };

function manwon(v: number) {
  if (!v) return "0";
  if (v >= 100000000) return `${(v / 100000000).toFixed(1)}억`;
  if (v >= 10000) return `${Math.round(v / 10000).toLocaleString()}만`;
  return v.toLocaleString();
}

// 연도별 막대 색상: 최신=자주, 직전=주황, 그 이전=회색 계열
const YEAR_COLORS = ["#a61955", "#f6a700", "#7a7772", "#cd527d", "#fcc74c", "#b7b4b0"];

export function MediaSpendCompare({ mediaYoY, years }: { mediaYoY: MediaRow[]; years: number[] }) {
  const allMedia = mediaYoY.map((m) => m.medium);
  // 기본: 상위 6개 매체 선택
  const [selected, setSelected] = useState<Set<string>>(new Set(allMedia.slice(0, 6)));
  const [view, setView] = useState<"chart" | "table">("chart");

  function toggle(medium: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(medium)) next.delete(medium);
      else next.add(medium);
      return next;
    });
  }
  const allOn = selected.size === allMedia.length;

  const rows = mediaYoY.filter((m) => selected.has(m.medium));
  // 색상: 연도 순서(오래된→최신)에 맞춰 배정, 최신이 자주색이 되도록 뒤에서부터
  const yearColor = (y: number) => {
    const idxFromLatest = years.length - 1 - years.indexOf(y);
    return YEAR_COLORS[idxFromLatest % YEAR_COLORS.length];
  };
  const chartData = rows.map((m) => ({ medium: m.medium, ...m.byYear }));

  const latest = years[years.length - 1];
  const prev = years.length >= 2 ? years[years.length - 2] : null;

  if (mediaYoY.length === 0) {
    return (
      <Card className="border-t-4 border-t-brand-600 p-5">
        <div className="mb-1 text-base font-bold text-pgray-900">매체별 광고비 증감 현황</div>
        <p className="py-6 text-center text-sm text-pgray-400">집행 내역이 쌓이면 매체별 증감을 비교할 수 있어요.</p>
      </Card>
    );
  }

  return (
    <Card className="border-t-4 border-t-brand-600 p-5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-base font-bold text-pgray-900">매체별 광고비 증감 현황</div>
          <p className="text-xs text-pgray-500">
            매체를 선택하면 학년도별 집행액을 비교합니다{prev ? ` (${prev} → ${latest} 증감)` : ""}.
          </p>
        </div>
        <div className="flex overflow-hidden rounded-lg border border-pgray-200 text-sm">
          <button onClick={() => setView("chart")} className={`px-3 py-1.5 ${view === "chart" ? "bg-brand-600 text-white" : "text-pgray-500 hover:bg-pgray-50"}`}>그래프</button>
          <button onClick={() => setView("table")} className={`px-3 py-1.5 ${view === "table" ? "bg-brand-600 text-white" : "text-pgray-500 hover:bg-pgray-50"}`}>표</button>
        </div>
      </div>

      {/* 매체 선택 */}
      <div className="my-3 flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setSelected(allOn ? new Set() : new Set(allMedia))}
          className="rounded-full border border-pgray-200 px-2.5 py-1 text-xs font-medium text-pgray-500 hover:bg-pgray-50"
        >
          {allOn ? "전체 해제" : "전체 선택"}
        </button>
        {allMedia.map((m) => {
          const on = selected.has(m);
          return (
            <button
              key={m}
              onClick={() => toggle(m)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                on ? "bg-brand-600 text-white" : "bg-pgray-100 text-pgray-600 hover:bg-pgray-200"
              }`}
            >
              {on ? "✓ " : ""}{m}
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-pgray-400">비교할 매체를 하나 이상 선택하세요.</p>
      ) : view === "chart" ? (
        <ResponsiveContainer width="100%" height={Math.max(260, rows.length * 46)}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 6, right: 20, left: 10, bottom: 0 }} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee7ea" horizontal={false} />
            <XAxis type="number" tickFormatter={(v: number) => `${manwon(v)}`} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="medium" width={92} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number, n: string) => [`${manwon(v)}원`, `${n}학년도`]} />
            <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => `${v}학년도`} />
            {years.map((y) => (
              <Bar key={y} dataKey={String(y)} name={String(y)} fill={yearColor(y)} radius={[0, 3, 3, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-pgray-100 text-left text-xs text-pgray-500">
              <tr>
                <th className="px-2 py-2">매체</th>
                {years.map((y) => <th key={y} className="px-2 py-2 text-right">{y}학년도</th>)}
                {prev && <th className="px-2 py-2 text-right">증감</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-pgray-100">
              {rows.map((m) => {
                const cur = m.byYear[String(latest)] ?? 0;
                const pre = prev ? (m.byYear[String(prev)] ?? 0) : 0;
                const diff = cur - pre;
                const pct = pre ? Math.round((diff / pre) * 100) : null;
                return (
                  <tr key={m.medium} className="hover:bg-pgray-50">
                    <td className="px-2 py-2 font-medium text-pgray-800">{m.medium}</td>
                    {years.map((y) => (
                      <td key={y} className="px-2 py-2 text-right text-pgray-700">{manwon(m.byYear[String(y)] ?? 0)}원</td>
                    ))}
                    {prev && (
                      <td className={`px-2 py-2 text-right font-semibold ${diff > 0 ? "text-brand-600" : diff < 0 ? "text-pgray-500" : "text-pgray-400"}`}>
                        {diff > 0 ? "▲" : diff < 0 ? "▼" : "-"} {manwon(Math.abs(diff))}원
                        {pct !== null && <span className="ml-1 text-xs">({pct > 0 ? "+" : ""}{pct}%)</span>}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
