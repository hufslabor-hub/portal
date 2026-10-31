import 'server-only';
import { adminAuth } from './firebase';
import { logAudit } from './audit';
import { splitName } from './members';

/**
 * 권한 구조(기존과 동일): Firebase 계정의 custom claim
 *   member=true : 승인된 조합원        admin=true : 관리자(조합원 중에서 지정)
 * 관리자 지정/해제와 조합원 정보 수정은 모두 관리자만 할 수 있고, 모든 작업은 변경 기록(audit_logs)에 남습니다.
 */
type U = { uid: string; email?: string; displayName?: string; customClaims?: Record<string, unknown> };
export type Account = { uid: string; email: string; raw: string; name: string; admin: boolean; member: boolean };
export type Actor = { uid: string; email: string };

export class RoleError extends Error {}

const UID = /^[A-Za-z0-9_-]{1,128}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const toAccount = (u: U): Account => {
  const raw = u.displayName ?? '';
  return { uid: u.uid, email: u.email ?? '', raw, name: splitName(raw).name || raw || '-', admin: u.customClaims?.admin === true, member: u.customClaims?.member === true };
};
export const byName = (a: Account, b: Account) => a.name.localeCompare(b.name, 'ko') || a.email.localeCompare(b.email);

/** 기본 관리자: 환경 변수 ROOT_ADMIN_EMAILS(쉼표로 구분)에 적은 이메일은 다른 관리자가 해제할 수 없습니다. */
export const isRoot = (email?: string) =>
  !!email && (process.env.ROOT_ADMIN_EMAILS ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase());

const MAX_ACCOUNTS = 10000;   // 이보다 많아도 앞의 1만 명까지만 읽습니다
export async function listAccounts(): Promise<Account[]> {
  const out: Account[] = [];
  let token: string | undefined;
  do {
    const r = await adminAuth().listUsers(1000, token);
    out.push(...r.users.map(toAccount));
    token = r.pageToken;
  } while (token && out.length < MAX_ACCOUNTS);
  return out;
}

export async function getAccount(uid: string): Promise<Account | null> {
  if (!UID.test(uid)) return null;
  try { return toAccount(await adminAuth().getUser(uid)); }
  catch (e) { if ((e as { code?: string }).code === 'auth/user-not-found') return null; throw e; }
}

async function mustGet(uid: string): Promise<U> {
  if (!UID.test(uid)) throw new RoleError('잘못된 요청입니다.');
  try { return await adminAuth().getUser(uid); }
  catch (e) { if ((e as { code?: string }).code === 'auth/user-not-found') throw new RoleError('계정을 찾을 수 없습니다.'); throw e; }
}

/** 승인된 조합원을 관리자로 지정(on=true)하거나 관리자 권한을 해제(on=false) */
export async function setAdminRole(actor: Actor, uid: string, on: boolean): Promise<string> {
  if (!on && uid === actor.uid) throw new RoleError('본인의 관리자 권한은 직접 해제할 수 없습니다. 다른 관리자에게 요청해 주세요.');
  const u = await mustGet(uid);
  const claims = u.customClaims ?? {};
  const who = toAccount(u).name;
  if (on) {
    if (claims.admin === true) throw new RoleError('이미 관리자입니다.');
    if (claims.member !== true) throw new RoleError('승인된 조합원만 관리자로 지정할 수 있습니다. 먼저 조합원 관리에서 승인해 주세요.');
    await adminAuth().setCustomUserClaims(uid, { ...claims, admin: true, member: true });
    await logAudit({ actorUid: actor.uid, actorEmail: actor.email, action: 'admin_grant', targetUid: uid, targetEmail: u.email });
    return `${who} 님을 관리자로 지정했습니다. 지정된 분이 다시 로그인하면 관리자 메뉴가 보입니다.`;
  }
  if (claims.admin !== true) throw new RoleError('관리자가 아닙니다.');
  if (isRoot(u.email)) throw new RoleError('기본 관리자 계정은 해제할 수 없습니다.');
  await adminAuth().setCustomUserClaims(uid, { ...claims, admin: false });
  await adminAuth().revokeRefreshTokens(uid);        // 이미 로그인한 기기의 관리자 세션도 즉시 무효화
  await logAudit({ actorUid: actor.uid, actorEmail: actor.email, action: 'admin_revoke', targetUid: uid, targetEmail: u.email });
  return `${who} 님의 관리자 권한을 해제했습니다. 이미 로그인한 기기에서도 바로 로그아웃됩니다.`;
}

/** 조합원 정보(이름·이메일) 수정. 관리자 계정은 본인만 고칠 수 있음(다른 관리자가 이메일을 바꿔 계정을 가로채는 것을 방지). */
export async function updateAccount(actor: Actor, uid: string, edit: { email: string; name: string }): Promise<string> {
  const email = edit.email.trim().toLowerCase();
  const name = edit.name.trim();
  if (!name) throw new RoleError('이름을 입력해 주세요.');
  if (name.length > 100) throw new RoleError('이름은 100자 이하로 입력해 주세요.');
  if (email.length > 200 || !EMAIL.test(email)) throw new RoleError('이메일 형식이 올바르지 않습니다.');

  const u = await mustGet(uid);
  if (u.customClaims?.admin === true && uid !== actor.uid) throw new RoleError('관리자 계정의 정보는 본인만 수정할 수 있습니다.');

  const patch: { email?: string; displayName?: string } = {};
  const changes: string[] = [];
  if (email !== (u.email ?? '').toLowerCase()) { patch.email = email; changes.push(`이메일: ${u.email ?? ''} → ${email}`); }
  if (name !== (u.displayName ?? '')) { patch.displayName = name; changes.push(`이름: ${u.displayName ?? ''} → ${name}`); }
  if (!changes.length) throw new RoleError('변경된 내용이 없습니다.');

  try { await adminAuth().updateUser(uid, patch); }
  catch (e) {
    const code = (e as { code?: string }).code;
    if (code === 'auth/email-already-exists') throw new RoleError('이미 다른 계정에서 쓰는 이메일입니다.');
    if (code === 'auth/invalid-email') throw new RoleError('이메일 형식이 올바르지 않습니다.');
    throw e;
  }
  if (patch.email && uid !== actor.uid) await adminAuth().revokeRefreshTokens(uid);   // 이메일이 바뀌면 기존 로그인 세션 종료
  await logAudit({ actorUid: actor.uid, actorEmail: actor.email, action: 'member_edit', targetUid: uid, targetEmail: patch.email ?? u.email, detail: changes.join(' / ') });
  return `${toAccount({ ...u, displayName: patch.displayName ?? u.displayName }).name} 님의 정보를 수정했습니다.${patch.email && uid !== actor.uid ? ' 이메일이 바뀌어 이미 로그인한 기기는 로그아웃됩니다.' : ''}`;
}
