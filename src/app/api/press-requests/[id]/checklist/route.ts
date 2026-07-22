import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isManager } from "@/lib/session";

// PATCH { key, checked } — toggle a checklist item. Manager only.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (!isManager(user)) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const key = String(body.key ?? "");
  const checked = !!body.checked;
  if (!key) return NextResponse.json({ error: "key가 필요합니다." }, { status: 400 });

  await prisma.checklistItem.update({
    where: { pressRequestId_key: { pressRequestId: id, key } },
    data: { checked },
  });
  return NextResponse.json({ ok: true });
}
