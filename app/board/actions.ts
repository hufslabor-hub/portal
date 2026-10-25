'use server';
import { redirect } from 'next/navigation';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '@/lib/firebase';
import { getSession } from '@/lib/auth';
import { anonHash } from '@/lib/anon';
import { limit } from '@/lib/ratelimit';

const t = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? '').replace(/\r\n/g, '\n').trim().slice(0, max);
const ID = /^[A-Za-z0-9]{10,40}$/;
async function me() {
  const s = await getSession(true);
  if (!s) redirect('/login?next=/board');
  return s;
}

export async function createPost(fd: FormData) {
  const s = await me();
  const title = t(fd, 'title', 100), body = t(fd, 'body', 3000);
  if (!title || !body) throw new Error('제목과 내용을 입력하세요.');
  if (!(await limit('board-post', s.uid, 5, 3600))) throw new Error('글은 1시간에 5개까지 쓸 수 있습니다. 잠시 후 다시 시도해 주세요.');
  const ref = db().collection('board_posts').doc();
  await ref.set({ title, body, authorHash: anonHash(s.uid), createdAt: Timestamp.now(), commentCount: 0 });
  redirect(`/board/${ref.id}`);
}

export async function addComment(fd: FormData) {
  const s = await me();
  const postId = t(fd, 'postId', 40), body = t(fd, 'body', 1000);
  if (!ID.test(postId) || !body) throw new Error('내용을 입력하세요.');
  if (!(await limit('board-comment', s.uid, 20, 3600))) throw new Error('댓글은 1시간에 20개까지 쓸 수 있습니다.');
  const post = db().collection('board_posts').doc(postId);
  await db().runTransaction(async (tx) => {
    if (!(await tx.get(post)).exists) throw new Error('글을 찾을 수 없습니다.');
    tx.set(post.collection('comments').doc(), { body, authorHash: anonHash(s.uid), createdAt: Timestamp.now() });
    tx.update(post, { commentCount: FieldValue.increment(1) });
  });
  redirect(`/board/${postId}`);
}

export async function deleteComment(fd: FormData) {
  const s = await me();
  const postId = t(fd, 'postId', 40), id = t(fd, 'id', 40);
  if (!ID.test(postId) || !ID.test(id)) throw new Error('잘못된 요청');
  const post = db().collection('board_posts').doc(postId), ref = post.collection('comments').doc(id);
  await db().runTransaction(async (tx) => {
    const c = await tx.get(ref);
    if (!c.exists) return;
    if (s.role !== 'admin' && c.data()!.authorHash !== anonHash(s.uid)) throw new Error('삭제 권한이 없습니다.');
    tx.delete(ref);
    tx.update(post, { commentCount: FieldValue.increment(-1) });
  });
  redirect(`/board/${postId}`);
}

export async function deletePost(fd: FormData) {
  const s = await me();
  const id = t(fd, 'id', 40);
  if (!ID.test(id)) throw new Error('잘못된 요청');
  const ref = db().collection('board_posts').doc(id);
  const p = await ref.get();
  if (p.exists) {
    if (s.role !== 'admin' && p.data()!.authorHash !== anonHash(s.uid)) throw new Error('삭제 권한이 없습니다.');
    await db().recursiveDelete(ref); // 댓글까지 함께 삭제
  }
  redirect('/board');
}
