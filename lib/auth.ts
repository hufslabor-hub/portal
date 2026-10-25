import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from './firebase';

export const SESSION = 'session';
export const SESSION_SEC = 60 * 60 * 24 * 5;
export type Role = 'admin' | 'member' | null;
export type Session = { uid: string; role: 'admin' | 'member'; email: string; name: string };

/** 쿠키의 세션을 서버에서 검증. strict=true면 취소(차단)된 세션까지 확인(보호된 내용·쓰기에 사용). */
export async function getSession(strict = false): Promise<Session | null> {
  const c = (await cookies()).get(SESSION)?.value;
  if (!c) return null;
  try {
    const d = await adminAuth().verifySessionCookie(c, strict);
    const role = d.admin === true ? 'admin' : d.member === true ? 'member' : null;
    return role ? { uid: d.uid, role, email: d.email ?? '', name: String(d.name ?? '') } : null;
  } catch { return null; }
}
export async function getRole(strict = false): Promise<Role> { return (await getSession(strict))?.role ?? null; }

/** 로그인 후 돌아갈 주소는 사이트 내부 경로만 허용(외부 주소로 보내는 공격 방지). */
export const safeNext = (n?: string | null) => (n && /^\/(?!\/)[A-Za-z0-9\-_./?=&%]*$/.test(n) ? n : '/');

export async function requireSession(next: string): Promise<Session> {
  const s = await getSession(true);
  if (!s) redirect('/login?next=' + encodeURIComponent(next));
  return s;
}
export async function requireMember(next: string) { await requireSession(next); }

/** 관리자(custom claim admin=true)만 통과. 모든 관리자 페이지와 서버 액션의 첫 줄에서 호출. */
export async function requireAdmin() {
  const c = (await cookies()).get(SESSION)?.value;
  if (!c) redirect('/admin/login');
  try {
    const d = await adminAuth().verifySessionCookie(c, true);
    if (d.admin !== true) redirect('/admin/login');
    return d;
  } catch {
    redirect('/admin/login');
  }
}
