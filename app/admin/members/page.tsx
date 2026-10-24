import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { adminAuth } from '@/lib/firebase';
import { deleteUser, setMember } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Members() {
  await requireAdmin();
  const { users } = await adminAuth().listUsers(1000);
  const rows = users.map((u) => ({ uid: u.uid, email: u.email ?? '', name: u.displayName ?? '', admin: u.customClaims?.admin === true, member: u.customClaims?.member === true, at: u.metadata.creationTime }))
    .sort((a, b) => Number(a.member || a.admin) - Number(b.member || b.admin) || +new Date(b.at) - +new Date(a.at));
  return (
    <main><div className="wrap">
      <p><Link href="/admin">← 관리자</Link></p>
      <h1 className="pt">조합원 관리</h1>
      <ul className="cards">
        {rows.map((r) => (
          <li key={r.uid}><div className="mrow">
            <div><b>{r.name || '(이름 없음)'}</b><span className="meta"> {r.email} · {r.at.slice(5, 16)} · {r.admin ? '관리자' : r.member ? '승인됨' : '승인 대기'}</span></div>
            {!r.admin && (
              <div className="btns">
                <form action={setMember}><input type="hidden" name="uid" value={r.uid} /><input type="hidden" name="on" value={r.member ? '0' : '1'} /><button className={`btn sm${r.member ? ' ghost' : ''}`}>{r.member ? '승인 해제' : '승인'}</button></form>
                <form action={deleteUser}><input type="hidden" name="uid" value={r.uid} /><button className="btn sm danger">삭제</button></form>
              </div>
            )}
          </div></li>
        ))}
        {!rows.length && <li className="meta">가입한 사람이 없습니다.</li>}
      </ul>
    </div></main>
  );
}
