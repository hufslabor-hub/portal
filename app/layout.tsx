import './globals.css';
import Link from 'next/link';
import type { Metadata, Viewport } from 'next';
import { getRole } from '@/lib/auth';
import { memberLogout } from './member-actions';
import MobileMenu from '@/components/MobileMenu';

export const metadata: Metadata = {
  title: { default: 'HUFS UNION - 한국외국어대학교 노동조합', template: '%s - HUFS UNION' },
  description: '한국외국어대학교 노동조합 공식 홈페이지',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#14213d' };

type Item = { href: string; name: string; lock?: boolean };
type Menu = Item & { sub?: Item[] };

// 상위 메뉴와, 마우스를 올렸을 때 그 메뉴 아래에만 펼쳐지는 하위 메뉴
const MENU: Menu[] = [
  { href: '/c/notice', name: '공고' },
  { href: '/c/news', name: '우리소식', lock: true, sub: [
    { href: '/c/bargaining', name: '임단협뉴스', lock: true },
    { href: '/c/letter', name: '위원장 서신' },
    { href: '/c/newsletter', name: '뉴스레터' },
  ] },
  { href: '/page/agreement', name: '단체협약', lock: true },
  { href: '/page/bylaws', name: '규약', lock: true },
  { href: '/page/about', name: '조합소개', sub: [
    { href: '/page/greeting', name: '위원장 인사말' },
    { href: '/page/history', name: '조합 역사' },
    { href: '/page/officers', name: '역대 임원진' },
    { href: '/page/rules', name: '지부규정' },
    { href: '/c/forms', name: '양식' },
  ] },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const role = await getRole();
  const label = (i: Item) => (i.lock && !role ? `${i.name} 🔒` : i.name);
  return (
    <html lang="ko">
      <head><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" /></head>
      <body>
        <header className="main"><div className="wrap">
          <Link href="/" className="logo">HUFS <b>UNION</b></Link>
          <nav className="dnav">
            {MENU.map((m) => (
              <div key={m.href} className="ni">
                <Link href={m.href}>{label(m)}</Link>
                {m.sub && <div className="dd">{m.sub.map((s) => <Link key={s.href} href={s.href}>{label(s)}</Link>)}</div>}
              </div>
            ))}
            {role === 'admin' && <div className="ni"><Link href="/admin">관리</Link></div>}
            <div className="ni">{role ? <form action={memberLogout}><button className="linkbtn">로그아웃</button></form> : <Link href="/login">로그인</Link>}</div>
          </nav>
          <MobileMenu>
              {MENU.map((m) => (
                <div key={m.href}>
                  <Link href={m.href}>{label(m)}</Link>
                  {m.sub?.map((s) => <Link key={s.href} href={s.href} className="subl">{label(s)}</Link>)}
                </div>
              ))}
              <small>계정</small>
              {role === 'admin' && <Link href="/admin">관리자 화면</Link>}
              {role ? <form action={memberLogout}><button className="linkbtn" style={{ padding: '16px 4px', fontSize: 19 }}>로그아웃</button></form> : <Link href="/login">조합원 로그인</Link>}
            </MobileMenu>
        </div></header>
        {children}
        <footer><div className="wrap">
          <b>한국외국어대학교 노동조합</b><br />
          서울캠퍼스 본관 602호 · <a href="tel:0221732611">02-2173-2611</a><br />
          글로벌캠퍼스 백년관 922호<br />
          <a href="mailto:hufslabor@hufs.ac.kr">hufslabor@hufs.ac.kr</a> · <a href="https://pf.kakao.com/_Pxnjxkxj" rel="noopener noreferrer">카카오 채널</a> · <a href="https://www.instagram.com/hufs_labor_union/" target="_blank" rel="noopener noreferrer">인스타그램</a>
        </div></footer>
      </body>
    </html>
  );
}
