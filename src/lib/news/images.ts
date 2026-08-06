import { promises as fs } from "fs";
import path from "path";

// 기사 대표 이미지(og:image) URL을 서버 로컬 JSON에 캐시한다(스키마 변경 없이 앨범형 노출).
// 네이버 뉴스 검색 API는 이미지를 주지 않으므로, 기사 페이지에서 og:image를 best-effort로 긁는다.
const FILE = path.join(process.cwd(), ".pressflow-news-images.json");

type ImageMap = Record<string, string>; // articleUrl -> imageUrl ("" = 시도했으나 없음)

export async function readNewsImages(): Promise<ImageMap> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as ImageMap) : {};
  } catch {
    return {};
  }
}

async function writeNewsImages(map: ImageMap): Promise<void> {
  try {
    await fs.writeFile(FILE, JSON.stringify(map, null, 2), "utf8");
  } catch {
    /* ignore */
  }
}

async function fetchOgImage(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(3500),
      headers: { "user-agent": "Mozilla/5.0 (compatible; PressFlow/1.0)" },
    });
    if (!res.ok) return "";
    const html = (await res.text()).slice(0, 300_000); // 앞부분만(메타태그는 head에 있음)
    const m =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    let img = m?.[1] ?? "";
    if (img.startsWith("//")) img = "https:" + img;
    return img.startsWith("http") ? img : "";
  } catch {
    return "";
  }
}

// 캐시에 없는 URL들에 대해 대표 이미지를 채운다(호출당 최대 maxFetch건, 병렬).
export async function ensureNewsImages(urls: string[], maxFetch = 12): Promise<void> {
  const cache = await readNewsImages();
  const todo = urls.filter((u) => u && !(u in cache)).slice(0, maxFetch);
  if (todo.length === 0) return;
  const results = await Promise.allSettled(todo.map((u) => fetchOgImage(u)));
  results.forEach((r, i) => {
    cache[todo[i]] = r.status === "fulfilled" ? r.value : "";
  });
  await writeNewsImages(cache);
}
