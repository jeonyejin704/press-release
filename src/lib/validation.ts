import { z } from "zod";
import { REQUEST_TYPES } from "@/lib/enums";

const optionalDate = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v && v.trim() ? new Date(v) : null));

export const commonRequestSchema = z.object({
  type: z.enum(REQUEST_TYPES),
  title: z.string().optional().default(""),
  applicantName: z.string().min(1, "신청자 이름을 입력하세요."),
  applicantEmail: z.string().email("올바른 이메일 주소를 입력하세요."),
  department: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  desiredPublishDate: optionalDate,
  isUrgent: z.boolean().optional().default(false),
  publicDisclosureAllowed: z.boolean().optional().default(true),
  note: z.string().optional().nullable(),
  submit: z.boolean().optional().default(false),
  // type-specific detail bag (validated loosely; all fields optional strings)
  detail: z.record(z.any()).optional().default({}),
});

export type CommonRequestInput = z.infer<typeof commonRequestSchema>;

// Maps request type -> the Prisma nested-create relation + date fields.
export const DETAIL_DATE_FIELDS: Record<string, string[]> = {
  RESEARCH: ["publishedDate"],
  AWARD: ["ceremonyDate"],
  APPOINTMENT: ["termStart", "termEnd"],
  PERSONAL_NEWS: ["occurredAt"],
  EVENT: [],
  OTHER: [],
};

export const DETAIL_RELATION: Record<string, string> = {
  RESEARCH: "research",
  AWARD: "award",
  APPOINTMENT: "appointment",
  PERSONAL_NEWS: "personalNews",
  EVENT: "event",
  OTHER: "",
};

// Whitelisted detail fields per type (protects against arbitrary keys).
export const DETAIL_FIELDS: Record<string, string[]> = {
  RESEARCH: [
    "paperTitleKo", "paperTitleEn", "correspondingAuthorName", "correspondingAuthorDepartment",
    "correspondingAuthorEmployeeNo", "firstAuthorName", "firstAuthorDepartment", "coAuthors",
    "journalName", "publishedDate", "partnerInstitutions", "doi", "fundingInfo", "abstract",
    "researchBackground", "researchContent", "significance", "expectedImpact", "applicationFields",
    "easyExplanation", "additionalNotes",
  ],
  AWARD: [
    "awardName", "awardeeName", "awardeeDepartment", "awardeeTitle", "awardingOrganization",
    "ceremonyDate", "ceremonyLocation", "awardDescription", "awardBackground", "significance",
  ],
  APPOINTMENT: [
    "appointeeName", "department", "title", "committeeName", "organization", "term",
    "termStart", "termEnd", "roleDescription", "appointmentBackground", "expectedImpact",
  ],
  PERSONAL_NEWS: [
    "subjectName", "department", "title", "newsType", "content", "occurredAt", "location",
    "organization", "significance",
  ],
  EVENT: [
    "eventName", "who", "when", "whereAt", "what", "how", "why", "host", "organizer",
    "participants", "program", "expectedImpact", "contactInfo",
  ],
  OTHER: [],
};

export function buildDetailData(type: string, detail: Record<string, unknown>) {
  const allowed = DETAIL_FIELDS[type] ?? [];
  const dateFields = DETAIL_DATE_FIELDS[type] ?? [];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    const v = detail[key];
    if (v === undefined || v === null || v === "") continue;
    if (dateFields.includes(key)) {
      data[key] = new Date(String(v));
    } else {
      data[key] = String(v);
    }
  }
  return data;
}
