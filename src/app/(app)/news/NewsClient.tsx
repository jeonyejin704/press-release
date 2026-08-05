"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Badge, EmptyState, Field, inputClass } from "@/components/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function NewsClient({
  news,
  keywords,
  provider = "mock",
  syncError = null,
  connected = false,
  clientIdMasked = "",
}: {
  news: any[];
  keywords: string[];
  provider?: string;
  syncError?: string | null;
  connected?: boolean;
  clientIdMasked?: string;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);

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
            네이버 뉴스 실시간 수집 · 키워드 {keywords.length}개 · 중요 표시 {importantCount}건
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSetupOpen((o) => !o)}
            className="rounded-lg border border-pgray-200 px-3 py-2 text-sm font-medium text-pgray-600 hover:bg-pgray-50"
          >
            ⚙️ API 연결 설정
          </button>
          <Button variant="secondary" disabled={busy} onClick={refresh}>
            {busy ? "수집 중…" : "🔄 뉴스 새로고침"}
          </Button>
        </div>
      </div>

      {/* 실시간 수집 상태 */}
      {provider === "mock" ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-accent-200 bg-accent-50 px-3 py-2 text-xs text-accent-800">
          <span>현재 <b>mock(샘플)</b> 모드입니다. 실제 네이버 기사를 보려면 API 키를 연결하세요.</span>
          <button onClick={() => setSetupOpen(true)} className="rounded-md bg-accent-600 px-2.5 py-1 font-semibold text-white hover:bg-accent-700">
            지금 연결하기 →
          </button>
        </div>
      ) : syncError ? (
        <div className="mb-3 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs text-brand-700">
          ⚠️ 네이버 연동 오류: {syncError} — API 키를 다시 확인해 주세요. (⚙️ API 연결 설정)
        </div>
      ) : (
        <div className="mb-3 flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs text-brand-700">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-brand-500" />
          네이버 뉴스 실시간 연동 중 — 페이지에 들어올 때마다 최신 기사를 수집합니다.
        </div>
      )}

      {setupOpen && (
        <NewsApiSetup
          connected={connected}
          clientIdMasked={clientIdMasked}
          onClose={() => setSetupOpen(false)}
          onChanged={() => router.refresh()}
        />
      )}

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

function NewsApiSetup({
  connected,
  clientIdMasked,
  onClose,
  onChanged,
}: {
  connected: boolean;
  clientIdMasked: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok?: boolean; msg: string } | null>(null);

  async function save() {
    setResult(null);
    if (!clientId.trim() || !clientSecret.trim()) {
      setResult({ ok: false, msg: "Client ID와 Client Secret을 모두 입력해 주세요." });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/settings/news", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ clientId: clientId.trim(), clientSecret: clientSecret.trim() }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.ok) {
        setResult({ ok: true, msg: `연결 성공! 테스트 검색에서 ${d.testCount}건을 받았습니다. 최신 기사를 불러옵니다…` });
        setClientId("");
        setClientSecret("");
        setTimeout(onChanged, 800);
      } else {
        setResult({ ok: false, msg: d.error ? `연결 실패: ${d.error}` : "연결에 실패했습니다. 키를 다시 확인해 주세요." });
      }
    } finally {
      setSaving(false);
    }
  }

  async function disconnect() {
    if (!confirm("네이버 API 연결을 해제할까요? (다시 mock 샘플 모드로 돌아갑니다)")) return;
    await fetch("/api/settings/news", { method: "DELETE" });
    onChanged();
  }

  return (
    <Card className="mb-4 border-t-4 border-t-brand-600 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-bold text-pgray-900">🔗 네이버 뉴스 API 연결</div>
        <button onClick={onClose} className="text-sm text-pgray-400 hover:underline">닫기 ✕</button>
      </div>

      {connected ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-pgray-600">
            <span className="mr-2 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
              <span className="inline-block h-2 w-2 rounded-full bg-brand-500" /> 연결됨
            </span>
            Client ID <b>{clientIdMasked}</b> 로 실시간 수집 중입니다.
          </div>
          <button onClick={disconnect} className="rounded-lg border border-pgray-200 px-3 py-1.5 text-sm text-pgray-500 hover:bg-pgray-50 hover:text-brand-600">
            연결 해제
          </button>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-pgray-500">
            네이버 클라우드 플랫폼 API HUB 애플리케이션의 <b>[인증 정보]</b>에서 확인한 값을 붙여넣고 저장하세요.
            저장 즉시 연결되며 <b>터미널·재시작이 필요 없습니다.</b>
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Client ID (X-NCP-APIGW-API-KEY-ID)" required>
              <input className={inputClass} value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="예: zpg23gszjq" autoComplete="off" />
            </Field>
            <Field label="Client Secret (X-NCP-APIGW-API-KEY)" required>
              <input type="password" className={inputClass} value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} placeholder="비밀 키를 붙여넣으세요" autoComplete="off" />
            </Field>
          </div>
          <div className="mt-3">
            <Button disabled={saving} onClick={save}>{saving ? "연결 테스트 중…" : "저장하고 연결"}</Button>
          </div>
        </>
      )}

      {result && (
        <div className={`mt-3 rounded-lg px-3 py-2 text-sm ${result.ok ? "bg-brand-50 text-brand-700" : "bg-accent-50 text-accent-800"}`}>
          {result.ok ? "✅ " : "⚠️ "}{result.msg}
        </div>
      )}
    </Card>
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
