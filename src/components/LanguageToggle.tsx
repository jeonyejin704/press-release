"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { type Lang, LANG_COOKIE } from "@/lib/i18n";

// KOR/ENG 세그먼트 토글. 쿠키에 언어를 저장하고 화면을 새로고침한다.
export function LanguageToggle({ lang, className = "" }: { lang: Lang; className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function set(next: Lang) {
    if (next === lang) return;
    // 1년짜리 쿠키
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div className={`inline-flex overflow-hidden rounded-lg border border-pgray-200 text-xs ${className}`}>
      {(["ko", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          disabled={pending}
          onClick={() => set(l)}
          className={`px-2.5 py-1 font-semibold transition ${
            lang === l ? "bg-brand-600 text-white" : "bg-white text-pgray-500 hover:bg-pgray-50"
          }`}
        >
          {l === "ko" ? "KOR" : "ENG"}
        </button>
      ))}
    </div>
  );
}
