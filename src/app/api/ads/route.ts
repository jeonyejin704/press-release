import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isManager } from "@/lib/session";
import { audit } from "@/lib/audit";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isManager(user)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const ads = await prisma.adSpend.findMany({ orderBy: { executedAt: "desc" } });
  return NextResponse.json({ ads });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isManager(user)) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? "").trim();
  const medium = String(body.medium ?? "").trim();
  const amount = Math.round(Number(body.amount));
  const executedAt = body.executedAt ? new Date(body.executedAt) : null;

  if (!title || !medium || !amount || amount <= 0 || !executedAt || isNaN(executedAt.getTime())) {
    return NextResponse.json({ error: "집행 건명·매체·집행액·집행일을 확인해 주세요." }, { status: 400 });
  }

  const ad = await prisma.adSpend.create({
    data: {
      title,
      medium,
      amount,
      executedAt,
      department: body.department ? String(body.department) : null,
      note: body.note ? String(body.note) : null,
    },
  });
  await audit({ userId: user.id, action: "AD_SPEND_ADDED", afterValue: `${title} ${amount}` });
  return NextResponse.json({ ad });
}
