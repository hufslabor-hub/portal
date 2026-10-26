import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CATEGORIES, getPosts, isCat } from '@/lib/content';
import { requireUnlocked } from '@/lib/locks';

export const dynamic = 'force-dynamic';

export default async function Category({ params }: { params: Promise<{ cat: string }> }) {
  const { cat } = await params;
  if (!isCat(cat)) notFound();
  await requireUnlocked(`/c/${cat}`);
  const posts = await getPosts(cat, 50);
  return (
    <main><div className="wrap">
      <div className="chips">{Object.entries(CATEGORIES).map(([k, n]) => <Link key={k} href={`/c/${k}`} className={k === cat ? 'on' : ''}>{n}</Link>)}</div>
      <h1 className="pt">{CATEGORIES[cat]}</h1>
      <ul className="cards">
        {posts.map((p) => <li key={p.id}><Link href={`/p/${p.id}`}><b>{p.title}</b><time>{p.createdAt.slice(0, 10)}</time></Link></li>)}
        {!posts.length && <li className="meta">게시글이 없습니다.</li>}
      </ul>
    </div></main>
  );
}
