import Link from 'next/link';
import { CATEGORIES, getPosts, type Cat } from '@/lib/content';
import { getRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const role = await getRole(true);
  const keys: Cat[] = role ? ['notice', 'news', 'bargaining'] : ['notice'];
  const lists = await Promise.all(keys.map((k) => getPosts(k, 4)));
  const lock = role ? '' : ' 🔒';
  return (
    <>
      <section className="hero"><div className="wrap">
        <h1>함께 일하는 사람들의<br /><em>목소리</em>, 한국외대 노동조합</h1>
        <p>공고와 교섭 소식을 가장 먼저 확인하세요.</p>
        <div className="btns">
          <a className="btn insta" href="https://www.instagram.com/hufs_labor_union/" target="_blank" rel="noopener noreferrer">인스타그램</a>
          <a className="btn kakao" href="https://pf.kakao.com/_Pxnjxkxj" rel="noopener noreferrer">카카오톡 채널</a>
        </div>
      </div></section>
      <main><div className="wrap">
        <div className="quick">
          <Link href="/page/agreement">단체협약{lock}</Link><Link href="/page/bylaws">규약{lock}</Link>
          <Link href="/c/forms">양식</Link><Link href="/page/about">조합소개</Link>
        </div>
        {keys.map((k, i) => (
          <section key={k}>
            <h2 className="sec">{CATEGORIES[k]}<Link href={`/c/${k}`}>더보기 →</Link></h2>
            <ul className="cards">
              {lists[i].map((p) => <li key={p.id}><Link href={`/p/${p.id}`}><b>{p.title}</b><time>{p.createdAt.slice(0, 10)}</time></Link></li>)}
            </ul>
          </section>
        ))}
        {!role && (
          <section>
            <h2 className="sec">조합원 전용</h2>
            <ul className="cards"><li><Link href="/login"><b>🔒 로그인하고 우리소식 · 임단협뉴스 · 단체협약 · 규약 보기</b><time>조합원 로그인 / 가입 신청</time></Link></li></ul>
          </section>
        )}
      </div></main>
    </>
  );
}
