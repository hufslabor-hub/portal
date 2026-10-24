import './globals.css';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'HUFS UNION - 한국외국어대학교 노동조합', template: '%s - HUFS UNION' },
  description: '한국외국어대학교 노동조합 공식 홈페이지',
};

const NAV = [
  ['/c/news', '우리소식'], ['/page/about', '조합소개'], ['/c/notice', '공고'],
  ['/c/bargaining', '임단협뉴스'], ['/page/agreement', '단체협약'], ['/page/bylaws', '규약'],
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="top"><div className="wrap">서울시 동대문구 이문로 107, 본관 602호 · 02-2173-2611</div></div>
        <header className="main"><div className="wrap">
          <Link href="/" className="logo">HUFS UNION</Link>
          <nav>{NAV.map(([h, n]) => <Link key={h} href={h}>{n}</Link>)}</nav>
        </div></header>
        <main><div className="wrap">{children}</div></main>
        <footer><div className="wrap">
          서울캠퍼스: 본관 602호 (TEL 02-2173-2611) · 글로벌캠퍼스: 백년관 922호<br />
          hufslabor@hufs.ac.kr · <a href="https://pf.kakao.com/_Pxnjxkxj" rel="noopener noreferrer">카카오 채널</a>
        </div></footer>
      </body>
    </html>
  );
}
