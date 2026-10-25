export type Doc = { title: string; url: string; org: string; year: string };

const MD_LINK = /\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g;
const HTML_LINK = /<a\s[^>]*href="(https:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
const RENAME: Record<string, string> = { '연구협력산학단': '연구산학협력단' };
const ORDER = ['한국외국어대학교', '연구산학협력단', '후생파트', '지식출판콘텐츠원'];
const rank = (o: string) => { const i = ORDER.indexOf(o); return i < 0 ? 99 : i; };
const unesc = (t: string) => t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');

/** 본문에서 문서 링크를 뽑아 '조직 / 학년도'로 나눔. 나머지 글은 rest로 돌려줌. */
export function extractDocs(body: string): { docs: Doc[]; rest: string } {
  const docs: Doc[] = [];
  const add = (rawTitle: string, rawUrl: string) => {
    const title = unesc(rawTitle.replace(/<[^>]+>/g, '')).trim(), url = unesc(rawUrl);
    const y = title.match(/(\d{4})(?:\s*[_~\-]\s*(\d{4}))?\s*학년도/);
    const year = y ? (y[2] ? `${y[1]}~${y[2]}학년도` : `${y[1]}학년도`) : '';
    const org = title.replace(/\d{4}(?:\s*[_~\-]\s*\d{4})?\s*학년도/g, '').replace(/단체협약서?/g, '').replace(/[_\-]+/g, ' ').trim();
    const name = org || title;
    docs.push({ title, url, org: RENAME[name] ?? name, year });
    return '';
  };
  const rest = body
    .replace(HTML_LINK, (_m, url: string, t: string) => add(t, url))
    .replace(MD_LINK, (_m, t: string, url: string) => add(t, url))
    .replace(/<p[^>]*>\s*<\/p>/g, '').trim();
  docs.sort((a, b) => rank(a.org) - rank(b.org) || b.year.localeCompare(a.year) || a.org.localeCompare(b.org, 'ko'));
  return { docs, rest };
}

export default function DocGrid({ docs }: { docs: Doc[] }) {
  return (
    <div className="docs">
      {docs.map((d) => (
        <article key={d.url} className="doc">
          {d.year && <span className="docyear">{d.year}</span>}
          <h3>{d.org}</h3>
          <p className="meta">단체협약서</p>
          <a className="btn sm" href={d.url} target="_blank" rel="noopener noreferrer">PDF 열기</a>
        </article>
      ))}
    </div>
  );
}
