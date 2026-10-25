import 'server-only';
import { unstable_cache } from 'next/cache';
import { db } from './firebase';
import { DEFAULT_MENU, type MenuItem } from './menu-data';
import { PROTECTED_CATS, PROTECTED_PAGES } from './content';

export async function loadMenu(): Promise<MenuItem[]> {
  const d = await db().collection('settings').doc('menu').get();
  return d.exists ? (d.data()!.items as MenuItem[]) : DEFAULT_MENU;
}

// 화면용(30초 캐시, 관리자가 저장하면 즉시 갱신). 조합원 전용으로 표시된 페이지 목록도 함께 가져옴.
export const getMenu = unstable_cache(async () => {
  const [items, locked] = await Promise.all([loadMenu(), db().collection('pages').where('membersOnly', '==', true).get()]);
  return { items, lockedPages: locked.docs.map((x) => x.id) };
}, ['menu'], { revalidate: 30, tags: ['menu'] });

/** 이 주소가 조합원 전용인지(🔒 표시용). 실제 접근 제한은 각 페이지에서 서버가 따로 확인함. */
export function isLocked(href: string, lockedPages: string[]) {
  const c = href.match(/^\/c\/([^/?#]+)/);
  if (c && (PROTECTED_CATS as string[]).includes(c[1])) return true;
  const p = href.match(/^\/page\/([^/?#]+)/);
  if (p && (PROTECTED_PAGES.includes(p[1]) || lockedPages.includes(p[1]))) return true;
  return /^\/(community|members|board|chat|me)(\/|\?|$)/.test(href);
}
