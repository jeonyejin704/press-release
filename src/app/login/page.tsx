"use client";

import { useState } from "react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");

  async function enter(role: "APPLICANT" | "PR_MANAGER") {
    setError("");
    setLoading(role);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "로그인에 실패했습니다.");
        setLoading("");
        return;
      }
      window.location.href = "/";
    } catch {
      setError("로그인에 실패했습니다.");
      setLoading("");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-800 to-brand-600 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="font-display text-3xl text-brand-600">POSTECH 언론홍보</div>
          <div className="mt-1 text-sm text-pgray-500">대외협력팀 언론 홍보 관리 시스템</div>
        </div>

        <div className="space-y-3">
          {/* 신청 — 크게(주 버튼) */}
          <button
            onClick={() => enter("APPLICANT")}
            disabled={!!loading}
            className="w-full rounded-2xl bg-brand-600 px-6 py-7 text-left text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
          >
            <div className="font-display text-2xl">📝 신청</div>
            <div className="mt-1 text-sm text-white/80">홍보 유형을 골라 보도자료 홍보를 신청합니다.</div>
          </button>

          {/* 관리 — 작게(보조 버튼) */}
          <button
            onClick={() => enter("PR_MANAGER")}
            disabled={!!loading}
            className="w-full rounded-xl border border-pgray-200 bg-white px-5 py-4 text-left text-pgray-700 transition hover:bg-pgray-50 disabled:opacity-60"
          >
            <div className="font-display text-lg">🗂️ 관리</div>
            <div className="mt-0.5 text-xs text-pgray-400">대외협력팀 담당자 — 신청 검토·대시보드·일정·광고비·뉴스</div>
          </button>
        </div>

        {loading && <p className="mt-4 text-center text-sm text-pgray-400">로그인 중…</p>}
        {error && <p className="mt-4 text-center text-sm text-brand-600">{error}</p>}
      </div>
    </main>
  );
}
