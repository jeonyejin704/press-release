"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Badge, Field, inputClass, EmptyState } from "@/components/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */

const MEDIA = ["네이버", "유튜브", "카카오", "신문(지면)", "구글/GDN", "인스타그램", "라디오", "옥외(지하철/버스)", "기타"];

function manwon(v: number) {
  if (v >= 100000000) return `${(v / 100000000).toFixed(1)}억원`;
  if (v >= 10000) return `${Math.round(v / 10000).toLocaleString()}만원`;
  return `${v.toLocaleString()}원`;
}

export function AdsClient({ ads, summary }: { ads: any[]; summary: any }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", medium: "네이버", amount: "", executedAt: "", department: "", note: "" });

  async function submit() {
    setError("");
    if (!form.title || !form.amount || !form.executedAt) {
      setError("집행 건명·집행액·집행일은 필수입니다.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/ads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "등록 실패");
        return;
      }
      setForm({ title: "", medium: "네이버", amount: "", executedAt: "", department: "", note: "" });
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const maxMedium = summary.mediums[0]?.amount ?? 1;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-pgray-900">광고비 집행 현황</h1>
          <p className="text-sm text-pgray-500">매체별 광고비 집행 내역을 관리하고 추이를 확인합니다.</p>
        </div>
        <Button onClick={() => setOpen((o) => !o)}>{open ? "닫기" : "＋ 집행 내역 추가"}</Button>
      </div>

      {/* 요약 */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-4"><div className="text-sm text-pgray-500">{summary.thisYear} 집행 합계</div>
          <div className="mt-1 font-display text-2xl text-brand-700">{manwon(summary.thisYearTotal)}</div></Card>
        <Card className="p-4"><div className="text-sm text-pgray-500">{summary.thisYear - 1} 집행 합계</div>
          <div className="mt-1 font-display text-2xl text-accent-600">{manwon(summary.lastYearTotal)}</div></Card>
        <Card className="p-4"><div className="text-sm text-pgray-500">전년 대비</div>
          <div className="mt-1 font-display text-2xl text-pgray-700">
            {summary.lastYearTotal ? `${summary.thisYearTotal >= summary.lastYearTotal ? "+" : ""}${Math.round((summary.thisYearTotal / summary.lastYearTotal - 1) * 100)}%` : "-"}
          </div></Card>
        <Card className="p-4"><div className="text-sm text-pgray-500">총 집행 건수</div>
          <div className="mt-1 font-display text-2xl text-pgray-700">{summary.count}건</div></Card>
      </div>

      {/* 추가 폼 */}
      {open && (
        <Card className="mb-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Field label="집행 건명" required>
              <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="예: 신입생 모집 홍보 캠페인" /></Field></div>
            <Field label="매체" required>
              <select className={inputClass} value={form.medium} onChange={(e) => setForm({ ...form, medium: e.target.value })}>
                {MEDIA.map((m) => <option key={m}>{m}</option>)}
              </select></Field>
            <Field label="집행액 (원)" required>
              <input type="number" className={inputClass} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="예: 5000000" /></Field>
            <Field label="집행일" required>
              <input type="date" className={inputClass} value={form.executedAt} onChange={(e) => setForm({ ...form, executedAt: e.target.value })} /></Field>
            <Field label="담당 부서/메모">
              <input className={inputClass} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
          </div>
          {error && <p className="mt-2 text-sm font-medium text-brand-600">{error}</p>}
          <div className="mt-3"><Button disabled={busy} onClick={submit}>{busy ? "등록 중…" : "등록"}</Button></div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* 매체별 (올해) */}
        <Card className="p-5">
          <div className="mb-3 text-base font-bold text-pgray-900">{summary.thisYear} 매체별 집행</div>
          {summary.mediums.length === 0 ? <EmptyState title="데이터 없음" /> : (
            <div className="space-y-2">
              {summary.mediums.map((m: any) => (
                <div key={m.medium}>
                  <div className="flex justify-between text-sm">
                    <span className="text-pgray-700">{m.medium}</span>
                    <span className="font-semibold text-pgray-800">{manwon(m.amount)}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-pgray-100">
                    <div className="h-2 rounded-full bg-brand-500" style={{ width: `${(m.amount / maxMedium) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 내역 표 */}
        <Card className="p-0 lg:col-span-2">
          <div className="border-b border-pgray-100 px-5 py-3 text-base font-bold text-pgray-900">집행 내역</div>
          {ads.length === 0 ? <div className="p-6"><EmptyState title="집행 내역이 없습니다." /></div> : (
            <div className="max-h-[30rem] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-pgray-50 text-left text-xs uppercase text-pgray-500">
                  <tr><th className="px-4 py-2">집행일</th><th className="px-4 py-2">건명</th><th className="px-4 py-2">매체</th><th className="px-4 py-2 text-right">집행액</th></tr>
                </thead>
                <tbody className="divide-y divide-pgray-100">
                  {ads.map((a) => (
                    <tr key={a.id} className="hover:bg-pgray-50">
                      <td className="whitespace-nowrap px-4 py-2 text-pgray-500">{new Date(a.executedAt).toLocaleDateString("ko-KR")}</td>
                      <td className="px-4 py-2 text-pgray-800">{a.title}</td>
                      <td className="px-4 py-2"><Badge>{a.medium}</Badge></td>
                      <td className="whitespace-nowrap px-4 py-2 text-right font-semibold text-pgray-800">{manwon(a.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
