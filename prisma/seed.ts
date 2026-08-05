import { PrismaClient } from "@prisma/client";
import { CHECKLIST_TEMPLATES } from "../src/lib/checklist";
import type { RequestType } from "../src/lib/enums";

const prisma = new PrismaClient();

// ── helpers ────────────────────────────────────────────────────────────────
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function weighted<T>(pairs: [T, number][]): T {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [v, w] of pairs) {
    if ((r -= w) <= 0) return v;
  }
  return pairs[0][0];
}
function randInt(a: number, b: number) {
  return a + Math.floor(Math.random() * (b - a + 1));
}

const DEPARTMENTS: [string, number][] = [
  ["화학공학과", 10],
  ["물리학과", 9],
  ["생명과학과", 8],
  ["신소재공학과", 7],
  ["컴퓨터공학과", 7],
  ["기계공학과", 5],
  ["전자전기공학과", 5],
  ["수학과", 3],
  ["산업경영공학과", 3],
  ["인문사회학부", 2],
  ["대외협력팀", 2],
];

const TYPE_WEIGHTS: [RequestType, number][] = [
  ["RESEARCH", 45],
  ["AWARD", 20],
  ["EVENT", 15],
  ["APPOINTMENT", 8],
  ["PERSONAL_NEWS", 8],
  ["OTHER", 4],
];

// 상태 분포 (각 KPI가 의미있는 건수를 갖도록)
const STATUS_WEIGHTS: [string, number][] = [
  ["DISTRIBUTED", 30],
  ["FINAL_COMPLETED", 10],
  ["SCHEDULED", 5],
  ["PR_REVIEW", 8],
  ["MATERIAL_REQUESTED", 6],
  ["APPLICANT_REVIEW", 6],
  ["KOREAN_FINAL_CONFIRMED", 5],
  ["ENGLISH_DRAFTING", 4],
  ["ENGLISH_REVIEW_REQUESTED", 4],
  ["REVISION_REQUESTED", 3],
  ["SUBMITTED", 6],
  ["DRAFT", 3],
  ["ON_HOLD", 5],
  ["REJECTED", 5],
];

const NAMES = [
  "김민준", "이서연", "박도윤", "최지우", "정하은", "강시우", "조은우", "윤서준",
  "임지호", "한예린", "오지훈", "서수아", "신재윤", "권나윤", "황준서", "안하린",
  "송우진", "홍지안", "문서율", "배건우",
];
const TITLES = ["교수", "부교수", "조교수", "연구교수", "책임연구원", "박사과정"];
const RESEARCH_TOPICS = [
  "차세대 배터리 소재의 안정성 원리", "양자 얽힘 기반 정밀 측정 기술", "세포 노화 조절 단백질 네트워크",
  "고효율 태양전지 계면 구조", "인공지능 신약 후보 물질 탐색", "초전도 양자컴퓨팅 소자",
  "친환경 수소 생산 촉매", "뇌 신경회로 신호 전달 메커니즘", "차세대 반도체 소재 결함 제어",
  "기후변화 예측 대기 모델", "표적 항암 나노입자 전달체", "유연 전자소자 신축성 회로",
];
const AWARDS = ["젊은과학자상", "우수논문상", "학술대상", "신진연구자상", "올해의 과학자상", "산업기술포상"];
const AWARD_ORGS = ["한국과학기술한림원", "대한화학회", "한국물리학회", "대한금속재료학회", "과학기술정보통신부", "IEEE"];
const EVENTS = [
  "POSTECH 오픈캠퍼스", "AI 국제 심포지엄", "미래과학 콘서트", "산학협력 포럼",
  "글로벌 리더십 세미나", "청소년 과학캠프", "창업 데모데이", "노벨상 수상자 초청 강연",
];
const COMMITTEES = ["국가과학기술자문회의", "한국연구재단 전문위원회", "정부 R&D 정책자문단", "국제학술지 편집위원회"];
const ACTIVITIES = ["국제 학회 기조강연", "정부 정책 자문", "해외 대학 초청 강연", "산업체 기술 자문"];
const MISC = ["국제 대학평가 상위권 진입", "신규 연구센터 개소", "글로벌 기업과 산학협력 협약", "장학기금 유치"];

// 게재 저널 (최상위급 Science/Nature/Cell 포함). 가중치로 빈도 조절.
const JOURNALS: [string, number][] = [
  ["Nature", 5],
  ["Science", 5],
  ["Cell", 4],
  ["Nature Communications", 9],
  ["Nature Energy", 4],
  ["Nature Materials", 4],
  ["PNAS", 8],
  ["JACS", 8],
  ["Advanced Materials", 9],
  ["Physical Review Letters", 8],
  ["Angewandte Chemie", 6],
  ["ACS Nano", 6],
  ["Advanced Energy Materials", 5],
  ["Chemical Science", 5],
  ["IEEE TPAMI", 4],
  ["Nucleic Acids Research", 3],
];

// 계절성: 특정 시기(3월·9월 학기 초 등)에 신청이 몰리도록 월별 가중치
function seasonalWeight(month1to12: number): number {
  const map: Record<number, number> = {
    1: 0.6, 2: 0.8, 3: 1.9, 4: 1.4, 5: 1.1, 6: 0.9,
    7: 0.6, 8: 0.7, 9: 2.0, 10: 1.5, 11: 1.1, 12: 0.8,
  };
  return map[month1to12] ?? 1;
}

function titleFor(type: RequestType, dept: string) {
  const name = pick(NAMES);
  const title = pick(TITLES);
  switch (type) {
    case "RESEARCH":
      return `${dept} 연구팀, ${pick(RESEARCH_TOPICS)} 규명`;
    case "AWARD":
      return `${name} ${title}, ${pick(AWARDS)} 수상`;
    case "EVENT":
      return `${pick(EVENTS)} 개최`;
    case "APPOINTMENT":
      return `${name} ${title}, ${pick(COMMITTEES)} 위원 선임`;
    case "PERSONAL_NEWS":
      return `${name} ${title}, ${pick(ACTIVITIES)}`;
    default:
      return `POSTECH, ${pick(MISC)}`;
  }
}

// createdAt: 최근 24개월. 전년 대비(YoY) 비교가 가능하도록 2년치를 생성하되,
// 올해로 갈수록 증가(성장 추세) + 3월·9월 등 계절성 반영.
function randomCreatedAt() {
  const now = new Date();
  const pairs: [number, number][] = [];
  for (let i = 0; i < 24; i++) {
    // i=0 → 23개월 전, i=23 → 이번 달
    const d = new Date(now.getFullYear(), now.getMonth() - (23 - i), 1);
    const growth = 1 + i * 0.09; // 최근일수록 증가
    pairs.push([i, growth * seasonalWeight(d.getMonth() + 1)]);
  }
  const mi = weighted(pairs);
  const base = new Date(now.getFullYear(), now.getMonth() - (23 - mi), 1);
  base.setDate(randInt(1, 28));
  base.setHours(randInt(8, 19), randInt(0, 59));
  if (base > now) base.setTime(now.getTime() - randInt(1, 5) * 3600000);
  return base;
}

async function main() {
  // On Vercel builds we seed only when the database is still empty, so that
  // redeploys don't wipe data. Local `npm run db:seed` always reseeds.
  if (process.env.SEED_ONLY_IF_EMPTY === "1") {
    const existing = await prisma.user.count().catch(() => 0);
    if (existing > 0) {
      console.log(`↺ Seed skipped — database already has ${existing} users.`);
      return;
    }
  }

  console.log("🌱 Seeding PressFlow (≈320 requests)...");

  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.checklistItem.deleteMany(),
    prisma.attachment.deleteMany(),
    prisma.pressReleaseVersion.deleteMany(),
    prisma.pressRelease.deleteMany(),
    prisma.researchDetail.deleteMany(),
    prisma.awardDetail.deleteMany(),
    prisma.appointmentDetail.deleteMany(),
    prisma.personalNewsDetail.deleteMany(),
    prisma.eventDetail.deleteMany(),
    prisma.pressRequest.deleteMany(),
    prisma.user.deleteMany(),
    prisma.newsItem.deleteMany(),
    prisma.newsKeyword.deleteMany(),
    prisma.adSpend.deleteMany(),
  ]);

  // ── Users ────────────────────────────────────────────────────────────────
  // 고정 ID: DB를 다시 시드해도 로그인 쿠키가 무효화되지 않도록 (리다이렉트 루프 방지)
  const manager = await prisma.user.create({
    data: { id: "u_manager", email: "pr.manager@postech.ac.kr", name: "전홍보", phone: "010-5555-6666", department: "대외협력팀", role: "PR_MANAGER" },
  });
  const admin = await prisma.user.create({
    data: { id: "u_admin", email: "admin@postech.ac.kr", name: "관리자", department: "대외협력팀", role: "ADMIN" },
  });
  const applicant1 = await prisma.user.create({
    data: { id: "u_kim", email: "prof.kim@postech.ac.kr", name: "김연구", phone: "010-1111-2222", department: "화학공학과", role: "APPLICANT" },
  });
  const applicant2 = await prisma.user.create({
    data: { id: "u_lee", email: "prof.lee@postech.ac.kr", name: "이교수", phone: "010-3333-4444", department: "물리학과", role: "APPLICANT" },
  });
  // 다양성용 추가 신청자
  const extraApplicants = [];
  for (let i = 0; i < 6; i++) {
    const dept = weighted(DEPARTMENTS);
    extraApplicants.push(
      await prisma.user.create({
        data: { email: `applicant${i}@postech.ac.kr`, name: pick(NAMES), department: dept, role: "APPLICANT" },
      }),
    );
  }
  const applicants = [applicant1, applicant2, ...extraApplicants];

  async function seedChecklist(pressRequestId: string, type: RequestType) {
    const items = CHECKLIST_TEMPLATES[type];
    await prisma.checklistItem.createMany({
      data: items.map((it) => ({ pressRequestId, key: it.key, label: it.label })),
    });
  }

  // ── Hero 상세 신청 (연구성과 - 오늘 배포 포함) ─────────────────────────────
  const heroDept = "생명과학과";
  const hero = await prisma.pressRequest.create({
    data: {
      type: "RESEARCH",
      status: "KOREAN_FINAL_CONFIRMED",
      title: "노화 관련 단백질의 새로운 조절 경로 발견",
      applicantId: applicant1.id,
      department: heroDept,
      contactPhone: applicant1.phone,
      submittedAt: new Date(Date.now() - 5 * 86400000),
      research: {
        create: {
          paperTitleKo: "세포 노화 조절 단백질 네트워크 규명",
          paperTitleEn: "Regulatory protein network controlling cellular senescence",
          correspondingAuthorName: applicant1.name,
          correspondingAuthorDepartment: heroDept,
          firstAuthorName: "정제일저자",
          journalName: "Cell",
          publishedDate: new Date(Date.now() - 10 * 86400000),
          doi: "10.1000/example.cell",
          fundingInfo: "한국연구재단 중견연구자지원사업",
        },
      },
    },
  });
  await seedChecklist(hero.id, "RESEARCH");
  await prisma.pressRelease.create({
    data: {
      pressRequestId: hero.id,
      language: "KO",
      title: hero.title,
      subtitle: "Cell 게재… 노화 제어 후속 연구 기대",
      body: "POSTECH 생명과학과 연구팀은 세포 노화를 조절하는 새로운 단백질 네트워크를 규명했다.",
      summary: "- 게재 저널: Cell\n- 교신저자: 김연구",
      isFinal: true,
      createdById: manager.id,
    },
  });

  // 두 번째 오늘 배포 건 (수상)
  const hero2 = await prisma.pressRequest.create({
    data: {
      type: "AWARD",
      status: "SCHEDULED",
      title: "최수상 교수, 젊은과학자상 수상",
      applicantId: applicant2.id,
      department: "컴퓨터공학과",
      submittedAt: new Date(Date.now() - 3 * 86400000),
      award: {
        create: {
          awardName: "젊은과학자상",
          awardeeName: "최수상",
          awardeeDepartment: "컴퓨터공학과",
          awardeeTitle: "교수",
          awardingOrganization: "한국과학기술한림원",
          ceremonyDate: new Date(Date.now() + 5 * 86400000),
        },
      },
    },
  });
  await seedChecklist(hero2.id, "AWARD");
  await prisma.pressRelease.create({
    data: {
      pressRequestId: hero2.id, language: "KO",
      title: hero2.title, subtitle: "한국과학기술한림원 시상",
      isFinal: false, createdById: manager.id,
    },
  });

  // ── Bulk ~318건 (24개월치, YoY 비교용) ──────────────────────────────────────
  const TARGET = 320;
  const created = 2;
  for (let i = created; i < TARGET; i++) {
    const type = weighted(TYPE_WEIGHTS);
    const status = weighted(STATUS_WEIGHTS);
    const dept = weighted(DEPARTMENTS);
    const applicant = pick(applicants);
    const createdAt = randomCreatedAt();
    const isDraft = status === "DRAFT";
    const submittedAt = isDraft ? null : new Date(createdAt.getTime() + randInt(0, 2) * 86400000);
    const completedAt = status === "FINAL_COMPLETED" ? new Date(createdAt.getTime() + randInt(5, 20) * 86400000) : null;
    const distributedAt = status === "DISTRIBUTED" ? new Date(createdAt.getTime() + randInt(7, 25) * 86400000) : null;
    // 배포일정(예상 배포일)은 더미로 채우지 않음 — 사용자가 업로드/입력한 건만 달력에 표시
    const expectedPublishDate: Date | null = null;

    await prisma.pressRequest.create({
      data: {
        type,
        status,
        title: titleFor(type, dept),
        applicantId: applicant.id,
        department: dept,
        isUrgent: Math.random() < 0.08,
        createdAt,
        updatedAt: submittedAt ?? createdAt,
        submittedAt,
        completedAt,
        distributedAt,
        expectedPublishDate,
        // 연구성과는 저널명을 부여해 '연구성과 저널 게재 현황' 집계가 가능하도록
        ...(type === "RESEARCH"
          ? { research: { create: { journalName: weighted(JOURNALS) } } }
          : {}),
      },
    });
  }

  // ── News ───────────────────────────────────────────────────────────────────
  for (const kw of ["포스텍", "POSTECH", "포항공과대학교", "포항공대"]) {
    await prisma.newsKeyword.create({ data: { keyword: kw } });
  }
  const media = ["연합뉴스", "동아사이언스", "한국경제", "매일경제", "조선일보", "경북일보", "전자신문"];
  const keywords = ["포스텍", "POSTECH", "포항공과대학교", "포항공대"];
  for (let i = 0; i < 16; i++) {
    const kw = keywords[i % keywords.length];
    await prisma.newsItem.create({
      data: {
        title: `${kw} 연구팀, ${pick(RESEARCH_TOPICS)} 성과 발표… 학계 주목`,
        mediaName: media[i % media.length],
        publishedAt: new Date(Date.now() - i * 8 * 3600000),
        url: `https://news.example.com/${encodeURIComponent(kw)}/${i + 1}`,
        summary: `${kw}가 발표한 연구 성과가 국내외 언론의 주목을 받고 있다.`,
        keyword: kw,
        isImportant: i < 3,
      },
    });
  }

  await prisma.notification.create({
    data: { userId: manager.id, type: "SUBMITTED", title: "새 홍보 신청", message: "새로운 홍보 신청이 접수되었습니다." },
  });

  // 광고비 집행 내역은 더미로 채우지 않음 — 사용자가 '광고비 집행' 메뉴에서 직접 등록/업로드.

  const total = await prisma.pressRequest.count();
  console.log(`✅ Seed complete. 총 신청 ${total}건`);
  console.log("   담당자: pr.manager@postech.ac.kr / 신청자: prof.kim@postech.ac.kr / 관리자: admin@postech.ac.kr");
  console.log("   (데모 로그인은 이메일만 입력, 비밀번호 없음)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
