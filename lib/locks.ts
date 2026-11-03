import 'server-only';
import { revalidateTag, unstable_cache } from 'next/cache';
import { db } from './firebase';
import { requireExec, requireMember } from './auth';

/** 관리자가 아직 잠금 설정을 바꾼 적이 없을 때의 기본값 */
export const DEFAULT_LOCKS = ['/c/news', '/c/bargaining', '/page/agreement', '/page/bylaws', '/page/rules', '/page/projects'];
/** 조합원 정보·대화가 있는 곳은 항상 조합원 전용(관리자도 풀 수 없음) */
const ALWAYS = /^\/(community|members|board|chat|me)(\/|$)/;

export const normPath = (h: string) => h.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
export const isAlways = (h: string) => ALWAYS.test(normPath(h));
/** 이 주소가 조합원 전용인지(🔒 표시용) */
export const isLocked = (href: string, locks: string[]) => !!href && (isAlways(href) || locks.includes(normPath(href)));

/** 집행부·관리자만 볼 수 있는 곳: 집행부 게시판(/c/exec)과 /exec 아래는 항상 전용(관리자도 풀 수 없음) */
const ALWAYS_EXEC = /^\/(exec|c\/exec)(\/|$)/;
export const isExecOnly = (href: string, execLocks: string[]) => !!href && (ALWAYS_EXEC.test(normPath(href)) || execLocks.includes(normPath(href)));

/** 집행부 전용으로 추가 지정한 주소(고정 페이지 등). 관리자 화면(/admin/exec)에서 관리 */
export async function loadExecLocks(): Promise<string[]> {
  const d = await db().collection('settings').doc('execLocks').get();
  return d.exists && Array.isArray(d.data()!.paths) ? (d.data()!.paths as string[]) : [];
}
export const getExecLocks = unstable_cache(loadExecLocks, ['exec-locks'], { revalidate: 30, tags: ['execlocks'] });

/** 메뉴에서 집행부 전용 항목을 숨김(집행부·관리자에게는 전부 보임). 모든 하위가 숨겨진 묶음 메뉴도 숨김. */
export function filterExecMenu<S extends { href: string }, T extends { href: string; sub?: S[] }>(items: T[], canExec: boolean, execLocks: string[]): T[] {
  if (canExec) return items;
  const hide = (h: string) => isExecOnly(h, execLocks);
  return items.flatMap((m) => {
    if (hide(m.href)) return [];
    if (!m.sub) return [m];
    const sub = m.sub.filter((x) => !hide(x.href));
    if (m.sub.length > 0 && sub.length === 0 && !m.href) return [];
    return [{ ...m, sub }];
  });
}

export async function loadLocks(): Promise<string[]> {
  const d = await db().collection('settings').doc('locks').get();
  return d.exists ? (d.data()!.paths as string[]) : DEFAULT_LOCKS;
}
export const getLocks = unstable_cache(loadLocks, ['locks'], { revalidate: 30, tags: ['locks'] });

/** 잠긴 주소면 로그인한 조합원만 통과(아니면 로그인 화면으로). 보호는 반드시 서버에서 확인. */
export async function requireUnlocked(path: string, next = path) {
  if (isExecOnly(path, await getExecLocks())) { await requireExec(next); return; }   // 집행부·관리자 전용
  if (isAlways(path) || (await getLocks()).includes(normPath(path))) await requireMember(next);
}

/** 관리자가 선택한 잠금 저장 */
export async function setLock(href: string, on: boolean) {
  const p = normPath(href);
  if (!p.startsWith('/') || isAlways(p)) return;
  const ref = db().collection('settings').doc('locks');
  await db().runTransaction(async (tx) => {
    const s = await tx.get(ref);
    const paths = new Set<string>(s.exists ? (s.data()!.paths as string[]) : DEFAULT_LOCKS);
    if (on) paths.add(p); else paths.delete(p);
    tx.set(ref, { paths: [...paths] });
  });
  revalidateTag('locks');
}

/** 관리자가 선택한 집행부 전용 주소 저장 */
export async function setExecLock(href: string, on: boolean) {
  const p = normPath(href.trim());
  if (!/^\/[A-Za-z0-9\-_./가-힣]{0,200}$/.test(p) || p === '/') throw new Error('주소는 /page/이름 처럼 사이트 안 주소로 입력하세요.');
  if (/^\/(admin|login|api)(\/|$)/.test(p)) throw new Error('관리자·로그인 화면 주소는 지정할 수 없습니다.');
  if (ALWAYS_EXEC.test(p)) throw new Error('이 주소는 항상 집행부 전용이라 따로 지정하지 않아도 됩니다.');
  const ref = db().collection('settings').doc('execLocks');
  await db().runTransaction(async (tx) => {
    const s = await tx.get(ref);
    const paths = new Set<string>(s.exists && Array.isArray(s.data()!.paths) ? (s.data()!.paths as string[]) : []);
    if (on) paths.add(p); else paths.delete(p);
    if (paths.size > 100) throw new Error('집행부 전용 주소는 100개까지 지정할 수 있습니다.');
    tx.set(ref, { paths: [...paths] });
  });
  revalidateTag('execlocks');
}
