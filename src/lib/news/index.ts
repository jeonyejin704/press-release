// News monitoring provider abstraction.
//
// Default: Mock provider (sample articles, no network).
// Real source: NAVER Cloud Platform · API HUB "NAVER 검색(뉴스)" API.
//   NEWS_PROVIDER=naver 로 설정하고, API HUB 애플리케이션의 [인증 정보]에서
//   확인한 Client ID / Client Secret 를 NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 에 입력.
//   (인증 헤더는 X-NCP-APIGW-API-KEY-ID / X-NCP-APIGW-API-KEY)

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
  // 실제 연동 시 마지막 오류(HTTP 상태/메시지)를 UI에서 안내하기 위한 필드
  lastError?: string | null;
}

// 기본 모니터링 키워드
export const DEFAULT_KEYWORDS = ["포스텍", "POSTECH", "포항공과대학교", "포항공대"];

// mock(샘플) 기사 식별용 호스트 — 실제 연동 후 이 도메인 기사만 골라 삭제한다.
export const MOCK_URL_HOST = "news.example.com";

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
          url: `https://${MOCK_URL_HOST}/${encodeURIComponent(kw)}/${idx + 1}`,
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

// NAVER Cloud Platform · API HUB "NAVER 검색(뉴스)" 엔드포인트.
// (기존 developers.naver.com 오픈API와 인증 헤더/도메인이 다름)
// 필요 시 NAVER_SEARCH_URL 로 재정의 가능.
const NCP_NEWS_URL =
  process.env.NAVER_SEARCH_URL ?? "https://naverapihub.apigw.ntruss.com/search/v1/news";

export class NaverNewsProvider implements NewsProvider {
  readonly name = "naver";
  lastError: string | null = null;
  constructor(
    private clientId: string,
    private clientSecret: string,
    private baseUrl: string = NCP_NEWS_URL,
  ) {}

  async searchNews(keywords: string[]): Promise<NewsItemInput[]> {
    const out: NewsItemInput[] = [];
    this.lastError = null;
    for (const kw of keywords) {
      const url = `${this.baseUrl}?query=${encodeURIComponent(kw)}&display=30&sort=date`;
      let res: Response;
      try {
        res = await fetch(url, {
          headers: {
            // NCP API HUB 인증 헤더 (Client ID / Client Secret)
            "X-NCP-APIGW-API-KEY-ID": this.clientId,
            "X-NCP-APIGW-API-KEY": this.clientSecret,
          },
        });
      } catch (e) {
        this.lastError = `요청 실패(${kw}): ${(e as Error).message}`;
        console.warn("[news]", this.lastError);
        continue;
      }
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        this.lastError = `HTTP ${res.status} (${kw}) ${body.slice(0, 200)}`;
        console.warn("[news] Naver API", this.lastError);
        continue;
      }
      let data: {
        items?: Array<{ title: string; description: string; originallink: string; link: string; pubDate: string }>;
      };
      try {
        data = await res.json();
      } catch (e) {
        this.lastError = `응답 파싱 실패(${kw}): ${(e as Error).message}`;
        console.warn("[news]", this.lastError);
        continue;
      }
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

// 환경변수(.env)만 보고 제공자 결정 (구버전 호환용).
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

// 앱 내 설정(브라우저에서 저장) 우선, 없으면 .env 를 확인해 제공자 결정.
export async function resolveNewsProvider(): Promise<NewsProvider> {
  const { readSettings } = await import("@/lib/settings");
  const s = await readSettings();
  const provider = (s.NEWS_PROVIDER ?? process.env.NEWS_PROVIDER ?? "mock").toLowerCase();
  if (provider === "naver") {
    const id = s.NAVER_CLIENT_ID || process.env.NAVER_CLIENT_ID;
    const secret = s.NAVER_CLIENT_SECRET || process.env.NAVER_CLIENT_SECRET;
    const url = s.NAVER_SEARCH_URL || process.env.NAVER_SEARCH_URL;
    if (id && secret) return new NaverNewsProvider(id, secret, url || undefined);
  }
  return new MockNewsProvider();
}
