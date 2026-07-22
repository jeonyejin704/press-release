// News monitoring provider abstraction.
//
// The MVP ships a Mock provider seeded with sample articles. To connect a
// real source (Naver News Search API, Bing News, Google Programmable Search,
// RSS), implement `NewsProvider` and switch on NEWS_PROVIDER.

export type NewsItemInput = {
  title: string;
  mediaName?: string;
  publishedAt?: Date;
  url: string;
  summary?: string;
  keyword?: string;
};

export interface NewsProvider {
  readonly name: string;
  searchNews(keywords: string[]): Promise<NewsItemInput[]>;
}

export class MockNewsProvider implements NewsProvider {
  readonly name = "mock";

  async searchNews(keywords: string[]): Promise<NewsItemInput[]> {
    const media = ["연합뉴스", "동아사이언스", "한국경제", "매일경제", "조선일보", "경북일보"];
    const now = Date.now();
    const items: NewsItemInput[] = [];
    keywords.forEach((kw, ki) => {
      for (let i = 0; i < 3; i++) {
        const idx = ki * 3 + i;
        items.push({
          title: `${kw} 연구팀, 새로운 성과 발표… 학계 주목 (${idx + 1})`,
          mediaName: media[idx % media.length],
          publishedAt: new Date(now - idx * 1000 * 60 * 60 * 6),
          url: `https://news.example.com/${encodeURIComponent(kw)}/${idx + 1}`,
          summary: `${kw}가 발표한 연구 성과가 국내외 언론의 주목을 받고 있다. 관련 후속 연구가 기대된다.`,
          keyword: kw,
        });
      }
    });
    return items;
  }
}

export function getNewsProvider(): NewsProvider {
  const provider = (process.env.NEWS_PROVIDER ?? "mock").toLowerCase();
  // TODO: implement NaverNewsProvider using NAVER_CLIENT_ID / NAVER_CLIENT_SECRET.
  if (provider === "naver") {
    console.warn("[news] Naver provider not yet implemented; using mock.");
  }
  return new MockNewsProvider();
}
