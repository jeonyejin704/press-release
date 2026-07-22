import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isManager } from "@/lib/session";
import { getAccessibleRequest } from "@/lib/access";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { isRequestStatus, type RequestStatus, type NotificationType } from "@/lib/enums";

// Which statuses notify the applicant, and with what message.
const APPLICANT_NOTIFY: Partial<Record<RequestStatus, { type: NotificationType; title: string; msg: string }>> = {
  MATERIAL_REQUESTED: { type: "MATERIAL_REQUESTED", title: "자료 보완 요청", msg: "홍보팀이 추가 자료를 요청했습니다. 상세 페이지에서 확인해 주세요." },
  APPLICANT_REVIEW: { type: "REVIEW_REQUESTED", title: "검토 요청", msg: "홍보팀이 보도자료 검토를 요청했습니다." },
  ENGLISH_REVIEW_REQUESTED: { type: "ENGLISH_REVIEW_REQUESTED", title: "영문본 검토 요청", msg: "영문 보도자료 검토를 요청했습니다." },
  KOREAN_FINAL_CONFIRMED: { type: "KOREAN_FINAL_CONFIRMED", title: "국문 최종본 확정", msg: "국문 보도자료 최종본이 확정되었습니다." },
  FINAL_COMPLETED: { type: "FINAL_COMPLETED", title: "최종 완료", msg: "보도자료가 최종 완료 처리되었습니다." },
  DISTRIBUTED: { type: "DISTRIBUTED", title: "배포 완료", msg: "보도자료가 언론에 배포되었습니다." },
};

// Statuses an applicant is allowed to set themselves.
const APPLICANT_ALLOWED: RequestStatus[] = ["SUBMITTED", "REVISION_REQUESTED"];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const { id } = await params;
  const request = await getAccessibleRequest(user, id);
  if (!request) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const status = body.status as string;
  if (!isRequestStatus(status)) {
    return NextResponse.json({ error: "유효하지 않은 상태값입니다." }, { status: 400 });
  }
  if (!isManager(user) && !APPLICANT_ALLOWED.includes(status)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const before = request.status;
  const extra: Record<string, unknown> = {};
  if (status === "SUBMITTED" && !request.submittedAt) extra.submittedAt = new Date();
  if (status === "FINAL_COMPLETED") extra.completedAt = new Date();
  if (status === "DISTRIBUTED") extra.distributedAt = new Date();

  await prisma.pressRequest.update({ where: { id }, data: { status, ...extra } });
  await audit({
    userId: user.id,
    pressRequestId: id,
    action: "STATUS_CHANGED",
    beforeValue: before,
    afterValue: status,
  });

  // Notify the applicant of relevant transitions.
  const rule = APPLICANT_NOTIFY[status as RequestStatus];
  if (rule && isManager(user)) {
    await notify({
      userId: request.applicantId,
      pressRequestId: id,
      type: rule.type,
      title: rule.title,
      message: rule.msg,
    });
  }
  // Notify managers when applicant submits or requests revision.
  if (!isManager(user)) {
    const managers = await prisma.user.findMany({
      where: { role: { in: ["PR_MANAGER", "ADMIN"] } },
      select: { id: true },
    });
    await Promise.all(
      managers.map((m) =>
        notify({
          userId: m.id,
          pressRequestId: id,
          type: status === "SUBMITTED" ? "SUBMITTED" : "REVISION_REQUESTED",
          title: status === "SUBMITTED" ? "신청 제출" : "수정 요청",
          message: `${user.name}님이 "${request.title}" 건을 업데이트했습니다.`,
        }),
      ),
    );
  }

  return NextResponse.json({ ok: true, status });
}
