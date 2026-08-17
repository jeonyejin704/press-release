import type { RequestType } from "@/lib/enums";

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "date";
  required?: boolean;
  hint?: string;
};

const CONTACT = "문의사항이 있을 경우 대외협력팀으로 연락 부탁드립니다. ☎ 054-279-2416";

// 유형별 '보도자료 초안 양식' 다운로드 파일 (public/templates 에 심어 둠).
export const TEMPLATE_FILES: Record<RequestType, string> = {
  // 연구성과: 대외협력팀이 제공한 실제 HWP 샘플 양식
  RESEARCH: "/templates/연구성과_보도자료_샘플.hwp",
  AWARD: "/templates/수상성과_보도자료_초안양식.md",
  APPOINTMENT: "/templates/위원선임_보도자료_초안양식.md",
  PERSONAL_NEWS: "/templates/동정_보도자료_초안양식.md",
  EVENT: "/templates/행사이벤트_보도자료_초안양식.md",
  OTHER: "/templates/기타소식_보도자료_초안양식.md",
};

// 안내 문구(줄글): 새 홍보 신청 시 각 유형에서 신청자에게 보여줄 설명.
// 상세한 서술(연구 배경·의미·기대효과 등)은 솔루션에 입력하지 않고,
// 신청자가 '보도자료 초안 파일'에 작성하여 업로드하도록 안내한다.
export const REQUEST_GUIDE: Record<RequestType, string> = {
  RESEARCH:
    "연구성과 홍보를 신청합니다. 아래에는 논문 정보 등 기본 사항만 입력해 주세요. " +
    "연구 배경, 연구 내용, 성과의 의미, 기대효과, 활용 분야, 쉽게 풀어 쓴 설명 등 상세한 내용은 " +
    "보도자료 초안 샘플을 내려받아 작성하신 뒤 업로드해 주세요. " +
    "대외협력팀이 업로드된 초안을 검토·보완할 예정입니다. " +
    "연구진 사진과 대표 이미지도 함께 첨부해 주세요. " +
    CONTACT,
  AWARD:
    "수상성과 홍보를 신청합니다. 수상명, 주최(시상)기관, 수상 내역 등 기본 정보를 입력해 주세요. " +
    "자세한 수상 배경·의미는 '보도자료 초안 양식'을 내려받아 작성 후 파일로 업로드해 주시면 됩니다. " +
    "수상자 사진 또는 시상식 사진을 함께 첨부해 주세요. " +
    CONTACT,
  APPOINTMENT:
    "위원 선임 홍보를 신청합니다. 선임된 위원회명, 주관 기관, 임기(시작일·종료일) 등 기본 정보를 입력해 주세요. " +
    "선임 배경과 기대효과는 '보도자료 초안 양식'에 작성해 업로드해 주시면 됩니다. " +
    "선임자 사진을 함께 첨부해 주세요. " +
    CONTACT,
  PERSONAL_NEWS:
    "동정(강연·방문·활동 등) 홍보를 신청합니다. 대상자, 주요 내용, 일정, 장소 등 기본 정보를 입력해 주세요. " +
    "자세한 내용은 '보도자료 초안 양식'에 작성해 업로드해 주시면 됩니다. " +
    CONTACT,
  EVENT:
    "행사 및 이벤트 홍보를 신청합니다. 행사명, 진행 일정, 진행 장소, 주최/주관 등 기본 정보를 입력해 주세요. " +
    "행사 취지와 주요 프로그램 등 상세 내용은 '보도자료 초안 양식'에 작성해 업로드해 주시면 됩니다. " +
    "행사 포스터와 관련 사진을 함께 첨부해 주세요. " +
    CONTACT,
  OTHER:
    "기타 대학 소식 홍보를 신청합니다. 제목과 간단한 내용을 입력하시고, 자세한 내용은 " +
    "'보도자료 초안 양식'에 작성해 파일로 업로드해 주세요. " +
    CONTACT,
};

// 유형별 '기본 정보' 입력 항목 (상세 서술형 항목은 제외 — 초안 파일에 작성).
export const DETAIL_FORM: Record<RequestType, FieldDef[]> = {
  RESEARCH: [
    { name: "paperTitleKo", label: "논문명 (국문)", required: true },
    { name: "paperTitleEn", label: "논문명 (영문)", required: true },
    { name: "correspondingAuthorName", label: "교신저자 이름", required: true },
    { name: "correspondingAuthorDepartment", label: "교신저자 소속 학과", required: true },
    { name: "correspondingAuthorEmployeeNo", label: "교신저자 직번", required: true },
    { name: "firstAuthorName", label: "제1저자 이름", required: true },
    { name: "firstAuthorDepartment", label: "제1저자 소속 학과", required: true },
    { name: "coAuthors", label: "공동저자" },
    { name: "journalName", label: "게재 저널명", required: true },
    { name: "publishedDate", label: "게재일", type: "date", required: true },
    { name: "partnerInstitutions", label: "공동 연구기관", required: true },
    { name: "doi", label: "논문 DOI", hint: "예: 10.1000/example", required: true },
    { name: "fundingInfo", label: "사사사업명", required: true },
  ],
  AWARD: [
    { name: "awardName", label: "수상명", required: true },
    { name: "awardeeName", label: "수상자 이름", required: true },
    { name: "awardeeDepartment", label: "수상자 소속 학과/부서" },
    { name: "awardeeTitle", label: "수상자 직위" },
    { name: "awardingOrganization", label: "주최(시상) 기관", required: true },
    { name: "ceremonyDate", label: "수상 일자", type: "date" },
    { name: "ceremonyLocation", label: "장소" },
    { name: "awardDescription", label: "수상 내역", type: "textarea", hint: "수상 부문·간단한 사유 등" },
  ],
  APPOINTMENT: [
    { name: "appointeeName", label: "선임자 이름", required: true },
    { name: "department", label: "소속 학과/부서" },
    { name: "title", label: "직위" },
    { name: "committeeName", label: "선임된 위원회명", required: true },
    { name: "organization", label: "주관 기관" },
    { name: "termStart", label: "임기 시작일", type: "date" },
    { name: "termEnd", label: "임기 종료일(기한)", type: "date" },
    { name: "roleDescription", label: "역할" },
  ],
  PERSONAL_NEWS: [
    { name: "subjectName", label: "대상자 이름", required: true },
    { name: "department", label: "소속 학과/부서" },
    { name: "title", label: "직위" },
    { name: "newsType", label: "동정 유형", hint: "예: 강연, 방문, 활동 등" },
    { name: "content", label: "주요 내용", type: "textarea", required: true },
    { name: "occurredAt", label: "일정", type: "date" },
    { name: "location", label: "장소" },
    { name: "organization", label: "관련 기관" },
  ],
  EVENT: [
    { name: "eventName", label: "행사명", required: true },
    { name: "when", label: "진행 일정", hint: "예: 2026년 8월 15일 14:00" },
    { name: "whereAt", label: "진행 장소" },
    { name: "host", label: "주최" },
    { name: "organizer", label: "주관" },
    { name: "participants", label: "참여 대상" },
    { name: "program", label: "주요 프로그램", type: "textarea" },
    { name: "contactInfo", label: "문의처" },
  ],
  // 기타: 제목 + 공통 '참고 메모' + 초안 파일로 충분하므로 별도 상세 항목 없음.
  OTHER: [],
};
