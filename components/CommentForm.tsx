'use client';
import { useActionState, useEffect, useRef } from 'react';
import { addComment, type CommentState } from '@/app/comment-actions';

export default function CommentForm({ scope, postId, path }: { scope: string; postId: string; path: string }) {
  const [st, action, pending] = useActionState<CommentState, FormData>(addComment, null);
  const errRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (st?.error) errRef.current?.focus(); }, [st]);

  return (
    <form action={action} className="form cmform">
      <input type="hidden" name="scope" value={scope} />
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="path" value={path} />
      <label>댓글 쓰기 (다른 조합원에게는 ‘익명’으로 표시됩니다)
        <textarea name="body" rows={3} required maxLength={1000} defaultValue={st?.body ?? ''} placeholder="의견이나 궁금한 점을 남겨 주세요." />
      </label>
      {st?.error && <p ref={errRef} tabIndex={-1} className="err" role="alert">{st.error}</p>}
      <button className="btn sm" disabled={pending}>{pending ? '등록 중…' : '댓글 등록'}</button>
    </form>
  );
}
