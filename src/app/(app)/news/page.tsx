import { redirect } from "next/navigation";
import { getCurrentUser, isManager } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NewsClient } from "./NewsClient";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isManager(user)) redirect("/requests");

  const [news, keywords] = await Promise.all([
    prisma.newsItem.findMany({ orderBy: { publishedAt: "desc" } }),
    prisma.newsKeyword.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <NewsClient
      news={JSON.parse(JSON.stringify(news))}
      keywords={keywords.map((k) => k.keyword)}
    />
  );
}
