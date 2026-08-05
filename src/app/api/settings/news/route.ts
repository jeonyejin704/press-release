import { NextResponse } from "next/server";
import { getCurrentUser, isManager } from "@/lib/session";
import { readSettings, writeSettings, maskSecret } from "@/lib/settings";
import { resolveNewsProvider } from "@/lib/news";

export const runtime = "nodejs";

// 현재 연결 상태 조회
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isManager(user)) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  const s = await readSettings();
  const id = s.NAVER_CLIENT_ID || process.env.NAVER_CLIENT_ID || "";
  const secret = s.NAVER_CLIENT_SECRET || process.env.NAVER_CLIENT_SECRET || "";
  const provider = (s.NEWS_PROVIDER ?? process.env.NEWS_PROVIDER ?? "mock").toLowerCase();
  return NextResponse.json({
    provider,
    connected: provider === "naver" && !!id && !!secret,
    clientIdMasked: maskSecret(id),
    secretSet: !!secret,
  });
}

// 키 저장 + 즉시 연결 테스트
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isManager(user)) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const clientId = String(body.clientId ?? "").trim();
  const clientSecret = String(body.clientSecret ?? "").trim();
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Client ID와 Client Secret을 모두 입력해 주세요." }, { status: 400 });
  }

  await writeSettings({
    NEWS_PROVIDER: "naver",
    NAVER_CLIENT_ID: clientId,
    NAVER_CLIENT_SECRET: clientSecret,
  });

  // 저장한 키로 실제 1건 검색해 연결 확인
  const provider = await resolveNewsProvider();
  let testCount = 0;
  let testError: string | null = null;
  if (provider.name === "naver") {
    try {
      const items = await provider.searchNews(["포스텍"]);
      testCount = items.length;
      testError = provider.lastError ?? null;
    } catch (e) {
      testError = (e as Error).message;
    }
  } else {
    testError = "설정이 저장되지 않았습니다.";
  }

  const ok = provider.name === "naver" && testCount > 0 && !testError;
  return NextResponse.json({
    ok,
    provider: provider.name,
    testCount,
    ...(testError ? { error: testError } : {}),
  });
}

// 연결 해제(키 삭제 → mock 으로 복귀)
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user || !isManager(user)) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  await writeSettings({ NEWS_PROVIDER: "mock", NAVER_CLIENT_ID: "", NAVER_CLIENT_SECRET: "" });
  return NextResponse.json({ ok: true });
}
