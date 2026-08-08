import { notFound, redirect } from "next/navigation";
import { getCurrentUser, isManager } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { detectMissingMaterials } from "@/lib/checklist";
import { DETAIL_FORM } from "@/lib/formConfig";
import type { RequestType } from "@/lib/enums";
import { RequestDetail } from "./RequestDetail";

export const dynamic = "force-dynamic";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const request = await prisma.pressRequest.findUnique({
    where: { id },
    include: {
      applicant: { select: { name: true, email: true, department: true } },
      research: true,
      award: true,
      appointment: true,
      personalNews: true,
      event: true,
      releases: { orderBy: { language: "asc" } },
      attachments: { orderBy: { createdAt: "desc" } },
      comments: {
        include: { author: { select: { name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
      checklist: { orderBy: { id: "asc" } },
      auditLogs: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!request) notFound();
  const manager = isManager(user);
  if (!manager && request.applicantId !== user.id) notFound();

  // Build a display-friendly detail object.
  const type = request.type as RequestType;
  const relationKey: Record<RequestType, keyof typeof request> = {
    RESEARCH: "research",
    AWARD: "award",
    APPOINTMENT: "appointment",
    PERSONAL_NEWS: "personalNews",
    EVENT: "event",
    OTHER: "research",
  };
  const detailRow = (request as Record<string, unknown>)[relationKey[type]] as
    | Record<string, unknown>
    | null;

  const detailFields = (DETAIL_FORM[type] ?? []).map((f) => ({
    label: f.label,
    value: detailRow ? formatValue(detailRow[f.name]) : "",
  }));

  const presentAttachmentTypes = request.attachments.map((a) => a.fileType);
  const missing = manager ? detectMissingMaterials(type, presentAttachmentTypes) : [];

  return (
    <RequestDetail
      isManager={manager}
      currentUserId={user.id}
      data={JSON.parse(JSON.stringify({
        id: request.id,
        type: request.type,
        status: request.status,
        title: request.title,
        department: request.department,
        contactPhone: request.contactPhone,
        isUrgent: request.isUrgent,
        publicDisclosureAllowed: request.publicDisclosureAllowed,
        note: request.note,
        desiredPublishDate: request.desiredPublishDate,
        expectedPublishDate: request.expectedPublishDate,
        submittedAt: request.submittedAt,
        createdAt: request.createdAt,
        applicant: request.applicant,
        releases: request.releases,
        attachments: request.attachments,
        comments: request.comments,
        checklist: request.checklist,
        auditLogs: request.auditLogs,
        detailFields,
        missing,
      }))}
    />
  );
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return new Date(v).toLocaleDateString("ko-KR");
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
    return new Date(v).toLocaleDateString("ko-KR");
  }
  return String(v);
}
