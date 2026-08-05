import { promises as fs } from "fs";
import path from "path";

// 런타임 설정을 서버 로컬 JSON 파일에 저장한다.
// (DB 스키마 변경 없이 즉시 반영 — 브라우저에서 저장하면 서버 재시작 불필요)
// 이 파일은 비밀값(API 키)을 담으므로 .gitignore 로 제외되어 있다.
const FILE = path.join(process.cwd(), ".pressflow-settings.json");

export type AppSettings = Record<string, string>;

export async function readSettings(): Promise<AppSettings> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as AppSettings) : {};
  } catch {
    return {};
  }
}

export async function writeSettings(patch: AppSettings): Promise<AppSettings> {
  const current = await readSettings();
  const next: AppSettings = { ...current };
  for (const [k, v] of Object.entries(patch)) {
    if (v === "") delete next[k]; // 빈 문자열이면 해당 키 제거
    else next[k] = v;
  }
  await fs.writeFile(FILE, JSON.stringify(next, null, 2), "utf8");
  return next;
}

// 값을 마스킹해서 화면에 안전하게 표시 (예: "zpg2…YZaB")
export function maskSecret(v?: string | null): string {
  if (!v) return "";
  if (v.length <= 6) return "•".repeat(v.length);
  return `${v.slice(0, 3)}…${v.slice(-3)}`;
}
