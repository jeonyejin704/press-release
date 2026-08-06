"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Badge, EmptyState, Field, inputClass } from "@/components/ui";
import { mentionedPerson } from "@/lib/mention";
import { mediaLabel } from "@/lib/news/media";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function NewsClient({
  news,
  keywords,
  keywordRecords = [],
  provider = "mock",
  syncError = null,
  connected = false,
  clientIdMasked = "",
}: {
  news: any[];
  keywords: string[];
  keywordRecords?: any[];
  provider?: string;
  syncError?: string | null;
  connected?: boolean;
  clientIdMasked?: string;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("");
  const [busy, setBusy] = useState(false);
  // 연결 안 됨(mock)이면 연결 폼을 처음부터 펼쳐 보여준다(놓치지 않도록).
  const [setupOpen, setSetupOpen] = useState(provider === "mock");
  const [keywordsOpen, setKeywordsOpen] = useState(false);

  const filtered = filter ? news.filter((n) => n.keyword === filter) : news;
  const importantCount = news.filter((n) => n.isImportant).length;
  const dummyCount = news.filter((n) => typeof n.url === "string" && n.url.includes("news.example.com")).length;

  async function purgeDummy() {
    if (!confirm(`샘플(더미) 기사 ${dummyCount}건을 모두 삭제할까요?`)) return;
    await fetch("/api/news?scope=dummy", { method: "DELETE" });
    router.refresh();
  }

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
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setKeywordsOpen((o) => !o)}
            className="rounded-lg border border-pgray-200 px-3 py-2 text-sm font-medium text-pgray-600 hover:bg-pgray-50"
          >
            🔤 키워드 관리
          </button>
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

      {dummyCount > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-accent-300 bg-accent-50 px-3 py-2 text-xs text-accent-800">
          <span>🧹 남아있는 <b>샘플(더미) 기사 {dummyCount}건</b>이 있습니다. 실제 기사만 남기려면 삭제하세요.</span>
          <button onClick={purgeDummy} className="rounded-md bg-accent-600 px-2.5 py-1 font-semibold text-white hover:bg-accent-700">
            샘플 기사 모두 삭제
          </button>
        </div>
      )}

      {keywordsOpen && (
        <KeywordManager
          records={keywordRecords}
          onClose={() => setKeywordsOpen(false)}
          onChanged={() => router.refresh()}
        />
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((n) => (
            <MonitorCard key={n.id} n={n} onToggle={() => toggleImportant(n.id, n.isImportant)} />
          ))}
        </div>
      )}
    </div>
  );
}

function MonitorCard({ n, onToggle }: { n: any; onToggle: () => void }) {
  const media = mediaLabel(n.mediaName);
  const person = mentionedPerson(n.title, n.summary);
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-pgray-100 bg-white transition hover:shadow-md">
      <a href={n.url} target="_blank" rel="noopener noreferrer" className="flex flex-1 flex-col">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-pgray-50">
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pgray-100 to-pgray-50">
            <span className={`font-display text-lg ${media.known ? "text-brand-600" : "text-pgray-400"}`}>{media.name || "기사"}</span>
          </div>
          {n.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={n.imageUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-[1.03]"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1 p-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className={`font-bold ${media.known ? "text-brand-600" : "text-pgray-400"}`}>{media.name}</span>
            {n.publishedAt && <span className="text-pgray-300">· {new Date(n.publishedAt).toLocaleDateString("ko-KR")}</span>}
            {n.keyword && <span className="ml-auto rounded-full bg-pgray-100 px-1.5 text-[10px] text-pgray-500">{n.keyword}</span>}
          </div>
          <p className="line-clamp-2 text-sm font-medium text-pgray-800 group-hover:text-brand-700">
            {n.title}
            {person && <span className="text-brand-600"> · {person}</span>}
          </p>
        </div>
      </a>
      <button
        onClick={onToggle}
        title="중요 표시"
        className={`absolute right-2 top-2 rounded-full bg-white/80 px-1.5 text-lg backdrop-blur ${
          n.isImportant ? "text-accent-500" : "text-pgray-300 hover:text-accent-300"
        }`}
      >
        ★
      </button>
    </div>
  );
}

function KeywordManager({
  records,
  onClose,
  onChanged,
}: {
  records: any[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [adding, setAdding] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");

  async function call(url: string, method: string, body?: any) {
    setError("");
    setBusy(true);
    try {
      const res = await fetch(url, {
        method,
        ...(body ? { headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : {}),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.error ?? "처리에 실패했습니다.");
        return false;
      }
      return true;
    } finally {
      setBusy(false);
    }
  }

  async function add() {
    const kw = adding.trim();
    if (!kw) return;
    if (await call("/api/news/keywords", "POST", { keyword: kw })) {
      setAdding("");
      onChanged();
    }
  }
  async function remove(id: string) {
    if (!confirm("이 키워드를 삭제할까요? (이 키워드로는 더 이상 기사를 수집하지 않습니다)")) return;
    if (await call(`/api/news/keywords/${id}`, "DELETE")) onChanged();
  }
  async function toggle(id: string, active: boolean) {
    if (await call(`/api/news/keywords/${id}`, "PATCH", { active: !active })) onChanged();
  }
  async function saveEdit(id: string) {
    const kw = editVal.trim();
    if (!kw) return;
    if (await call(`/api/news/keywords/${id}`, "PATCH", { keyword: kw })) {
      setEditId(null);
      onChanged();
    }
  }

  return (
    <Card className="mb-4 border-t-4 border-t-brand-600 p-5">
      <div className="mb-1 flex items-center justify-between">
        <div className="font-bold text-pgray-900">🔤 검색 키워드 관리</div>
        <button onClick={onClose} className="text-sm text-pgray-400 hover:underline">닫기 ✕</button>
      </div>
      <p className="mb-3 text-sm text-pgray-500">
        여기에 등록된 키워드로 네이버 뉴스를 검색합니다. 켜기/끄기, 이름 수정, 삭제, 추가가 가능합니다.
      </p>

      <div className="mb-3 space-y-2">
        {records.length === 0 ? (
          <p className="py-2 text-sm text-pgray-400">등록된 키워드가 없습니다. 아래에서 추가하세요.</p>
        ) : (
          records.map((k) => (
            <div key={k.id} className="flex items-center gap-2 rounded-lg border border-pgray-100 bg-pgray-50 px-3 py-2">
              {editId === k.id ? (
                <>
                  <input
                    className={`${inputClass} h-8 py-1`}
                    value={editVal}
                    onChange={(e) => setEditVal(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit(k.id)}
                    autoFocus
                  />
                  <button disabled={busy} onClick={() => saveEdit(k.id)} className="shrink-0 rounded-md bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-700">저장</button>
                  <button onClick={() => setEditId(null)} className="shrink-0 rounded-md px-2 py-1 text-xs text-pgray-500 hover:bg-pgray-100">취소</button>
                </>
              ) : (
                <>
                  <span className={`flex-1 font-medium ${k.active ? "text-pgray-800" : "text-pgray-400 line-through"}`}>
                    {k.keyword}
                  </span>
                  <button
                    disabled={busy}
                    onClick={() => toggle(k.id, k.active)}
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      k.active ? "bg-brand-100 text-brand-700" : "bg-pgray-200 text-pgray-500"
                    }`}
                    title="수집 켜기/끄기"
                  >
                    {k.active ? "수집 중" : "꺼짐"}
                  </button>
                  <button onClick={() => { setEditId(k.id); setEditVal(k.keyword); }} className="shrink-0 rounded-md px-2 py-1 text-xs text-pgray-500 hover:bg-pgray-100">수정</button>
                  <button disabled={busy} onClick={() => remove(k.id)} className="shrink-0 rounded-md px-2 py-1 text-xs text-pgray-400 hover:bg-pgray-100 hover:text-brand-600">삭제</button>
                </>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          className={inputClass}
          value={adding}
          onChange={(e) => setAdding(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="새 키워드 입력 (예: 포항공과대학교)"
        />
        <Button disabled={busy || !adding.trim()} onClick={add}>추가</Button>
      </div>
      {error && <p className="mt-2 text-sm font-medium text-brand-600">{error}</p>}
    </Card>
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
