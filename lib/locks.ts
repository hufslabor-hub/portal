import 'server-only';
import { revalidateTag, unstable_cache } from 'next/cache';
import { db } from './firebase';
import { requireMember } from './auth';

/** 관리자가 아직 잠금 설정을 바꾼 적이 없을 때의 기본값 */
export const DEFAULT_LOCKS = ['/c/news', '/c/bargaining', '/page/agreement', '/page/bylaws', '/page/rules', '/page/projects'];
/** 조합원 정보·대화가 있는 곳은 항상 조합원 전용(관리자도 풀 수 없음) */
const ALWAYS = /^\/(community|members|board|chat|me)(\/|$)/;

export const normPath = (h: string) => h.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
export const isAlways = (h: string) => ALWAYS.test(normPath(h));
/** 이 주소가 조합원 전용인지(🔒 표시용) */
export const isLocked = (href: string, locks: string[]) => !!href && (isAlways(href) || locks.includes(normPath(href)));

export async function loadLocks(): Promise<string[]> {
  const d = await db().collection('settings').doc('locks').get();
  return d.exists ? (d.data()!.paths as string[]) : DEFAULT_LOCKS;
}
export const getLocks = unstable_cache(loadLocks, ['locks'], { revalidate: 30, tags: ['locks'] });

/** 잠긴 주소면 로그인한 조합원만 통과(아니면 로그인 화면으로). 보호는 반드시 서버에서 확인. */
export async function requireUnlocked(path: string, next = path) {
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
