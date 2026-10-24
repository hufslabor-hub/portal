'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// 모바일 ☰ 메뉴: 메뉴 항목을 누르거나 화면이 이동하면 자동으로 닫힘
export default function MobileMenu({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const path = usePathname();
  useEffect(() => { ref.current?.removeAttribute('open'); }, [path]);
  return (
    <details className="m" ref={ref}>
      <summary aria-label="메뉴">☰</summary>
      <div className="mpanel" onClick={(e) => { if ((e.target as HTMLElement).closest('a, button')) ref.current?.removeAttribute('open'); }}>
        {children}
      </div>
    </details>
  );
}
