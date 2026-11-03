import Link from 'next/link';

export const metadata = { title: '열람 권한이 없습니다', robots: { index: false, follow: false } };

export default function NoAccess() {
  return (
    <main><div className="wrap narrow">
      <h1 className="pt">열람 권한이 없습니다</h1>
      <p style={{ whiteSpace: 'normal' }}>이 페이지는 <b>집행부와 관리자</b>만 볼 수 있습니다. 권한이 필요하시면 노동조합 사무실로 문의해 주세요.</p>
      <div className="btns"><Link className="btn" href="/">홈으로</Link></div>
    </div></main>
  );
}
