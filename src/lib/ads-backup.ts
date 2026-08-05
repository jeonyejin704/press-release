import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

// 광고비 데이터를 서버 로컬 JSON 파일에 자동 백업한다.
// 추가/삭제 시마다 스냅샷을 병합 저장해, 실수로 지워도 '복구'로 되돌릴 수 있다.
const FILE = path.join(process.cwd(), ".pressflow-ads-backup.json");

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function readAdsBackup(): Promise<any[]> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// 현재 DB의 광고비 전체를 기존 백업과 '병합'해서 저장(과거 항목이 사라지지 않도록).
export async function snapshotAds(): Promise<void> {
  try {
    const ads = await prisma.adSpend.findMany();
    const prev = await readAdsBackup();
    const map = new Map<string, any>();
    for (const a of prev) map.set(a.id, a);
    for (const a of ads) map.set(a.id, a);
    await fs.writeFile(FILE, JSON.stringify(Array.from(map.values()), null, 2), "utf8");
  } catch {
    // 백업 실패는 본 작업을 막지 않는다
  }
}

// 백업에 있으나 현재 DB에 없는 항목 수(복구 가능 건수)
export async function restorableCount(): Promise<number> {
  const backup = await readAdsBackup();
  if (backup.length === 0) return 0;
  const existing = new Set((await prisma.adSpend.findMany({ select: { id: true } })).map((a) => a.id));
  return backup.filter((a) => a.id && !existing.has(a.id)).length;
}

// 백업에서 누락된 항목을 DB에 복구
export async function restoreAdsFromBackup(): Promise<number> {
  const backup = await readAdsBackup();
  if (backup.length === 0) return 0;
  const existing = new Set((await prisma.adSpend.findMany({ select: { id: true } })).map((a) => a.id));
  let restored = 0;
  for (const a of backup) {
    if (!a.id || existing.has(a.id)) continue;
    try {
      await prisma.adSpend.create({
        data: {
          id: a.id,
          title: a.title,
          medium: a.medium,
          amount: Math.round(Number(a.amount)) || 0,
          executedAt: new Date(a.executedAt),
          department: a.department ?? null,
          note: a.note ?? null,
          ...(a.createdAt ? { createdAt: new Date(a.createdAt) } : {}),
        },
      });
      restored++;
    } catch {
      // 개별 실패는 건너뜀
    }
  }
  return restored;
}
