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

export const REQUEST_TYPE_LABELS_EN: Record<RequestType, string> = {
  RESEARCH: "Research Achievement",
  AWARD: "Award",
  APPOINTMENT: "Committee Appointment",
  PERSONAL_NEWS: "Personal News",
  EVENT: "Event",
  OTHER: "Other University News",
};

// 언어별 유형 라벨 헬퍼
export function requestTypeLabel(type: RequestType, lang: "ko" | "en" = "ko") {
  return lang === "en" ? REQUEST_TYPE_LABELS_EN[type] : REQUEST_TYPE_LABELS[type];
}

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

// ── 상태 4단계 묶음 (목록·필터를 단순하게 보여주기 위함) ──────────────
// 14개 세부 상태를 4개 큰 단계로 묶어 표시한다. 보류/반려/초안은 별도 표시.
export const STATUS_PHASES = ["RECEIVED", "IN_PROGRESS", "SCHEDULED", "DONE"] as const;
export type StatusPhase = (typeof STATUS_PHASES)[number] | "HOLD" | "DRAFT";

export const STATUS_PHASE_LABELS: Record<StatusPhase, string> = {
  RECEIVED: "접수",
  IN_PROGRESS: "검토·작성 중",
  SCHEDULED: "배포 예정",
  DONE: "배포 완료",
  HOLD: "보류·반려",
  DRAFT: "초안",
};

export const STATUS_PHASE_COLORS: Record<StatusPhase, string> = {
  RECEIVED: "bg-brand-50 text-brand-700",
  IN_PROGRESS: "bg-accent-100 text-accent-800",
  SCHEDULED: "bg-brand-100 text-brand-700",
  DONE: "bg-brand-700 text-white",
  HOLD: "bg-pgray-200 text-pgray-700",
  DRAFT: "bg-pgray-100 text-pgray-600",
};

// 세부 상태 → 4단계 매핑
export const STATUS_TO_PHASE: Record<RequestStatus, StatusPhase> = {
  DRAFT: "DRAFT",
  SUBMITTED: "RECEIVED",
  PR_REVIEW: "IN_PROGRESS",
  MATERIAL_REQUESTED: "IN_PROGRESS",
  APPLICANT_REVIEW: "IN_PROGRESS",
  KOREAN_FINAL_CONFIRMED: "IN_PROGRESS",
  ENGLISH_DRAFTING: "IN_PROGRESS",
  ENGLISH_REVIEW_REQUESTED: "IN_PROGRESS",
  REVISION_REQUESTED: "IN_PROGRESS",
  FINAL_COMPLETED: "IN_PROGRESS",
  SCHEDULED: "SCHEDULED",
  DISTRIBUTED: "DONE",
  ON_HOLD: "HOLD",
  REJECTED: "HOLD",
};

// 필터 드롭다운에 노출할 큰 단계 순서 (초안은 매니저 목록에서 거의 안 쓰므로 뒤로)
export const STATUS_PHASE_ORDER: StatusPhase[] = ["RECEIVED", "IN_PROGRESS", "SCHEDULED", "DONE", "HOLD", "DRAFT"];

// 한 단계에 속하는 세부 상태 코드 목록 (필터 where절 in [] 에 사용)
export const PHASE_TO_STATUSES: Record<StatusPhase, RequestStatus[]> = (() => {
  const m = Object.fromEntries(STATUS_PHASE_ORDER.map((p) => [p, [] as RequestStatus[]])) as Record<StatusPhase, RequestStatus[]>;
  for (const s of REQUEST_STATUSES) m[STATUS_TO_PHASE[s]].push(s);
  return m;
})();

export const LANGUAGES = ["KO", "EN"] as const;
export type Language = (typeof LANGUAGES)[number];

export const ATTACHMENT_TYPES = [
  "PRESS_RELEASE_DRAFT",
  "RESEARCHER_PHOTO",
  "REPRESENTATIVE_IMAGE",
  "VIDEO",
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
  VIDEO: "동영상",
  RESEARCH_IMAGE: "연구 관련 이미지",
  EVENT_PHOTO: "행사 사진",
  POSTER: "포스터",
  REFERENCE: "참고자료",
  PAPER_PDF: "논문 PDF",
  AWARD_MATERIAL: "수상 관련 자료",
  OTHER: "기타 첨부파일",
};

export const ATTACHMENT_TYPE_LABELS_EN: Record<AttachmentType, string> = {
  PRESS_RELEASE_DRAFT: "Press Release Draft",
  RESEARCHER_PHOTO: "Researcher Photo",
  REPRESENTATIVE_IMAGE: "Key Image",
  VIDEO: "Video",
  RESEARCH_IMAGE: "Research Image",
  EVENT_PHOTO: "Event Photo",
  POSTER: "Poster",
  REFERENCE: "Reference",
  PAPER_PDF: "Paper PDF",
  AWARD_MATERIAL: "Award Material",
  OTHER: "Other Attachment",
};

export function attachmentTypeLabel(type: AttachmentType, lang: "ko" | "en" = "ko") {
  return lang === "en" ? ATTACHMENT_TYPE_LABELS_EN[type] : ATTACHMENT_TYPE_LABELS[type];
}

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
