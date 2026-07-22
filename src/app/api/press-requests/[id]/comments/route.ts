import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isManager } from "@/lib/session";
import { getAccessibleRequest } from "@/lib/access";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const { id } = await params;
  const request = await getAccessibleRequest(user, id);
  if (!request) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const comments = await prisma.comment.findMany({
    where: { pressRequestId: id },
    include: { author: { select: { name: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ comments });
}

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
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text) return NextResponse.json({ error: "내용을 입력하세요." }, { status: 400 });

  const comment = await prisma.comment.create({
    data: { pressRequestId: id, authorId: user.id, body: text },
    include: { author: { select: { name: true, role: true } } },
  });
  await audit({ userId: user.id, pressRequestId: id, action: "COMMENT_ADDED" });

  // 코멘트 알림: 작성자가 담당자면 신청자에게, 신청자면 담당자 전원에게.
  const preview = text.length > 40 ? text.slice(0, 40) + "…" : text;
  const recipientIds: string[] = [];
  if (isManager(user)) {
    if (request.applicantId !== user.id) recipientIds.push(request.applicantId);
  } else {
    const managers = await prisma.user.findMany({
      where: { role: { in: ["PR_MANAGER", "ADMIN"] } },
      select: { id: true },
    });
    recipientIds.push(...managers.map((m) => m.id));
  }
  await Promise.all(
    recipientIds
      .filter((rid) => rid !== user.id)
      .map((rid) =>
        notify({
          userId: rid,
          pressRequestId: id,
          type: "COMMENT_ADDED",
          title: "새 코멘트",
          message: `${user.name}님이 "${request.title}"에 코멘트를 남겼습니다: ${preview}`,
        }),
      ),
  );

  return NextResponse.json({ comment });
}
