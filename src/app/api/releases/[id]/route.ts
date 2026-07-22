import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isManager } from "@/lib/session";
import { audit } from "@/lib/audit";

// PATCH: update press-release content. Snapshots the *previous* content into
// PressReleaseVersion before applying the change, then bumps the version.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const { id } = await params;

  const release = await prisma.pressRelease.findUnique({
    where: { id },
    include: { pressRequest: true },
  });
  if (!release) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (!isManager(user) && release.pressRequest.applicantId !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const changeComment = typeof body.changeComment === "string" ? body.changeComment : null;

  // Snapshot current content as a version.
  await prisma.pressReleaseVersion.create({
    data: {
      pressReleaseId: release.id,
      version: release.version,
      title: release.title,
      subtitle: release.subtitle,
      body: release.body,
      changedById: user.id,
      changeComment,
    },
  });

  const updated = await prisma.pressRelease.update({
    where: { id },
    data: {
      title: body.title ?? release.title,
      subtitle: body.subtitle ?? release.subtitle,
      body: body.body ?? release.body,
      summary: body.summary ?? release.summary,
      easyExplanation: body.easyExplanation ?? release.easyExplanation,
      imageCaption: body.imageCaption ?? release.imageCaption,
      version: release.version + 1,
    },
  });

  await audit({
    userId: user.id,
    pressRequestId: release.pressRequestId,
    action: "RELEASE_EDITED",
    afterValue: `${release.language} v${updated.version}`,
  });

  return NextResponse.json({ ok: true, version: updated.version });
}
