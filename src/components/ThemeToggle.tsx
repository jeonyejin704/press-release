"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    const root = document.documentElement;
    if (next) root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      localStorage.setItem("pf_theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      onClick={toggle}
      title={dark ? "라이트 모드로" : "다크 모드로"}
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-pgray-500 hover:bg-pgray-100"
    >
      <span>{dark ? "🌙" : "☀️"}</span>
      {dark ? "다크" : "라이트"}
    </button>
  );
}
