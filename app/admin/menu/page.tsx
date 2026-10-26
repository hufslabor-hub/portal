import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { loadMenu } from '@/lib/menu';
import { isAlways, loadLocks, normPath } from '@/lib/locks';
import type { MenuItem } from '@/lib/menu-data';
import { menuDelete, menuMove, menuReset, menuSave } from '../menu-actions';

export const dynamic = 'force-dynamic';

function LockBox({ href, locks }: { href: string; locks: string[] }) {
  if (!href.startsWith('/')) return null;                       // 주소가 없거나 외부 주소면 잠금을 정할 수 없음
  if (isAlways(href)) return <span className="meta lk" title="조합원 정보·대화가 있는 곳이라 항상 조합원 전용입니다">🔒 고정</span>;
  return (
    <label className="chk lk">
      <input type="hidden" name="lockable" value="1" />
      <input type="checkbox" name="lock" defaultChecked={locks.includes(normPath(href))} /> 🔒 조합원 전용
    </label>
  );
}

function Row({ it, sub, locks }: { it: MenuItem; sub?: boolean; locks: string[] }) {
  return (
    <div className="mrow3">
      <form action={menuSave} className="mf">
        <input type="hidden" name="id" value={it.id} />
        <input name="name" defaultValue={it.name} maxLength={20} required aria-label="메뉴 이름" />
        <input name="href" defaultValue={it.href} maxLength={300} required={sub} aria-label="주소" placeholder={sub ? '/주소 또는 https://…' : '(비우면 하위 메뉴만 펼침)'} />
        <LockBox href={it.href} locks={locks} />
        <button className="btn sm">저장</button>
      </form>
      <div className="btns">
        {(['up', 'down'] as const).map((d) => (
          <form key={d} action={menuMove}><input type="hidden" name="id" value={it.id} /><input type="hidden" name="dir" value={d} /><button className="btn sm ghost" aria-label={d === 'up' ? '위로' : '아래로'}>{d === 'up' ? '↑' : '↓'}</button></form>
        ))}
        <form action={menuDelete}><input type="hidden" name="id" value={it.id} /><button className="btn sm danger">삭제</button></form>
      </div>
    </div>
  );
}

export default async function AdminMenu({ searchParams }: { searchParams: Promise<{ err?: string; ok?: string }> }) {
  await requireAdmin();
  const { err, ok } = await searchParams;
  const [items, locks] = await Promise.all([loadMenu(), loadLocks()]);
  return (
    <main><div className="wrap">
      <p><Link href="/admin">← 관리자</Link></p>
      <h1 className="pt">메뉴 관리</h1>
      {err && <p className="err" role="alert">저장하지 못했습니다: {err}</p>}
      {ok && <p className="ok" role="status">저장했습니다. 사이트 메뉴에는 최대 30초 안에 반영됩니다.</p>}
      <p className="meta" style={{ whiteSpace: 'normal' }}>주소는 <code>/c/news</code>(게시판), <code>/page/about</code>(페이지)처럼 사이트 안 주소이거나 <code>https://</code>로 시작하는 외부 주소입니다. <b>🔒 조합원 전용</b>을 체크하면 그 주소는 로그인한 조합원만 볼 수 있고, 메뉴에도 자물쇠가 표시됩니다. 외부 주소와 주소 없는 상위 메뉴는 잠글 수 없습니다.</p>
      {items.map((it) => (
        <section key={it.id} className="mgroup">
          <Row it={it} locks={locks} />
          <div className="msubs">
            {(it.sub ?? []).map((s) => <Row key={s.id} it={s} sub locks={locks} />)}
            <form action={menuSave} className="mf add">
              <input type="hidden" name="parent" value={it.id} />
              <input type="hidden" name="lockable" value="1" />
              <input name="name" maxLength={20} required placeholder="새 하위 메뉴 이름" aria-label="새 하위 메뉴 이름" />
              <input name="href" maxLength={300} required placeholder="/주소 또는 https://…" aria-label="새 하위 메뉴 주소" />
              <label className="chk lk"><input type="checkbox" name="lock" /> 🔒 조합원 전용</label>
              <button className="btn sm">+ 하위 메뉴</button>
            </form>
          </div>
        </section>
      ))}
      <h2 className="sec">상위 메뉴 추가</h2>
      <form action={menuSave} className="mf add">
        <input type="hidden" name="lockable" value="1" />
        <input name="name" maxLength={20} required placeholder="메뉴 이름" aria-label="새 상위 메뉴 이름" />
        <input name="href" maxLength={300} placeholder="주소(비워도 됨)" aria-label="새 상위 메뉴 주소" />
        <label className="chk lk"><input type="checkbox" name="lock" /> 🔒 조합원 전용</label>
        <button className="btn sm">+ 상위 메뉴</button>
      </form>
      <form action={menuReset} style={{ marginTop: 32 }}><button className="btn sm ghost">기본 메뉴로 되돌리기</button></form>
    </div></main>
  );
}
