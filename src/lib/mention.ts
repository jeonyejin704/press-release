// 기사 제목/요약에서 언급된 '사람'을 추출한다(휴리스틱).
// 한국어 이름(2~4자) + 직함(교수/박사/총장 등) 패턴을 찾아 "이름 직함" 형태로 반환.
// 명확한 인물 언급이 없으면 null.
const PERSON_RE =
  /([가-힣]{2,4})\s?(교수님|석좌교수|특임교수|명예교수|부총장|총장|학장|원장|소장|연구원|교수|박사)/;

// 이름으로 부적절한 흔한 오매칭 방지용(직함 앞이 기관/일반명사인 경우)
const NAME_STOP = new Set(["대학교", "연구소", "연구원", "포스텍", "포항공대", "삼성전자", "부문", "본부", "위원회"]);

export function mentionedPerson(...texts: (string | undefined | null)[]): string | null {
  const text = texts.filter(Boolean).join(" ");
  if (!text) return null;
  const m = text.match(PERSON_RE);
  if (!m) return null;
  const name = m[1];
  if (NAME_STOP.has(name)) return null;
  const title = m[2].replace("교수님", "교수");
  return `${name} ${title}`;
}
