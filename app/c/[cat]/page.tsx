import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CATEGORIES, PAGE_SIZE, getPostsPage, isCat } from '@/lib/content';
import { requireUnlocked } from '@/lib/locks';
import Pager from '@/components/Pager';

export const dynamic = 'force-dynamic';

export default async function Category({ params, searchParams }: { params: Promise<{ cat: string }>; searchParams: Promise<{ page?: string }> }) {
  const { cat } = await params;
  const sp = await searchParams;
  if (!isCat(cat)) notFound();
  await requireUnlocked(`/c/${cat}`);
  const page = Math.max(1, Math.min(500, Number(sp.page) || 1));
  const { posts, total } = await getPostsPage(cat, page);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const thumbs = cat === 'letter' || cat === 'newsletter';   // 위원장 서신·뉴스레터는 첫 이미지를 썸네일로
  return (
    <main><div className="wrap">
      <div className="chips">{Object.entries(CATEGORIES).map(([k, n]) => <Link key={k} href={`/c/${k}`} className={k === cat ? 'on' : ''}>{n}</Link>)}</div>
      <div className="bar"><h1 className="pt">{CATEGORIES[cat]}</h1><Link className="btn sm ghost" href={`/search?cat=${cat}`}>🔍 검색</Link></div>
      <ul className="cards">
        {posts.map((p) => (
          <li key={p.id}>
            <Link href={`/p/${p.id}`} className={thumbs && p.thumb ? 'withthumb' : undefined}>
              {thumbs && p.thumb && <img className="thumb" src={p.thumb} alt="" loading="lazy" decoding="async" />}
              <div><b>{p.title}</b>{p.excerpt && <span className="excerpt">{p.excerpt}</span>}<time>{p.createdAt.slice(0, 10)}</time></div>
            </Link>
          </li>
        ))}
        {!posts.length && <li className="meta">게시글이 없습니다.</li>}
      </ul>
      <Pager base={`/c/${cat}`} page={Math.min(page, pages)} pages={pages} />
    </div></main>
  );
}
