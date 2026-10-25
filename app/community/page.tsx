import Link from 'next/link';
import { requireSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: '커뮤니티' };

const ITEMS = [
  ['/members', '조합원 찾기', '이름·소속·그룹으로 조합원을 찾아보세요'],
  ['/board', '자유게시판', '익명으로 자유롭게 이야기해요'],
  ['/chat', '그룹챗', '조합원끼리 대화해요'],
];

export default async function Community() {
  await requireSession('/community');
  return (
    <main><div className="wrap">
      <h1 className="pt">커뮤니티</h1>
      <ul className="cards">
        {ITEMS.map(([h, n, d]) => <li key={h}><Link href={h}><b>{n}</b><time>{d}</time></Link></li>)}
      </ul>
    </div></main>
  );
}
