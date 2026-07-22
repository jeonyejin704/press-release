import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getAIProvider } from "@/lib/ai";
import { buildResearchPrompt, RESEARCH_SYSTEM_PROMPT } from "@/lib/prompt";
import { audit } from "@/lib/audit";

// POST { pressRequestId } -> generates a KO draft from the research detail and
// stores it as the request's Korean PressRelease.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const pressRequestId = body.pressRequestId as string | undefined;
  if (!pressRequestId) {
    return NextResponse.json({ error: "pressRequestId가 필요합니다." }, { status: 400 });
  }

  const request = await prisma.pressRequest.findUnique({
    where: { id: pressRequestId },
    include: { research: true },
  });
  if (!request) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (request.type !== "RESEARCH" || !request.research) {
    return NextResponse.json(
      { error: "AI 초안 생성은 연구성과 유형에서만 지원됩니다." },
      { status: 400 },
    );
  }

  const r = request.research;
  const prompt = buildResearchPrompt({
    paperTitleKo: r.paperTitleKo,
    paperTitleEn: r.paperTitleEn,
    correspondingAuthor: r.correspondingAuthorName,
    firstAuthor: r.firstAuthorName,
    department: r.correspondingAuthorDepartment ?? request.department,
    journalName: r.journalName,
    publishedDate: r.publishedDate ? r.publishedDate.toISOString().slice(0, 10) : null,
    partnerInstitutions: r.partnerInstitutions,
    doi: r.doi,
    fundingInfo: r.fundingInfo,
    abstract: r.abstract,
    researchBackground: r.researchBackground,
    researchContent: r.researchContent,
    expectedImpact: r.expectedImpact,
    additionalNotes: r.additionalNotes,
  });

  const provider = getAIProvider();
  let draft;
  try {
    draft = await provider.generateResearchDraft(RESEARCH_SYSTEM_PROMPT, prompt);
  } catch (e) {
    return NextResponse.json(
      { error: `AI 생성 실패: ${(e as Error).message}` },
      { status: 502 },
    );
  }

  const release = await prisma.pressRelease.upsert({
    where: { pressRequestId_language: { pressRequestId, language: "KO" } },
    create: {
      pressRequestId,
      language: "KO",
      title: draft.title,
      subtitle: draft.subtitle,
      body: draft.body,
      summary: draft.summary,
      easyExplanation: draft.easyExplanation,
      imageCaption: draft.imageCaption,
      createdById: user.id,
    },
    update: {
      title: draft.title,
      subtitle: draft.subtitle,
      body: draft.body,
      summary: draft.summary,
      easyExplanation: draft.easyExplanation,
      imageCaption: draft.imageCaption,
    },
  });

  await audit({
    userId: user.id,
    pressRequestId,
    action: "AI_DRAFT_GENERATED",
    afterValue: `provider=${provider.name}`,
  });

  return NextResponse.json({ releaseId: release.id, provider: provider.name });
}
