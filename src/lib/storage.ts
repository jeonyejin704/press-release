import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

// Local-disk storage adapter (MVP). Saves under /public/uploads and returns a
// public URL. For production, replace with an S3 / Azure Blob adapter that
// implements the same `saveFile` signature and returns a signed URL.
//
// The random filename makes download URLs hard to guess (security requirement).
export async function saveFile(file: File): Promise<{
  fileUrl: string;
  fileName: string;
  mimeType: string;
  size: number;
}> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || "";
  const random = randomBytes(16).toString("hex");
  const stored = `${random}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, stored), buffer);
  return {
    fileUrl: `/uploads/${stored}`,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    size: buffer.length,
  };
}

// Basic upload constraints.
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB
export const ALLOWED_EXTENSIONS = [
  ".jpg", ".jpeg", ".png", ".gif", ".webp",
  ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".hwp", ".hwpx",
  ".zip", ".txt",
];

export function isAllowedFile(name: string, size: number): string | null {
  const ext = path.extname(name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) return "허용되지 않는 파일 형식입니다.";
  if (size > MAX_UPLOAD_BYTES) return "파일 크기가 20MB를 초과합니다.";
  return null;
}
