import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isManager } from "@/lib/session";

// 키워드 목록
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isManager(user)) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  const keywords = await prisma.newsKeyword.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ keywords });
}

// 키워드 추가
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isManager(user)) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const keyword = String(body.keyword ?? "").trim();
  if (!keyword) return NextResponse.json({ error: "키워드를 입력해 주세요." }, { status: 400 });

  const exists = await prisma.newsKeyword.findUnique({ where: { keyword } });
  if (exists) return NextResponse.json({ error: "이미 등록된 키워드입니다." }, { status: 409 });

  const created = await prisma.newsKeyword.create({ data: { keyword } });
  return NextResponse.json({ keyword: created });
}
