'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * 메뉴 링크를 누른 뒤에도 하위 메뉴가 화면에 남아 있던 문제를 해결합니다.
 * 원인: 하위 메뉴가 :hover / :focus-within 으로 열리는데, 링크를 누르면 마우스가 그 위에 있고 링크에 포커스도 남아 이동 후에도 열려 있었습니다.
 *  - 데스크톱: 링크를 누르면 .nav-closed 로 하위 메뉴를 닫고, 마우스가 다른 메뉴로 옮겨 가거나 메뉴를 벗어나면(또는 키보드로 다시 들어가면) 원래대로 열립니다.
 *  - 모바일: 이동하면 열려 있던 메뉴를 닫습니다.
 */
export default function NavClose() {
  const path = usePathname();
  const first = useRef(true);

  useEffect(() => {
    const nav = document.querySelector<HTMLElement>('.dnav');
    const mobile = document.querySelector<HTMLElement>('details.m');
    let clicked: Element | null = null;          // 방금 링크를 누른 메뉴 칸
    const onClick = (e: Event) => {
      if (!(e.target as Element).closest('a')) return;
      clicked = (e.target as Element).closest('.ni');
      closeMenus();
    };
    const reopen = () => { clicked = null; nav?.classList.remove('nav-closed'); };
    const onOver = (e: Event) => { const ni = (e.target as Element).closest('.ni'); if (ni && ni !== clicked) reopen(); };
    nav?.addEventListener('click', onClick);
    nav?.addEventListener('mouseover', onOver);
    nav?.addEventListener('mouseleave', reopen);
    nav?.addEventListener('focusin', reopen);
    mobile?.addEventListener('click', onClick);
    return () => {
      nav?.removeEventListener('click', onClick);
      nav?.removeEventListener('mouseover', onOver);
      nav?.removeEventListener('mouseleave', reopen);
      nav?.removeEventListener('focusin', reopen);
      mobile?.removeEventListener('click', onClick);
    };
  }, []);

  // 주소가 바뀌면(링크 클릭 외의 이동 포함) 메뉴를 닫음. 첫 화면 표시 때는 건드리지 않음
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    closeMenus();
  }, [path]);

  return null;
}

function closeMenus() {
  const nav = document.querySelector<HTMLElement>('.dnav');
  if (nav) {
    nav.classList.add('nav-closed');
    const a = document.activeElement as HTMLElement | null;
    if (a && nav.contains(a)) a.blur();
  }
  document.querySelectorAll<HTMLDetailsElement>('details.m[open]').forEach((d) => d.removeAttribute('open'));
}
