import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isManager } from "@/lib/session";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const { id } = await params;

  const release = await prisma.pressRelease.findUnique({
    where: { id },
    include: { pressRequest: true },
  });
  if (!release) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (!isManager(user) && release.pressRequest.applicantId !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const versions = await prisma.pressReleaseVersion.findMany({
    where: { pressReleaseId: id },
    include: { changedBy: { select: { name: true } } },
    orderBy: { version: "desc" },
  });
  return NextResponse.json({ versions });
}
