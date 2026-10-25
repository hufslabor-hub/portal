import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { kst } from '@/lib/anon';

export const dynamic = 'force-dynamic';
export const metadata = { title: '자유게시판' };

export default async function Board() {
  await requireSession('/board');
  const s = await db().collection('board_posts').orderBy('createdAt', 'desc').limit(50).get();
  return (
    <main><div className="wrap">
      <div className="bar"><h1 className="pt">자유게시판</h1><Link className="btn sm" href="/board/new">글쓰기</Link></div>
      <p className="meta" style={{ whiteSpace: 'normal' }}>작성자는 다른 조합원에게 ‘익명’으로만 표시됩니다.</p>
      <ul className="cards">
        {s.docs.map((d) => { const v = d.data(); return (
          <li key={d.id}><Link href={`/board/${d.id}`}>
            <b>{v.title}</b>
            <time>{kst(v.createdAt.toMillis())}{v.commentCount ? ` · 💬 ${v.commentCount}` : ''}</time>
          </Link></li>); })}
        {!s.docs.length && <li className="meta">아직 글이 없습니다. 첫 글을 남겨 보세요.</li>}
      </ul>
    </div></main>
  );
}
