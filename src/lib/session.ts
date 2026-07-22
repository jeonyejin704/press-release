import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/enums";

// ---------------------------------------------------------------------------
// Demo session handling.
//
// The MVP uses a simple signed-ish cookie that stores the user id. This is a
// deliberately lightweight auth layer so the app runs with zero external
// dependencies. For production, replace this module with a real auth provider
// (NextAuth / Microsoft Entra ID / university SSO) — the rest of the app only
// depends on `getCurrentUser()` / `requireUser()`.
// ---------------------------------------------------------------------------

const COOKIE_NAME = "pf_session";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  department: string | null;
};

export async function login(userId: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function logout() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const userId = store.get(COOKIE_NAME)?.value;
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    department: user.department,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export function isManager(user: { role: Role } | null): boolean {
  return user?.role === "PR_MANAGER" || user?.role === "ADMIN";
}
