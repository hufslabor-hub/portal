import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { loadExecLocks } from '@/lib/locks';
import { setExecPath } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: '집행부 전용 주소' };
const DANGER = { background: '#d64545', color: '#fff' } as const;

export default async function ExecPaths({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const paths = (await loadExecLocks()).slice().sort();      // 저장 직후에도 최신 값을 보기 위해 캐시를 거치지 않음
  return (
    <main><div className="wrap">
      <div className="bar"><h1 className="pt">집행부 전용 주소</h1><Link className="btn ghost sm" href="/admin">← 관리자 홈</Link></div>
      {sp.ok && <p className="ok" role="status">{sp.ok}</p>}
      {sp.err && <p className="err" role="alert">{sp.err}</p>}
      <p className="meta" style={{ whiteSpace: 'normal' }}>
        여기에 적은 주소는 <b>집행부와 관리자만</b> 열 수 있고, 그 밖의 사람에게는 메뉴에서도 보이지 않습니다.
        <b> 집행부 게시판(/c/exec)</b>은 항상 집행부 전용이라 따로 적지 않아도 됩니다.
      </p>
      <ol className="meta" style={{ whiteSpace: 'normal' }}>
        <li>고정 페이지를 만듭니다. (관리자 홈 → 고정 페이지) 예: 주소가 <code>exec-minutes</code> 이면 페이지 주소는 <code>/page/exec-minutes</code></li>
        <li>아래에 그 페이지 주소를 추가합니다.</li>
        <li>메뉴 관리에서 “집행부” 메뉴를 만들고 하위 메뉴로 그 주소를 넣습니다. 집행부·관리자에게만 메뉴가 보입니다.</li>
      </ol>

      <h2 className="sec">지정된 주소 {paths.length}개</h2>
      <ul className="cards">
        {paths.map((p) => (
          <li key={p} className="mcard">
            <div><strong>{p}</strong></div>
            <div className="acts">
              <details className="cmedit">
                <summary className="warn">전용 해제</summary>
                <form action={setExecPath}>
                  <input type="hidden" name="path" value={p} /><input type="hidden" name="on" value="0" />
                  <p className="meta" style={{ whiteSpace: 'normal' }}>{p} 의 집행부 전용을 해제할까요? 해제하면 조합원 전용 설정에 따라 다시 열립니다.</p>
                  <button className="btn sm" style={DANGER}>해제하기</button>
                </form>
              </details>
            </div>
          </li>
        ))}
        {!paths.length && <li className="meta">추가로 지정한 주소가 없습니다. (집행부 게시판은 항상 전용입니다)</li>}
      </ul>

      <h2 className="sec">주소 추가</h2>
      <form action={setExecPath} className="mf">
        <input type="hidden" name="on" value="1" />
        <input name="path" required maxLength={200} placeholder="/page/exec-minutes" aria-label="집행부 전용으로 지정할 주소" />
        <button className="btn sm">추가</button>
      </form>
    </div></main>
  );
}
