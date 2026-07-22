import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/session";
import { isManager } from "@/lib/session";

// Returns the request if the user may access it, else null.
// Applicants can only access their own requests; managers/admins see all.
export async function getAccessibleRequest(user: SessionUser, id: string) {
  const request = await prisma.pressRequest.findUnique({ where: { id } });
  if (!request) return null;
  if (!isManager(user) && request.applicantId !== user.id) return null;
  return request;
}
