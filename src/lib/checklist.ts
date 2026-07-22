import type { RequestType, AttachmentType } from "@/lib/enums";

// Per-type checklist templates seeded on the request detail page.
export const CHECKLIST_TEMPLATES: Record<RequestType, { key: string; label: string }[]> = {
  RESEARCH: [
    { key: "researcher_photo", label: "연구진 사진 있음" },
    { key: "representative_image", label: "대표 이미지 있음" },
    { key: "image_caption", label: "이미지 캡션 있음" },
    { key: "doi", label: "DOI 확인 완료" },
    { key: "journal", label: "저널명 확인 완료" },
    { key: "funding", label: "사사 정보 확인 완료" },
    { key: "applicant_review", label: "연구자 검토 완료" },
    { key: "english_review", label: "영문본 검토 완료" },
    { key: "distributed", label: "배포 완료" },
  ],
  AWARD: [
    { key: "awardee_photo", label: "수상자 사진 있음" },
    { key: "award_org", label: "시상 기관 확인 완료" },
    { key: "applicant_review", label: "신청자 검토 완료" },
    { key: "distributed", label: "배포 완료" },
  ],
  APPOINTMENT: [
    { key: "appointee_photo", label: "선임자 사진 있음" },
    { key: "committee", label: "위원회명 확인 완료" },
    { key: "applicant_review", label: "신청자 검토 완료" },
    { key: "distributed", label: "배포 완료" },
  ],
  PERSONAL_NEWS: [
    { key: "subject_photo", label: "대상자 사진 있음" },
    { key: "applicant_review", label: "신청자 검토 완료" },
    { key: "distributed", label: "배포 완료" },
  ],
  EVENT: [
    { key: "poster", label: "행사 포스터 있음" },
    { key: "event_photo", label: "행사 사진 있음" },
    { key: "program", label: "주요 프로그램 확인 완료" },
    { key: "applicant_review", label: "신청자 검토 완료" },
    { key: "distributed", label: "배포 완료" },
  ],
  OTHER: [
    { key: "reference", label: "참고자료 있음" },
    { key: "applicant_review", label: "신청자 검토 완료" },
    { key: "distributed", label: "배포 완료" },
  ],
};

// Required attachment types per request type, for auto missing-material detection.
export const REQUIRED_ATTACHMENTS: Record<RequestType, { type: AttachmentType; warning: string }[]> = {
  RESEARCH: [
    { type: "RESEARCHER_PHOTO", warning: "연구성과인데 연구진 사진이 없습니다." },
    { type: "REPRESENTATIVE_IMAGE", warning: "연구성과인데 대표 이미지가 없습니다." },
  ],
  AWARD: [{ type: "AWARD_MATERIAL", warning: "수상성과인데 수상자 사진/자료가 없습니다." }],
  APPOINTMENT: [],
  PERSONAL_NEWS: [],
  EVENT: [{ type: "POSTER", warning: "행사 홍보인데 행사 포스터가 없습니다." }],
  OTHER: [],
};

export function detectMissingMaterials(
  type: RequestType,
  presentTypes: string[],
): string[] {
  const required = REQUIRED_ATTACHMENTS[type] ?? [];
  return required.filter((r) => !presentTypes.includes(r.type)).map((r) => r.warning);
}
