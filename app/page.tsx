import Link from 'next/link';
import { CATEGORIES, getPosts, type Cat } from '@/lib/content';
import { getRole } from '@/lib/auth';
import { getLocks, isLocked } from '@/lib/locks';

export const dynamic = 'force-dynamic';

const APPLY_URL = 'https://script.google.com/a/macros/hufs.ac.kr/s/AKfycbzAXBPbje2UD12DwtYReu98ifbCo2-b-4DZx8hwVpF-iIVGNeAr3Fr47ZPufskVecQ/exec?page=apply';

export default async function Home() {
  const role = await getRole(true);
  const locks = await getLocks();
  const keys = (['notice', 'news', 'bargaining'] as Cat[]).filter((k) => role || !isLocked(`/c/${k}`, locks));
  const lists = await Promise.all(keys.map((k) => getPosts(k, 4)));
  const mark = (h: string) => (!role && isLocked(h, locks) ? ' 🔒' : '');
  return (
    <>
      <section className="hero"><div className="wrap">
        <h1>함께 일하는 사람들의<br /><em>목소리</em>, 한국외대 노동조합</h1>
        <p>공고와 교섭 소식을 가장 먼저 확인하세요.</p>
        <div className="btns">
          <a className="btn" href={APPLY_URL} target="_blank" rel="noopener noreferrer">가입신청서</a>
          <a className="btn insta" href="https://www.instagram.com/hufs_labor_union/" target="_blank" rel="noopener noreferrer">인스타그램</a>
          <a className="btn kakao" href="https://pf.kakao.com/_Pxnjxkxj" rel="noopener noreferrer">카카오톡 채널</a>
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
            <ul className="cards"><li><Link href="/login"><b>🔒 로그인하고 조합원 전용 소식과 자료 보기</b><time>조합원 로그인 / 가입 신청</time></Link></li></ul>
          </section>
        )}
      </div></main>
    </>
  );
}
