import Link from 'next/link';
import { CATEGORIES, getPosts, type Cat } from '@/lib/content';

export const revalidate = 300;

export default async function Home() {
  const keys: Cat[] = ['notice', 'news', 'bargaining'];
  const lists = await Promise.all(keys.map((k) => getPosts(k, 4)));
  return (
    <>
      <section className="hero"><div className="wrap">
        <h1>함께 일하는 사람들의<br /><em>목소리</em>, 한국외대 노동조합</h1>
        <p>공고와 교섭 소식을 가장 먼저 확인하세요.</p>
        <div className="btns">
          <a className="btn" href="tel:0221732611">전화 문의</a>
          <a className="btn ghost" href="https://pf.kakao.com/_Pxnjxkxj" rel="noopener noreferrer">카카오 채널</a>
        </div>
      </div></section>
      <main><div className="wrap">
        <div className="quick">
          {[['/page/agreement', '단체협약'], ['/page/bylaws', '규약'], ['/c/forms', '양식'], ['/page/about', '조합소개']].map(([h, n]) => <Link key={h} href={h}>{n}</Link>)}
        </div>
        {keys.map((k, i) => (
          <section key={k}>
            <h2 className="sec">{CATEGORIES[k]}<Link href={`/c/${k}`}>더보기 →</Link></h2>
            <ul className="cards">
              {lists[i].map((p) => <li key={p.id}><Link href={`/p/${p.id}`}><b>{p.title}</b><time>{p.createdAt.slice(0, 10)}</time></Link></li>)}
            </ul>
          </section>
        ))}
      </div></main>
    </>
  );
}
