import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { splitName } from '@/lib/members';
import { saveProfile } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: '내 정보' };

export default async function Me({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const s = await requireSession('/me');
  const { saved } = await searchParams;
  const m = (await db().collection('members').doc(s.uid).get()).data();
  const base = splitName(s.name);
  return (
    <main><div className="wrap narrow">
      <h1 className="pt">내 정보</h1>
      {saved && <p className="ok" role="status">저장했습니다.</p>}
      <form action={saveProfile} className="form">
        <label>이름<input value={String(m?.name ?? base.name)} disabled readOnly /></label>
        <label>소속 부서<input name="dept" defaultValue={String(m?.dept ?? base.dept)} maxLength={60} /></label>
        <label className="chk"><input type="checkbox" name="listed" defaultChecked={m?.listed !== false} /> ‘조합원 찾기’ 목록에 내 이름과 소속 보이기</label>
        <label className="chk"><input type="checkbox" name="showEmail" defaultChecked={m?.showEmail === true} /> 목록에 내 이메일도 보이기</label>
        <button className="btn">저장</button>
      </form>
      <p className="meta" style={{ whiteSpace: 'normal' }}>이름은 노동조합 사무실에서만 바꿀 수 있습니다. 비밀번호를 바꾸려면 <Link href="/forgot">비밀번호 찾기</Link>를 이용하세요.</p>
    </div></main>
  );
}
