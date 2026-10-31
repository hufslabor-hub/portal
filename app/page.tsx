import Link from 'next/link';
import { CATEGORIES, getRecent, type Cat } from '@/lib/content';
import { APPLY_URL } from '@/lib/links';
import { getRole } from '@/lib/auth';
import { getLocks, isLocked } from '@/lib/locks';
import { getHomeText } from '@/lib/home-text';
import HeroTitle from '@/components/HeroTitle';

export const dynamic = 'force-dynamic';


export default async function Home() {
  const [role, locks, tx] = await Promise.all([getRole(true), getLocks(), getHomeText()]);   // tx: 관리자가 고친 메인 문구(없으면 기본 문구)
  const keys = (['notice', 'news', 'bargaining'] as Cat[]).filter((k) => role || !isLocked(`/c/${k}`, locks));
  const lists = await Promise.all(keys.map((k) => getRecent(k, 4)));
  const mark = (h: string) => (!role && isLocked(h, locks) ? ' 🔒' : '');
  return (
    <>
      <section className="hero"><div className="wrap">
        <h1><HeroTitle text={tx.heroTitle} /></h1>
        <p>{tx.heroSub}</p>
        <div className="btns">
          <a className="btn" href={APPLY_URL} target="_blank" rel="noopener noreferrer">{tx.applyLabel}</a>
          <a className="btn insta" href="https://www.instagram.com/hufs_labor_union/" target="_blank" rel="noopener noreferrer">{tx.instaLabel}</a>
          <a className="btn kakao" href="https://pf.kakao.com/_Pxnjxkxj" rel="noopener noreferrer">{tx.kakaoLabel}</a>
        </div>
      </div></section>
      <main><div className="wrap">
        <div className="quick">
          <Link href="/page/agreement">단체협약{mark('/page/agreement')}</Link><Link href="/page/bylaws">규약{mark('/page/bylaws')}</Link>
          <Link href="/community">커뮤니티{mark('/community')}</Link><Link href="/page/projects">조합사업{mark('/page/projects')}</Link>
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
            <ul className="cards"><li><Link href="/login"><b>🔒 {tx.memberBoxTitle}</b><time>{tx.memberBoxSub}</time></Link></li></ul>
          </section>
        )}
      </div></main>
    </>
  );
}
