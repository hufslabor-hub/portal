import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { AUDIT_LABEL, recentAudit } from '@/lib/audit';
import { byName, isRoot, listAccounts, type Account } from '@/lib/roles';
import { kst } from '@/lib/anon';
import { setAdmin, setExec } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: '관리자·조합원 정보 관리' };
const SHOW = 100;
const DANGER = { background: '#d64545', color: '#fff' } as const;

export default async function Accounts({ searchParams }: { searchParams: Promise<{ q?: string; ok?: string; err?: string }> }) {
  const me = await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q ?? '').trim().slice(0, 60);
  const ql = q.toLowerCase();
  const [all, logs] = await Promise.all([listAccounts(), recentAudit(20)]);

  const hit = (a: Account) => !ql || a.email.toLowerCase().includes(ql) || a.name.toLowerCase().includes(ql) || a.raw.toLowerCase().includes(ql);
  const admins = all.filter((a) => a.admin).sort(byName);
  const execs = all.filter((a) => !a.admin && a.exec && a.member).sort(byName);
  const found = all.filter((a) => !a.admin && !a.exec && a.member && hit(a)).sort(byName);
  const members = found.slice(0, SHOW);

  return (
    <main><div className="wrap">
      <div className="bar"><h1 className="pt">관리자·조합원 정보</h1><Link className="btn ghost sm" href="/admin">← 관리자 홈</Link></div>
      {sp.ok && <p className="ok" role="status">{sp.ok}</p>}
      {sp.err && <p className="err" role="alert">{sp.err}</p>}
      <p className="meta" style={{ whiteSpace: 'normal' }}>승인된 조합원 중에서 관리자와 집행부를 지정할 수 있습니다. 관리자는 게시글·페이지·메뉴·메인 문구 수정, 조합원 승인·삭제, 조합원 정보 수정 권한을 갖고 집행부 메뉴도 볼 수 있습니다. 집행부는 일반 조합원 권한에 더해 집행부 메뉴(집행부 전용 게시판·페이지)를 볼 수 있습니다. 모든 변경은 아래 기록에 남습니다.</p>

      <h2 className="sec">관리자 {admins.length}명</h2>
      <ul className="cards">
        {admins.map((a) => (
          <li key={a.uid} className="mcard">
            <div><strong>{a.name}</strong>{a.uid === me.uid && <span className="badge">나</span>}{isRoot(a.email) && <span className="badge">기본 관리자</span>}</div>
            <div className="meta">{a.email}</div>
            <div className="acts">
              <Link className="btn sm ghost" href={`/admin/accounts/${a.uid}`}>{a.uid === me.uid ? '내 정보 수정' : '정보 보기'}</Link>
              {a.uid !== me.uid && !isRoot(a.email) && (
                <details className="cmedit">
                  <summary className="warn">관리자 해제</summary>
                  <form action={setAdmin}>
                    <input type="hidden" name="uid" value={a.uid} /><input type="hidden" name="on" value="0" /><input type="hidden" name="q" value={q} />
                    <p className="meta" style={{ whiteSpace: 'normal' }}>{a.name} 님의 관리자 권한을 해제할까요? 일반 조합원으로 돌아가며 이미 로그인한 기기에서도 바로 로그아웃됩니다.</p>
                    <button className="btn sm" style={DANGER}>해제하기</button>
                  </form>
                </details>
              )}
            </div>
          </li>
        ))}
      </ul>

      <h2 className="sec">집행부 {execs.length}명</h2>
      <ul className="cards">
        {execs.map((a) => (
          <li key={a.uid} className="mcard">
            <div><strong>{a.name}</strong><span className="badge">집행부</span></div>
            <div className="meta">{a.email}</div>
            <div className="acts">
              <Link className="btn sm ghost" href={`/admin/accounts/${a.uid}`}>정보 수정</Link>
              <details className="cmedit">
                <summary className="warn">집행부 해제</summary>
                <form action={setExec}>
                  <input type="hidden" name="uid" value={a.uid} /><input type="hidden" name="on" value="0" /><input type="hidden" name="q" value={q} />
                  <p className="meta" style={{ whiteSpace: 'normal' }}>{a.name} 님의 집행부 권한을 해제할까요? 일반 조합원으로 돌아가며 이미 로그인한 기기에서도 바로 로그아웃됩니다.</p>
                  <button className="btn sm" style={DANGER}>해제하기</button>
                </form>
              </details>
              <details className="cmedit">
                <summary>관리자로 지정</summary>
                <form action={setAdmin}>
                  <input type="hidden" name="uid" value={a.uid} /><input type="hidden" name="on" value="1" /><input type="hidden" name="q" value={q} />
                  <p className="meta" style={{ whiteSpace: 'normal' }}>{a.name} 님을 관리자로 지정할까요? 관리자 화면의 모든 기능을 쓸 수 있게 됩니다.</p>
                  <button className="btn sm">지정하기</button>
                </form>
              </details>
            </div>
          </li>
        ))}
        {!execs.length && <li className="meta">지정된 집행부가 없습니다. 아래 조합원 목록에서 “집행부로 지정”을 눌러 주세요.</li>}
      </ul>

      <h2 className="sec">일반 조합원</h2>
      <form className="mf" role="search">
        <input name="q" defaultValue={q} maxLength={60} placeholder="이름·이메일로 찾기" aria-label="조합원 검색" />
        <button className="btn sm">검색</button>
      </form>
      <p className="meta">{found.length}명{found.length > SHOW ? ` 중 ${SHOW}명 표시 — 검색어로 좁혀 주세요` : ''}</p>
      <ul className="cards">
        {members.map((a) => (
          <li key={a.uid} className="mcard">
            <div><strong>{a.name}</strong></div>
            <div className="meta">{a.email}</div>
            <div className="acts">
              <Link className="btn sm ghost" href={`/admin/accounts/${a.uid}`}>정보 수정</Link>
              <details className="cmedit">
                <summary>집행부로 지정</summary>
                <form action={setExec}>
                  <input type="hidden" name="uid" value={a.uid} /><input type="hidden" name="on" value="1" /><input type="hidden" name="q" value={q} />
                  <p className="meta" style={{ whiteSpace: 'normal' }}>{a.name} 님을 집행부로 지정할까요? 집행부 전용 게시판·페이지를 볼 수 있게 됩니다.</p>
                  <button className="btn sm">지정하기</button>
                </form>
              </details>
              <details className="cmedit">
                <summary>관리자로 지정</summary>
                <form action={setAdmin}>
                  <input type="hidden" name="uid" value={a.uid} /><input type="hidden" name="on" value="1" /><input type="hidden" name="q" value={q} />
                  <p className="meta" style={{ whiteSpace: 'normal' }}>{a.name} 님을 관리자로 지정할까요? 관리자 화면의 모든 기능을 쓸 수 있게 됩니다.</p>
                  <button className="btn sm">지정하기</button>
                </form>
              </details>
            </div>
          </li>
        ))}
        {!members.length && <li className="meta">{q ? '검색 결과가 없습니다.' : '승인된 일반 조합원이 없습니다.'}</li>}
      </ul>

      <h2 className="sec">최근 변경 기록</h2>
      <ul className="cards">
        {logs.map((l) => (
          <li key={l.id} className="mcard">
            <div className="meta">{kst(l.at)} · {l.actorEmail}</div>
            <div><strong>{AUDIT_LABEL[l.action] ?? l.action}</strong>{l.targetEmail ? ` — ${l.targetEmail}` : ''}</div>
            {l.detail && <div className="meta">{l.detail}</div>}
          </li>
        ))}
        {!logs.length && <li className="meta">아직 기록이 없습니다.</li>}
      </ul>
    </div></main>
  );
}
