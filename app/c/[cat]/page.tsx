import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CATEGORIES, getPosts, isCat } from '@/lib/content';

export const revalidate = 300;

export default async function Category({ params }: { params: Promise<{ cat: string }> }) {
  const { cat } = await params;
  if (!isCat(cat)) notFound();
  const posts = await getPosts(cat, 50);
  return (
    <>
      <h1>{CATEGORIES[cat]}</h1>
      <ul className="list">
        {posts.map((p) => (
          <li key={p.id}><Link href={`/p/${p.id}`}>{p.title}</Link><time>{p.createdAt.slice(0, 10)}</time></li>
        ))}
        {!posts.length && <li>게시글이 없습니다.</li>}
      </ul>
    </>
  );
}
