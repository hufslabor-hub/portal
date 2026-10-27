import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { CATEGORIES } from '@/lib/content';
import { deletePost, savePost } from '../../actions';
import UploadBox from '@/components/UploadBox';

export const dynamic = 'force-dynamic';

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  let v: FirebaseFirestore.DocumentData = { category: 'notice', published: true, files: [] };
  if (id !== 'new') {
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(id)) notFound();
    const d = await db().collection('posts').doc(id).get();
    if (!d.exists) notFound();
    v = d.data()!;
  }
  const files = (v.files ?? []).map((f: { name: string; url: string; size?: number }) => `${f.name} | ${f.url}${f.size ? ` | ${f.size}` : ''}`).join('\n');
  return (
    <main><div className="wrap">
      <h1 className="pt">{id === 'new' ? '새 글' : '글 수정'}</h1>
      <form action={savePost} className="form">
        <input type="hidden" name="id" value={id} />
        <label>제목<input name="title" defaultValue={v.title ?? ''} maxLength={200} required /></label>
        <label>카테고리<select name="category" defaultValue={v.category}>{Object.entries(CATEGORIES).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
        <label>본문 (Markdown)<textarea name="body" rows={16} defaultValue={v.body ?? ''} /></label>
        <UploadBox targetId="files" />
        <label>첨부파일 목록 (한 줄에 하나: 이름 | https://주소 | 용량(바이트, 생략 가능))<textarea id="files" name="files" rows={3} defaultValue={files} /></label>
        <label className="chk"><input type="checkbox" name="published" defaultChecked={v.published} /> 공개</label>
        <button className="btn">저장</button>
      </form>
      {id !== 'new' && <form action={deletePost} className="form"><input type="hidden" name="id" value={id} /><button className="btn danger">삭제</button></form>}
    </div></main>
  );
}
