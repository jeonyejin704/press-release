import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isManager } from "@/lib/session";
import { audit } from "@/lib/audit";

// 모든 홍보 신청(및 관련 상세/첨부/알림 등)을 삭제한다.
// 시연용 더미 데이터를 비우고 실제 업로드 데이터로 시작하기 위한 초기화.
// (사용자/광고비/뉴스/키워드는 유지)
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user || !isManager(user)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const count = await prisma.pressRequest.count();

  // 자식 레코드부터 순서대로 삭제(FK 제약 회피)
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.checklistItem.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.pressReleaseVersion.deleteMany({});
  await prisma.pressRelease.deleteMany({});
  await prisma.researchDetail.deleteMany({});
  await prisma.awardDetail.deleteMany({});
  await prisma.appointmentDetail.deleteMany({});
  await prisma.personalNewsDetail.deleteMany({});
  await prisma.eventDetail.deleteMany({});
  await prisma.pressRequest.deleteMany({});

  await audit({ userId: user.id, action: "REQUESTS_CLEARED", afterValue: `${count}건 삭제` });
  return NextResponse.json({ deleted: count });
}
