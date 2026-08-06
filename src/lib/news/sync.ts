import { prisma } from "@/lib/prisma";
import { resolveNewsProvider, DEFAULT_KEYWORDS, MOCK_URL_HOST } from "@/lib/news";
import { ensureNewsImages } from "@/lib/news/images";
import { readSettings, writeSettings } from "@/lib/settings";

// 마지막 동기화 시각(모듈 메모리). 짧은 시간 내 반복 요청을 눌러 API 호출 한도를 아낀다.
let lastSyncAt = 0;

// 대학 홍보 담당자에게 유용한 추천 키워드(정부 사업·고등교육·글로벌 대학).
// 기존 키워드에 '한 번만' 추가한다(사용자가 지우면 되살아나지 않음).
export const RECOMMENDED_KEYWORDS = [
  "교육부",
  "과학기술정보통신부",
  "대학 지원사업",
  "대학 국제화",
  "세계대학순위",
];

export type NewsSyncResult = {
  added: number;
  provider: string;
  skipped?: boolean;
  error?: string | null;
};

// 네이버(또는 mock) 뉴스를 가져와 DB에 upsert. URL 기준으로 중복 제거.
export async function syncNaverNews(opts: { throttleMs?: number } = {}): Promise<NewsSyncResult> {
  const provider = await resolveNewsProvider();
  const now = Date.now();

  // 실제 네이버 연동이면 예전에 쌓인 mock(샘플) 기사를 정리한다.
  // (스로틀과 무관하게 항상 실행 — 비용이 작고, 더미가 남아있으면 안 되므로)
  if (provider.name === "naver") {
    await prisma.newsItem.deleteMany({ where: { url: { contains: MOCK_URL_HOST } } }).catch(() => null);
  }

  if (opts.throttleMs && now - lastSyncAt < opts.throttleMs) {
    return { added: 0, provider: provider.name, skipped: true };
  }
  lastSyncAt = now;

  // 키워드가 하나도 없을 때만 기본 키워드(포스텍/POSTECH/포항공과대학교/포항공대) 최초 1회 시딩.
  // (사용자가 삭제한 키워드가 매번 되살아나지 않도록 upsert 하지 않는다)
  const total = await prisma.newsKeyword.count();
  if (total === 0) {
    await Promise.all(
      DEFAULT_KEYWORDS.map((keyword) =>
        prisma.newsKeyword.create({ data: { keyword } }).catch(() => null),
      ),
    );
  }

  // 추천 키워드(정부/고등교육/글로벌) 최초 1회 추가 — 플래그로 중복/부활 방지
  const settings = await readSettings();
  if (!settings.RECO_KW_ADDED) {
    await Promise.all(
      RECOMMENDED_KEYWORDS.map((keyword) =>
        prisma.newsKeyword.create({ data: { keyword } }).catch(() => null),
      ),
    );
    await writeSettings({ RECO_KW_ADDED: "1" });
  }

  const keywords = await prisma.newsKeyword.findMany({ where: { active: true } });
  const kwList = keywords.map((k) => k.keyword);
  if (kwList.length === 0) return { added: 0, provider: provider.name };

  const items = await provider.searchNews(kwList);

  let added = 0;
  const addedUrls: string[] = [];
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
      addedUrls.push(item.url);
    } catch {
      // url 유니크 충돌(이미 수집된 기사) — 건너뜀
    }
  }

  // 새로 추가된 기사의 대표 이미지(og:image)를 best-effort로 캐시(앨범형 노출용)
  if (addedUrls.length > 0) {
    await ensureNewsImages(addedUrls).catch(() => null);
  }

  return { added, provider: provider.name, error: provider.lastError ?? null };
}
