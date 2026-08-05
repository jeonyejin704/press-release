import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isManager } from "@/lib/session";
import { audit } from "@/lib/audit";
import { snapshotAds } from "@/lib/ads-backup";

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

  // 집행월(YYYY-MM) → 해당 월 1일
  let executedAt: Date | null = null;
  const monthStr = String(body.month ?? body.executedAt ?? "");
  const m = monthStr.match(/(\d{4})-(\d{1,2})/);
  if (m) executedAt = new Date(parseInt(m[1]), parseInt(m[2]) - 1, 1);

  if (!title || !medium || !amount || amount <= 0 || !executedAt || isNaN(executedAt.getTime())) {
    return NextResponse.json({ error: "집행 건명·매체·집행액·집행월을 확인해 주세요." }, { status: 400 });
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
  await snapshotAds(); // 추가할 때마다 백업 갱신
  return NextResponse.json({ ad });
}

// 개별 삭제(?id=) 또는 전체 비우기(?all=1)
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isManager(user)) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const all = searchParams.get("all");

  await snapshotAds(); // 삭제 전 반드시 백업(실수 대비 복구 가능)

  if (all === "1") {
    const { count } = await prisma.adSpend.deleteMany({});
    await audit({ userId: user.id, action: "AD_SPEND_CLEARED", afterValue: `${count}건 삭제` });
    return NextResponse.json({ deleted: count });
  }

  if (!id) return NextResponse.json({ error: "삭제할 항목을 지정해 주세요." }, { status: 400 });
  await prisma.adSpend.delete({ where: { id } }).catch(() => null);
  await audit({ userId: user.id, action: "AD_SPEND_DELETED", afterValue: id });
  return NextResponse.json({ deleted: 1 });
}
