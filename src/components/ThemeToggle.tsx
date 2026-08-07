"use client";

import { useEffect, useState } from "react";

// 라이트/다크가 나란히 보이는 세그먼트 스위치 — 현재 모드를 한눈에 알 수 있다.
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function apply(d: boolean) {
    setDark(d);
    const root = document.documentElement;
    if (d) root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      localStorage.setItem("pf_theme", d ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }

  return (
    <div className={`inline-flex items-center rounded-full border border-pgray-200 bg-pgray-50 p-0.5 text-xs ${className}`}>
      <button
        onClick={() => apply(false)}
        className={`flex flex-1 items-center justify-center gap-1 rounded-full px-2.5 py-1 transition ${
          !dark ? "bg-white font-bold text-brand-600 shadow-sm" : "text-pgray-500"
        }`}
      >
        ☀️ 라이트
      </button>
      <button
        onClick={() => apply(true)}
        className={`flex flex-1 items-center justify-center gap-1 rounded-full px-2.5 py-1 transition ${
          dark ? "bg-brand-600 font-bold text-white" : "text-pgray-500"
        }`}
      >
        🌙 다크
      </button>
    </div>
  );
}
