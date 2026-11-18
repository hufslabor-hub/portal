import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { loadMenu } from '@/lib/menu';
import { isAlways, loadLocks, normPath } from '@/lib/locks';
import type { MenuItem } from '@/lib/menu-data';
import { menuDelete, menuMove, menuReset, menuSave } from '../menu-actions';
import styles from './menu.module.css';

export const dynamic = 'force-dynamic';

/** 모든 메뉴 줄에 똑같이 보이는 '누가 볼 수 있나' 선택(주소가 없거나 바깥 주소여도 항상 표시) */
function Access({ it, locks }: { it?: MenuItem; locks: string[] }) {
  const href = it?.href ?? '';
  const always = isAlways(href);   // 조합원 정보·대화가 있는 곳은 항상 조합원 전용
  const lockOn = always || (href.startsWith('/') ? locks.includes(normPath(href)) : it?.members === true);
  return (
    <div className={styles.opts}>
      <input type="hidden" name="lockable" value="1" />
      <label className={styles.opt} title={always ? '조합원 정보·대화가 있는 곳이라 항상 조합원 전용입니다' : undefined}>
        <input type="checkbox" name="lock" defaultChecked={lockOn} disabled={always} /> 🔒 조합원 전용{always ? ' (고정)' : ''}
      </label>
      <label className={styles.opt}><input type="checkbox" name="exec" defaultChecked={it?.exec === true} /> 집행부 전용</label>
    </div>
  );
}

function Row({ it, sub, locks }: { it: MenuItem; sub?: boolean; locks: string[] }) {
  return (
    <div className={`${styles.row}${sub ? '' : ` ${styles.top}`}`}>
      <form action={menuSave} className={styles.form}>
        <input type="hidden" name="id" value={it.id} />
        <div className={styles.fields}>
          <input name="name" defaultValue={it.name} maxLength={20} required aria-label="메뉴 이름" placeholder="메뉴 이름" />
          <input name="href" defaultValue={it.href} maxLength={300} required={sub} aria-label="주소" placeholder={sub ? '/주소 또는 https://…' : '주소(비우면 하위 메뉴만 펼침)'} />
        </div>
        <div className={styles.opts}>
          <Access it={it} locks={locks} />
          <button className={`btn sm ${styles.save}`}>저장</button>
        </div>
      </form>
      <div className={styles.tools}>
        {(['up', 'down'] as const).map((d) => (
          <form key={d} action={menuMove}><input type="hidden" name="id" value={it.id} /><input type="hidden" name="dir" value={d} /><button className="btn sm ghost" aria-label={d === 'up' ? '위로' : '아래로'}>{d === 'up' ? '↑' : '↓'}</button></form>
        ))}
        <form action={menuDelete}><input type="hidden" name="id" value={it.id} /><button className="btn sm danger">삭제</button></form>
      </div>
    </div>
  );
}

function AddForm({ parent, locks }: { parent?: string; locks: string[] }) {
  return (
    <div className={`${styles.row} ${styles.add}`}>
      <form action={menuSave} className={styles.form}>
        {parent && <input type="hidden" name="parent" value={parent} />}
        <div className={styles.fields}>
          <input name="name" maxLength={20} required placeholder={parent ? '새 하위 메뉴 이름' : '새 상위 메뉴 이름'} aria-label="새 메뉴 이름" />
          <input name="href" maxLength={300} required={!!parent} placeholder={parent ? '/주소 또는 https://…' : '주소(비워도 됨)'} aria-label="새 메뉴 주소" />
        </div>
        <div className={styles.opts}>
          <Access locks={locks} />
          <button className={`btn sm ${styles.save}`}>{parent ? '+ 하위 메뉴 추가' : '+ 상위 메뉴 추가'}</button>
        </div>
      </form>
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
      <p className="meta" style={{ whiteSpace: 'normal' }}>주소는 <code>/c/news</code>(게시판), <code>/page/about</code>(페이지)처럼 사이트 안 주소이거나 <code>https://</code>로 시작하는 외부 주소입니다. 모든 메뉴에서 누가 볼 수 있는지 고를 수 있습니다.</p>
      <ul className="meta" style={{ whiteSpace: 'normal', paddingLeft: '1.2em', margin: '6px 0 14px' }}>
        <li><b>🔒 조합원 전용</b>: 사이트 안 주소는 로그인한 조합원만 열 수 있고 메뉴에 자물쇠가 표시됩니다. 바깥 사이트 주소와 하위 메뉴만 펼치는 묶음 메뉴는 로그인하지 않은 사람에게 메뉴가 보이지 않습니다.</li>
        <li><b>집행부 전용</b>: 집행부·관리자에게만 메뉴에 보입니다. 묶음 메뉴에 체크하면 하위 메뉴도 함께 숨겨집니다.</li>
        <li>바깥 사이트 주소는 메뉴만 숨길 뿐 주소 자체를 막지는 못하니, 그 사이트의 로그인 제한을 따로 확인하세요. 커뮤니티 안의 메뉴는 항상 조합원 전용입니다.</li>
      </ul>
      {items.map((it) => (
        <section key={it.id} className="mgroup">
          <Row it={it} locks={locks} />
          <div className="msubs">
            {(it.sub ?? []).map((s) => <Row key={s.id} it={s} sub locks={locks} />)}
            <AddForm parent={it.id} locks={locks} />
          </div>
        </section>
      ))}
      <h2 className="sec">상위 메뉴 추가</h2>
      <AddForm locks={locks} />
      <form action={menuReset} style={{ marginTop: 32 }}><button className="btn sm ghost">기본 메뉴로 되돌리기</button></form>
    </div></main>
  );
}
