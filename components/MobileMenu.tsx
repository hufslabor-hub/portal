'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const FOCUSABLE = 'summary, a[href], button:not([disabled])';

// 모바일 ☰ 메뉴: 항목을 누르거나 화면이 이동하면 닫힘 · Esc로 닫고 ☰ 버튼으로 포커스 복귀 · 열린 동안 Tab 이동이 메뉴 안에서만 순환
export default function MobileMenu({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const path = usePathname();

  useEffect(() => { ref.current?.removeAttribute('open'); }, [path]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const d = ref.current;
      if (!d || !d.hasAttribute('open')) return;
      if (e.key === 'Escape') { e.preventDefault(); d.removeAttribute('open'); d.querySelector('summary')?.focus(); return; }
      if (e.key !== 'Tab') return;
      const items = Array.from(d.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <details className="m" ref={ref} onToggle={(e) => { if (e.currentTarget.open) e.currentTarget.querySelector<HTMLElement>('.mpanel a')?.focus(); }}>
      <summary aria-label="메뉴">☰</summary>
      <div className="mpanel" onClick={(e) => { if ((e.target as HTMLElement).closest('a, button')) ref.current?.removeAttribute('open'); }}>
        {children}
      </div>
    </details>
  );
}
