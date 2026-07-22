import type { AIProvider, GeneratedPressRelease } from "./types";
import { parseDraftMarkdown } from "./parse";

// Deterministic offline generator. It reformats the supplied research
// information into a plausible press-release skeleton. No network access.
// This lets the whole flow work end-to-end without any API key.
export class MockAIProvider implements AIProvider {
  readonly name = "mock";

  async generateResearchDraft(
    _systemPrompt: string,
    userPrompt: string,
  ): Promise<GeneratedPressRelease> {
    const fields = extractFields(userPrompt);
    const title =
      fields["논문명 국문"] && fields["논문명 국문"] !== "(정보 없음)"
        ? `${fields["소속 학과"] ?? "POSTECH"} 연구팀, ${trimTitle(fields["논문명 국문"])}`
        : "POSTECH 연구팀, 새로운 연구성과 발표";

    const journal = valueOr(fields["게재 저널명"], "국제 학술지");
    const corresponding = valueOr(fields["교신저자"], "연구책임자");
    const abstract = valueOr(fields["논문 초록"], "");
    const background = valueOr(fields["연구 배경"], "");
    const content = valueOr(fields["연구 내용"], "");
    const impact = valueOr(fields["기대효과"], "");

    const md = `# ${title}

## 부제목
${journal} 게재… ${valueOr(fields["연구 내용"], "연구 성과의 학문적·사회적 의미 조명")}

## 본문
POSTECH(포항공과대학교) ${valueOr(fields["소속 학과"], "연구팀")} ${corresponding} 교수 연구팀은 ${journal}에 관련 연구 결과를 발표했다고 밝혔다.

${background ? `【연구 배경】\n${background}\n` : ""}
${content ? `【연구 내용】\n${content}\n` : ""}
${abstract ? `연구팀은 다음과 같은 내용을 확인했다. ${abstract}\n` : ""}
${impact ? `【기대효과】\n${impact}\n` : ""}
연구팀은 "이번 연구가 관련 분야의 이해를 넓히는 데 기여할 것으로 기대한다"고 설명했다.

## 핵심 요약
- 게재 저널: ${journal}
- 교신저자: ${corresponding}
- DOI: ${valueOr(fields["DOI"], "추후 확인")}

## 쉬운 설명
이번 연구는 어려운 과학 내용을 다루지만, 쉽게 말하면 ${valueOr(fields["연구 내용"], "새로운 사실을 밝혀낸 연구")}입니다. 앞으로 다양한 분야에서 활용될 수 있습니다.

## 이미지 캡션 초안
[사진] ${corresponding} 교수 연구팀. (제공: POSTECH)

> ⚠️ 이 초안은 오프라인 Mock AI가 생성했습니다. 실제 AI(Anthropic/OpenAI) 연동 시 AI_PROVIDER 환경변수를 변경하세요.`;

    return parseDraftMarkdown(md);
  }
}

function extractFields(prompt: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of prompt.split(/\r?\n/)) {
    const m = line.match(/^-\s*([^:]+):\s*(.*)$/);
    if (m) out[m[1].trim()] = m[2].trim();
  }
  return out;
}

function valueOr(v: string | undefined, fallback: string): string {
  if (!v || v === "(정보 없음)") return fallback;
  return v;
}

function trimTitle(t: string): string {
  return t.length > 40 ? t.slice(0, 40) + "…" : t;
}
