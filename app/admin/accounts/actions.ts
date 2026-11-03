'use server';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { limit } from '@/lib/ratelimit';
import { RoleError, setAdminRole, setExecutiveRole, updateAccount } from '@/lib/roles';

const t = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? '').trim().slice(0, max);

// 오류가 나도 빈 오류 화면 대신 같은 화면에 이유를 보여 줍니다. (권한 확인은 호출 전에 끝냄)
async function run(back: string, fn: () => Promise<string>): Promise<never> {
  let ok = '', err = '';
  try { ok = await fn(); }
  catch (e) {
    if (e instanceof RoleError) err = e.message;
    else { console.error('admin account action error', e); err = '처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'; }
  }
  redirect(`${back}${back.includes('?') ? '&' : '?'}${err ? 'err=' + encodeURIComponent(err) : 'ok=' + encodeURIComponent(ok)}`);
}

/** 관리자 지정(on=1) / 해제(on=0) */
export async function setAdmin(fd: FormData) {
  const a = await requireAdmin();
  const uid = t(fd, 'uid', 128), on = fd.get('on') === '1', q = t(fd, 'q', 60);
  await run(`/admin/accounts${q ? '?q=' + encodeURIComponent(q) : ''}`, async () => {
    if (!(await limit('admin-accounts', a.uid, 60, 3600))) throw new RoleError('요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.');
    return setAdminRole({ uid: a.uid, email: a.email ?? '' }, uid, on);
  });
}

/** 집행부 지정(on=1) / 해제(on=0) */
export async function setExec(fd: FormData) {
  const a = await requireAdmin();
  const uid = t(fd, 'uid', 128), on = fd.get('on') === '1', q = t(fd, 'q', 60);
  await run(`/admin/accounts${q ? '?q=' + encodeURIComponent(q) : ''}`, async () => {
    if (!(await limit('admin-accounts', a.uid, 60, 3600))) throw new RoleError('요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.');
    return setExecutiveRole({ uid: a.uid, email: a.email ?? '' }, uid, on);
  });
}

/** 조합원 이름·이메일 수정 */
export async function saveAccount(fd: FormData) {
  const a = await requireAdmin();
  const uid = t(fd, 'uid', 128);
  await run(`/admin/accounts/${encodeURIComponent(uid)}`, async () => {
    if (!(await limit('admin-accounts', a.uid, 60, 3600))) throw new RoleError('요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.');
    return updateAccount({ uid: a.uid, email: a.email ?? '' }, uid, { name: t(fd, 'name', 300), email: t(fd, 'email', 300) });
  });
}
