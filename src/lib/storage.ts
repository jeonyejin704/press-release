// File storage adapter.
//
// PressFlow stores uploaded files as data URLs in the database (the
// `Attachment.fileUrl` column). This keeps uploads working identically in
// every environment — local, GitHub Codespaces, and serverless hosts like
// Vercel — without a separate object-storage service or a writable disk.
//
// Trade-off: files live in the DB as base64, so we cap uploads at 4 MB (also
// under Vercel's serverless request-body limit). For large-scale production,
// swap this adapter for S3 / Vercel Blob / Azure Blob — the rest of the app
// only depends on `saveFile()` returning a usable `fileUrl`.

import path from "path";

export async function saveFile(file: File): Promise<{
  fileUrl: string;
  fileName: string;
  mimeType: string;
  size: number;
}> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";
  const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
  return {
    fileUrl: dataUrl,
    fileName: file.name,
    mimeType,
    size: buffer.length,
  };
}

// Upload constraints.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4 MB (serverless-safe)
export const ALLOWED_EXTENSIONS = [
  ".jpg", ".jpeg", ".png", ".gif", ".webp",
  ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".hwp", ".hwpx",
  ".zip", ".txt",
];

export function isAllowedFile(name: string, size: number): string | null {
  const ext = path.extname(name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) return "허용되지 않는 파일 형식입니다.";
  if (size > MAX_UPLOAD_BYTES) return "파일 크기가 4MB를 초과합니다.";
  return null;
}
