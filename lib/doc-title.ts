/**
 * 단체협약 링크 글자에서 학년도·조직 이름을 뽑음. (권장 형식: "2024학년도 단체협약서_조직이름")
 * 인식하는 학년도: 2024학년도 · 2024년도 · 2024년 · 2024~2025학년도 · 2022_2023학년도 · 2024-2025학년도
 * 학년도를 못 찾으면 year는 빈 문자열, 조직 이름이 비면 org도 빈 문자열(호출한 쪽에서 링크 글자 전체를 대신 씀).
 */
const YEAR = /(\d{4})(?:\s*[~∼～\-–_]\s*(\d{4}))?\s*(?:학년도|년도|년)/;

export function parseDocTitle(raw: string): { year: string; ys: number; org: string } {
  const y = raw.match(YEAR);
  const year = y ? (y[2] ? `${y[1]}~${y[2]}학년도` : `${y[1]}학년도`) : '';
  const ys = y ? Number(y[2] ?? y[1]) : 0;
  const org = raw
    .replace(/\.(pdf|hwpx?|docx?|xlsx?)$/i, '')
    .replace(new RegExp(YEAR.source, 'g'), ' ')
    .replace(/단체\s*협약서?/g, ' ')
    .replace(/[_~∼～\-–()\[\]]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return { year, ys, org };
}
