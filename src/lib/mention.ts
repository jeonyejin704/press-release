// 기사 제목/요약에서 언급된 '사람'을 추출한다(휴리스틱).
// '교수' 앞이라고 무조건 이름이 아니므로, 한국 성씨로 시작하는 실제 이름만 인정하고,
// 이름과 직함 사이에 소속(학과/연구소 등)이 끼어 있어도 인식한다.
// 예) "김범만 신소재공학과 교수" → "김범만 교수"
//     "삼성호암상 총상금" → 없음(성씨 아님)

// 흔한 한국 성씨(한 글자)
const SURNAMES = new Set(
  "김이박최정강조윤장임한오서신권황안송류전홍고문양손배백허유남심노하곽성차주우구민진지엄채원천방공현함변염여추도소석선설마길위연표명기반왕금옥육인맹제탁국어은편용예봉".split(""),
);
// 두 글자 성씨
const TWO_CHAR_SURNAMES = ["남궁", "황보", "제갈", "선우", "독고", "사공", "서문", "동방", "西門"];

// 직함(사람임을 강하게 시사)
const TITLE =
  "(교수님|석좌교수|특임교수|명예교수|겸임교수|부교수|조교수|교수|박사과정|박사|부총장|총장|학장|원장|소장|연구위원|연구교수|연구원|대표|원사|이사장|회장)";
// 이름 + (선택: 소속 단어) + 직함
const RE = new RegExp(
  `([가-힣]{2,3})\\s?(?:[가-힣]+(?:학과|학부|대학|대학원|연구소|연구원|연구단|연구센터|센터|연구팀|팀|부서|본부|과)\\s?)?${TITLE}`,
  "g",
);

function isName(name: string): boolean {
  if (TWO_CHAR_SURNAMES.includes(name.slice(0, 2))) return true;
  return SURNAMES.has(name[0]);
}

export function mentionedPerson(...texts: (string | undefined | null)[]): string | null {
  const text = texts.filter(Boolean).join(" ");
  if (!text) return null;
  RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = RE.exec(text)) !== null) {
    const name = m[1];
    if (!isName(name)) continue;
    const title = m[2] === "교수님" ? "교수" : m[2];
    return `${name} ${title}`;
  }
  return null;
}
