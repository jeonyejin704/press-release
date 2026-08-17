import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/Sidebar";
import { getLang } from "@/lib/i18n-server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, isRead: false },
  });
  const lang = await getLang();

  return (
    <div className="min-h-screen md:flex">
      <Sidebar
        user={{ name: user.name, role: user.role, department: user.department }}
        unreadCount={unreadCount}
        lang={lang}
      />
      <div className="min-w-0 flex-1">
        <main className="w-full px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
