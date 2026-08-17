"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ROLE_LABELS, type Role } from "@/lib/enums";
import { ThemeToggle } from "@/components/ThemeToggle";

type NavUser = { name: string; role: Role; department: string | null };
type NavItem = { href: string; label: string; icon: string };

export function Sidebar({ user, unreadCount }: { user: NavUser; unreadCount: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const manager = user.role === "PR_MANAGER" || user.role === "ADMIN";

  const links: NavItem[] = manager
    ? [
        { href: "/dashboard", label: "대시보드", icon: "📊" },
        { href: "/requests", label: "신청 관리", icon: "📋" },
        { href: "/applicants", label: "신청자", icon: "👤" },
        { href: "/schedule", label: "배포일정", icon: "📅" },
        { href: "/ads", label: "광고비 집행", icon: "💰" },
        { href: "/news", label: "뉴스 모니터링", icon: "📰" },
        { href: "/import", label: "데이터 가져오기", icon: "📥" },
        { href: "/notifications", label: "알림", icon: "🔔" },
      ]
    : [
        { href: "/requests", label: "내 신청", icon: "📋" },
        { href: "/requests/new", label: "새 홍보 신청", icon: "➕" },
        { href: "/notifications", label: "알림", icon: "🔔" },
      ];
  if (user.role === "ADMIN") links.push({ href: "/admin", label: "설정", icon: "⚙️" });

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
          POSTECH 언론홍보
        </Link>
        <div className="mb-4 px-1">
          <ThemeToggle className="w-full" />
        </div>
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
            로그아웃
          </button>
        </div>
      </aside>

      {/* ── Mobile: 상단 바 ── */}
      <header className="border-b border-pgray-100 bg-white md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="font-display text-lg text-brand-600">POSTECH 언론홍보</Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className="text-xs text-pgray-500">{user.name}</span>
            <button onClick={logout} className="rounded-lg px-2 py-1 text-xs text-pgray-400 hover:bg-pgray-100">로그아웃</button>
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
