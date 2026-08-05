import { prisma } from "@/lib/prisma";
import { getNewsProvider, DEFAULT_KEYWORDS } from "@/lib/news";

// 마지막 동기화 시각(모듈 메모리). 짧은 시간 내 반복 요청을 눌러 API 호출 한도를 아낀다.
let lastSyncAt = 0;

export type NewsSyncResult = {
  added: number;
  provider: string;
  skipped?: boolean;
  error?: string | null;
};

// 네이버(또는 mock) 뉴스를 가져와 DB에 upsert. URL 기준으로 중복 제거.
export async function syncNaverNews(opts: { throttleMs?: number } = {}): Promise<NewsSyncResult> {
  const provider = getNewsProvider();
  const now = Date.now();
  if (opts.throttleMs && now - lastSyncAt < opts.throttleMs) {
    return { added: 0, provider: provider.name, skipped: true };
  }
  lastSyncAt = now;

  // 기본 키워드(포스텍/POSTECH/포항공과대학교/포항공대)가 없으면 자동 추가
  await Promise.all(
    DEFAULT_KEYWORDS.map((keyword) =>
      prisma.newsKeyword.upsert({ where: { keyword }, create: { keyword }, update: {} }),
    ),
  );

  const keywords = await prisma.newsKeyword.findMany({ where: { active: true } });
  const kwList = keywords.map((k) => k.keyword);
  if (kwList.length === 0) return { added: 0, provider: provider.name };

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
      // url 유니크 충돌(이미 수집된 기사) — 건너뜀
    }
  }

  return { added, provider: provider.name, error: provider.lastError ?? null };
}
