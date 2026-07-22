import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { login } from "@/lib/session";

// Demo login: email only, no password. Replace with real auth in production.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) {
    return NextResponse.json({ error: "이메일을 입력하세요." }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(
      { error: "등록되지 않은 이메일입니다. 시드 계정을 사용하세요." },
      { status: 401 },
    );
  }
  await login(user.id);
  return NextResponse.json({ id: user.id, name: user.name, role: user.role });
}
