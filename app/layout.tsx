import './globals.css';
import Link from 'next/link';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: { default: 'HUFS UNION - 한국외국어대학교 노동조합', template: '%s - HUFS UNION' },
  description: '한국외국어대학교 노동조합 공식 홈페이지',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#14213d' };

const MAIN = [['/c/notice', '공고'], ['/c/news', '우리소식'], ['/c/bargaining', '임단협뉴스'], ['/page/agreement', '단체협약'], ['/page/bylaws', '규약']];
const ABOUT = [['/page/greeting', '지부장 인사말'], ['/page/about', '조합소개'], ['/page/history', '조합 역사'], ['/page/officers', '역대 임원진'], ['/page/rules', '지부규정'], ['/c/letter', '지부장 서신'], ['/c/newsletter', '뉴스레터'], ['/c/forms', '양식']];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" /></head>
      <body>
        <header className="main"><div className="wrap">
          <Link href="/" className="logo">HUFS <b>UNION</b></Link>
          <nav className="dnav">{[...MAIN, ['/page/about', '조합소개']].map(([h, n]) => <Link key={h} href={h}>{n}</Link>)}</nav>
          <details className="m"><summary aria-label="메뉴">☰</summary>
            <div className="mpanel">
              {MAIN.map(([h, n]) => <Link key={h} href={h}>{n}</Link>)}
              <small>조합 안내</small>
              {ABOUT.map(([h, n]) => <Link key={h} href={h}>{n}</Link>)}
            </div>
          </details>
        </div></header>
        {children}
        <footer><div className="wrap">
          <b>한국외국어대학교 노동조합</b><br />
          서울캠퍼스 본관 602호 · <a href="tel:0221732611">02-2173-2611</a><br />
          글로벌캠퍼스 백년관 922호<br />
          <a href="mailto:hufslabor@hufs.ac.kr">hufslabor@hufs.ac.kr</a> · <a href="https://pf.kakao.com/_Pxnjxkxj" rel="noopener noreferrer">카카오 채널</a>
        </div></footer>
      </body>
    </html>
  );
}
