// 대한민국 공휴일.
//  · 양력 고정 공휴일 → 매년 자동
//  · 음력 명절(설날·추석·부처님오신날) → '당일' 양력 날짜만 표로 두고,
//    연휴(±1일)와 대체공휴일은 코드가 규칙대로 계산한다.
//  ※ 음력 당일 날짜는 발표 기준이며, 2031년 이후는 추정치가 섞여 있어 확정 시 보정이 필요할 수 있음.

// 양력 고정 공휴일 (월-일)
const FIXED: Record<string, string> = {
  "1-1": "신정",
  "3-1": "삼일절",
  "5-5": "어린이날",
  "6-6": "현충일",
  "8-15": "광복절",
  "10-3": "개천절",
  "10-9": "한글날",
  "12-25": "크리스마스",
};

// 음력 명절 '당일' 양력 날짜 [월, 일]
type Main = { seollal: [number, number]; chuseok: [number, number]; buddha: [number, number] };
const LUNAR_MAIN: Record<number, Main> = {
  2024: { seollal: [2, 10], chuseok: [9, 17], buddha: [5, 15] },
  2025: { seollal: [1, 29], chuseok: [10, 6], buddha: [5, 5] },
  2026: { seollal: [2, 17], chuseok: [9, 25], buddha: [5, 24] },
  2027: { seollal: [2, 6], chuseok: [9, 15], buddha: [5, 13] },
  2028: { seollal: [1, 26], chuseok: [10, 3], buddha: [5, 2] },
  2029: { seollal: [2, 13], chuseok: [9, 22], buddha: [5, 20] },
  2030: { seollal: [2, 3], chuseok: [9, 12], buddha: [5, 9] },
  2031: { seollal: [1, 23], chuseok: [10, 1], buddha: [5, 28] },
  2032: { seollal: [2, 11], chuseok: [9, 19], buddha: [5, 16] },
  2033: { seollal: [1, 31], chuseok: [9, 8], buddha: [5, 6] },
  2034: { seollal: [2, 19], chuseok: [9, 27], buddha: [5, 25] },
  2035: { seollal: [2, 8], chuseok: [9, 16], buddha: [5, 15] },
};

// 알고리즘으로 못 잡는 특례(임시공휴일·선거일·중복 대체 등)
const EXTRA: Record<number, Record<string, string>> = {
  2024: { "4-10": "국회의원선거" },
  2025: { "1-27": "임시공휴일", "5-6": "대체공휴일" },
};

// 토/일과 겹치면 대체공휴일이 지정되는 공휴일
const SUBSTITUTABLE = new Set([
  "삼일절", "어린이날", "부처님오신날", "어린이날·부처님오신날",
  "광복절", "개천절", "한글날", "크리스마스",
  "설날", "설날 연휴", "추석", "추석 연휴",
]);

// 해당 연도의 공휴일 맵: "월-일" → 이름
export function getHolidays(year: number): Record<string, string> {
  const map: Record<string, string> = { ...FIXED };
  const key = (d: Date) => `${d.getMonth() + 1}-${d.getDate()}`;
  const addDate = (d: Date, name: string) => { if (d.getFullYear() === year) map[key(d)] = name; };
  const dayOffset = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

  const L = LUNAR_MAIN[year];
  if (L) {
    const seol = new Date(year, L.seollal[0] - 1, L.seollal[1]);
    addDate(dayOffset(seol, -1), "설날 연휴");
    addDate(seol, "설날");
    addDate(dayOffset(seol, 1), "설날 연휴");

    const chu = new Date(year, L.chuseok[0] - 1, L.chuseok[1]);
    addDate(dayOffset(chu, -1), "추석 연휴");
    addDate(chu, "추석");
    addDate(dayOffset(chu, 1), "추석 연휴");

    const budK = `${L.buddha[0]}-${L.buddha[1]}`;
    map[budK] = map[budK] === "어린이날" ? "어린이날·부처님오신날" : "부처님오신날";
  }

  // 대체공휴일: 대상 공휴일이 토/일이면 다음 평일(공휴일 아닌)에 대체 지정
  const inOrder = Object.keys(map)
    .map((k) => { const [m, d] = k.split("-").map(Number); return { m, d }; })
    .sort((a, b) => a.m - b.m || a.d - b.d);
  for (const { m, d } of inOrder) {
    const name = map[`${m}-${d}`];
    if (!SUBSTITUTABLE.has(name)) continue;
    const wd = new Date(year, m - 1, d).getDay();
    if (wd !== 0 && wd !== 6) continue; // 평일이면 대체 없음
    let n = new Date(year, m - 1, d + 1);
    while (n.getFullYear() === year) {
      const nwd = n.getDay();
      if (nwd !== 0 && nwd !== 6 && !map[key(n)]) { map[key(n)] = "대체공휴일"; break; }
      n = dayOffset(n, 1);
    }
  }

  // 특례 덮어쓰기(임시공휴일 등)
  Object.assign(map, EXTRA[year] ?? {});
  return map;
}

export function holidayName(year: number, month1to12: number, day: number): string | null {
  return getHolidays(year)[`${month1to12}-${day}`] ?? null;
}
