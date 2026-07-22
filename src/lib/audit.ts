import { prisma } from "@/lib/prisma";

// Records a change to the AuditLog. Best-effort: never throws to the caller.
export async function audit(params: {
  userId?: string | null;
  pressRequestId?: string | null;
  action: string;
  beforeValue?: string | null;
  afterValue?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? undefined,
        pressRequestId: params.pressRequestId ?? undefined,
        action: params.action,
        beforeValue: params.beforeValue ?? undefined,
        afterValue: params.afterValue ?? undefined,
      },
    });
  } catch (e) {
    console.warn("[audit] failed to write audit log:", e);
  }
}
