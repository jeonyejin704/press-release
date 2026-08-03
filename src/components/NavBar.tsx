"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ROLE_LABELS, type Role } from "@/lib/enums";

type NavUser = { name: string; role: Role; department: string | null };

export function NavBar({
  user,
  unreadCount,
}: {
  user: NavUser;
  unreadCount: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const manager = user.role === "PR_MANAGER" || user.role === "ADMIN";

  const links: { href: string; label: string }[] = manager
    ? [
        { href: "/dashboard", label: "대시보드" },
        { href: "/requests", label: "신청 관리" },
        { href: "/import", label: "데이터 가져오기" },
        { href: "/news", label: "뉴스 모니터링" },
        { href: "/notifications", label: "알림" },
      ]
    : [
        { href: "/requests", label: "내 신청" },
        { href: "/requests/new", label: "새 홍보 신청" },
        { href: "/notifications", label: "알림" },
      ];
  if (user.role === "ADMIN") links.push({ href: "/admin", label: "설정" });

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-display text-xl text-brand-600">
            PressFlow
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => {
              const active =
                pathname === l.href ||
                (l.href !== "/requests" && pathname.startsWith(l.href)) ||
                (l.href === "/requests" && pathname === "/requests");
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`relative rounded-lg px-3 py-1.5 text-sm font-medium ${
                    active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {l.label}
                  {l.href === "/notifications" && unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 rounded-full bg-brand-600 px-1.5 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium text-slate-700">{user.name}</div>
            <div className="text-xs text-slate-400">{ROLE_LABELS[user.role]}</div>
          </div>
          <button
            onClick={logout}
            className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
          >
            로그아웃
          </button>
        </div>
      </div>
      {/* mobile nav */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 px-2 py-1.5 md:hidden">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-slate-600"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
