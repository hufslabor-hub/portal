import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { getAccount } from '@/lib/roles';
import { saveAccount } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: '조합원 정보 수정' };

export default async function EditAccount({ params, searchParams }: { params: Promise<{ uid: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const me = await requireAdmin();
  const { uid } = await params;
  const sp = await searchParams;
  const a = await getAccount(uid);
  if (!a) notFound();
  const locked = a.admin && a.uid !== me.uid;          // 다른 관리자의 정보는 본인만 수정
  const composite = a.raw !== a.name;                   // 이름 칸에 이름 외의 정보가 함께 저장된 경우

  return (
    <main><div className="wrap narrow">
      <div className="bar"><h1 className="pt">조합원 정보</h1><Link className="btn ghost sm" href="/admin/accounts">← 목록</Link></div>
      {sp.ok && <p className="ok" role="status">{sp.ok}</p>}
      {sp.err && <p className="err" role="alert">{sp.err}</p>}
      <p className="meta" style={{ whiteSpace: 'normal' }}>
        {a.admin ? <span className="badge">관리자</span> : a.member ? <><span className="badge">조합원</span>{a.exec && <span className="badge">집행부</span>}</> : <span className="badge warn">승인 대기</span>}
        {' '}화면에는 “{a.name}”(으)로 표시됩니다.
      </p>
      {locked && <p className="err" role="status">관리자 계정의 정보는 본인만 수정할 수 있습니다.</p>}
      <form action={saveAccount} className="form">
        <input type="hidden" name="uid" value={a.uid} />
        <label>이름{composite ? ' (이름 외의 정보가 함께 저장되어 있습니다)' : ''}
          <input name="name" defaultValue={a.raw} required maxLength={100} disabled={locked} />
        </label>
        {composite && <p className="meta" style={{ whiteSpace: 'normal', margin: 0 }}>이 칸에는 이름 뒤에 다른 정보가 함께 들어 있습니다. 원래 형식을 그대로 둔 채 필요한 부분만 고쳐 주세요.</p>}
        <label>이메일 (로그인에 쓰는 주소)
          <input name="email" type="email" defaultValue={a.email} required maxLength={200} disabled={locked} />
        </label>
        <p className="meta" style={{ whiteSpace: 'normal', margin: 0 }}>이메일을 바꾸면 그 조합원이 이미 로그인한 기기는 로그아웃됩니다. 변경 내용은 기록에 남습니다.</p>
        {!locked && <button className="btn">저장</button>}
      </form>
    </div></main>
  );
}
