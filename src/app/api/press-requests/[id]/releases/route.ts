import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getAccessibleRequest } from "@/lib/access";
import { LANGUAGES } from "@/lib/enums";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const { id } = await params;
  const request = await getAccessibleRequest(user, id);
  if (!request) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const releases = await prisma.pressRelease.findMany({ where: { pressRequestId: id } });
  return NextResponse.json({ releases });
}

// Ensure a release row exists for a given language (used by "영문본 작성 시작").
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const { id } = await params;
  const request = await getAccessibleRequest(user, id);
  if (!request) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const language = LANGUAGES.includes(body.language) ? body.language : "KO";

  const release = await prisma.pressRelease.upsert({
    where: { pressRequestId_language: { pressRequestId: id, language } },
    create: { pressRequestId: id, language, createdById: user.id },
    update: {},
  });
  return NextResponse.json({ release });
}
