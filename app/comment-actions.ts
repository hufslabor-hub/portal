'use server';
import { redirect } from 'next/navigation';
import { Timestamp } from 'firebase-admin/firestore';
import { getSession } from '@/lib/auth';
import { anonHash } from '@/lib/anon';
import { limit } from '@/lib/ratelimit';
import { MAX_COMMENT, itemsRef, okCommentId, okPostId, okScope, safePath } from '@/lib/comments';

const t = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? '').replace(/\r\n/g, '\n').trim().slice(0, max);

// 실패해도 쓰던 내용이 사라지지 않도록 본문을 함께 돌려줍니다.
export type CommentState = { error: string; body: string } | null;

async function me(path: string) {
  const s = await getSession(true);
  if (!s) redirect(`/login?next=${encodeURIComponent(path)}`);
  return s;
}

/** 댓글 등록 (조합원 로그인 필요, 작성자는 다른 조합원에게 익명으로만 표시) */
export async function addComment(_p: CommentState, fd: FormData): Promise<CommentState> {
  const scope = t(fd, 'scope', 32), postId = t(fd, 'postId', 200), path = safePath(t(fd, 'path', 320)), body = t(fd, 'body', MAX_COMMENT * 5);
  const fail = (error: string): CommentState => ({ error, body });
  if (!okScope(scope) || !okPostId(postId)) return fail('잘못된 요청입니다.');
  const s = await me(path);
  if (!body) return fail('댓글 내용을 입력해 주세요.');
  if (body.length > MAX_COMMENT) return fail(`댓글은 ${MAX_COMMENT}자 이하로 써 주세요. (현재 ${body.length}자)`);
  if (!(await limit('post-comment', s.uid, 20, 3600))) return fail('댓글은 1시간에 20개까지 쓸 수 있습니다. 잠시 후 다시 시도해 주세요.');
  await itemsRef(scope, postId).add({ body, authorHash: anonHash(s.uid), createdAt: Timestamp.now() });
  redirect(`${path}#comments`);
}

/** 댓글 수정: 본인이 쓴 댓글만 (관리자도 남의 댓글은 삭제만 가능) */
export async function updateComment(fd: FormData) {
  const scope = t(fd, 'scope', 32), postId = t(fd, 'postId', 200), path = safePath(t(fd, 'path', 320)), id = t(fd, 'id', 40), body = t(fd, 'body', MAX_COMMENT * 5);
  if (!okScope(scope) || !okPostId(postId) || !okCommentId(id)) throw new Error('잘못된 요청입니다.');
  const s = await me(path);
  if (!body || body.length > MAX_COMMENT) throw new Error(`댓글은 1자 이상 ${MAX_COMMENT}자 이하로 써 주세요.`);
  if (!(await limit('post-comment-edit', s.uid, 30, 3600))) throw new Error('수정 횟수가 너무 많습니다. 잠시 후 다시 시도해 주세요.');
  const ref = itemsRef(scope, postId).doc(id);
  const c = await ref.get();
  if (!c.exists) throw new Error('댓글을 찾을 수 없습니다.');
  if (c.data()!.authorHash !== anonHash(s.uid)) throw new Error('수정 권한이 없습니다.');
  await ref.update({ body, editedAt: Timestamp.now() });
  redirect(`${path}#comments`);
}

/** 댓글 삭제: 본인 또는 관리자 */
export async function deleteComment(fd: FormData) {
  const scope = t(fd, 'scope', 32), postId = t(fd, 'postId', 200), path = safePath(t(fd, 'path', 320)), id = t(fd, 'id', 40);
  if (!okScope(scope) || !okPostId(postId) || !okCommentId(id)) throw new Error('잘못된 요청입니다.');
  const s = await me(path);
  const ref = itemsRef(scope, postId).doc(id);
  const c = await ref.get();
  if (c.exists) {
    if (s.role !== 'admin' && c.data()!.authorHash !== anonHash(s.uid)) throw new Error('삭제 권한이 없습니다.');
    await ref.delete();
  }
  redirect(`${path}#comments`);
}
