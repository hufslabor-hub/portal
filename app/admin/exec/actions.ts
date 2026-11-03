'use server';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { limit } from '@/lib/ratelimit';
import { logAudit } from '@/lib/audit';
import { setExecLock } from '@/lib/locks';

const t = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? '').trim().slice(0, max);

// 오류가 나도 빈 오류 화면 대신 같은 화면에 이유를 보여 줍니다.
async function run(fn: () => Promise<string>): Promise<never> {
  let ok = '', err = '';
  try { ok = await fn(); } catch (e) { err = e instanceof Error ? e.message : '저장하지 못했습니다.'; }
  redirect(`/admin/exec?${err ? 'err=' + encodeURIComponent(err) : 'ok=' + encodeURIComponent(ok)}`);
}

/** 집행부 전용 주소 추가(on=1) / 해제(on=0) */
export async function setExecPath(fd: FormData) {
  const a = await requireAdmin();
  const path = t(fd, 'path', 220), on = fd.get('on') === '1';
  await run(async () => {
    if (!(await limit('admin-exec-paths', a.uid, 60, 3600))) throw new Error('요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.');
    await setExecLock(path, on);
    await logAudit({ actorUid: a.uid, actorEmail: a.email ?? '', action: on ? 'exec_path_add' : 'exec_path_remove', detail: path });
    return on ? `${path} 을(를) 집행부 전용으로 지정했습니다.` : `${path} 의 집행부 전용 지정을 해제했습니다.`;
  });
}
