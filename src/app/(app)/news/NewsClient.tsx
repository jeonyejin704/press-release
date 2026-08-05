"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Badge, EmptyState } from "@/components/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function NewsClient({ news, keywords }: { news: any[]; keywords: string[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const filtered = filter ? news.filter((n) => n.keyword === filter) : news;
  const importantCount = news.filter((n) => n.isImportant).length;

  async function refresh() {
    setBusy(true);
    try {
      const res = await fetch("/api/news/refresh", { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        let msg = `${d.added}건의 새 기사를 수집했습니다. (provider: ${d.provider})`;
        if (d.note) msg += `\n\n${d.note}`;
        if (d.error) msg += `\n\n⚠️ 연동 오류: ${d.error}\n(API 키 또는 엔드포인트를 확인해 주세요.)`;
        alert(msg);
        router.refresh();
      } else {
        alert(d.error ?? "새로고침 실패");
      }
    } finally {
      setBusy(false);
    }
  }

  async function toggleImportant(id: string, current: boolean) {
    const res = await fetch(`/api/news/${id}/important`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isImportant: !current }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-800">뉴스 모니터링</h1>
          <p className="text-sm text-slate-500">
            키워드 기반 언론 보도 현황 · 중요 표시 {importantCount}건
          </p>
        </div>
        <Button variant="secondary" disabled={busy} onClick={refresh}>
          {busy ? "수집 중…" : "🔄 뉴스 새로고침"}
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip label="전체" active={!filter} onClick={() => setFilter("")} />
        {keywords.map((k) => (
          <FilterChip key={k} label={k} active={filter === k} onClick={() => setFilter(k)} />
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="수집된 뉴스가 없습니다." hint="'뉴스 새로고침'을 눌러보세요." />
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <Card key={n.id} className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {n.keyword && <Badge color="bg-brand-50 text-brand-700">{n.keyword}</Badge>}
                  <span className="text-xs text-slate-400">{n.mediaName}</span>
                  {n.publishedAt && (
                    <span className="text-xs text-slate-400">
                      {new Date(n.publishedAt).toLocaleString("ko-KR")}
                    </span>
                  )}
                </div>
                <a href={n.url} target="_blank" className="mt-1 block font-medium text-slate-800 hover:text-brand-700 hover:underline">
                  {n.title}
                </a>
                {n.summary && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{n.summary}</p>}
              </div>
              <button
                onClick={() => toggleImportant(n.id, n.isImportant)}
                className={`shrink-0 text-2xl ${n.isImportant ? "text-accent-500" : "text-pgray-300 hover:text-accent-300"}`}
                title="중요 표시"
              >
                ★
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm ${
        active ? "bg-brand-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}
