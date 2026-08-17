import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isManager } from "@/lib/session";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { CHECKLIST_TEMPLATES } from "@/lib/checklist";
import {
  commonRequestSchema,
  buildDetailData,
  DETAIL_RELATION,
} from "@/lib/validation";
import { REQUEST_TYPE_LABELS, type RequestType } from "@/lib/enums";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const where = isManager(user) ? {} : { applicantId: user.id };
  const requests = await prisma.pressRequest.findMany({
    where,
    include: { applicant: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ requests });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = commonRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "입력값이 올바르지 않습니다.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const input = parsed.data;
  const type = input.type as RequestType;

  // 신청자 정보(이름·이메일)로 신청자 계정을 찾거나 생성해 연결
  const email = input.applicantEmail.trim().toLowerCase();
  const applicant = await prisma.user.upsert({
    where: { email },
    create: { email, name: input.applicantName.trim(), department: input.department ?? null, role: "APPLICANT" },
    update: { name: input.applicantName.trim(), ...(input.department ? { department: input.department } : {}) },
  });

  // 제목은 신청자가 입력하지 않으므로 자동 생성
  const title = (input.title && input.title.trim()) || `[${REQUEST_TYPE_LABELS[type]}] ${input.applicantName.trim()}`;

  const detailData = buildDetailData(type, input.detail ?? {});
  const relation = DETAIL_RELATION[type];

  const created = await prisma.pressRequest.create({
    data: {
      type,
      status: input.submit ? "SUBMITTED" : "DRAFT",
      title,
      applicantId: applicant.id,
      department: input.department ?? applicant.department,
      contactPhone: input.contactPhone,
      desiredPublishDate: input.desiredPublishDate,
      isUrgent: input.isUrgent,
      publicDisclosureAllowed: input.publicDisclosureAllowed,
      note: input.note,
      submittedAt: input.submit ? new Date() : null,
      ...(relation && Object.keys(detailData).length > 0
        ? { [relation]: { create: detailData } }
        : {}),
    },
  });

  // Seed checklist
  const items = CHECKLIST_TEMPLATES[type] ?? [];
  if (items.length > 0) {
    await prisma.checklistItem.createMany({
      data: items.map((it) => ({
        pressRequestId: created.id,
        key: it.key,
        label: it.label,
      })),
    });
  }

  await audit({
    userId: applicant.id,
    pressRequestId: created.id,
    action: input.submit ? "REQUEST_SUBMITTED" : "REQUEST_CREATED",
    afterValue: created.status,
  });

  // Notify PR managers on submit
  if (input.submit) {
    const managers = await prisma.user.findMany({
      where: { role: { in: ["PR_MANAGER", "ADMIN"] } },
      select: { id: true },
    });
    await Promise.all(
      managers.map((m) =>
        notify({
          userId: m.id,
          pressRequestId: created.id,
          type: "SUBMITTED",
          title: "새 홍보 신청",
          message: `${input.applicantName}님이 "${created.title}" 홍보를 신청했습니다.`,
        }),
      ),
    );
  }

  return NextResponse.json({ id: created.id, status: created.status });
}
