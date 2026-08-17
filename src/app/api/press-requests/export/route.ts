import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isManager } from "@/lib/session";
import { REQUEST_TYPE_LABELS, PHASE_TO_STATUSES, type RequestType, type StatusPhase } from "@/lib/enums";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fmtDate(d: Date | null): string {
  if (!d) return "";
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

// 신청 관리 목록을 엑셀로 내려받기.
// 컬럼: 신청일 / 신청자 소속 학과 / 이름 / 홍보 유형 / 예상 배포일
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (!isManager(user)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const where: Record<string, unknown> = {};
  if (searchParams.get("type")) where.type = searchParams.get("type");
  const phase = searchParams.get("phase");
  if (phase && PHASE_TO_STATUSES[phase as StatusPhase]) {
    where.status = { in: PHASE_TO_STATUSES[phase as StatusPhase] };
  } else if (searchParams.get("status")) {
    where.status = searchParams.get("status");
  }
  if (searchParams.get("department")) where.department = searchParams.get("department");
  if (searchParams.get("applicant")) where.applicantId = searchParams.get("applicant");
  if (searchParams.get("q")) where.title = { contains: searchParams.get("q") };

  const requests = await prisma.pressRequest.findMany({
    where,
    include: { applicant: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const rows = requests.map((r) => ({
    "신청일": fmtDate(r.createdAt),
    "신청자 소속 학과": r.department ?? "",
    "이름": r.applicant?.name ?? "",
    "홍보 유형": REQUEST_TYPE_LABELS[r.type as RequestType] ?? r.type,
    "예상 배포일": fmtDate(r.expectedPublishDate),
  }));

  const ws = XLSX.utils.json_to_sheet(rows, {
    header: ["신청일", "신청자 소속 학과", "이름", "홍보 유형", "예상 배포일"],
  });
  ws["!cols"] = [{ wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 14 }, { wch: 12 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "신청 관리");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  const today = fmtDate(new Date());
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="press-requests-${today}.xlsx"`,
    },
  });
}
