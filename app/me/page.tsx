import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { splitName } from '@/lib/members';
import { memberLogout } from '../member-actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: '내 정보' };

export default async function Me() {
  const s = await requireSession('/me');
  return (
    <main><div className="wrap narrow">
      <h1 className="pt">내 정보</h1>
      <ul className="cards">
        <li className="mcard"><span className="meta">이름</span><br /><b>{splitName(s.name).name || '-'}</b></li>
        <li className="mcard"><span className="meta">이메일</span><br /><b>{s.email}</b></li>
      </ul>
      <p className="meta" style={{ whiteSpace: 'normal' }}>이름이나 정보를 바꾸려면 노동조합 사무실에 문의해 주세요. 비밀번호는 <Link href="/forgot">비밀번호 찾기</Link>로 바꿀 수 있습니다.</p>
      <form action={memberLogout}><button className="btn sm ghost">로그아웃</button></form>
    </div></main>
  );
}
