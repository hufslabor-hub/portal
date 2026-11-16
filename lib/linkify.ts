export type Part = { text: string; href?: string };

// 주소로 인식할 글자: 영문·숫자·주소에 쓰는 기호만(한글 조사가 바로 붙어도 주소에 딸려 들어가지 않음)
const URL_RE = /((?:https?:\/\/|www\.)[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+)/gi;

/** 채팅 글을 '글자'와 '링크' 조각으로 나눔. http(s)://, www. 로 시작하는 주소만 링크로 만들어 다른 형식(javascript: 등)은 막음 */
export function splitLinks(input: string): Part[] {
  const parts: Part[] = [];
  let last = 0, m: RegExpExecArray | null;
  URL_RE.lastIndex = 0;
  while ((m = URL_RE.exec(input))) {
    let url = m[1];
    // 주소 경로에 한글이 들어 있는 경우(예: .../wiki/한국)는 한글까지 주소로 봄. 단, 주소 뒤에 조사가 바로 붙은 경우(.../about입니다)는 주소에서 제외
    const next = input[m.index + m[1].length];
    if (next && /[가-힣]/.test(next) && /[/_\-=.]$/.test(m[1])) url += input.slice(m.index + m[1].length).match(/^\S+/)?.[0] ?? '';
    // 문장 끝의 부호는 주소에서 제외(괄호는 짝이 맞으면 주소의 일부로 봄)
    for (;;) {
      const c = url[url.length - 1];
      if (c && '.,;:!?\'"'.includes(c)) url = url.slice(0, -1);
      else if (c === ')' && (url.match(/\(/g)?.length ?? 0) < (url.match(/\)/g)?.length ?? 0)) url = url.slice(0, -1);
      else if (c === ']') url = url.slice(0, -1);
      else break;
    }
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    let ok = false;
    try { const u = new URL(href); ok = (u.protocol === 'http:' || u.protocol === 'https:') && u.hostname.includes('.'); } catch { /* 올바른 주소가 아님 */ }
    if (!ok) continue;
    if (m.index > last) parts.push({ text: input.slice(last, m.index) });
    parts.push({ text: url, href });
    last = m.index + url.length;
    URL_RE.lastIndex = last;
  }
  if (last < input.length) parts.push({ text: input.slice(last) });
  return parts.length ? parts : [{ text: input }];
}
