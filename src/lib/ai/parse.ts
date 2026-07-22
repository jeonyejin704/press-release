import type { GeneratedPressRelease } from "./types";

// Parse the standard markdown sections our prompt asks the model to emit.
// Resilient to missing sections — every field defaults to "".
export function parseDraftMarkdown(raw: string): GeneratedPressRelease {
  const sections = splitSections(raw);
  return {
    title: sections["제목"] ?? firstHeading(raw) ?? "",
    subtitle: sections["부제목"] ?? "",
    body: sections["본문"] ?? "",
    summary: sections["핵심 요약"] ?? "",
    easyExplanation: sections["쉬운 설명"] ?? "",
    imageCaption: sections["이미지 캡션 초안"] ?? sections["이미지 캡션"] ?? "",
    raw,
  };
}

function splitSections(md: string): Record<string, string> {
  const lines = md.split(/\r?\n/);
  const out: Record<string, string> = {};
  let current: string | null = null;
  let buf: string[] = [];
  const flush = () => {
    if (current) out[current] = buf.join("\n").trim();
    buf = [];
  };
  for (const line of lines) {
    const m = line.match(/^#{1,3}\s+(.+?)\s*$/);
    if (m) {
      flush();
      current = m[1].trim();
    } else if (current) {
      buf.push(line);
    }
  }
  flush();
  return out;
}

function firstHeading(md: string): string | null {
  const m = md.match(/^#{1,3}\s+(.+)$/m);
  return m ? m[1].trim() : null;
}
