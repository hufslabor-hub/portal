import Link from 'next/link';
import { CATEGORIES, getPosts, type Cat } from '@/lib/content';

export const revalidate = 300;

export default async function Home() {
  const keys: Cat[] = ['notice', 'news', 'bargaining'];
  const lists = await Promise.all(keys.map((k) => getPosts(k, 5)));
  return (
    <>
      <h1>한국외국어대학교 노동조합</h1>
      {keys.map((k, i) => (
        <section key={k}>
          <h2><Link href={`/c/${k}`}>{CATEGORIES[k]} →</Link></h2>
          <ul className="list">
            {lists[i].map((p) => (
              <li key={p.id}><Link href={`/p/${p.id}`}>{p.title}</Link><time>{p.createdAt.slice(0, 10)}</time></li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
