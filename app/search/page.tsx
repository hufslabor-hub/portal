import Link from 'next/link';
import { CATEGORIES, PAGE_SIZE, getSearchIndex, isCat, type Cat } from '@/lib/content';
import { getRole } from '@/lib/auth';
import { getLocks, isLocked } from '@/lib/locks';
import Pager from '@/components/Pager';

export const dynamic = 'force-dynamic';
export const metadata = { title: '검색' };

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string; cat?: string; page?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim().slice(0, 60);
  const [role, locks] = await Promise.all([getRole(true), getLocks()]);
  // 로그인하지 않은 사람에게는 조합원 전용 게시판의 글을 검색 결과에도 보여 주지 않음
  const cats = (Object.keys(CATEGORIES) as Cat[]).filter((c) => role || !isLocked(`/c/${c}`, locks));
  const cat = sp.cat && isCat(sp.cat) && cats.includes(sp.cat) ? sp.cat : '';
  const page = Math.max(1, Math.min(500, Number(sp.page) || 1));
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 5);

  const hits = tokens.length
    ? (await getSearchIndex()).filter((d) => cats.includes(d.category) && (!cat || d.category === cat)
        && tokens.every((t) => d.title.toLowerCase().includes(t) || d.text.toLowerCase().includes(t)))
    : [];
  const pages = Math.max(1, Math.ceil(hits.length / PAGE_SIZE));
  const cur = Math.min(page, pages);
  const shown = hits.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE);
  const snippet = (text: string) => {
    const i = text.toLowerCase().indexOf(tokens[0]);
    if (i < 0) return text.slice(0, 110);
    return (i > 40 ? '…' : '') + text.slice(Math.max(0, i - 40), i + 90) + (text.length > i + 90 ? '…' : '');
  };

  return (
    <main><div className="wrap">
      <h1 className="pt">검색</h1>
      <form className="search" role="search">
        <input name="q" defaultValue={q} maxLength={60} placeholder="제목·본문 검색" aria-label="검색어" />
        <select name="cat" defaultValue={cat} aria-label="게시판">
          <option value="">전체</option>
          {cats.map((c) => <option key={c} value={c}>{CATEGORIES[c]}</option>)}
        </select>
        <button className="btn sm">검색</button>
      </form>
      {!tokens.length ? <p className="meta" style={{ whiteSpace: 'normal' }}>제목과 본문(앞부분)에서 찾습니다. 단어를 띄어 쓰면 모두 포함된 글만 나옵니다.</p>
        : <p className="meta" role="status">‘{q}’ 검색 결과 {hits.length}건</p>}
      <ul className="cards">
        {shown.map((d) => (
          <li key={d.id}>
            <Link href={`/p/${d.id}`}>
              <div><b>{d.title}</b><span className="excerpt">{snippet(d.text)}</span><time>{CATEGORIES[d.category]} · {d.createdAt.slice(0, 10)}</time></div>
            </Link>
          </li>
        ))}
        {tokens.length > 0 && !hits.length && <li className="meta">검색 결과가 없습니다.</li>}
      </ul>
      <Pager base={`/search?q=${encodeURIComponent(q)}${cat ? `&cat=${cat}` : ''}`} page={cur} pages={pages} />
    </div></main>
  );
}
