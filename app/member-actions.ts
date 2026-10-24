'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase';
import { SESSION, SESSION_SEC, safeNext } from '@/lib/auth';

const idt = (path: string, body: object) =>
  fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${path}?key=${process.env.FIREBASE_WEB_API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
const f = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? '').trim().slice(0, max);

export async function memberLogin(_p: string | null, fd: FormData): Promise<string | null> {
  const next = safeNext(f(fd, 'next', 300));
  const r = await idt('signInWithPassword', { email: f(fd, 'email', 200), password: String(fd.get('password') ?? '').slice(0, 200), returnSecureToken: true });
  if (!r.ok) return '이메일 또는 비밀번호가 올바르지 않습니다.';
  const { idToken } = await r.json();
  const dec = await adminAuth().verifyIdToken(idToken);
  if (dec.admin !== true && dec.member !== true) return '아직 승인되지 않은 계정입니다. 노동조합 사무실에 문의해 주세요.';
  const cookie = await adminAuth().createSessionCookie(idToken, { expiresIn: SESSION_SEC * 1000 });
  (await cookies()).set(SESSION, cookie, { httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: SESSION_SEC });
  redirect(next);
}

export async function memberLogout() {
  (await cookies()).delete(SESSION);
  redirect('/');
}

export async function signup(_p: { ok: boolean; msg: string } | null, fd: FormData): Promise<{ ok: boolean; msg: string }> {
  if (f(fd, 'website', 100)) return { ok: true, msg: '접수되었습니다.' }; // 숨은 칸(스팸 봇 차단)
  const name = f(fd, 'name', 40), dept = f(fd, 'dept', 60), password = String(fd.get('password') ?? '').slice(0, 200);
  if (!name) return { ok: false, msg: '이름을 입력하세요.' };
  if (password.length < 8) return { ok: false, msg: '비밀번호는 8자 이상이어야 합니다.' };
  const r = await idt('signUp', { email: f(fd, 'email', 200), password, returnSecureToken: false });
  if (!r.ok) return { ok: false, msg: '가입 신청에 실패했습니다. 이미 가입했다면 로그인해 주세요.' };
  const { localId } = await r.json();
  await adminAuth().updateUser(localId, { displayName: dept ? `${name} (${dept})` : name });
  return { ok: true, msg: '가입 신청이 접수되었습니다. 조합 사무실의 승인 후 로그인할 수 있습니다.' };
}
