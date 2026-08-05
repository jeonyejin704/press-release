import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isManager } from "@/lib/session";

// 키워드 수정(이름 변경 또는 활성/비활성 토글)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !isManager(user)) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: { keyword?: string; active?: boolean } = {};

  if (body.keyword !== undefined) {
    const keyword = String(body.keyword).trim();
    if (!keyword) return NextResponse.json({ error: "키워드를 입력해 주세요." }, { status: 400 });
    const dup = await prisma.newsKeyword.findUnique({ where: { keyword } });
    if (dup && dup.id !== id) return NextResponse.json({ error: "이미 등록된 키워드입니다." }, { status: 409 });
    data.keyword = keyword;
  }
  if (body.active !== undefined) data.active = !!body.active;

  const updated = await prisma.newsKeyword.update({ where: { id }, data }).catch(() => null);
  if (!updated) return NextResponse.json({ error: "키워드를 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json({ keyword: updated });
}

// 키워드 삭제
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !isManager(user)) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  const { id } = await params;
  await prisma.newsKeyword.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
