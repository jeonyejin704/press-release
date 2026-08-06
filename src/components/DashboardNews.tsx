"use client";

import { useEffect, useState } from "react";
import { mentionedPerson } from "@/lib/mention";
import { mediaLabel } from "@/lib/news/media";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */

const PAGE_SIZE = 5; // 앨범 한 페이지 5개
const MAX_ITEMS = 25; // 최근 25개(= 5페이지)

export function DashboardNews({ news, keywords }: { news: any[]; keywords: string[] }) {
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);

  const recent = news.slice(0, MAX_ITEMS);
  const filtered = filter ? recent.filter((n) => n.keyword === filter) : recent;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => setPage(0), [filter]);
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <Chip label="전체" active={!filter} onClick={() => setFilter("")} />
          {keywords.map((k) => (
            <Chip key={k} label={k} active={filter === k} onClick={() => setFilter(k)} />
          ))}
        </div>
        {filtered.length > 0 && (
          <span className="text-xs text-pgray-400">최근 {filtered.length}건 · {safePage + 1}/{totalPages}</span>
        )}
      </div>

      {pageItems.length === 0 ? (
        <p className="py-10 text-center text-sm text-pgray-400">기사가 없습니다.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((n) => (
            <NewsCard key={n.id} n={n} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1.5">
          <PageBtn disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>‹</PageBtn>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`h-7 w-7 rounded-full text-xs font-semibold transition ${
                i === safePage ? "bg-brand-600 text-white" : "bg-pgray-100 text-pgray-500 hover:bg-pgray-200"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <PageBtn disabled={safePage >= totalPages - 1} onClick={() => setPage(safePage + 1)}>›</PageBtn>
        </div>
      )}
    </div>
  );
}

export function NewsCard({ n }: { n: any }) {
  const media = mediaLabel(n.mediaName);
  const person = mentionedPerson(n.title, n.summary);
  return (
    <a
      href={n.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-xl border border-pgray-100 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-pgray-50">
        {n.imageUrl ? (
          <img src={n.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover transition group-hover:scale-[1.03]"
            onError={(e) => { (e.currentTarget.style.display = "none"); }} />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-pgray-100 to-pgray-50">
            <span className={`font-display text-lg ${media.known ? "text-brand-600" : "text-pgray-400"}`}>{media.name || "기사"}</span>
          </div>
        )}
        {n.isImportant && <span className="absolute left-2 top-2 rounded-full bg-accent-500 px-1.5 text-xs font-bold text-white">★</span>}
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
  );
}

function PageBtn({ disabled, onClick, children }: { disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="flex h-7 w-7 items-center justify-center rounded-full text-pgray-500 hover:bg-pgray-100 disabled:opacity-30">
      {children}
    </button>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${active ? "bg-brand-600 text-white" : "bg-pgray-100 text-pgray-600 hover:bg-pgray-200"}`}>
      {label}
    </button>
  );
}
