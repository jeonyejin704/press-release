import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isManager } from "@/lib/session";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

// POST: mark a release as final. For KO this confirms the Korean final;
// advances the request status accordingly. Manager only.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (!isManager(user)) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const { id } = await params;
  const release = await prisma.pressRelease.findUnique({
    where: { id },
    include: { pressRequest: true },
  });
  if (!release) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  await prisma.pressRelease.update({ where: { id }, data: { isFinal: true } });

  const newStatus = release.language === "KO" ? "KOREAN_FINAL_CONFIRMED" : "FINAL_COMPLETED";
  await prisma.pressRequest.update({
    where: { id: release.pressRequestId },
    data: {
      status: newStatus,
      ...(newStatus === "FINAL_COMPLETED" ? { completedAt: new Date() } : {}),
    },
  });

  await audit({
    userId: user.id,
    pressRequestId: release.pressRequestId,
    action: "RELEASE_FINALIZED",
    afterValue: `${release.language} final`,
  });

  await notify({
    userId: release.pressRequest.applicantId,
    pressRequestId: release.pressRequestId,
    type: release.language === "KO" ? "KOREAN_FINAL_CONFIRMED" : "FINAL_COMPLETED",
    title: release.language === "KO" ? "국문 최종본 확정" : "최종 완료",
    message:
      release.language === "KO"
        ? "국문 보도자료 최종본이 확정되었습니다."
        : "보도자료가 최종 완료되었습니다.",
  });

  return NextResponse.json({ ok: true, status: newStatus });
}
