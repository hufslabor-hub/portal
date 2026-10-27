import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { getSheetMembers, type SheetMember } from '@/lib/members-sheet';

export const dynamic = 'force-dynamic';
export const metadata = { title: '조합원 찾기' };

const SORTS = { name: '이름순', dept: '소속별', status: '그룹(상태)별' } as const;
type SortKey = keyof typeof SORTS;
const isSuspended = (s: string) => s.includes('정지');   // '자격정지' 등
const NONE_STATUS = '미분류', NONE_DEPT = '소속 미지정';

export default async function Members({ searchParams }: { searchParams: Promise<{ q?: string; sort?: string; status?: string }> }) {
  await requireSession('/members');
  const sp = await searchParams;
  const q = (sp.q ?? '').trim().slice(0, 40), query = q.toLowerCase();
  const sort: SortKey = sp.sort && sp.sort in SORTS ? (sp.sort as SortKey) : 'name';
  const status = (sp.status ?? '').slice(0, 40);

  let all: SheetMember[] = [], error = '';
  try { all = await getSheetMembers(); }
  catch (e) {
    console.error('members sheet error', e);
    error = (e as Error).message === 'not-configured' ? '조합원 명단 연결이 아직 설정되지 않았습니다.' : '명단을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
  }
  const st = (m: SheetMember) => m.status || NONE_STATUS;

  // 그룹(상태) 개수: 자격정지는 맨 뒤에
  const counts = new Map<string, number>();
  all.forEach((m) => counts.set(st(m), (counts.get(st(m)) ?? 0) + 1));
  const statuses = [...counts.keys()].sort((a, b) => Number(isSuspended(a)) - Number(isSuspended(b)) || a.localeCompare(b, 'ko'));

  const list = all
    .filter((m) => !query || `${m.name} ${m.dept} ${m.status}`.toLowerCase().includes(query))
    .filter((m) => !status || st(m) === status);

  // 정렬/묶음
  const keyOf = (m: SheetMember) => (sort === 'dept' ? m.dept || NONE_DEPT : sort === 'status' ? st(m) : '');
  const groups = new Map<string, SheetMember[]>();
  list.forEach((m) => groups.set(keyOf(m), [...(groups.get(keyOf(m)) ?? []), m]));
  const order = [...groups.keys()].sort((a, b) => {
    if (sort === 'status') return Number(isSuspended(a)) - Number(isSuspended(b)) || a.localeCompare(b, 'ko');
    return Number(a === NONE_DEPT) - Number(b === NONE_DEPT) || a.localeCompare(b, 'ko');
  });
  const href = (over: { status?: string }) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (sort !== 'name') p.set('sort', sort);
    const s = over.status ?? status;
    if (s) p.set('status', s);
    const t = p.toString();
    return t ? `/members?${t}` : '/members';
  };

  const card = (m: SheetMember, i: number) => (
    <li key={i} className="mcard">
      <b>{m.name}</b>{m.dept && <span className="badge">{m.dept}</span>}
      {m.status && <span className={`stat${isSuspended(m.status) ? ' warn' : ''}`}>{m.status}</span>}
    </li>
  );

  return (
    <main><div className="wrap">
      <h1 className="pt">조합원 찾기</h1>
      <form className="search" role="search">
        <input name="q" defaultValue={q} maxLength={40} placeholder="이름·소속·상태 검색" aria-label="검색" />
        <select name="sort" defaultValue={sort} aria-label="정렬">{(Object.keys(SORTS) as SortKey[]).map((k) => <option key={k} value={k}>{SORTS[k]}</option>)}</select>
        {status && <input type="hidden" name="status" value={status} />}
        <button className="btn sm">보기</button>
      </form>
      {statuses.length > 1 && (
        <div className="chips" style={{ marginTop: 8 }}>
          <Link href={href({ status: '' })} className={!status ? 'on' : ''}>전체 {all.length}</Link>
          {statuses.map((s) => <Link key={s} href={href({ status: s })} className={`${status === s ? 'on' : ''}${isSuspended(s) ? ' warn' : ''}`}>{s} {counts.get(s)}</Link>)}
        </div>
      )}
      {error ? <p className="err" role="alert">{error}</p> : <p className="meta" style={{ whiteSpace: 'normal' }}>{list.length}명 · 노동조합 조합원 명단을 5분마다 새로 불러옵니다.</p>}
      {sort === 'name' ? (
        <ul className="cards">{list.map(card)}</ul>
      ) : order.map((g) => (
        <section key={g}>
          <h2 className="sec" style={{ marginTop: 28 }}>{g}<span className="meta"> {groups.get(g)!.length}명</span></h2>
          <ul className="cards">{groups.get(g)!.map(card)}</ul>
        </section>
      ))}
      {!error && !list.length && <p className="meta">검색 결과가 없습니다.</p>}
    </div></main>
  );
}
