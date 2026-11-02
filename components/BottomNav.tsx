'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import s from './BottomNav.module.css';

const TABS = [
  { href: '/', label: '홈', icon: 'home' },
  { href: '/chat', label: '그룹챗', icon: 'chat' },
  { href: '/board', label: '자유게시판', icon: 'board' },
  { href: '/members', label: '조합원', icon: 'people' },
] as const;

function Icon({ name }: { name: string }) {
  switch (name) {
    case 'home': return (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v10h5v-6h4v6h5V10" /></svg>);
    case 'chat': return (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12z" /></svg>);
    case 'board': return (<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" /></svg>);
    case 'people': return (<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14.2c2.9.3 5 2.6 5 5.8" /></svg>);
    default: return (<svg className="dots" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" /></svg>);
  }
}

// 모바일 하단 메뉴(홈·그룹챗·자유게시판·조합원·더보기). 더보기를 누르면 전체 메뉴가 펼쳐짐. PC(820px 이상)에서는 보이지 않음.
export default function BottomNav({ children }: { children: React.ReactNode }) {
  const path = usePathname() ?? '/';
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const more = useRef<HTMLButtonElement>(null);

  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    root.current?.querySelector<HTMLElement>('#more-sheet a')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setOpen(false); more.current?.focus(); return; }
      if (e.key !== 'Tab' || !root.current) return;
      const items = Array.from(root.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'));
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open]);

  if (path.startsWith('/admin')) return null;   // 관리자 화면에서는 숨김
  const on = (h: string) => (h === '/' ? path === '/' : path === h || path.startsWith(`${h}/`));

  return (
    <div ref={root}>
      {open && (
        <div id="more-sheet" className={s.sheet} aria-label="전체 메뉴" onClick={(e) => { if ((e.target as HTMLElement).closest('a, button')) setOpen(false); }}>
          {children}
        </div>
      )}
      <nav className={s.bar} aria-label="하단 메뉴">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={`${s.tab}${on(t.href) && !open ? ` ${s.on}` : ''}`} aria-current={on(t.href) ? 'page' : undefined} onClick={() => setOpen(false)}>
            <Icon name={t.icon} /><span>{t.label}</span>
          </Link>
        ))}
        <button ref={more} type="button" className={`${s.tab}${open ? ` ${s.on}` : ''}`} aria-expanded={open} aria-controls="more-sheet" onClick={() => setOpen((v) => !v)}>
          <Icon name="more" /><span>더보기</span>
        </button>
      </nav>
      <div className={s.spacer} aria-hidden="true" />
    </div>
  );
}
