import { redirect } from "next/navigation";
import { getCurrentUser, isManager } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { syncNaverNews } from "@/lib/news/sync";
import { readSettings, maskSecret } from "@/lib/settings";
import { NewsClient } from "./NewsClient";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isManager(user)) redirect("/requests");

  // 페이지 진입 시 실시간으로 최신 기사를 수집(잦은 새로고침은 10초 스로틀).
  const sync = await syncNaverNews({ throttleMs: 10_000 }).catch(() => null);

  const [news, keywords, settings] = await Promise.all([
    prisma.newsItem.findMany({ orderBy: { publishedAt: "desc" } }),
    prisma.newsKeyword.findMany({ orderBy: { createdAt: "asc" } }),
    readSettings(),
  ]);

  const clientId = settings.NAVER_CLIENT_ID || process.env.NAVER_CLIENT_ID || "";
  const connected = (sync?.provider ?? "mock") === "naver";

  return (
    <NewsClient
      news={JSON.parse(JSON.stringify(news))}
      keywords={keywords.filter((k) => k.active).map((k) => k.keyword)}
      keywordRecords={JSON.parse(JSON.stringify(keywords))}
      provider={sync?.provider ?? "mock"}
      syncError={sync?.error ?? null}
      connected={connected}
      clientIdMasked={maskSecret(clientId)}
    />
  );
}
