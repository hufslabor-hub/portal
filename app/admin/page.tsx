import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { CATEGORIES } from '@/lib/content';
import { logout } from './actions';

export const dynamic = 'force-dynamic';
const PAGES = [['greeting', '지부장 인사말'], ['about', '조합소개'], ['history', '조합 역사'], ['officers', '역대 임원진'], ['agreement', '단체협약'], ['bylaws', '규약'], ['rules', '지부규정']];

export default async function Admin() {
  await requireAdmin();
  const s = await db().collection('posts').orderBy('createdAt', 'desc').limit(200).get();
  return (
    <main><div className="wrap">
      <div className="bar"><h1 className="pt">관리자</h1><form action={logout}><button className="btn ghost sm">로그아웃</button></form></div>
      <div className="btns"><Link className="btn" href="/admin/post/new">+ 새 글 쓰기</Link><Link className="btn ghost" href="/admin/members">조합원 관리</Link></div>
      <h2 className="sec">게시글</h2>
      <ul className="cards">
        {s.docs.map((d) => { const v = d.data(); return (
          <li key={d.id}><Link href={`/admin/post/${d.id}`}>
            <b>{v.title}</b>
            <time>{CATEGORIES[v.category as keyof typeof CATEGORIES] ?? v.category} · {v.createdAt?.toDate().toISOString().slice(0, 10)}{v.published ? '' : ' · 비공개'}</time>
          </Link></li>); })}
      </ul>
      <h2 className="sec">고정 페이지</h2>
      <div className="chips wrapchips">{PAGES.map(([k, n]) => <Link key={k} href={`/admin/page/${k}`}>{n}</Link>)}</div>
    </div></main>
  );
}
