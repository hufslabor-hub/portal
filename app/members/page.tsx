import { requireSession } from '@/lib/auth';
import { getSheetMembers, type SheetMember } from '@/lib/members-sheet';
import { refreshSheet } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: '조합원 찾기' };

export default async function Members({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const s = await requireSession('/members');
  const { q = '' } = await searchParams;
  const query = q.trim().slice(0, 40).toLowerCase();
  let all: SheetMember[] = [], error = '';
  try { all = await getSheetMembers(); }
  catch (e) {
    console.error('members sheet error', e);
    error = (e as Error).message === 'not-configured' ? '조합원 명단 연결이 아직 설정되지 않았습니다.' : '명단을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
  }
  const list = query ? all.filter((m) => `${m.name} ${m.dept}`.toLowerCase().includes(query)) : all;
  return (
    <main><div className="wrap">
      <h1 className="pt">조합원 찾기</h1>
      <form className="search" role="search">
        <input name="q" defaultValue={q} maxLength={40} placeholder="이름 또는 소속 검색" aria-label="이름 또는 소속 검색" />
        <button className="btn sm">검색</button>
      </form>
      {error ? <p className="err" role="alert">{error}</p> : (
        <p className="meta" style={{ whiteSpace: 'normal' }}>{list.length}명 · 노동조합 조합원 명단(이름, 소속)을 5분마다 새로 불러옵니다.</p>
      )}
      <ul className="cards">
        {list.map((m, i) => (
          <li key={i} className="mcard"><b>{m.name}</b>{m.dept && <span className="meta"> {m.dept}</span>}</li>
        ))}
        {!error && !list.length && <li className="meta">검색 결과가 없습니다.</li>}
      </ul>
      {s.role === 'admin' && <form action={refreshSheet} style={{ marginTop: 20 }}><button className="btn sm ghost">명단 지금 새로고침</button></form>}
    </div></main>
  );
}
