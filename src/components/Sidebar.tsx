"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ROLE_LABELS, type Role } from "@/lib/enums";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { makeT, type Lang } from "@/lib/i18n";

type NavUser = { name: string; role: Role; department: string | null };
type NavItem = { href: string; label: string; icon: string };

export function Sidebar({ user, unreadCount, lang = "ko" }: { user: NavUser; unreadCount: number; lang?: Lang }) {
  const pathname = usePathname();
  const router = useRouter();
  const manager = user.role === "PR_MANAGER" || user.role === "ADMIN";
  const tr = makeT(lang);

  const links: NavItem[] = manager
    ? [
        { href: "/dashboard", label: tr("nav.dashboard"), icon: "📊" },
        { href: "/requests", label: tr("nav.requests.manager"), icon: "📋" },
        { href: "/applicants", label: tr("nav.applicants"), icon: "👤" },
        { href: "/schedule", label: tr("nav.schedule"), icon: "📅" },
        { href: "/ads", label: tr("nav.ads"), icon: "💰" },
        { href: "/news", label: tr("nav.news"), icon: "📰" },
        { href: "/import", label: tr("nav.import"), icon: "📥" },
        { href: "/notifications", label: tr("nav.notifications"), icon: "🔔" },
      ]
    : [
        { href: "/requests", label: tr("nav.requests.applicant"), icon: "📋" },
        { href: "/requests/new", label: tr("nav.new"), icon: "➕" },
        { href: "/notifications", label: tr("nav.notifications"), icon: "🔔" },
      ];
  if (user.role === "ADMIN") links.push({ href: "/admin", label: tr("nav.settings"), icon: "⚙️" });

  function isActive(href: string) {
    if (href === "/requests") return pathname === "/requests";
    if (href === "/dashboard") return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
    return pathname === href || pathname.startsWith(href + "/");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* ── Desktop: 좌측 사이드바 ── */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-pgray-100 bg-white px-3 py-5 md:flex">
        <Link href="/" className="mb-3 whitespace-nowrap px-2 font-display text-lg text-brand-600">
          {tr("brand")}
        </Link>
        <div className="mb-2 px-1">
          <ThemeToggle className="w-full" />
        </div>
        <div className="mb-4 flex items-center justify-between px-1">
          <span className="text-[11px] text-pgray-400">{lang === "en" ? "Language" : "언어"}</span>
          <LanguageToggle lang={lang} />
        </div>
        {!manager && (
          <p className="mb-3 rounded-lg bg-brand-50/60 px-2.5 py-2 text-[11px] leading-snug text-brand-700">
            {tr("lang.notice")}
          </p>
        )}
        <nav className="flex flex-1 flex-col gap-1">
          {links.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  active ? "bg-brand-50 text-brand-700" : "text-pgray-600 hover:bg-pgray-50"
                }`}
              >
                <span className="text-base">{l.icon}</span>
                {l.label}
                {l.href === "/notifications" && unreadCount > 0 && (
                  <span className="ml-auto rounded-full bg-brand-600 px-2 text-[11px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 flex items-center justify-between border-t border-pgray-100 pt-4">
          <div className="min-w-0 px-2">
            <div className="truncate text-sm font-bold text-pgray-800">{user.name}</div>
            <div className="text-xs text-pgray-400">{ROLE_LABELS[user.role]}</div>
          </div>
          <button onClick={logout} className="rounded-lg px-2 py-1 text-xs text-pgray-400 hover:bg-pgray-100">
            {tr("logout")}
          </button>
        </div>
      </aside>

      {/* ── Mobile: 상단 바 ── */}
      <header className="border-b border-pgray-100 bg-white md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="font-display text-lg text-brand-600">{tr("brand")}</Link>
          <div className="flex items-center gap-2">
            <LanguageToggle lang={lang} />
            <ThemeToggle />
            <span className="text-xs text-pgray-500">{user.name}</span>
            <button onClick={logout} className="rounded-lg px-2 py-1 text-xs text-pgray-400 hover:bg-pgray-100">{tr("logout")}</button>
          </div>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto px-2 pb-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold ${
                isActive(l.href) ? "bg-brand-50 text-brand-700" : "text-pgray-600"
              }`}
            >
              <span>{l.icon}</span>{l.label}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}
