import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { PROTECTED_PAGES } from '@/lib/content';
import { savePage } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,40}$/.test(slug)) notFound();
  const d = await db().collection('pages').doc(slug).get();
  const v = d.data() ?? {};
  return (
    <main><div className="wrap">
      <h1 className="pt">페이지 수정 · {slug}</h1>
      <form action={savePage} className="form">
        <input type="hidden" name="slug" value={slug} />
        <label>제목<input name="title" defaultValue={v.title ?? ''} maxLength={200} required /></label>
        <label>본문 (Markdown)<textarea name="body" rows={20} defaultValue={v.body ?? ''} /></label>
        <label className="chk"><input type="checkbox" name="membersOnly" defaultChecked={v.membersOnly === true || PROTECTED_PAGES.includes(slug)} /> 조합원 전용 (로그인한 조합원만 보기)</label>
        <button className="btn">저장</button>
      </form>
    </div></main>
  );
}
