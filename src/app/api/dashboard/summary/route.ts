import { NextResponse } from "next/server";
import { getCurrentUser, isManager } from "@/lib/session";
import { getDashboardData } from "@/lib/dashboard";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isManager(user)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const data = await getDashboardData();
  return NextResponse.json(data);
}
