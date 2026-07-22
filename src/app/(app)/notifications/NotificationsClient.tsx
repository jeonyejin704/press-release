"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, EmptyState } from "@/components/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function NotificationsClient({ notifications }: { notifications: any[] }) {
  const router = useRouter();

  async function markRead(id: string, pressRequestId: string | null) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    if (pressRequestId) router.push(`/requests/${pressRequestId}`);
    else router.refresh();
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-slate-800">알림</h1>
      {notifications.length === 0 ? (
        <EmptyState title="알림이 없습니다." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`p-4 ${n.isRead ? "" : "border-l-4 border-l-brand-500"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {!n.isRead && <span className="h-2 w-2 rounded-full bg-brand-500" />}
                    <span className="font-medium text-slate-800">{n.title}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(n.createdAt).toLocaleString("ko-KR")}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {n.pressRequestId && (
                    <Link
                      href={`/requests/${n.pressRequestId}`}
                      onClick={() => fetch(`/api/notifications/${n.id}/read`, { method: "PATCH" })}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      바로가기
                    </Link>
                  )}
                  {!n.isRead && (
                    <button
                      onClick={() => markRead(n.id, null)}
                      className="text-xs text-slate-400 hover:underline"
                    >
                      읽음
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
