import './globals.css';
import Link from 'next/link';
import type { Metadata, Viewport } from 'next';
import { getRole } from '@/lib/auth';
import { getMenu } from '@/lib/menu';
import { isLocked } from '@/lib/locks';
import { memberLogout } from './member-actions';
import MobileMenu from '@/components/MobileMenu';
import { APPLY_URL, INSTAGRAM_URL, KAKAO_URL } from '@/lib/links';

const SITE = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: 'HUFS UNION - 한국외국어대학교 노동조합', template: '%s - HUFS UNION' },
  description: '한국외국어대학교 노동조합 공식 홈페이지',
  openGraph: {
    title: '한국외국어대학교 노동조합',
    description: '공고와 교섭 소식을 가장 먼저 확인하세요.',
    siteName: 'HUFS UNION', locale: 'ko_KR', type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: '한국외국어대학교 노동조합' }],
  },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#14213d' };

function L({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  if (!href) return <span className="nolink">{children}</span>;
  if (href.startsWith('https://')) return <a href={href} className={className} target="_blank" rel="noopener noreferrer">{children}</a>;
  return <Link href={href} className={className}>{children}</Link>;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const role = await getRole();
  const { items, locks } = await getMenu();
  const lab = (n: string, href: string) => (!role && isLocked(href, locks) ? `${n} 🔒` : n);
  return (
    <html lang="ko">
      <head><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" /></head>
      <body>
        <a href="#main" className="skip">본문 바로가기</a>
        <header className="main"><div className="wrap">
          <Link href="/" className="logo">HUFS <b>UNION</b></Link>
          <nav className="dnav" aria-label="주요 메뉴">
            {items.map((m) => (
              <div key={m.id} className="ni">
                <L href={m.href}>{lab(m.name, m.href)}</L>
                {m.sub && m.sub.length > 0 && <div className="dd">{m.sub.map((x) => <L key={x.id} href={x.href}>{lab(x.name, x.href)}</L>)}</div>}
              </div>
            ))}
            <div className="ni"><Link href="/search" aria-label="검색">🔍</Link></div>
            {role && <div className="ni"><Link href="/me">내 정보</Link></div>}
            {role === 'admin' && <div className="ni"><Link href="/admin">관리</Link></div>}
            <div className="ni">{role ? <form action={memberLogout}><button className="linkbtn">로그아웃</button></form> : <Link href="/login">로그인</Link>}</div>
          </nav>
          <MobileMenu>
              {items.map((m) => (
                <div key={m.id}>
                  {m.href ? <L href={m.href}>{lab(m.name, m.href)}</L> : <small>{m.name}</small>}
                  {m.sub?.map((x) => <L key={x.id} href={x.href} className="subl">{lab(x.name, x.href)}</L>)}
                </div>
              ))}
              <Link href="/search">🔍 검색</Link>
              <small>계정</small>
              {role && <Link href="/me">내 정보</Link>}
              {role === 'admin' && <Link href="/admin">관리자 화면</Link>}
              {role ? <form action={memberLogout}><button className="linkbtn" style={{ padding: '16px 4px', fontSize: 19 }}>로그아웃</button></form> : <Link href="/login">조합원 로그인</Link>}
            </MobileMenu>
        </div></header>
        <div id="main" tabIndex={-1}>{children}</div>
        <footer><div className="wrap">
          <b>한국외국어대학교 노동조합</b><br />
          서울캠퍼스 본관 602호 · <a href="tel:0221732611">02-2173-2611</a><br />
          글로벌캠퍼스 백년관 922호<br />
          <a href="mailto:hufslabor@hufs.ac.kr">hufslabor@hufs.ac.kr</a> · <a href={APPLY_URL} target="_blank" rel="noopener noreferrer">가입신청서</a> · <a href={KAKAO_URL} target="_blank" rel="noopener noreferrer">카카오 채널</a> · <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">인스타그램</a>
        </div></footer>
      </body>
    </html>
  );
}
