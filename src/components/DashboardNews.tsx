"use client";

import { useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function DashboardNews({ news, keywords }: { news: any[]; keywords: string[] }) {
  const [filter, setFilter] = useState("");
  const filtered = (filter ? news.filter((n) => n.keyword === filter) : news).slice(0, 8);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        <Chip label="전체" active={!filter} onClick={() => setFilter("")} />
        {keywords.map((k) => (
          <Chip key={k} label={k} active={filter === k} onClick={() => setFilter(k)} />
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="py-4 text-center text-sm text-pgray-400">기사가 없습니다.</p>
      ) : (
        <ul className="divide-y divide-pgray-100">
          {filtered.map((n) => (
            <li key={n.id} className="py-2">
              <a href={n.url} target="_blank" className="flex items-start gap-2">
                {n.isImportant && <span className="mt-0.5 text-accent-500">★</span>}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-pgray-800 hover:text-brand-700 hover:underline">
                    {n.title}
                  </span>
                  <span className="text-xs text-pgray-400">
                    {n.mediaName}
                    {n.publishedAt && ` · ${new Date(n.publishedAt).toLocaleDateString("ko-KR")}`}
                    {n.keyword && ` · ${n.keyword}`}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
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
