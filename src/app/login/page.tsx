"use client";

import { useState } from "react";
import { Card, Button, inputClass } from "@/components/ui";

const DEMO_ACCOUNTS = [
  { email: "prof.kim@postech.ac.kr", label: "신청자 · 김연구" },
  { email: "pr.manager@postech.ac.kr", label: "대외협력팀 담당자 · 전예진" },
  { email: "admin@postech.ac.kr", label: "관리자" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(targetEmail: string) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "로그인에 실패했습니다.");
        setLoading(false);
        return;
      }
      window.location.href = "/";
    } catch {
      setError("로그인에 실패했습니다.");
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-800 to-brand-600 p-4">
      {/* 데모 계정 (우측 상단) */}
      <div className="absolute right-4 top-4 w-60 rounded-xl bg-white/10 p-3 text-white backdrop-blur">
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/70">데모 계정 (비밀번호 없음)</div>
        <div className="space-y-1.5">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.email}
              onClick={() => submit(a.email)}
              disabled={loading}
              className="w-full rounded-lg bg-white/15 px-2.5 py-1.5 text-left text-xs hover:bg-white/25 disabled:opacity-60"
            >
              <div className="font-medium">{a.label}</div>
              <div className="text-[10px] text-white/60">{a.email}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 로그인 (중앙) */}
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <div className="font-display text-3xl text-brand-600">POSTECH 언론홍보</div>
          <div className="mt-1 text-sm text-pgray-500">대외협력팀 언론 홍보 관리 시스템</div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(email);
          }}
          className="space-y-3"
        >
          <input
            type="email"
            className={inputClass}
            placeholder="이메일 (예: prof.kim@postech.ac.kr)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && <p className="text-sm text-brand-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "로그인 중…" : "로그인"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
