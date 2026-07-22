"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, inputClass } from "@/components/ui";

const DEMO_ACCOUNTS = [
  { email: "prof.kim@postech.ac.kr", label: "신청자 · 김연구 (화학공학과)" },
  { email: "pr.manager@postech.ac.kr", label: "홍보팀 담당자 · 박홍보" },
  { email: "admin@postech.ac.kr", label: "관리자" },
];

export default function LoginPage() {
  const router = useRouter();
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
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-800 to-brand-600 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold text-brand-700">PressFlow</div>
          <div className="mt-1 text-sm text-slate-500">대학 언론홍보 관리 시스템</div>
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
            placeholder="이메일 (예: pr.manager@postech.ac.kr)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "로그인 중…" : "로그인"}
          </Button>
        </form>

        <div className="mt-6">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            데모 계정 (비밀번호 없음)
          </div>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                onClick={() => submit(a.email)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:bg-brand-50"
              >
                <div className="font-medium text-slate-700">{a.label}</div>
                <div className="text-xs text-slate-400">{a.email}</div>
              </button>
            ))}
          </div>
        </div>
      </Card>
    </main>
  );
}
