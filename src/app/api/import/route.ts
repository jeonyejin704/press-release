import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isManager } from "@/lib/session";
import { audit } from "@/lib/audit";
import {
  REQUEST_TYPE_LABELS,
  REQUEST_STATUS_LABELS,
  REQUEST_TYPES,
  REQUEST_STATUSES,
  type RequestType,
  type RequestStatus,
} from "@/lib/enums";

export const runtime = "nodejs";

// label -> enum reverse maps (also accept the raw enum code)
const TYPE_BY_LABEL: Record<string, RequestType> = {};
for (const t of REQUEST_TYPES) {
  TYPE_BY_LABEL[REQUEST_TYPE_LABELS[t]] = t;
  TYPE_BY_LABEL[t] = t;
}
const STATUS_BY_LABEL: Record<string, RequestStatus> = {};
for (const s of REQUEST_STATUSES) {
  STATUS_BY_LABEL[REQUEST_STATUS_LABELS[s]] = s;
  STATUS_BY_LABEL[s] = s;
}

function norm(v: unknown): string {
  return v === undefined || v === null ? "" : String(v).trim();
}

function parseDate(v: unknown): Date | null {
  if (v === undefined || v === null || v === "") return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === "number") {
    // Excel serial date
    const d = XLSX.SSF ? XLSX.SSF.parse_date_code(v) : null;
    if (d) return new Date(Date.UTC(d.y, d.m - 1, d.d));
  }
  const s = norm(v).replace(/[./]/g, "-");
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function truthy(v: unknown): boolean {
  const s = norm(v).toLowerCase();
  return ["y", "yes", "예", "true", "1", "긴급", "o"].includes(s);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isManager(user)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "엑셀/CSV 파일이 필요합니다." }, { status: 400 });
  }

  let rows: Record<string, unknown>[];
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { cellDates: true });
    const sheet =
      wb.Sheets["신청내역"] ?? wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  } catch {
    return NextResponse.json({ error: "파일을 읽을 수 없습니다. 양식(xlsx/csv)을 확인해 주세요." }, { status: 400 });
  }

  const userCache = new Map<string, string>();
  async function resolveApplicant(name: string, email: string, department: string) {
    const key = (email || name).toLowerCase();
    if (userCache.has(key)) return userCache.get(key)!;
    const finalEmail = email || `${name || "unknown"}@imported.local`;
    const u = await prisma.user.upsert({
      where: { email: finalEmail },
      create: { email: finalEmail, name: name || "미상", department: department || null, role: "APPLICANT" },
      update: {},
    });
    userCache.set(key, u.id);
    return u.id;
  }

  let imported = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const line = i + 2; // header is row 1
    const typeRaw = norm(r["유형"]);
    const title = norm(r["제목"]);
    const dept = norm(r["학과"] ?? r["소속"]);
    const createdAt = parseDate(r["신청일"]);
    const statusRaw = norm(r["상태"]);

    // skip fully-empty rows silently
    if (!typeRaw && !title && !dept && !statusRaw) continue;

    const type = TYPE_BY_LABEL[typeRaw];
    const status = STATUS_BY_LABEL[statusRaw];
    const problems: string[] = [];
    if (!type) problems.push(`유형('${typeRaw}')`);
    if (!title) problems.push("제목");
    if (!dept) problems.push("학과");
    if (!createdAt) problems.push("신청일");
    if (!status) problems.push(`상태('${statusRaw}')`);
    if (problems.length) {
      errors.push(`${line}행: ${problems.join(", ")} 확인 필요`);
      continue;
    }

    try {
      const applicantId = await resolveApplicant(norm(r["신청자이름"] ?? r["신청자"]), norm(r["신청자이메일"] ?? r["이메일"]), dept);
      const journal = norm(r["게재저널"] ?? r["저널"]);
      await prisma.pressRequest.create({
        data: {
          type,
          status,
          title,
          department: dept,
          applicantId,
          isUrgent: truthy(r["긴급"]),
          createdAt: createdAt!,
          updatedAt: createdAt!,
          submittedAt: status === "DRAFT" ? null : createdAt,
          completedAt: status === "FINAL_COMPLETED" ? createdAt : null,
          distributedAt: status === "DISTRIBUTED" ? createdAt : null,
          expectedPublishDate: parseDate(r["예상배포일"]),
          ...(type === "RESEARCH" && journal
            ? { research: { create: { journalName: journal } } }
            : {}),
        },
      });
      imported++;
    } catch (e) {
      errors.push(`${line}행: 등록 실패 (${(e as Error).message.slice(0, 60)})`);
    }
  }

  await audit({ userId: user.id, action: "BULK_IMPORT", afterValue: `imported=${imported}` });
  return NextResponse.json({ imported, skipped: errors.length, errors: errors.slice(0, 30) });
}
