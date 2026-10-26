'use server';
import { randomBytes } from 'node:crypto';
import { redirect } from 'next/navigation';
import { revalidateTag } from 'next/cache';
import { db } from '@/lib/firebase';
import { requireAdmin } from '@/lib/auth';
import { setLock } from '@/lib/locks';
import { DEFAULT_MENU, type MenuItem } from '@/lib/menu-data';

const t = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? '').trim().slice(0, max);

function cleanHref(h: string, required: boolean) {
  h = h.trim();
  if (!h) { if (required) throw new Error('주소를 입력하세요. (예: /page/projects 또는 https://…)'); return ''; }
  if (/^http:\/\//i.test(h)) throw new Error('외부 주소는 https:// 로 시작해야 합니다.');
  if (!/^(\/|https:\/\/)/.test(h) && /^[A-Za-z0-9\-_./?=&%가-힣]+$/.test(h)) h = '/' + h;   // 앞의 / 를 빠뜨린 경우 보정
  if (/^\/(?!\/)[A-Za-z0-9\-_./?=&%가-힣]{0,200}$/.test(h) || /^https:\/\/[^\s"'<>]{1,300}$/.test(h)) return h;
  throw new Error('주소는 /page/이름 처럼 사이트 안 주소이거나 https:// 로 시작하는 외부 주소여야 합니다.');
}
function locate(items: MenuItem[], id: string) {
  let i = items.findIndex((x) => x.id === id);
  if (i >= 0) return { arr: items, i, top: true };
  for (const p of items) { i = (p.sub ?? []).findIndex((x) => x.id === id); if (i >= 0) return { arr: p.sub!, i, top: false }; }
  return null;
}
async function mutate(fn: (items: MenuItem[]) => void) {
  const ref = db().collection('settings').doc('menu');
  await db().runTransaction(async (tx) => {
    const s = await tx.get(ref);
    const items: MenuItem[] = structuredClone(s.exists ? (s.data()!.items as MenuItem[]) : DEFAULT_MENU);
    fn(items);
    tx.set(ref, { items });
  });
  revalidateTag('menu');
}
// 오류가 나도 빈 오류 화면 대신 메뉴 관리 화면에 이유를 보여 줌(권한 확인은 호출 전에 끝냄)
async function run(fn: () => Promise<void>): Promise<never> {
  let err = '';
  try { await fn(); } catch (e) { err = e instanceof Error ? e.message : '저장하지 못했습니다.'; }
  redirect(err ? `/admin/menu?err=${encodeURIComponent(err)}` : '/admin/menu?ok=1');
}

export async function menuSave(fd: FormData) {
  await requireAdmin();
  const id = t(fd, 'id', 20), parent = t(fd, 'parent', 20), name = t(fd, 'name', 20);
  await run(async () => {
    if (!name) throw new Error('이름을 입력하세요.');
    await mutate((items) => {
      if (id) {
        const loc = locate(items, id); if (!loc) throw new Error('메뉴를 찾을 수 없습니다.');
        loc.arr[loc.i].name = name; loc.arr[loc.i].href = cleanHref(t(fd, 'href', 300), !loc.top);
      } else if (parent) {
        const p = items.find((x) => x.id === parent); if (!p) throw new Error('상위 메뉴를 찾을 수 없습니다.');
        if ((p.sub?.length ?? 0) >= 15) throw new Error('하위 메뉴는 15개까지 만들 수 있습니다.');
        p.sub = [...(p.sub ?? []), { id: randomBytes(4).toString('hex'), name, href: cleanHref(t(fd, 'href', 300), true) }];
      } else {
        if (items.length >= 12) throw new Error('상위 메뉴는 12개까지 만들 수 있습니다.');
        items.push({ id: randomBytes(4).toString('hex'), name, href: cleanHref(t(fd, 'href', 300), false) });
      }
    });
    // 🔒 조합원 전용 선택(사이트 안 주소에만 적용)
    if (fd.get('lockable') === '1') {
      const href = cleanHref(t(fd, 'href', 300), false);
      if (href.startsWith('/')) await setLock(href, fd.get('lock') === 'on');
    }
  });
}

export async function menuDelete(fd: FormData) {
  await requireAdmin();
  const id = t(fd, 'id', 20);
  await run(() => mutate((items) => { const loc = locate(items, id); if (loc) loc.arr.splice(loc.i, 1); }));
}

export async function menuMove(fd: FormData) {
  await requireAdmin();
  const id = t(fd, 'id', 20), d = fd.get('dir') === 'up' ? -1 : 1;
  await run(() => mutate((items) => {
    const loc = locate(items, id); if (!loc) return;
    const j = loc.i + d; if (j < 0 || j >= loc.arr.length) return;
    [loc.arr[loc.i], loc.arr[j]] = [loc.arr[j], loc.arr[loc.i]];
  }));
}

export async function menuReset() {
  await requireAdmin();
  await run(async () => { await db().collection('settings').doc('menu').delete(); revalidateTag('menu'); });
}
