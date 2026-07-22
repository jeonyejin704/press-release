import { PrismaClient } from "@prisma/client";
import { CHECKLIST_TEMPLATES } from "../src/lib/checklist";
import type { RequestType } from "../src/lib/enums";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding PressFlow database...");

  // --- Clean (idempotent reseed) ------------------------------------------
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
  ]);

  // --- Users ---------------------------------------------------------------
  const applicant1 = await prisma.user.create({
    data: {
      email: "prof.kim@postech.ac.kr",
      name: "김연구",
      phone: "010-1111-2222",
      department: "화학공학과",
      role: "APPLICANT",
    },
  });
  const applicant2 = await prisma.user.create({
    data: {
      email: "prof.lee@postech.ac.kr",
      name: "이교수",
      phone: "010-3333-4444",
      department: "물리학과",
      role: "APPLICANT",
    },
  });
  const manager = await prisma.user.create({
    data: {
      email: "pr.manager@postech.ac.kr",
      name: "박홍보",
      phone: "010-5555-6666",
      department: "대외협력팀",
      role: "PR_MANAGER",
    },
  });
  const admin = await prisma.user.create({
    data: {
      email: "admin@postech.ac.kr",
      name: "관리자",
      department: "대외협력팀",
      role: "ADMIN",
    },
  });

  const applicants = [applicant1, applicant2];
  const departments = ["화학공학과", "물리학과", "생명과학과", "컴퓨터공학과", "신소재공학과"];

  // helper to seed checklist
  async function seedChecklist(pressRequestId: string, type: RequestType) {
    const items = CHECKLIST_TEMPLATES[type];
    for (const it of items) {
      await prisma.checklistItem.create({
        data: { pressRequestId, key: it.key, label: it.label },
      });
    }
  }

  // --- Research requests (3) ----------------------------------------------
  const researchSeeds = [
    {
      status: "PR_REVIEW",
      dept: "화학공학과",
      title: "차세대 배터리 소재의 안정성 향상 메커니즘 규명",
      paperKo: "고에너지밀도 리튬금속 배터리의 계면 안정화 전략",
      journal: "Nature Energy",
    },
    {
      status: "SUBMITTED",
      dept: "물리학과",
      title: "양자 얽힘을 이용한 정밀 측정 기술 개발",
      paperKo: "양자 센서를 활용한 초정밀 자기장 측정",
      journal: "Physical Review Letters",
    },
    {
      status: "KOREAN_FINAL_CONFIRMED",
      dept: "생명과학과",
      title: "노화 관련 단백질의 새로운 조절 경로 발견",
      paperKo: "세포 노화 조절 단백질 네트워크 규명",
      journal: "Cell",
    },
  ];

  for (let i = 0; i < researchSeeds.length; i++) {
    const s = researchSeeds[i];
    const applicant = applicants[i % applicants.length];
    const pr = await prisma.pressRequest.create({
      data: {
        type: "RESEARCH",
        status: s.status,
        title: s.title,
        applicantId: applicant.id,
        department: s.dept,
        contactPhone: applicant.phone,
        isUrgent: i === 0,
        publicDisclosureAllowed: true,
        submittedAt: new Date(Date.now() - (i + 1) * 86400000),
        // KOREAN_FINAL_CONFIRMED 건은 '오늘 배포 예정'으로 표시 (대시보드 데모용)
        expectedPublishDate:
          s.status === "KOREAN_FINAL_CONFIRMED" ? new Date() : null,
        research: {
          create: {
            paperTitleKo: s.paperKo,
            paperTitleEn: "A representative English paper title",
            correspondingAuthorName: applicant.name,
            correspondingAuthorDepartment: s.dept,
            firstAuthorName: "정제일저자",
            firstAuthorDepartment: s.dept,
            journalName: s.journal,
            publishedDate: new Date(Date.now() - (i + 5) * 86400000),
            doi: `10.1000/example.${i + 1}`,
            fundingInfo: "한국연구재단 중견연구자지원사업",
            abstract:
              "본 연구는 해당 분야의 오랜 난제를 해결하기 위한 새로운 접근법을 제시한다. 연구팀은 실험과 이론을 결합해 핵심 메커니즘을 규명했다.",
            researchBackground: "기존 기술은 안정성과 효율 사이의 상충 관계라는 한계가 있었다.",
            researchContent: "연구팀은 새로운 소재 설계 전략을 통해 이 한계를 극복했다.",
            expectedImpact: "관련 산업 및 후속 연구에 폭넓게 활용될 것으로 기대된다.",
          },
        },
      },
    });
    await seedChecklist(pr.id, "RESEARCH");

    // Korean release
    await prisma.pressRelease.create({
      data: {
        pressRequestId: pr.id,
        language: "KO",
        title: s.title,
        subtitle: `${s.journal} 게재`,
        body: `POSTECH ${s.dept} ${applicant.name} 교수 연구팀은 ${s.journal}에 관련 연구 결과를 발표했다.\n\n연구팀은 오랜 난제를 해결하기 위한 새로운 접근법을 제시했으며, 향후 다양한 분야에서 활용될 것으로 기대된다.`,
        summary: `- 게재 저널: ${s.journal}\n- 교신저자: ${applicant.name}`,
        easyExplanation: "쉽게 말하면, 기존보다 더 안정적이고 효율적인 기술을 개발한 연구입니다.",
        imageCaption: `[사진] ${applicant.name} 교수 연구팀. (제공: POSTECH)`,
        isFinal: s.status === "KOREAN_FINAL_CONFIRMED",
        createdById: manager.id,
      },
    });
  }

  // --- Award requests (2) --------------------------------------------------
  const awardSeeds = [
    { dept: "컴퓨터공학과", name: "최수상", award: "젊은 과학자상", org: "한국과학기술한림원" },
    { dept: "신소재공학과", name: "한우수", award: "우수논문상", org: "대한금속재료학회" },
  ];
  for (let i = 0; i < awardSeeds.length; i++) {
    const s = awardSeeds[i];
    const pr = await prisma.pressRequest.create({
      data: {
        type: "AWARD",
        status: i === 0 ? "SUBMITTED" : "MATERIAL_REQUESTED",
        title: `${s.name} 교수, ${s.award} 수상`,
        applicantId: applicants[i % applicants.length].id,
        department: s.dept,
        submittedAt: new Date(Date.now() - (i + 2) * 86400000),
        award: {
          create: {
            awardName: s.award,
            awardeeName: s.name,
            awardeeDepartment: s.dept,
            awardeeTitle: "교수",
            awardingOrganization: s.org,
            ceremonyDate: new Date(Date.now() + 5 * 86400000),
            ceremonyLocation: "서울 코엑스",
            awardDescription: "해당 분야의 탁월한 연구 업적을 인정받아 수상했다.",
            significance: "젊은 연구자의 우수성을 대외적으로 인정받은 사례다.",
          },
        },
      },
    });
    await seedChecklist(pr.id, "AWARD");
  }

  // --- Event requests (2) --------------------------------------------------
  const eventSeeds = [
    { dept: "대외협력팀", name: "2026 POSTECH 오픈캠퍼스", status: "SUBMITTED" },
    { dept: "컴퓨터공학과", name: "AI 국제 심포지엄", status: "PR_REVIEW" },
  ];
  for (let i = 0; i < eventSeeds.length; i++) {
    const s = eventSeeds[i];
    const pr = await prisma.pressRequest.create({
      data: {
        type: "EVENT",
        status: s.status,
        title: s.name,
        applicantId: applicants[i % applicants.length].id,
        department: s.dept,
        submittedAt: new Date(Date.now() - (i + 1) * 86400000),
        event: {
          create: {
            eventName: s.name,
            who: "POSTECH",
            when: "2026년 8월 15일",
            whereAt: "POSTECH 대강당",
            what: s.name,
            how: "현장 및 온라인 병행",
            why: "대학의 연구 성과를 대중과 공유하기 위해",
            host: "POSTECH",
            organizer: s.dept,
            participants: "일반 시민, 고등학생, 학부모",
            program: "기조강연, 연구실 투어, 체험 프로그램",
            expectedImpact: "대학과 지역사회의 교류 확대",
            contactInfo: "054-279-0000",
          },
        },
      },
    });
    await seedChecklist(pr.id, "EVENT");
  }

  // --- Appointment request (1) --------------------------------------------
  {
    const pr = await prisma.pressRequest.create({
      data: {
        type: "APPOINTMENT",
        status: "FINAL_COMPLETED",
        title: "정위원 교수, 국가과학기술자문회의 위원 선임",
        applicantId: applicant2.id,
        department: "물리학과",
        submittedAt: new Date(Date.now() - 10 * 86400000),
        completedAt: new Date(Date.now() - 2 * 86400000),
        appointment: {
          create: {
            appointeeName: "정위원",
            department: "물리학과",
            title: "교수",
            committeeName: "국가과학기술자문회의",
            organization: "대통령실",
            term: "2026.07 ~ 2028.06 (2년)",
            roleDescription: "국가 과학기술 정책 자문",
            appointmentBackground: "관련 분야의 전문성을 인정받아 선임됐다.",
            expectedImpact: "대학의 정책 기여도 제고",
          },
        },
      },
    });
    await seedChecklist(pr.id, "APPOINTMENT");
  }

  // --- News keywords + items ----------------------------------------------
  for (const kw of ["POSTECH", "포항공과대학교", "포스텍"]) {
    await prisma.newsKeyword.create({ data: { keyword: kw } });
  }
  const media = ["연합뉴스", "동아사이언스", "한국경제", "매일경제", "조선일보"];
  const keywords = ["POSTECH", "포항공과대학교", "포스텍"];
  for (let i = 0; i < 10; i++) {
    const kw = keywords[i % keywords.length];
    await prisma.newsItem.create({
      data: {
        title: `${kw} 연구팀, 새로운 성과 발표… 학계 주목 (${i + 1})`,
        mediaName: media[i % media.length],
        publishedAt: new Date(Date.now() - i * 6 * 3600000),
        url: `https://news.example.com/${encodeURIComponent(kw)}/${i + 1}`,
        summary: `${kw}가 발표한 연구 성과가 국내외 언론의 주목을 받고 있다.`,
        keyword: kw,
        isImportant: i < 2,
      },
    });
  }

  // --- A couple of notifications ------------------------------------------
  await prisma.notification.create({
    data: {
      userId: manager.id,
      type: "SUBMITTED",
      title: "새 홍보 신청",
      message: "새로운 연구성과 홍보 신청이 접수되었습니다.",
    },
  });

  console.log("✅ Seed complete.");
  console.log("   신청자:  prof.kim@postech.ac.kr / prof.lee@postech.ac.kr");
  console.log("   담당자:  pr.manager@postech.ac.kr");
  console.log("   관리자:  admin@postech.ac.kr");
  console.log("   (데모 로그인은 이메일만 입력하면 됩니다. 비밀번호 없음)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
