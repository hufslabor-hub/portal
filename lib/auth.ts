import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from './firebase';

export const SESSION = 'admin_session';
export const SESSION_SEC = 60 * 60 * 24 * 5;

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
