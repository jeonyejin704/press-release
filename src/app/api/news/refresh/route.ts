import { NextResponse } from "next/server";
import { getCurrentUser, isManager } from "@/lib/session";
import { syncNaverNews } from "@/lib/news/sync";

// 설정된 뉴스 제공자(기본 mock, naver 설정 시 네이버)에서 최신 기사를 가져와
// 활성 키워드 전체에 대해 수집하고 URL 기준으로 중복 제거한다.
export async function POST() {
  const user = await getCurrentUser();
  if (!user || !isManager(user)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const result = await syncNaverNews();
  return NextResponse.json({
    added: result.added,
    provider: result.provider,
    ...(result.error ? { error: result.error } : {}),
    ...(result.provider === "mock"
      ? { note: "현재 mock(샘플) 모드입니다. 실제 기사를 보려면 NEWS_PROVIDER=naver 와 API 키를 설정하세요." }
      : {}),
  });
}
