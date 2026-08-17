import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { login } from "@/lib/session";

// 데모 로그인: '신청'(APPLICANT) / '관리'(PR_MANAGER) 역할 버튼 기반.
// (email 로도 로그인 가능 — 기존 호환)
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const role = typeof body.role === "string" ? body.role : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  // 역할 기반 로그인
  if (role === "APPLICANT" || role === "PR_MANAGER") {
    let user;
    if (role === "PR_MANAGER") {
      user =
        (await prisma.user.findUnique({ where: { email: "pr.manager@postech.ac.kr" } })) ??
        (await prisma.user.findFirst({ where: { role: { in: ["PR_MANAGER", "ADMIN"] } } }));
      if (!user) {
        user = await prisma.user.create({
          data: { email: "pr.manager@postech.ac.kr", name: "대외협력팀", department: "대외협력팀", role: "PR_MANAGER" },
        });
      }
    } else {
      // 신청자: 공용 접수 계정(실제 신청자 정보는 신청 폼에서 입력)
      user = await prisma.user.upsert({
        where: { email: "guest.applicant@postech.ac.kr" },
        create: { email: "guest.applicant@postech.ac.kr", name: "신청자", role: "APPLICANT" },
        update: {},
      });
    }
    await login(user.id, user.role);
    return NextResponse.json({ id: user.id, name: user.name, role: user.role });
  }

  // 이메일 기반 로그인(호환)
  if (!email) {
    return NextResponse.json({ error: "역할을 선택하세요." }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "등록되지 않은 이메일입니다." }, { status: 401 });
  }
  await login(user.id, user.role);
  return NextResponse.json({ id: user.id, name: user.name, role: user.role });
}
