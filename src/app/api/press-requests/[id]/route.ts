import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isManager } from "@/lib/session";
import { getAccessibleRequest } from "@/lib/access";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

// PATCH: update editable request fields (e.g. expectedPublishDate by manager).
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
  const data: Record<string, unknown> = {};

  // expectedPublishDate is manager-only.
  if ("expectedPublishDate" in body && isManager(user)) {
    data.expectedPublishDate = body.expectedPublishDate ? new Date(body.expectedPublishDate) : null;
  }
  if ("note" in body) data.note = body.note;
  if ("isUrgent" in body) data.isUrgent = !!body.isUrgent;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "변경할 값이 없습니다." }, { status: 400 });
  }

  const updated = await prisma.pressRequest.update({ where: { id }, data });
  await audit({
    userId: user.id,
    pressRequestId: id,
    action: "REQUEST_UPDATED",
    afterValue: JSON.stringify(data),
  });

  // Notify applicant when a publish date is announced.
  if ("expectedPublishDate" in data && data.expectedPublishDate) {
    const d = new Date(data.expectedPublishDate as Date);
    await notify({
      userId: request.applicantId,
      pressRequestId: id,
      type: "PUBLISH_DATE_ANNOUNCED",
      title: "예상 배포일 안내",
      message: `신청하신 "${request.title}" 보도자료의 예상 배포일은 ${d.toLocaleDateString("ko-KR")}입니다. 일정 변경 시 다시 안내드리겠습니다.`,
    });
  }

  return NextResponse.json({ ok: true, request: updated });
}
