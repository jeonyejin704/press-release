// 뉴스 매체 호스트 → 한글 매체명 매핑. 알려진 매체는 한글명 + '별색(붉은색)' 처리.
const MEDIA_MAP: Record<string, string> = {
  "etnews.com": "전자신문",
  "mk.co.kr": "매일경제",
  "yna.co.kr": "연합뉴스",
  "yonhapnews.co.kr": "연합뉴스",
  "chosun.com": "조선일보",
  "donga.com": "동아일보",
  "dongascience.com": "동아사이언스",
  "joongang.co.kr": "중앙일보",
  "joins.com": "중앙일보",
  "hani.co.kr": "한겨레",
  "khan.co.kr": "경향신문",
  "hankyung.com": "한국경제",
  "sedaily.com": "서울경제",
  "edaily.co.kr": "이데일리",
  "mt.co.kr": "머니투데이",
  "fnnews.com": "파이낸셜뉴스",
  "asiae.co.kr": "아시아경제",
  "newsis.com": "뉴시스",
  "news1.kr": "뉴스1",
  "hellodd.com": "헬로디디",
  "dt.co.kr": "디지털타임스",
  "zdnet.co.kr": "지디넷코리아",
  "kbs.co.kr": "KBS",
  "imbc.com": "MBC",
  "sbs.co.kr": "SBS",
  "ytn.co.kr": "YTN",
  "jtbc.co.kr": "JTBC",
  "kmib.co.kr": "국민일보",
  "seoul.co.kr": "서울신문",
  "munhwa.com": "문화일보",
  "hankookilbo.com": "한국일보",
  "segye.com": "세계일보",
  "kyeongin.com": "경인일보",
  "kbmaeil.com": "경북매일",
  "kyongbuk.co.kr": "경북일보",
  "kyongbuk.com": "경북일보",
  "imaeil.com": "매일신문",
  "yeongnam.com": "영남일보",
  "idaegu.com": "대구일보",
  "veritas-a.com": "베리타스알파",
  "unn.net": "한국대학신문",
  "news.unn.net": "한국대학신문",
  "dhnews.co.kr": "대학저널",
  "kukinews.com": "쿠키뉴스",
  "newspim.com": "뉴스핌",
  "ajunews.com": "아주경제",
  "biz.chosun.com": "조선비즈",
  "wowtv.co.kr": "한국경제TV",
  "moef.go.kr": "기획재정부",
  "moe.go.kr": "교육부",
  "msit.go.kr": "과학기술정보통신부",
};

function normHost(h: string): string {
  return h.toLowerCase().replace(/^www\./, "").replace(/^m\./, "").replace(/^n\./, "");
}

// stored mediaName 은 hostOf(originallink) (예: "etnews.com").
export function mediaLabel(hostOrName?: string | null): { name: string; known: boolean } {
  if (!hostOrName) return { name: "", known: false };
  const h = normHost(hostOrName.trim());
  if (MEDIA_MAP[h]) return { name: MEDIA_MAP[h], known: true };
  // 서브도메인 등 부분 일치
  for (const [k, v] of Object.entries(MEDIA_MAP)) {
    if (h === k || h.endsWith("." + k)) return { name: v, known: true };
  }
  // 알 수 없는 호스트: 원래 표기를 그대로(회색)
  return { name: hostOrName, known: false };
}
