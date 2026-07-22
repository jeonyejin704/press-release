import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isManager } from "@/lib/session";
import { audit } from "@/lib/audit";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const { id } = await params;

  const attachment = await prisma.attachment.findUnique({
    where: { id },
    include: { pressRequest: true },
  });
  if (!attachment) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (!isManager(user) && attachment.pressRequest.applicantId !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  await prisma.attachment.delete({ where: { id } });
  await audit({
    userId: user.id,
    pressRequestId: attachment.pressRequestId,
    action: "ATTACHMENT_DELETED",
    beforeValue: attachment.fileName,
  });
  return NextResponse.json({ ok: true });
}
