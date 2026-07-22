import type { RequestType } from "@/lib/enums";

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "date";
  required?: boolean;
  hint?: string;
};

// Type-specific detail field definitions used by the applicant form.
export const DETAIL_FORM: Record<RequestType, FieldDef[]> = {
  RESEARCH: [
    { name: "paperTitleKo", label: "논문명 (국문)", required: true },
    { name: "paperTitleEn", label: "논문명 (영문)" },
    { name: "correspondingAuthorName", label: "교신저자 이름", required: true },
    { name: "correspondingAuthorDepartment", label: "교신저자 소속 학과" },
    { name: "correspondingAuthorEmployeeNo", label: "교신저자 직번" },
    { name: "firstAuthorName", label: "제1저자 이름" },
    { name: "firstAuthorDepartment", label: "제1저자 소속 학과" },
    { name: "coAuthors", label: "공동저자 정보", type: "textarea" },
    { name: "journalName", label: "게재 저널명", required: true },
    { name: "publishedDate", label: "게재일", type: "date" },
    { name: "partnerInstitutions", label: "공동 연구기관" },
    { name: "doi", label: "논문 DOI", hint: "예: 10.1000/example — 추후 Crossref 연동 예정" },
    { name: "fundingInfo", label: "사사사업명" },
    { name: "abstract", label: "논문 초록", type: "textarea", required: true, hint: "AI 초안 생성의 핵심 입력입니다." },
    { name: "researchBackground", label: "연구 배경", type: "textarea" },
    { name: "researchContent", label: "연구 내용", type: "textarea" },
    { name: "significance", label: "연구 성과의 의미", type: "textarea" },
    { name: "expectedImpact", label: "기대효과", type: "textarea" },
    { name: "applicationFields", label: "활용 가능 분야" },
    { name: "easyExplanation", label: "중학생도 이해할 수 있는 쉬운 설명", type: "textarea" },
    { name: "additionalNotes", label: "추가 설명", type: "textarea" },
  ],
  AWARD: [
    { name: "awardName", label: "수상명", required: true },
    { name: "awardeeName", label: "수상자 이름", required: true },
    { name: "awardeeDepartment", label: "수상자 소속 학과/부서" },
    { name: "awardeeTitle", label: "수상자 직위" },
    { name: "awardingOrganization", label: "시상 기관", required: true },
    { name: "ceremonyDate", label: "시상식 일자", type: "date" },
    { name: "ceremonyLocation", label: "시상식 장소" },
    { name: "awardDescription", label: "수상 내용", type: "textarea" },
    { name: "awardBackground", label: "수상 배경", type: "textarea" },
    { name: "significance", label: "수상의 의미", type: "textarea" },
  ],
  APPOINTMENT: [
    { name: "appointeeName", label: "선임자 이름", required: true },
    { name: "department", label: "소속 학과/부서" },
    { name: "title", label: "직위" },
    { name: "committeeName", label: "선임된 위원회명", required: true },
    { name: "organization", label: "주관 기관" },
    { name: "term", label: "임기" },
    { name: "roleDescription", label: "역할", type: "textarea" },
    { name: "appointmentBackground", label: "선임 배경", type: "textarea" },
    { name: "expectedImpact", label: "기대효과", type: "textarea" },
  ],
  PERSONAL_NEWS: [
    { name: "subjectName", label: "대상자 이름", required: true },
    { name: "department", label: "소속 학과/부서" },
    { name: "title", label: "직위" },
    { name: "newsType", label: "동정 유형", hint: "예: 강연, 방문, 임명 등" },
    { name: "content", label: "주요 내용", type: "textarea", required: true },
    { name: "occurredAt", label: "일시", type: "date" },
    { name: "location", label: "장소" },
    { name: "organization", label: "관련 기관" },
    { name: "significance", label: "의미", type: "textarea" },
  ],
  EVENT: [
    { name: "eventName", label: "행사명", required: true },
    { name: "who", label: "누가" },
    { name: "when", label: "언제" },
    { name: "whereAt", label: "어디서" },
    { name: "what", label: "무엇을", type: "textarea" },
    { name: "how", label: "어떻게" },
    { name: "why", label: "왜", type: "textarea" },
    { name: "host", label: "주최" },
    { name: "organizer", label: "주관" },
    { name: "participants", label: "참여 대상" },
    { name: "program", label: "주요 프로그램", type: "textarea" },
    { name: "expectedImpact", label: "기대효과", type: "textarea" },
    { name: "contactInfo", label: "문의처" },
  ],
  OTHER: [],
};
