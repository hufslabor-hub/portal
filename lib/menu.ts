import 'server-only';
import { unstable_cache } from 'next/cache';
import { db } from './firebase';
import { DEFAULT_MENU, type MenuItem } from './menu-data';
import { loadLocks } from './locks';

export async function loadMenu(): Promise<MenuItem[]> {
  const d = await db().collection('settings').doc('menu').get();
  return d.exists ? (d.data()!.items as MenuItem[]) : DEFAULT_MENU;
}

// 화면용(30초 캐시, 관리자가 저장하면 즉시 갱신). 메뉴와 잠금(🔒) 설정을 함께 가져옴.
export const getMenu = unstable_cache(async () => {
  const [items, locks] = await Promise.all([loadMenu(), loadLocks()]);
  return { items, locks };
}, ['menu'], { revalidate: 30, tags: ['menu', 'locks'] });
