"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Button, Badge, Field, inputClass, EmptyState } from "@/components/ui";
import { MediaSpendCompare } from "./MediaSpendCompare";

/* eslint-disable @typescript-eslint/no-explicit-any */

// 광고 유형 예시(자유 입력 가능)
const AD_TYPE_SUGGESTIONS = ["신문(지면)", "포털(네이버/다음)", "동영상(유튜브 등)", "SNS", "방송", "라디오", "잡지/전문지", "옥외(지하철/버스)", "온라인 배너", "기타"];

function manwon(v: number) {
  if (v >= 100000000) return `${(v / 100000000).toFixed(1)}억원`;
  if (v >= 10000) return `${Math.round(v / 10000).toLocaleString()}만원`;
  return `${v.toLocaleString()}원`;
}

export function AdsClient({ ads, summary, mediaYoY = [], years = [], focusMonth, restorable = 0 }: { ads: any[]; summary: any; mediaYoY?: any[]; years?: number[]; focusMonth?: string | null; restorable?: number }) {
  const router = useRouter();
  const ymOf = (d: string) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`; };
  const focusAds = focusMonth ? ads.filter((a) => ymOf(a.executedAt) === focusMonth) : [];
  const focusTotal = focusAds.reduce((s, a) => s + a.amount, 0);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", medium: "", amount: "", month: "", note: "" });
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [importing, setImporting] = useState(false);
  // 업로드 → 미리보기 → '저장' 2단계
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ willImport: number; skipped: number; errors: string[]; sample: any[] } | null>(null);
  const [saving, setSaving] = useState(false);
  // 총 집행 건수 = 현재 학년도(3월~다음해 2월) 기준
  const fiscalYearOf = (d: string) => { const x = new Date(d); return x.getMonth() >= 2 ? x.getFullYear() : x.getFullYear() - 1; };
  const thisYearCount = ads.filter((a) => fiscalYearOf(a.executedAt) === summary.thisYear).length;

  async function submit() {
    setError("");
    if (!form.title || !form.medium || !form.amount || !form.month) {
      setError("매체명·광고 유형·집행액·집행월은 필수입니다.");
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
      setForm({ title: "", medium: "", amount: "", month: "", note: "" });
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function removeOne(id: string) {
    if (!confirm("이 집행 내역을 삭제할까요?")) return;
    await fetch(`/api/ads?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    router.refresh();
  }

  async function clearAll() {
    const answer = prompt(`집행 내역 ${summary.count}건을 모두 삭제하려면 아래에 "삭제"를 입력하세요.\n(삭제 전 자동 백업되어 나중에 '복구'할 수 있습니다.)`);
    if (answer !== "삭제") return;
    await fetch(`/api/ads?all=1`, { method: "DELETE" });
    router.refresh();
  }

  async function restore() {
    if (!confirm(`백업에서 광고비 내역 ${restorable}건을 복구할까요?`)) return;
    const res = await fetch(`/api/ads/restore`, { method: "POST" });
    const d = await res.json().catch(() => ({}));
    alert(`${d.restored ?? 0}건을 복구했습니다.`);
    router.refresh();
  }

  // 1단계: 파일 업로드 → 미리보기(저장하지 않음)
  async function previewFile(file: File) {
    setImportResult(null);
    setPreview(null);
    setPendingFile(file);
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/ads/import?mode=preview", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setImportResult({ imported: 0, skipped: 0, errors: [data.error ?? "파일을 읽지 못했습니다."] });
        setPendingFile(null);
        return;
      }
      setPreview(data);
    } finally {
      setImporting(false);
    }
  }

  // 2단계: '저장' 클릭 → 실제 저장(기존 내역 유지, 추가만)
  async function saveImport() {
    if (!pendingFile) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("file", pendingFile);
      const res = await fetch("/api/ads/import?mode=commit", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setImportResult({ imported: 0, skipped: 0, errors: [data.error ?? "저장 실패"] });
        return;
      }
      setImportResult(data);
      setPreview(null);
      setPendingFile(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function cancelImport() {
    setPreview(null);
    setPendingFile(null);
    setImportResult(null);
  }

  const maxMedium = summary.mediums[0]?.amount ?? 1;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-pgray-900">광고비 집행 현황</h1>
          <p className="text-sm text-pgray-500">매체별 광고비 집행 내역을 관리하고 추이를 확인합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          {summary.count > 0 && (
            <button onClick={clearAll}
              className="rounded-lg border border-pgray-200 px-3 py-2 text-sm font-medium text-pgray-400 hover:bg-pgray-50 hover:text-brand-600">
              전체 삭제
            </button>
          )}
          <Button onClick={() => setOpen((o) => !o)}>{open ? "닫기" : "＋ 집행 내역 추가"}</Button>
        </div>
      </div>

      {/* 자동 백업 복구 안내 */}
      {restorable > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-300 bg-brand-50 px-4 py-2.5 text-sm text-brand-700">
          <span>💾 백업에 <b>복구 가능한 집행 내역 {restorable}건</b>이 있습니다. (실수로 삭제된 데이터일 수 있어요)</span>
          <button onClick={restore} className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700">
            백업에서 복구
          </button>
        </div>
      )}

      {/* 선택 월 상세 (대시보드 그래프 클릭) */}
      {focusMonth && (
        <Card className="mb-4 border-t-4 border-t-brand-600 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-display text-lg text-pgray-900">{focusMonth.replace("-", "년 ")}월 집행 내역</span>
              <Badge color="bg-brand-100 text-brand-700">{focusAds.length}건 · {manwon(focusTotal)}</Badge>
            </div>
            <Link href="/ads" className="text-sm text-pgray-500 hover:underline">닫기 ✕</Link>
          </div>
          {focusAds.length === 0 ? (
            <p className="py-4 text-center text-sm text-pgray-400">이 달에 집행된 내역이 없습니다.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {focusAds.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl border border-pgray-100 bg-pgray-50 px-4 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-pgray-800">{a.title}</span>
                    <Badge>{a.medium}</Badge>
                  </span>
                  <span className="shrink-0 font-semibold text-pgray-800">{manwon(a.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* 요약: 최근 3개 학년도 집행 합계 + 기간별 집행 건수 */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {summary.yearTotals.map((yt: any, i: number) => (
          <Card key={yt.year} className="p-4">
            <div className="text-sm text-pgray-500">{yt.year}학년도 집행 합계</div>
            <div className={`mt-1 font-display text-2xl ${i === 0 ? "text-brand-700" : i === 1 ? "text-accent-600" : "text-pgray-600"}`}>{manwon(yt.total)}</div>
          </Card>
        ))}
        <Card className="p-4">
          <div className="text-sm text-pgray-500">총 집행 건수 <span className="text-xs text-pgray-400">({summary.thisYear}학년도)</span></div>
          <div className="mt-1 font-display text-2xl text-pgray-700">{thisYearCount}건</div>
        </Card>
      </div>

      {/* 엑셀 일괄 업로드 */}
      <Card className="mb-4 border-t-4 border-t-brand-600 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-bold text-pgray-900">📥 엑셀로 한 번에 올리기</div>
            <div className="text-sm text-pgray-500">
              지금까지 엑셀로 관리하던 내역을 업로드하세요. 열 구성: <b>매체명 · 광고 유형 · 집행액(원) · 집행월</b>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/templates/광고비_일괄등록_양식.xlsx" download
              className="inline-flex items-center rounded-lg border border-accent-300 bg-accent-50 px-3 py-2 text-sm font-bold text-accent-800 hover:bg-accent-100">
              양식 다운로드
            </a>
            <label className="inline-flex cursor-pointer items-center rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              {importing ? "파일 확인 중…" : "① 엑셀 업로드"}
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" disabled={importing || saving}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) previewFile(f); e.target.value = ""; }} />
            </label>
          </div>
        </div>

        {/* 미리보기 → 저장 */}
        {preview && (
          <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm text-pgray-700">
                <b className="text-brand-700">{preview.willImport}건</b>이 추가될 예정입니다.
                {preview.skipped > 0 && <span className="ml-2 text-accent-700">{preview.skipped}건은 오류로 제외</span>}
                <div className="mt-0.5 text-xs text-pgray-500">저장 전까지는 반영되지 않으며, <b>기존 내역은 삭제되지 않고 추가만</b> 됩니다.</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={cancelImport} className="rounded-lg border border-pgray-200 bg-white px-3 py-2 text-sm text-pgray-600 hover:bg-pgray-50">취소</button>
                <button onClick={saveImport} disabled={saving || preview.willImport === 0}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-40">
                  {saving ? "저장 중…" : `② 저장 (${preview.willImport}건 추가)`}
                </button>
              </div>
            </div>
            {preview.sample.length > 0 && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-left text-pgray-400">
                    <tr><th className="py-1 pr-3">집행월</th><th className="py-1 pr-3">매체명</th><th className="py-1 pr-3">광고 유형</th><th className="py-1 text-right">집행액</th></tr>
                  </thead>
                  <tbody className="text-pgray-700">
                    {preview.sample.map((s, i) => (
                      <tr key={i} className="border-t border-brand-100">
                        <td className="py-1 pr-3 whitespace-nowrap">{s.month}</td>
                        <td className="py-1 pr-3">{s.title}</td>
                        <td className="py-1 pr-3">{s.medium}</td>
                        <td className="py-1 text-right whitespace-nowrap">{manwon(s.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.willImport > preview.sample.length && (
                  <div className="mt-1 text-xs text-pgray-400">…외 {preview.willImport - preview.sample.length}건 (저장 시 모두 추가)</div>
                )}
              </div>
            )}
            {preview.errors.length > 0 && (
              <ul className="mt-2 text-xs text-accent-700">{preview.errors.map((e, i) => <li key={i}>• {e}</li>)}</ul>
            )}
          </div>
        )}

        {importResult && (
          <div className="mt-3 rounded-lg bg-pgray-50 p-3 text-sm">
            <span className="font-semibold text-brand-700">✅ {importResult.imported}건 저장 완료</span>
            {importResult.skipped > 0 && <span className="ml-2 text-accent-700">{importResult.skipped}건 건너뜀</span>}
            {importResult.errors.length > 0 && (
              <ul className="mt-1 text-xs text-pgray-500">{importResult.errors.map((e, i) => <li key={i}>• {e}</li>)}</ul>
            )}
          </div>
        )}
      </Card>

      {/* 추가 폼 */}
      {open && (
        <Card className="mb-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="매체명" required>
              <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="예: 조선일보, 네이버, 경북일보" /></Field>
            <Field label="광고 유형" required>
              <input className={inputClass} list="adtype-suggestions" value={form.medium}
                onChange={(e) => setForm({ ...form, medium: e.target.value })}
                placeholder="예: 신문(지면), 포털, 동영상 등" />
              <datalist id="adtype-suggestions">
                {AD_TYPE_SUGGESTIONS.map((m) => <option key={m} value={m} />)}
              </datalist></Field>
            <Field label="집행액 (원)" required>
              <input type="number" className={inputClass} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="예: 5000000" /></Field>
            <Field label="집행월" required>
              <input type="month" className={inputClass} value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} /></Field>
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
          <div className="mb-3 text-base font-bold text-pgray-900">{summary.thisYear}학년도 매체별 집행</div>
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
                  <tr><th className="px-4 py-2">집행월</th><th className="px-4 py-2">매체명</th><th className="px-4 py-2">광고 유형</th><th className="px-4 py-2 text-right">집행액</th><th className="px-4 py-2"></th></tr>
                </thead>
                <tbody className="divide-y divide-pgray-100">
                  {ads.map((a) => (
                    <tr key={a.id} className="hover:bg-pgray-50">
                      <td className="whitespace-nowrap px-4 py-2 text-pgray-500">{new Date(a.executedAt).getFullYear()}.{String(new Date(a.executedAt).getMonth() + 1).padStart(2, "0")}</td>
                      <td className="px-4 py-2 text-pgray-800">{a.title}</td>
                      <td className="px-4 py-2"><Badge>{a.medium}</Badge></td>
                      <td className="whitespace-nowrap px-4 py-2 text-right font-semibold text-pgray-800">{manwon(a.amount)}</td>
                      <td className="px-2 py-2 text-right">
                        <button onClick={() => removeOne(a.id)} title="삭제"
                          className="rounded px-1.5 text-pgray-300 hover:text-brand-600">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* 매체별 광고비 증감 현황 (작년·올해 비교, 과거 실적 추가 시 연도 자동 확장) */}
      <div className="mt-4">
        <MediaSpendCompare mediaYoY={mediaYoY} years={years} />
      </div>
    </div>
  );
}
