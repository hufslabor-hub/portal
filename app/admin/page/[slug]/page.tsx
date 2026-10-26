import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { isLocked, loadLocks } from '@/lib/locks';
import { savePage } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,40}$/.test(slug)) notFound();
  const [d, locks] = await Promise.all([db().collection('pages').doc(slug).get(), loadLocks()]);
  const v = d.data() ?? {};
  return (
    <main><div className="wrap">
      <h1 className="pt">페이지 수정 · {slug}</h1>
      <form action={savePage} className="form">
        <input type="hidden" name="slug" value={slug} />
        <label>제목<input name="title" defaultValue={v.title ?? ''} maxLength={200} required /></label>
        {slug === 'agreement' && <p className="meta" style={{ whiteSpace: 'normal' }}>카드는 링크 글자로 만들어집니다. <b>2024학년도 단체협약서_조직이름</b> 형식을 권장합니다. (2024년도, 2024~2025학년도도 인식하며, 학년도가 없으면 연도 표시 없이 나옵니다.)</p>}
        <label>본문 (Markdown)<textarea name="body" rows={20} defaultValue={v.body ?? ''} /></label>
        <label className="chk"><input type="checkbox" name="membersOnly" defaultChecked={isLocked(`/page/${slug}`, locks)} /> 🔒 조합원 전용 (로그인한 조합원만 보기)</label>
        <label className="chk"><input type="checkbox" name="hub" defaultChecked={v.hub === true} /> 이 페이지가 상위 메뉴일 때, 하위 메뉴를 카드로 보여주기</label>
        <button className="btn">저장</button>
      </form>
    </div></main>
  );
}
