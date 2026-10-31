'use server';
import { redirect } from 'next/navigation';
import { revalidatePath, revalidateTag } from 'next/cache';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '@/lib/firebase';
import { requireAdmin } from '@/lib/auth';
import { limit } from '@/lib/ratelimit';
import { logAudit } from '@/lib/audit';
import { HOME_DEFAULTS, HOME_KEYS, HOME_LABELS, HOME_LIMITS, loadHomeText, type HomeKey } from '@/lib/home-text';

const MAX_TITLE_LINES = 3;

// 오류가 나도 빈 오류 화면 대신 편집 화면에 이유를 보여 줍니다.
async function run(fn: () => Promise<string>): Promise<never> {
  let ok = '', err = '';
  try { ok = await fn(); } catch (e) { err = e instanceof Error ? e.message : '저장하지 못했습니다.'; }
  redirect(`/admin/home?${err ? 'err=' + encodeURIComponent(err) : 'ok=' + encodeURIComponent(ok)}`);
}

export async function saveHomeText(fd: FormData) {
  const a = await requireAdmin();
  await run(async () => {
    if (!(await limit('admin-home', a.uid, 30, 3600))) throw new Error('저장 횟수가 너무 많습니다. 잠시 후 다시 시도해 주세요.');
    const vals = {} as Record<HomeKey, string>;
    for (const k of HOME_KEYS) {
      let v = String(fd.get(k) ?? '').replace(/\r\n/g, '\n').trim();
      if (k !== 'heroTitle') v = v.replace(/\s*\n\s*/g, ' ');                 // 한 줄 항목은 줄 바꿈 제거
      if (v.length > HOME_LIMITS[k]) throw new Error(`“${HOME_LABELS[k]}”은(는) ${HOME_LIMITS[k]}자 이하로 써 주세요. (현재 ${v.length}자)`);
      vals[k] = v;
    }
    if (vals.heroTitle.split('\n').length > MAX_TITLE_LINES) throw new Error(`큰 제목은 ${MAX_TITLE_LINES}줄까지 쓸 수 있습니다.`);
    const before = await loadHomeText();
    const changed = HOME_KEYS.filter((k) => (vals[k] || HOME_DEFAULTS[k]) !== before[k]).map((k) => HOME_LABELS[k]);
    await db().collection('settings').doc('home').set({ ...vals, updatedAt: Timestamp.now(), updatedBy: a.email ?? '' });
    if (changed.length) await logAudit({ actorUid: a.uid, actorEmail: a.email ?? '', action: 'home_edit', detail: `변경: ${changed.join(', ')}` });
    revalidateTag('home');
    revalidatePath('/');
    return changed.length ? '메인 문구를 저장했습니다. 메인 페이지에 바로 반영됩니다.' : '변경된 내용이 없습니다.';
  });
}

export async function resetHomeText() {
  const a = await requireAdmin();
  await run(async () => {
    await db().collection('settings').doc('home').delete();
    await logAudit({ actorUid: a.uid, actorEmail: a.email ?? '', action: 'home_reset' });
    revalidateTag('home');
    revalidatePath('/');
    return '기본 문구로 되돌렸습니다.';
  });
}
