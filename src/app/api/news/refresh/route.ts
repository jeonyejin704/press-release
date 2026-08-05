import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isManager } from "@/lib/session";
import { getNewsProvider, DEFAULT_KEYWORDS } from "@/lib/news";

// Pulls fresh articles from the configured news provider (mock by default)
// for all active keywords, de-duplicating by URL.
export async function POST() {
  const user = await getCurrentUser();
  if (!user || !isManager(user)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  // 기본 키워드(포스텍/POSTECH/포항공과대학교/포항공대)가 없으면 자동 추가
  await Promise.all(
    DEFAULT_KEYWORDS.map((keyword) =>
      prisma.newsKeyword.upsert({ where: { keyword }, create: { keyword }, update: {} }),
    ),
  );

  const keywords = await prisma.newsKeyword.findMany({ where: { active: true } });
  const kwList = keywords.map((k) => k.keyword);
  if (kwList.length === 0) return NextResponse.json({ added: 0 });

  const provider = getNewsProvider();
  const items = await provider.searchNews(kwList);

  let added = 0;
  for (const item of items) {
    try {
      await prisma.newsItem.create({
        data: {
          title: item.title,
          mediaName: item.mediaName,
          publishedAt: item.publishedAt,
          url: item.url,
          summary: item.summary,
          keyword: item.keyword,
        },
      });
      added++;
    } catch {
      // duplicate url (unique) — skip
    }
  }

  // 실 연동(naver)인데 0건이면 원인(키 오류/엔드포인트 등)을 함께 안내
  const error = provider.lastError ?? null;
  return NextResponse.json({
    added,
    provider: provider.name,
    ...(error ? { error } : {}),
    ...(provider.name === "mock" ? { note: "현재 mock(샘플) 모드입니다. 실제 기사를 보려면 NEWS_PROVIDER=naver 와 API 키를 설정하세요." } : {}),
  });
}
