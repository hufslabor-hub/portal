import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { anonHash, kst } from '@/lib/anon';
import { itemsRef } from '@/lib/comments';
import { deleteComment, updateComment } from '@/app/comment-actions';
import CommentForm from './CommentForm';

/**
 * 글 아래에 붙이는 댓글 영역.
 *   <Comments scope="news" postId={글 ID} path={이 글의 주소} />
 * 조합원 로그인 후에만 댓글을 보고 쓸 수 있습니다. (로그인 전에는 안내만 표시)
 */
export default async function Comments({ scope, postId, path }: { scope: string; postId: string; path: string }) {
  const s = await getSession(true);
  if (!s) {
    return (
      <section id="comments" className="cmts" aria-labelledby="cmts-h">
        <h2 id="cmts-h">댓글</h2>
        <p className="meta" style={{ whiteSpace: 'normal' }}>댓글은 조합원 로그인 후 보고 쓸 수 있습니다. <Link href={`/login?next=${encodeURIComponent(path)}`}>로그인하기</Link></p>
      </section>
    );
  }

  const snap = await itemsRef(scope, postId).orderBy('createdAt', 'asc').limit(200).get();
  const mine = anonHash(s.uid);
  const nums = new Map<string, number>();   // 작성자 → 이 글 안에서의 익명 번호
  const items = snap.docs.map((d) => {
    const v = d.data();
    if (!nums.has(v.authorHash)) nums.set(v.authorHash, nums.size + 1);
    return { id: d.id, body: String(v.body ?? ''), own: v.authorHash === mine, n: nums.get(v.authorHash)!, at: v.createdAt.toMillis() as number, edited: !!v.editedAt };
  });
  const admin = s.role === 'admin';
  const hidden = (id?: string) => (
    <>
      <input type="hidden" name="scope" value={scope} />
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="path" value={path} />
      {id && <input type="hidden" name="id" value={id} />}
    </>
  );

  return (
    <section id="comments" className="cmts" aria-labelledby="cmts-h">
      <h2 id="cmts-h">댓글 {items.length ? <span className="meta">{items.length}개</span> : null}</h2>
      {items.length === 0 && <p className="meta">아직 댓글이 없습니다. 첫 댓글을 남겨 보세요.</p>}
      <ul className="cmlist">
        {items.map((c) => (
          <li key={c.id} className="cm">
            <p className="cmbody">{c.body}</p>
            <div className="cmrow">
              <span className="meta">{c.own ? <b>익명 {c.n} (나)</b> : `익명 ${c.n}`} · {kst(c.at)}{c.edited ? ' · 수정됨' : ''}</span>
              {c.own && (
                <details className="cmedit">
                  <summary className="linkbtn xs">수정</summary>
                  <form action={updateComment} className="form">
                    {hidden(c.id)}
                    <textarea name="body" rows={3} required maxLength={1000} defaultValue={c.body} aria-label="댓글 수정" />
                    <button className="btn sm">저장</button>
                  </form>
                </details>
              )}
              {(c.own || admin) && (
                <details className="cmedit">
                  <summary className="linkbtn xs">삭제</summary>
                  <form action={deleteComment}>
                    {hidden(c.id)}
                    <p className="meta" style={{ whiteSpace: 'normal' }}>{c.own ? '이 댓글을 삭제할까요?' : '관리자 권한으로 이 댓글을 삭제할까요?'}</p>
                    <button className="btn sm danger">삭제하기</button>
                  </form>
                </details>
              )}
            </div>
          </li>
        ))}
      </ul>
      <CommentForm scope={scope} postId={postId} path={path} />
    </section>
  );
}
