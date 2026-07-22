import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getAccessibleRequest } from "@/lib/access";
import { saveFile, isAllowedFile } from "@/lib/storage";
import { audit } from "@/lib/audit";
import { ATTACHMENT_TYPES } from "@/lib/enums";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const { id } = await params;
  const request = await getAccessibleRequest(user, id);
  if (!request) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const attachments = await prisma.attachment.findMany({
    where: { pressRequestId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ attachments });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const { id } = await params;
  const request = await getAccessibleRequest(user, id);
  if (!request) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file");
  const fileType = String(formData.get("fileType") ?? "OTHER");
  const description = formData.get("description") ? String(formData.get("description")) : null;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "파일이 필요합니다." }, { status: 400 });
  }
  const err = isAllowedFile(file.name, file.size);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const saved = await saveFile(file);
  const attachment = await prisma.attachment.create({
    data: {
      pressRequestId: id,
      fileName: saved.fileName,
      fileUrl: saved.fileUrl,
      fileType: ATTACHMENT_TYPES.includes(fileType as never) ? fileType : "OTHER",
      mimeType: saved.mimeType,
      size: saved.size,
      description,
      uploadedById: user.id,
    },
  });
  await audit({ userId: user.id, pressRequestId: id, action: "ATTACHMENT_ADDED", afterValue: saved.fileName });
  return NextResponse.json({ attachment });
}
