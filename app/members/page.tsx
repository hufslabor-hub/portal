import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { listMembers } from '@/lib/members';

export const dynamic = 'force-dynamic';
export const metadata = { title: '조합원 찾기' };

export default async function Members({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireSession('/members');
  const { q = '' } = await searchParams;
  const query = q.trim().slice(0, 40).toLowerCase();
  const all = await listMembers();
  const list = query ? all.filter((m) => `${m.name} ${m.dept}`.toLowerCase().includes(query)) : all;
  return (
    <main><div className="wrap">
      <h1 className="pt">조합원 찾기</h1>
      <form className="search" role="search">
        <input name="q" defaultValue={q} maxLength={40} placeholder="이름 또는 소속 검색" aria-label="이름 또는 소속 검색" />
        <button className="btn sm">검색</button>
      </form>
      <p className="meta" style={{ whiteSpace: 'normal' }}>{list.length}명 · 이름과 소속만 보입니다. 내 정보는 <Link href="/me">내 정보</Link>에서 목록 표시 여부를 정할 수 있습니다.</p>
      <ul className="cards">
        {list.map((m, i) => (
          <li key={i} className="mcard">
            <b>{m.name}</b>{m.dept && <span className="meta"> {m.dept}</span>}
            {m.email && <a href={`mailto:${m.email}`} className="meta"> · {m.email}</a>}
          </li>
        ))}
        {!list.length && <li className="meta">검색 결과가 없습니다.</li>}
      </ul>
    </div></main>
  );
}
