"use client";

import { useEffect, useState } from "react";
import { mentionedPerson } from "@/lib/mention";

/* eslint-disable @typescript-eslint/no-explicit-any */

const PAGE_SIZE = 5; // 한 페이지 5개
const MAX_ITEMS = 25; // 최근 25개까지(= 최대 5페이지)

export function DashboardNews({ news, keywords }: { news: any[]; keywords: string[] }) {
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);

  const recent = news.slice(0, MAX_ITEMS);
  const filtered = filter ? recent.filter((n) => n.keyword === filter) : recent;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // 필터가 바뀌면 첫 페이지로
  useEffect(() => setPage(0), [filter]);
  // 페이지 수가 줄면 범위 보정
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
          <span className="text-xs text-pgray-400">
            최근 {filtered.length}건 · {safePage + 1}/{totalPages}
          </span>
        )}
      </div>

      {/* 목록: 5줄 높이를 고정해 페이지를 넘겨도 위/아래 영역이 밀리지 않도록 함 */}
      <ul className="min-h-[17.5rem] divide-y divide-pgray-100">
        {pageItems.length === 0 ? (
          <li className="py-10 text-center text-sm text-pgray-400">기사가 없습니다.</li>
        ) : (
          pageItems.map((n) => (
            <li key={n.id} className="py-2.5">
              <a href={n.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2">
                {n.isImportant && <span className="mt-0.5 text-accent-500">★</span>}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-pgray-800 hover:text-brand-700 hover:underline">
                    {n.title}
                    {mentionedPerson(n.title, n.summary) && (
                      <span className="text-brand-600"> · {mentionedPerson(n.title, n.summary)}</span>
                    )}
                  </span>
                  <span className="text-xs text-pgray-400">
                    {n.mediaName}
                    {n.publishedAt && ` · ${new Date(n.publishedAt).toLocaleDateString("ko-KR")}`}
                    {n.keyword && ` · ${n.keyword}`}
                  </span>
                </span>
              </a>
            </li>
          ))
        )}
      </ul>

      {/* 페이지 넘김 (이 카드만) */}
      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
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

function PageBtn({ disabled, onClick, children }: { disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-7 w-7 items-center justify-center rounded-full text-pgray-500 hover:bg-pgray-100 disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        active ? "bg-brand-600 text-white" : "bg-pgray-100 text-pgray-600 hover:bg-pgray-200"
      }`}
    >
      {label}
    </button>
  );
}
