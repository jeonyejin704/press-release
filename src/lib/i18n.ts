// 화면 언어. 외국인(주로 신청자)이 영문으로 전체를 볼 수 있게 하기 위한 경량 i18n.
// 사용자가 입력한 콘텐츠(논문명·본문 등)는 그대로 두고, UI 문구만 전환한다.
// ⚠️ 이 파일은 클라이언트 컴포넌트에서도 import 되므로 next/headers 등 서버 전용 API를
//    두지 않는다. 서버에서 쿠키로 언어를 읽는 getLang()은 i18n-server.ts 에 둔다.
export type Lang = "ko" | "en";
export const LANG_COOKIE = "pf_lang";

type Dict = Record<string, { ko: string; en: string }>;

// UI 사전. 키는 화면 영역별로 묶는다.
export const D: Dict = {
  // ── 공통/사이드바 ──
  "brand": { ko: "POSTECH 언론홍보", en: "POSTECH Media Relations" },
  "nav.dashboard": { ko: "대시보드", en: "Dashboard" },
  "nav.requests.manager": { ko: "신청 관리", en: "Requests" },
  "nav.requests.applicant": { ko: "내 신청", en: "My Requests" },
  "nav.applicants": { ko: "신청자", en: "Applicants" },
  "nav.schedule": { ko: "배포일정", en: "Schedule" },
  "nav.ads": { ko: "광고비 집행", en: "Ad Spend" },
  "nav.news": { ko: "뉴스 모니터링", en: "News" },
  "nav.import": { ko: "데이터 가져오기", en: "Import" },
  "nav.notifications": { ko: "알림", en: "Notifications" },
  "nav.new": { ko: "새 홍보 신청", en: "New Request" },
  "nav.settings": { ko: "설정", en: "Settings" },
  "logout": { ko: "로그아웃", en: "Log out" },
  "lang.notice": {
    ko: "언어 전환(KOR/ENG) 버튼으로 화면을 영문으로 볼 수 있습니다.",
    en: "This service is available in English. Your entries are kept in the language you type.",
  },

  // ── 로그인 ──
  "login.title": { ko: "언론홍보 신청·관리", en: "Media Relations Portal" },
  "login.subtitle": { ko: "이메일로 로그인하세요.", en: "Sign in with your email." },
  "login.email": { ko: "이메일", en: "Email" },
  "login.button": { ko: "로그인", en: "Sign in" },
  "login.demo": { ko: "데모 계정", en: "Demo accounts" },

  // ── 신청 목록 ──
  "req.title.manager": { ko: "전체 신청 관리", en: "All Requests" },
  "req.title.applicant": { ko: "내 홍보 신청", en: "My Requests" },
  "req.new": { ko: "＋ 새 홍보 신청", en: "＋ New Request" },
  "req.total.prefix": { ko: "총", en: "Total" },
  "req.total.suffix": { ko: "건", en: "" },
  "req.export": { ko: "⬇ 엑셀 내려받기", en: "⬇ Export to Excel" },
  "req.search": { ko: "제목 검색", en: "Search title" },
  "req.filter.type": { ko: "유형 전체", en: "All types" },
  "req.filter.status": { ko: "상태 전체", en: "All statuses" },
  "req.filter.dept": { ko: "학과 전체", en: "All departments" },
  "req.apply": { ko: "적용", en: "Apply" },
  "req.reset": { ko: "초기화", en: "Reset" },
  "req.col.title": { ko: "제목", en: "Title" },
  "req.col.type": { ko: "유형", en: "Type" },
  "req.col.dept": { ko: "학과", en: "Dept." },
  "req.col.applicant": { ko: "신청자", en: "Applicant" },
  "req.col.status": { ko: "상태", en: "Status" },
  "req.col.publish": { ko: "예상 배포일", en: "Publish date" },
  "req.col.updated": { ko: "수정일", en: "Updated" },
  "req.empty": { ko: "신청 내역이 없습니다.", en: "No requests yet." },
  "req.empty.hint": { ko: "새 홍보 신청을 만들어 보세요.", en: "Create a new request to get started." },

  // ── 새 홍보 신청(유형 선택) ──
  "new.title": { ko: "새 홍보 신청", en: "New Request" },
  "new.subtitle": { ko: "홍보 유형을 선택하세요. 각 유형의 안내를 먼저 확인해 주세요.", en: "Choose a request type. Please review each type's guidance first." },
  "new.banner": {
    ko: "각 유형 화면에서 ‘보도자료 초안 양식’을 내려받아 작성하신 뒤, 파일로 업로드해 주세요. 대외협력팀이 이를 검토·보완하여 최종본을 완성합니다.",
    en: "On each type's page, download the ‘Press Release Draft Template’, fill it in, and upload the file. The Office of Public Relations will review and refine it into the final version.",
  },
  "new.banner.contact": {
    ko: "문의사항이 있을 경우 대외협력팀으로 연락 부탁드립니다. ☎ 054-279-2416",
    en: "If you have any questions, please contact the Office of Public Relations. ☎ +82-54-279-2416",
  },
  "new.apply": { ko: "신청하기 →", en: "Apply →" },

  // ── 신청 폼 ──
  "form.title": { ko: "새 홍보 신청", en: "New Request" },
  "form.tpl.title": { ko: "📄 보도자료 초안 양식", en: "📄 Press Release Draft Template" },
  "form.tpl.desc": { ko: "양식을 내려받아 작성하신 뒤, 아래 ‘보도자료 초안 업로드’에 첨부해 주세요.", en: "Download the template, fill it in, and attach it under ‘Upload Press Release Draft’ below." },
  "form.tpl.download": { ko: "양식 다운로드", en: "Download template" },
  "form.basic": { ko: "기본 정보", en: "Basic Information" },
  "form.applicantName": { ko: "신청자 이름", en: "Applicant Name" },
  "form.applicantName.ph": { ko: "예: 김범만", en: "e.g. John Kim" },
  "form.applicantEmail": { ko: "신청자 이메일", en: "Applicant Email" },
  "form.applicantEmail.hint": { ko: "로그인 계정 이메일", en: "Your login account email" },
  "form.department": { ko: "소속 학과/부서", en: "Department/Unit" },
  "form.phone": { ko: "연락처", en: "Contact Number" },
  "form.desiredDate": { ko: "홍보 희망일", en: "Preferred Publish Date" },
  "form.note": { ko: "참고 메모", en: "Notes" },
  "form.info.suffix": { ko: "정보", en: "Details" },
  "form.corr": { ko: "교신저자", en: "Corresponding Author" },
  "form.corr.n": { ko: "교신저자", en: "Corresponding Author" },
  "form.corr.name": { ko: "이름", en: "Name" },
  "form.corr.dept": { ko: "소속 학과", en: "Department" },
  "form.corr.empNo": { ko: "직번", en: "Employee No." },
  "form.corr.add": { ko: "＋ 교신저자 추가", en: "＋ Add corresponding author" },
  "form.corr.hint": { ko: "POSTECH 소속 교신저자가 둘 이상이면 추가해 주세요. (기본 1명)", en: "Add more if there is more than one POSTECH corresponding author. (Default: 1)" },
  "form.remove": { ko: "삭제", en: "Remove" },
  "form.media.title": { ko: "사진·영상 첨부", en: "Photos & Video" },
  "form.media.desc": {
    ko: "연구진 사진·대표 이미지는 JPG(.jpg), 동영상은 mp4/mov로 첨부해 주세요. 사진은 인쇄·배포용이므로 고해상도 원본을, 영상은 10~20초 내외의 짧은 길이를 권장합니다. (파일당 최대 20MB)",
    en: "Attach researcher photos and the key image as JPG (.jpg), and videos as mp4/mov. Photos are used for print/distribution, so please provide high-resolution originals; videos of about 10–20 seconds are recommended. (Max 20MB per file)",
  },
  "form.media.researcher": { ko: "연구진 사진", en: "Researcher Photo" },
  "form.media.researcher.hint": { ko: "연구진 인물 사진 (JPG)", en: "Researcher portrait (JPG)" },
  "form.media.key": { ko: "대표 이미지", en: "Key Image" },
  "form.media.key.hint": { ko: "연구 대표 이미지·도식 (JPG)", en: "Representative research image/figure (JPG)" },
  "form.media.video": { ko: "동영상", en: "Video" },
  "form.media.video.hint": { ko: "10~20초 권장 (mp4/mov)", en: "10–20s recommended (mp4/mov)" },
  "form.doc.title": { ko: "보도자료 초안 업로드", en: "Upload Press Release Draft" },
  "form.doc.desc": {
    ko: "작성한 보도자료 초안과 참고 문서를 첨부해 주세요. (한글/PDF/문서/zip, 최대 20MB) · 사진·영상은 위 ‘사진·영상 첨부’를 이용하세요.",
    en: "Attach your completed press release draft and reference documents. (HWP/PDF/DOC/zip, max 20MB) · For photos and video, use ‘Photos & Video’ above.",
  },
  "form.doc.kind": { ko: "자료 유형", en: "Document Type" },
  "form.file.pick": { ko: "파일 선택", en: "Choose file" },
  "form.pick": { ko: "선택", en: "Choose" },
  "form.save.draft": { ko: "임시저장", en: "Save draft" },
  "form.submit": { ko: "홍보 신청 제출", en: "Submit request" },
  "form.submitting": { ko: "제출 중…", en: "Submitting…" },
  "form.err.applicant": { ko: "신청자 이름과 이메일을 입력하세요.", en: "Please enter the applicant's name and email." },
  "form.err.save": { ko: "저장에 실패했습니다.", en: "Failed to save." },
  "form.err.jpg": { ko: "사진은 JPG(.jpg) 형식만 업로드할 수 있습니다.", en: "Photos must be in JPG (.jpg) format." },
  "form.err.video": { ko: "동영상은 mp4/mov 형식만 업로드할 수 있습니다.", en: "Videos must be in mp4/mov format." },

  // ── 신청 상세 ──
  "d.back": { ko: "← 목록으로", en: "← Back to list" },
  "d.urgent": { ko: "긴급", en: "Urgent" },
  "d.applicant": { ko: "신청자", en: "Applicant" },
  "d.tab.info": { ko: "신청 정보", en: "Request Info" },
  "d.tab.release": { ko: "보도자료", en: "Press Release" },
  "d.tab.files": { ko: "첨부파일", en: "Attachments" },
  "d.tab.checklist": { ko: "체크리스트", en: "Checklist" },
  "d.tab.comments": { ko: "코멘트", en: "Comments" },
  "d.tab.history": { ko: "이력", en: "History" },
  "d.missing.title": { ko: "⚠️ 자료 누락 감지", en: "⚠️ Missing materials detected" },
  "d.submit": { ko: "홍보 신청 제출", en: "Submit request" },
  "d.reviseReq": { ko: "수정 요청", en: "Request revision" },
  "d.reviewOk": { ko: "검토 완료 (이상 없음)", en: "Review complete (approved)" },
  "d.status.change": { ko: "상태 변경:", en: "Change status:" },
  "d.sched.label": { ko: "예상 배포일 (저장 시 신청자에게 안내 알림 발송)", en: "Expected publish date (saving notifies the applicant)" },
  "d.sched.save": { ko: "배포일 저장·안내", en: "Save & notify" },
  "d.req.failed": { ko: "요청에 실패했습니다.", en: "Request failed." },
  "d.upload.failed": { ko: "업로드 실패", en: "Upload failed." },
  // 보도자료 초안 패널
  "d.draft.title": { ko: "보도자료 초안", en: "Press Release Draft" },
  "d.draft.tpl": { ko: "📄 초안 양식 다운로드", en: "📄 Download draft template" },
  "d.draft.desc.manager": { ko: "신청자가 올린 초안을 내려받아 보완한 뒤, 보완본을 다시 업로드하세요.", en: "Download the applicant's draft, refine it, and re-upload the revised version." },
  "d.draft.desc.applicant": { ko: "양식을 내려받아 작성한 보도자료 초안을 업로드하세요. 대외협력팀이 검토·보완합니다.", en: "Download the template, fill in your press release draft, and upload it. The Office of Public Relations will review and refine it." },
  "d.draft.none": { ko: "아직 업로드된 초안이 없습니다.", en: "No draft uploaded yet." },
  "d.draft.download": { ko: "다운로드", en: "Download" },
  "d.draft.upload.manager": { ko: "보완본 업로드", en: "Upload revised version" },
  "d.draft.upload.applicant": { ko: "초안 업로드", en: "Upload draft" },
  "d.uploading": { ko: "업로드 중…", en: "Uploading…" },
  // 신청 정보 탭
  "d.common": { ko: "공통 정보", en: "General Information" },
  "d.f.applicant": { ko: "신청자", en: "Applicant" },
  "d.f.dept": { ko: "소속", en: "Department" },
  "d.f.submittedAt": { ko: "신청일시", en: "Submitted at" },
  "d.f.notSubmitted": { ko: "임시저장 (미제출)", en: "Draft (not submitted)" },
  "d.f.phone": { ko: "연락처", en: "Contact" },
  "d.f.desiredDate": { ko: "홍보 희망일", en: "Preferred date" },
  "d.f.expectedDate": { ko: "예상 배포일", en: "Expected publish date" },
  "d.f.note": { ko: "참고 메모", en: "Notes" },
  "d.detail.suffix": { ko: "상세", en: "Details" },
  "d.detail.none": { ko: "입력된 상세 정보가 없습니다.", en: "No details provided." },
  // 첨부파일 탭
  "d.att.upload": { ko: "파일 업로드", en: "Upload File" },
  "d.att.kind": { ko: "자료 유형", en: "Document Type" },
  "d.att.desc": { ko: "설명", en: "Description" },
  "d.att.pick": { ko: "파일 선택", en: "Choose file" },
  "d.att.allow": { ko: "허용: 이미지/PDF/문서/한글/zip, 최대 20MB", en: "Allowed: image/PDF/DOC/HWP/zip, max 20MB" },
  "d.att.none": { ko: "첨부된 파일이 없습니다.", en: "No attachments." },
  "d.att.confirmDelete": { ko: "이 파일을 삭제할까요?", en: "Delete this file?" },
  "d.remove": { ko: "삭제", en: "Delete" },
  // 체크리스트
  "d.chk.title": { ko: "자료 확인 체크리스트", en: "Materials Checklist" },
  "d.chk.none": { ko: "체크리스트가 없습니다.", en: "No checklist." },
  // 코멘트
  "d.cmt.none": { ko: "아직 코멘트가 없습니다.", en: "No comments yet." },
  "d.cmt.ph": { ko: "코멘트 입력…", en: "Write a comment…" },
  "d.cmt.add": { ko: "등록", en: "Post" },
  // 이력
  "d.hist.none": { ko: "이력이 없습니다.", en: "No history." },
  "d.hist.system": { ko: "시스템", en: "System" },

  // ── 알림 ──
  "notif.title": { ko: "알림", en: "Notifications" },
  "notif.empty": { ko: "알림이 없습니다.", en: "No notifications." },
  "notif.goto": { ko: "바로가기", en: "Open" },
  "notif.markread": { ko: "읽음", en: "Mark read" },

  // ── 상태 4단계 ──
  "phase.RECEIVED": { ko: "접수", en: "Received" },
  "phase.IN_PROGRESS": { ko: "검토·작성 중", en: "In progress" },
  "phase.SCHEDULED": { ko: "배포 예정", en: "Scheduled" },
  "phase.DONE": { ko: "배포 완료", en: "Distributed" },
  "phase.HOLD": { ko: "보류·반려", en: "On hold / Rejected" },
  "phase.DRAFT": { ko: "초안", en: "Draft" },
};

export function t(lang: Lang, key: string): string {
  const e = D[key];
  if (!e) return key;
  return e[lang];
}

// 헬퍼: 특정 언어에 바인딩된 t 함수를 만든다.
export function makeT(lang: Lang) {
  return (key: string) => t(lang, key);
}
