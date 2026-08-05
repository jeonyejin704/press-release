// Central definition of the enum-like values stored as strings in SQLite.
// These are the single source of truth for allowed values + Korean labels.

export const ROLES = ["APPLICANT", "PR_MANAGER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  APPLICANT: "홍보 신청자",
  PR_MANAGER: "대외협력팀 담당자",
  ADMIN: "관리자",
};

export const REQUEST_TYPES = [
  "RESEARCH",
  "AWARD",
  "APPOINTMENT",
  "PERSONAL_NEWS",
  "EVENT",
  "OTHER",
] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  RESEARCH: "연구성과",
  AWARD: "수상성과",
  APPOINTMENT: "위원 선임",
  PERSONAL_NEWS: "동정",
  EVENT: "행사 및 이벤트",
  OTHER: "기타 대학 소식",
};

export const REQUEST_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "PR_REVIEW",
  "MATERIAL_REQUESTED",
  "APPLICANT_REVIEW",
  "KOREAN_FINAL_CONFIRMED",
  "ENGLISH_DRAFTING",
  "ENGLISH_REVIEW_REQUESTED",
  "REVISION_REQUESTED",
  "FINAL_COMPLETED",
  "SCHEDULED",
  "DISTRIBUTED",
  "ON_HOLD",
  "REJECTED",
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  DRAFT: "초안 작성 중",
  SUBMITTED: "신청 완료",
  PR_REVIEW: "대외협력팀 검토 중",
  MATERIAL_REQUESTED: "자료 보완 요청",
  APPLICANT_REVIEW: "연구진 검토 요청",
  KOREAN_FINAL_CONFIRMED: "국문 최종본 확정",
  ENGLISH_DRAFTING: "영문본 작성 중",
  ENGLISH_REVIEW_REQUESTED: "영문본 검토 요청",
  REVISION_REQUESTED: "연구진 수정 요청",
  FINAL_COMPLETED: "최종 완료",
  SCHEDULED: "배포 예정",
  DISTRIBUTED: "배포 완료",
  ON_HOLD: "보류",
  REJECTED: "반려",
};

// Badge color classes per status — POSTECH palette only (red/orange/gray).
//  · 진행/긍정 단계     → 레드(brand)
//  · 주의/조치 필요 단계 → 오렌지(accent)
//  · 비활성(초안/보류/반려) → 그레이(pgray)
export const REQUEST_STATUS_COLORS: Record<RequestStatus, string> = {
  DRAFT: "bg-pgray-100 text-pgray-600",
  SUBMITTED: "bg-brand-50 text-brand-700",
  PR_REVIEW: "bg-brand-100 text-brand-700",
  MATERIAL_REQUESTED: "bg-accent-100 text-accent-800",
  APPLICANT_REVIEW: "bg-accent-50 text-accent-700",
  KOREAN_FINAL_CONFIRMED: "bg-brand-100 text-brand-700",
  ENGLISH_DRAFTING: "bg-accent-50 text-accent-700",
  ENGLISH_REVIEW_REQUESTED: "bg-accent-100 text-accent-800",
  REVISION_REQUESTED: "bg-accent-100 text-accent-800",
  FINAL_COMPLETED: "bg-brand-600 text-white",
  SCHEDULED: "bg-accent-100 text-accent-800",
  DISTRIBUTED: "bg-brand-700 text-white",
  ON_HOLD: "bg-pgray-200 text-pgray-700",
  REJECTED: "bg-pgray-300 text-pgray-800",
};

export const LANGUAGES = ["KO", "EN"] as const;
export type Language = (typeof LANGUAGES)[number];

export const ATTACHMENT_TYPES = [
  "PRESS_RELEASE_DRAFT",
  "RESEARCHER_PHOTO",
  "REPRESENTATIVE_IMAGE",
  "RESEARCH_IMAGE",
  "EVENT_PHOTO",
  "POSTER",
  "REFERENCE",
  "PAPER_PDF",
  "AWARD_MATERIAL",
  "OTHER",
] as const;
export type AttachmentType = (typeof ATTACHMENT_TYPES)[number];

export const ATTACHMENT_TYPE_LABELS: Record<AttachmentType, string> = {
  PRESS_RELEASE_DRAFT: "보도자료 초안",
  RESEARCHER_PHOTO: "연구진 사진",
  REPRESENTATIVE_IMAGE: "대표 이미지",
  RESEARCH_IMAGE: "연구 관련 이미지",
  EVENT_PHOTO: "행사 사진",
  POSTER: "포스터",
  REFERENCE: "참고자료",
  PAPER_PDF: "논문 PDF",
  AWARD_MATERIAL: "수상 관련 자료",
  OTHER: "기타 첨부파일",
};

export const NOTIFICATION_TYPES = [
  "SUBMITTED",
  "MATERIAL_REQUESTED",
  "PUBLISH_DATE_ANNOUNCED",
  "REVIEW_REQUESTED",
  "REVISION_REQUESTED",
  "KOREAN_FINAL_CONFIRMED",
  "ENGLISH_REVIEW_REQUESTED",
  "FINAL_COMPLETED",
  "DISTRIBUTED",
  "COMMENT_ADDED",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

// Terminal-ish statuses used by dashboard aggregations.
export const ACTIVE_STATUSES: RequestStatus[] = [
  "SUBMITTED",
  "PR_REVIEW",
  "MATERIAL_REQUESTED",
  "APPLICANT_REVIEW",
  "KOREAN_FINAL_CONFIRMED",
  "ENGLISH_DRAFTING",
  "ENGLISH_REVIEW_REQUESTED",
  "REVISION_REQUESTED",
];

export function isRole(v: string): v is Role {
  return (ROLES as readonly string[]).includes(v);
}
export function isRequestType(v: string): v is RequestType {
  return (REQUEST_TYPES as readonly string[]).includes(v);
}
export function isRequestStatus(v: string): v is RequestStatus {
  return (REQUEST_STATUSES as readonly string[]).includes(v);
}
