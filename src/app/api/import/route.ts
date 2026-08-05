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

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") === "commit" ? "commit" : "preview";

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

  // 1) 파싱 + 검증 (DB에 쓰지 않음)
  type ValidRow = {
    type: RequestType; status: RequestStatus; title: string; dept: string;
    applicantName: string; applicantEmail: string; journal: string;
    isUrgent: boolean; createdAt: Date; expectedPublishDate: Date | null;
  };
  const valid: ValidRow[] = [];
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

    valid.push({
      type, status, title, dept,
      applicantName: norm(r["신청자이름"] ?? r["신청자"]),
      applicantEmail: norm(r["신청자이메일"] ?? r["이메일"]),
      journal: norm(r["게재저널"] ?? r["저널"]),
      isUrgent: truthy(r["긴급"]),
      createdAt: createdAt!,
      expectedPublishDate: parseDate(r["예상배포일"]),
    });
  }

  // 2) 미리보기 모드: 저장하지 않고 결과만 반환
  if (mode === "preview") {
    return NextResponse.json({
      mode: "preview",
      willImport: valid.length,
      skipped: errors.length,
      errors: errors.slice(0, 30),
      sample: valid.slice(0, 5).map((v) => ({
        type: REQUEST_TYPE_LABELS[v.type],
        title: v.title,
        department: v.dept,
        applicant: v.applicantName || "미상",
        status: REQUEST_STATUS_LABELS[v.status],
      })),
    });
  }

  // 3) 저장 모드: 기존 내역은 그대로 두고 '추가'만 한다(삭제 없음)
  let imported = 0;
  for (const v of valid) {
    try {
      const applicantId = await resolveApplicant(v.applicantName, v.applicantEmail, v.dept);
      await prisma.pressRequest.create({
        data: {
          type: v.type,
          status: v.status,
          title: v.title,
          department: v.dept,
          applicantId,
          isUrgent: v.isUrgent,
          createdAt: v.createdAt,
          updatedAt: v.createdAt,
          submittedAt: v.status === "DRAFT" ? null : v.createdAt,
          completedAt: v.status === "FINAL_COMPLETED" ? v.createdAt : null,
          distributedAt: v.status === "DISTRIBUTED" ? v.createdAt : null,
          expectedPublishDate: v.expectedPublishDate,
          ...(v.type === "RESEARCH" && v.journal
            ? { research: { create: { journalName: v.journal } } }
            : {}),
        },
      });
      imported++;
    } catch (e) {
      errors.push(`저장 실패: ${v.title} (${(e as Error).message.slice(0, 50)})`);
    }
  }

  await audit({ userId: user.id, action: "BULK_IMPORT", afterValue: `imported=${imported}` });
  return NextResponse.json({ mode: "commit", imported, skipped: errors.length, errors: errors.slice(0, 30) });
}
