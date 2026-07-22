// AI prompt template for research press-release drafting.
// Kept as a standalone module so it can be surfaced in the admin
// "AI 프롬프트 템플릿 관리" screen and unit-tested independently.

export type ResearchPromptInput = {
  paperTitleKo?: string | null;
  paperTitleEn?: string | null;
  correspondingAuthor?: string | null;
  firstAuthor?: string | null;
  department?: string | null;
  journalName?: string | null;
  publishedDate?: string | null;
  partnerInstitutions?: string | null;
  doi?: string | null;
  fundingInfo?: string | null;
  abstract?: string | null;
  researchBackground?: string | null;
  researchContent?: string | null;
  expectedImpact?: string | null;
  additionalNotes?: string | null;
};

export const RESEARCH_SYSTEM_PROMPT = `너는 대학 홍보팀의 보도자료 전문 작성자다.
대학 공식 보도자료 문체로, 공신력 있고 차분하게 작성한다.
과장된 표현을 피하고, 제공된 정보에 없는 내용을 사실처럼 지어내지 않는다.
"세계 최초", "획기적", "혁신적" 같은 표현은 명확한 근거가 있을 때만 사용한다.`;

export function buildResearchPrompt(input: ResearchPromptInput): string {
  const v = (s?: string | null) => (s && s.trim() ? s.trim() : "(정보 없음)");
  return `아래 정보를 바탕으로 연구성과 보도자료 초안을 작성하라.

작성 기준:
1. 제목, 부제목, 본문을 작성한다.
2. 본문은 A4 용지 약 1.5페이지 분량으로 작성한다.
3. 중학생도 이해할 수 있도록 쉽고 흥미롭게 설명한다.
4. 연구 배경, 연구 내용, 연구 성과의 의미, 기대효과가 자연스럽게 이어지도록 구성한다.
5. 논문 초록이나 제공 정보에 없는 내용을 사실처럼 지어내지 않는다.
6. 과장된 표현을 피한다.
7. 대학 공식 보도자료 문체로 작성한다.
8. 첫 문단에서 핵심 성과가 명확히 드러나도록 한다.
9. 전문용어가 필요한 경우 괄호 안에 쉬운 설명을 덧붙인다.
10. 기자가 기사화하기 쉬운 구조로 작성한다.

입력 정보:
- 논문명 국문: ${v(input.paperTitleKo)}
- 논문명 영문: ${v(input.paperTitleEn)}
- 교신저자: ${v(input.correspondingAuthor)}
- 제1저자: ${v(input.firstAuthor)}
- 소속 학과: ${v(input.department)}
- 게재 저널명: ${v(input.journalName)}
- 게재일: ${v(input.publishedDate)}
- 공동 연구기관: ${v(input.partnerInstitutions)}
- DOI: ${v(input.doi)}
- 사사사업명: ${v(input.fundingInfo)}
- 논문 초록: ${v(input.abstract)}
- 연구 배경: ${v(input.researchBackground)}
- 연구 내용: ${v(input.researchContent)}
- 기대효과: ${v(input.expectedImpact)}
- 추가 설명: ${v(input.additionalNotes)}

출력은 아래 형식의 마크다운으로 작성한다:
# 제목
...

## 부제목
...

## 본문
...

## 핵심 요약
- ...
- ...
- ...

## 쉬운 설명
...

## 이미지 캡션 초안
...`;
}
