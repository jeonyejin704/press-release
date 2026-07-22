import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

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
