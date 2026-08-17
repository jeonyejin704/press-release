import { cookies } from "next/headers";
import { type Lang, LANG_COOKIE } from "@/lib/i18n";

// 서버 컴포넌트/라우트에서 쿠키로 현재 언어를 읽는다.
export async function getLang(): Promise<Lang> {
  const store = await cookies();
  return store.get(LANG_COOKIE)?.value === "en" ? "en" : "ko";
}
