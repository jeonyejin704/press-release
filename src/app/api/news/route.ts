import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isManager } from "@/lib/session";
import { MOCK_URL_HOST } from "@/lib/news";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("keyword") ?? undefined;
  const news = await prisma.newsItem.findMany({
    where: keyword ? { keyword } : {},
    orderBy: { publishedAt: "desc" },
  });
  return NextResponse.json({ news });
}

// 더미(샘플) 기사 삭제(?scope=dummy) 또는 전체 삭제(?scope=all)
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isManager(user)) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") ?? "dummy";
  const where = scope === "all" ? {} : { url: { contains: MOCK_URL_HOST } };
  const { count } = await prisma.newsItem.deleteMany({ where });
  return NextResponse.json({ deleted: count, scope });
}
