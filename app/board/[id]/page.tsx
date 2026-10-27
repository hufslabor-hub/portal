import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { anonHash, kst } from '@/lib/anon';
import { addComment, deleteComment, deletePost, updateComment } from '../actions';

export const dynamic = 'force-dynamic';

export default async function BoardPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await requireSession(`/board/${id}`);
  if (!/^[A-Za-z0-9]{10,40}$/.test(id)) notFound();
  const ref = db().collection('board_posts').doc(id);
  const [p, cs] = await Promise.all([ref.get(), ref.collection('comments').orderBy('createdAt', 'asc').limit(300).get()]);
  if (!p.exists) notFound();
  const v = p.data()!, my = anonHash(s.uid), admin = s.role === 'admin', mine = v.authorHash === my;
  // 글쓴이는 '익명(글쓴이)', 댓글 쓴 사람은 이 글 안에서만 '익명1, 익명2…'로 구분(작성자 정보는 화면으로 보내지 않음)
  const nums = new Map<string, number>();
  const label = (h: string) => (h === v.authorHash ? '익명(글쓴이)' : `익명${nums.get(h) ?? (nums.set(h, nums.size + 1), nums.size)}`);
  return (
    <main><div className="wrap">
      <p><Link href="/board">← 자유게시판</Link></p>
      <article>
        <h1 className="pt">{v.title}</h1>
        <p className="meta">익명(글쓴이) · {kst(v.createdAt.toMillis())}{v.editedAt ? ' · 수정됨' : ''}</p>
        <p className="pre">{v.body}</p>
        {(admin || mine) && (
          <div className="btns">
            {mine && <Link className="btn sm ghost" href={`/board/${id}/edit`}>수정</Link>}
            <form action={deletePost}><input type="hidden" name="id" value={id} /><button className="btn sm danger">글 삭제</button></form>
          </div>
        )}
      </article>
      <h2 className="sec">댓글 {cs.size}개</h2>
      <ul className="cards">
        {cs.docs.map((c) => { const d = c.data(), cmine = d.authorHash === my; return (
          <li key={c.id} className="cm">
            <span className="meta">{label(d.authorHash)} · {kst(d.createdAt.toMillis())}{d.editedAt ? ' · 수정됨' : ''}</span>
            <p className="pre">{d.body}</p>
            {(admin || cmine) && (
              <div className="btns">
                {cmine && (
                  <details className="cmedit">
                    <summary className="btn sm ghost">수정</summary>
                    <form action={updateComment} className="form">
                      <input type="hidden" name="postId" value={id} /><input type="hidden" name="id" value={c.id} />
                      <textarea name="body" rows={3} maxLength={1000} required defaultValue={String(d.body)} aria-label="댓글 수정" />
                      <button className="btn sm">저장</button>
                    </form>
                  </details>
                )}
                <form action={deleteComment}><input type="hidden" name="postId" value={id} /><input type="hidden" name="id" value={c.id} /><button className="btn sm ghost">삭제</button></form>
              </div>
            )}
          </li>); })}
      </ul>
      <form action={addComment} className="form">
        <input type="hidden" name="postId" value={id} />
        <label>댓글 쓰기<textarea name="body" rows={3} maxLength={1000} required /></label>
        <button className="btn">댓글 등록</button>
      </form>
    </div></main>
  );
}
