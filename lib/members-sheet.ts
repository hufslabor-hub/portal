import 'server-only';
import { unstable_cache } from 'next/cache';

export type SheetMember = { name: string; dept: string };

// 구글 스프레드시트(조합원 전체 시트)를 읽는 Apps Script 웹 앱에서 이름·소속만 받아옴.
async function fetchMembers(): Promise<SheetMember[]> {
  const url = process.env.MEMBERS_API_URL, key = process.env.MEMBERS_API_KEY;
  if (!url || !key) throw new Error('not-configured');
  const r = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }),
    redirect: 'follow', cache: 'no-store', signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  if (!Array.isArray(j.members)) throw new Error(String(j.error ?? 'bad-response'));
  return (j.members as { name?: unknown; dept?: unknown }[])
    .map((m) => ({ name: String(m.name ?? '').trim().slice(0, 40), dept: String(m.dept ?? '').trim().slice(0, 80) }))
    .filter((m) => m.name)
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

// 5분마다 새로 받아옴(실패한 응답은 저장하지 않음). 관리자가 '지금 새로고침'을 누르면 즉시 갱신.
export const getSheetMembers = unstable_cache(fetchMembers, ['sheet-members'], { revalidate: 300, tags: ['sheet-members'] });
