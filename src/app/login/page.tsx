"use client";

import { useEffect, useState } from "react";
import { Card, Button, inputClass } from "@/components/ui";

const DEMO_ACCOUNTS = [
  { email: "prof.kim@postech.ac.kr", ko: "신청자 · 김연구", en: "Applicant · Kim" },
  { email: "pr.manager@postech.ac.kr", ko: "대외협력팀 담당자 · 전예진", en: "PR Manager · Jeon" },
  { email: "admin@postech.ac.kr", ko: "관리자", en: "Administrator" },
];

type L = "ko" | "en";
const TX = {
  brand: { ko: "POSTECH 언론홍보", en: "POSTECH Media Relations" },
  subtitle: { ko: "대외협력팀 언론 홍보 관리 시스템", en: "Media Relations Management System" },
  emailPh: { ko: "이메일 (예: prof.kim@postech.ac.kr)", en: "Email (e.g. prof.kim@postech.ac.kr)" },
  signin: { ko: "로그인", en: "Sign in" },
  signingIn: { ko: "로그인 중…", en: "Signing in…" },
  demo: { ko: "데모 계정 (비밀번호 없음)", en: "Demo accounts (no password)" },
  fail: { ko: "로그인에 실패했습니다.", en: "Sign-in failed." },
} as const;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<L>("ko");

  // 쿠키에 저장된 언어 선택을 반영
  useEffect(() => {
    const m = document.cookie.match(/(?:^|; )pf_lang=(\w+)/);
    if (m && m[1] === "en") setLang("en");
  }, []);
  function switchLang(next: L) {
    setLang(next);
    document.cookie = `pf_lang=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }
  const T = (k: keyof typeof TX) => TX[k][lang];

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
        setError(data.error ?? T("fail"));
        setLoading(false);
        return;
      }
      window.location.href = "/";
    } catch {
      setError(T("fail"));
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-800 to-brand-600 p-4">
      {/* 언어 전환 (좌측 상단) */}
      <div className="absolute left-4 top-4 inline-flex overflow-hidden rounded-lg border border-white/30 text-xs">
        {(["ko", "en"] as L[]).map((l) => (
          <button
            key={l}
            onClick={() => switchLang(l)}
            className={`px-2.5 py-1 font-semibold transition ${lang === l ? "bg-white text-brand-700" : "bg-white/10 text-white hover:bg-white/20"}`}
          >
            {l === "ko" ? "KOR" : "ENG"}
          </button>
        ))}
      </div>

      {/* 데모 계정 (우측 상단) */}
      <div className="absolute right-4 top-4 w-60 rounded-xl bg-white/10 p-3 text-white backdrop-blur">
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/70">{T("demo")}</div>
        <div className="space-y-1.5">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.email}
              onClick={() => submit(a.email)}
              disabled={loading}
              className="w-full rounded-lg bg-white/15 px-2.5 py-1.5 text-left text-xs hover:bg-white/25 disabled:opacity-60"
            >
              <div className="font-medium">{a[lang]}</div>
              <div className="text-[10px] text-white/60">{a.email}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 로그인 (중앙) */}
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <div className="font-display text-3xl text-brand-600">{T("brand")}</div>
          <div className="mt-1 text-sm text-pgray-500">{T("subtitle")}</div>
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
            placeholder={T("emailPh")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && <p className="text-sm text-brand-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? T("signingIn") : T("signin")}
          </Button>
        </form>
      </Card>
    </main>
  );
}
