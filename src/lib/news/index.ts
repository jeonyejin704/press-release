// News monitoring provider abstraction.
//
// Default: Mock provider (sample articles, no network).
// Real source: Naver 뉴스 검색 API — set NEWS_PROVIDER=naver and provide
// NAVER_CLIENT_ID / NAVER_CLIENT_SECRET (from https://developers.naver.com).

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

// 기본 모니터링 키워드
export const DEFAULT_KEYWORDS = ["포스텍", "POSTECH", "포항공과대학교", "포항공대"];

// ── Mock ────────────────────────────────────────────────────────────────────
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
          summary: `${kw}가 발표한 연구 성과가 국내외 언론의 주목을 받고 있다.`,
          keyword: kw,
        });
      }
    });
    return items;
  }
}

// ── Naver 뉴스 검색 API ──────────────────────────────────────────────────────
function stripHtml(s: string): string {
  return (s || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export class NaverNewsProvider implements NewsProvider {
  readonly name = "naver";
  constructor(private clientId: string, private clientSecret: string) {}

  async searchNews(keywords: string[]): Promise<NewsItemInput[]> {
    const out: NewsItemInput[] = [];
    for (const kw of keywords) {
      const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(kw)}&display=30&sort=date`;
      let res: Response;
      try {
        res = await fetch(url, {
          headers: {
            "X-Naver-Client-Id": this.clientId,
            "X-Naver-Client-Secret": this.clientSecret,
          },
        });
      } catch (e) {
        console.warn(`[news] Naver fetch 실패 (${kw}):`, (e as Error).message);
        continue;
      }
      if (!res.ok) {
        console.warn(`[news] Naver API ${res.status} (${kw})`);
        continue;
      }
      const data = (await res.json()) as {
        items?: Array<{ title: string; description: string; originallink: string; link: string; pubDate: string }>;
      };
      for (const item of data.items ?? []) {
        const link = item.originallink || item.link;
        out.push({
          title: stripHtml(item.title),
          summary: stripHtml(item.description),
          url: link,
          mediaName: hostOf(link),
          publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
          keyword: kw,
        });
      }
    }
    return out;
  }
}

export function getNewsProvider(): NewsProvider {
  const provider = (process.env.NEWS_PROVIDER ?? "mock").toLowerCase();
  if (provider === "naver") {
    const id = process.env.NAVER_CLIENT_ID;
    const secret = process.env.NAVER_CLIENT_SECRET;
    if (id && secret) return new NaverNewsProvider(id, secret);
    console.warn("[news] NEWS_PROVIDER=naver 이지만 NAVER_CLIENT_ID/SECRET 이 없어 mock 사용");
  }
  return new MockNewsProvider();
}
