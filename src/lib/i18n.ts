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
