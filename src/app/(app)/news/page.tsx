import { redirect } from "next/navigation";
import { getCurrentUser, isManager } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { syncNaverNews } from "@/lib/news/sync";
import { NewsClient } from "./NewsClient";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isManager(user)) redirect("/requests");

  // 페이지 진입 시 실시간으로 최신 기사를 수집(잦은 새로고침은 10초 스로틀).
  const sync = await syncNaverNews({ throttleMs: 10_000 }).catch(() => null);

  const [news, keywords] = await Promise.all([
    prisma.newsItem.findMany({ orderBy: { publishedAt: "desc" } }),
    prisma.newsKeyword.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <NewsClient
      news={JSON.parse(JSON.stringify(news))}
      keywords={keywords.map((k) => k.keyword)}
      provider={sync?.provider ?? "mock"}
      syncError={sync?.error ?? null}
    />
  );
}
