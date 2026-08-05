import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isManager } from "@/lib/session";
import { audit } from "@/lib/audit";
import { snapshotAds } from "@/lib/ads-backup";

export const runtime = "nodejs";

function norm(v: unknown): string {
  return v === undefined || v === null ? "" : String(v).trim();
}

// "2026-03", "2026.03", "2026/3", "2026년 3월", Excel date → 해당 월 1일
function parseMonth(v: unknown): Date | null {
  if (v === undefined || v === null || v === "") return null;
  if (v instanceof Date && !isNaN(v.getTime())) return new Date(v.getFullYear(), v.getMonth(), 1);
  const s = norm(v);
  const m = s.match(/(\d{4})\s*[-./년]\s*(\d{1,2})/);
  if (m) {
    const y = parseInt(m[1]);
    const mo = parseInt(m[2]);
    if (mo >= 1 && mo <= 12) return new Date(y, mo - 1, 1);
  }
  return null;
}

function parseAmount(v: unknown): number {
  const n = Number(norm(v).replace(/[,\s원]/g, ""));
  return isNaN(n) ? 0 : Math.round(n);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isManager(user)) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "엑셀/CSV 파일이 필요합니다." }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") === "commit" ? "commit" : "preview";

  let rows: Record<string, unknown>[];
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { cellDates: true });
    const sheet = wb.Sheets["광고비내역"] ?? wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  } catch {
    return NextResponse.json({ error: "파일을 읽을 수 없습니다. 양식(xlsx/csv)을 확인해 주세요." }, { status: 400 });
  }

  // 1) 파싱 + 검증 (DB에 쓰지 않음)
  const valid: { title: string; medium: string; amount: number; executedAt: Date }[] = [];
  const errors: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const line = i + 2;
    const title = norm(r["집행 건명"] ?? r["집행건명"] ?? r["건명"]);
    const medium = norm(r["매체"]);
    const amount = parseAmount(r["집행액(원)"] ?? r["집행액"] ?? r["금액"]);
    const executedAt = parseMonth(r["집행월"] ?? r["월"]);

    if (!title && !medium && !amount && !executedAt) continue;

    const problems: string[] = [];
    if (!title) problems.push("집행 건명");
    if (!medium) problems.push("매체");
    if (!amount || amount <= 0) problems.push("집행액");
    if (!executedAt) problems.push("집행월");
    if (problems.length) {
      errors.push(`${line}행: ${problems.join(", ")} 확인 필요`);
      continue;
    }
    valid.push({ title, medium, amount, executedAt: executedAt! });
  }

  // 2) 미리보기 모드: 저장하지 않고 결과만 반환
  if (mode === "preview") {
    const ym = (d: Date) => `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
    return NextResponse.json({
      mode: "preview",
      willImport: valid.length,
      skipped: errors.length,
      errors: errors.slice(0, 30),
      sample: valid.slice(0, 5).map((v) => ({ title: v.title, medium: v.medium, amount: v.amount, month: ym(v.executedAt) })),
    });
  }

  // 3) 저장 모드: 기존 내역은 그대로 두고 '추가'만 한다(삭제 없음)
  let imported = 0;
  for (const v of valid) {
    try {
      await prisma.adSpend.create({
        data: { title: v.title, medium: v.medium, amount: v.amount, executedAt: v.executedAt, department: "대외협력팀" },
      });
      imported++;
    } catch (e) {
      errors.push(`저장 실패: ${v.title} (${(e as Error).message.slice(0, 40)})`);
    }
  }

  await audit({ userId: user.id, action: "AD_SPEND_IMPORT", afterValue: `imported=${imported}` });
  await snapshotAds(); // 추가 후 자동 백업
  return NextResponse.json({ mode: "commit", imported, skipped: errors.length, errors: errors.slice(0, 30) });
}
