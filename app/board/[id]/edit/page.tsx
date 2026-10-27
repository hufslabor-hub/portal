import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { anonHash } from '@/lib/anon';
import { updatePost } from '../../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: '글 수정 - 자유게시판' };

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await requireSession(`/board/${id}/edit`);
  if (!/^[A-Za-z0-9]{10,40}$/.test(id)) notFound();
  const p = await db().collection('board_posts').doc(id).get();
  if (!p.exists) notFound();
  const v = p.data()!;
  if (v.authorHash !== anonHash(s.uid)) redirect(`/board/${id}`);   // 본인 글만 수정 가능
  return (
    <main><div className="wrap narrow">
      <h1 className="pt">글 수정</h1>
      <form action={updatePost} className="form">
        <input type="hidden" name="id" value={id} />
        <label>제목<input name="title" defaultValue={String(v.title)} maxLength={100} required /></label>
        <label>내용<textarea name="body" rows={10} defaultValue={String(v.body)} maxLength={3000} required /></label>
        <button className="btn">저장</button>
        <Link href={`/board/${id}`} className="meta">취소</Link>
      </form>
    </div></main>
  );
}
