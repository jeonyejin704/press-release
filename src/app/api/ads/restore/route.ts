import { NextResponse } from "next/server";
import { getCurrentUser, isManager } from "@/lib/session";
import { restoreAdsFromBackup } from "@/lib/ads-backup";
import { audit } from "@/lib/audit";

// 자동 백업에서 광고비 내역 복구
export async function POST() {
  const user = await getCurrentUser();
  if (!user || !isManager(user)) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  const restored = await restoreAdsFromBackup();
  await audit({ userId: user.id, action: "AD_SPEND_RESTORED", afterValue: `${restored}건 복구` });
  return NextResponse.json({ restored });
}
