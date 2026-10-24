'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase';
import { SESSION, SESSION_SEC, safeNext } from '@/lib/auth';
import { limit } from '@/lib/ratelimit';

const idt = (path: string, body: object) =>
  fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${path}?key=${process.env.FIREBASE_WEB_API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
const f = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? '').trim().slice(0, max);
const TOO_MANY = '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';

export async function memberLogin(_p: string | null, fd: FormData): Promise<string | null> {
  const next = safeNext(f(fd, 'next', 300));
  const email = f(fd, 'email', 200);
  if (!(await limit('login', email.toLowerCase(), 10, 900))) return '시도가 너무 많습니다. 15분 뒤에 다시 시도해 주세요.';
  const r = await idt('signInWithPassword', { email, password: String(fd.get('password') ?? '').slice(0, 200), returnSecureToken: true });
  if (!r.ok) return '이메일 또는 비밀번호가 올바르지 않습니다.';
  const { idToken } = await r.json();
  const dec = await adminAuth().verifyIdToken(idToken);
  if (dec.admin !== true && dec.member !== true) return '아직 승인되지 않은 계정입니다. 노동조합 사무실에 문의해 주세요.';
  const cookie = await adminAuth().createSessionCookie(idToken, { expiresIn: SESSION_SEC * 1000 });
  // HttpOnly: 스크립트가 읽을 수 없음 / Secure: HTTPS만 / Lax: 카카오톡·인스타 등 외부 링크로 들어와도 로그인 유지, 다른 사이트의 POST 요청에는 쿠키 미전송
  (await cookies()).set(SESSION, cookie, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: SESSION_SEC });
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
  if (!(await limit('signup', null, 5, 3600))) return { ok: false, msg: TOO_MANY };
  const r = await idt('signUp', { email: f(fd, 'email', 200), password, returnSecureToken: false });
  if (!r.ok) return { ok: false, msg: '가입 신청에 실패했습니다. 이미 가입했다면 로그인해 주세요.' };
  const { localId } = await r.json();
  await adminAuth().updateUser(localId, { displayName: dept ? `${name} (${dept})` : name });
  return { ok: true, msg: '가입 신청이 접수되었습니다. 조합 사무실의 승인 후 로그인할 수 있습니다.' };
}

// 비밀번호 재설정 메일 발송. 가입 여부·제한 여부가 드러나지 않도록 결과 문구는 항상 같음.
export async function resetPassword(_p: { ok: boolean; msg: string } | null, fd: FormData): Promise<{ ok: boolean; msg: string }> {
  const done = { ok: true, msg: '해당 주소로 가입된 계정이 있으면 비밀번호 재설정 메일을 보냈습니다. 메일함(스팸함 포함)을 확인해 주세요.' };
  if (f(fd, 'website', 100)) return done;
  const email = f(fd, 'email', 200);
  if (!email) return done;
  // 같은 접속지에서 시간당 10회, 같은 메일 주소로는 시간당 3회까지만 발송(메일 폭탄·할당량 소진 방지)
  const okIp = await limit('forgot-ip', null, 10, 3600);
  const okMail = await limit('forgot-mail', email.toLowerCase(), 3, 3600);
  if (okIp && okMail) await idt('sendOobCode', { requestType: 'PASSWORD_RESET', email }).catch(() => {});
  return done;
}
