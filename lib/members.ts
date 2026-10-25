import 'server-only';
import { revalidateTag, unstable_cache } from 'next/cache';
import { adminAuth, db } from './firebase';

/** 'Firebase 표시 이름'("이름 (부서)")을 이름과 부서로 나눔 */
export const splitName = (d: string) => {
  const m = d.match(/^(.*?)\s*\((.*)\)\s*$/);
  return m ? { name: m[1].trim(), dept: m[2].trim() } : { name: d.trim(), dept: '' };
};

/** 승인된 조합원을 '조합원 찾기' 목록(members 컬렉션)에 등록/갱신. 이미 정한 공개 설정은 유지. */
export async function syncMember(uid: string) {
  const u = await adminAuth().getUser(uid);
  const { name, dept } = splitName(u.displayName ?? '');
  const ref = db().collection('members').doc(uid);
  const exists = (await ref.get()).exists;
  await ref.set({ name: name || (u.email ?? '').split('@')[0], dept, email: u.email ?? '', ...(exists ? {} : { listed: true, showEmail: false }) }, { merge: true });
  revalidateTag('members');
}
export async function dropMember(uid: string) {
  await db().collection('members').doc(uid).delete();
  revalidateTag('members');
}

// 목록에는 공개를 허락한 정보만 담음(이메일은 본인이 공개를 켠 경우에만). 5분 캐시.
export const listMembers = unstable_cache(async () => {
  const s = await db().collection('members').get();
  return s.docs.map((d) => d.data()).filter((m) => m.listed !== false)
    .map((m) => ({ name: String(m.name), dept: String(m.dept ?? ''), email: m.showEmail ? String(m.email ?? '') : '' }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}, ['members'], { revalidate: 300, tags: ['members'] });
