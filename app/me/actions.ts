'use server';
import { redirect } from 'next/navigation';
import { revalidateTag } from 'next/cache';
import { adminAuth, db } from '@/lib/firebase';
import { requireSession } from '@/lib/auth';
import { splitName } from '@/lib/members';

export async function saveProfile(fd: FormData) {
  const s = await requireSession('/me');
  const dept = String(fd.get('dept') ?? '').trim().slice(0, 60);
  const ref = db().collection('members').doc(s.uid);
  const cur = (await ref.get()).data();
  const name = String(cur?.name ?? '') || splitName(s.name).name || s.email.split('@')[0]; // 이름은 사칭 방지를 위해 관리자만 변경
  await ref.set({ name, dept, email: s.email, listed: fd.get('listed') === 'on', showEmail: fd.get('showEmail') === 'on' }, { merge: true });
  await adminAuth().updateUser(s.uid, { displayName: dept ? `${name} (${dept})` : name });
  revalidateTag('members');
  redirect('/me?saved=1');
}
