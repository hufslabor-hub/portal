import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { HOME_DEFAULTS, HOME_KEYS, HOME_LABELS, HOME_LIMITS, loadHomeText, type HomeKey } from '@/lib/home-text';
import HeroTitle from '@/components/HeroTitle';
import { resetHomeText, saveHomeText } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: '메인 문구 관리' };
const MULTI: HomeKey[] = ['heroTitle'];

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const t = await loadHomeText();            // 저장 직후에도 최신 값을 보여 주기 위해 캐시를 거치지 않음
  return (
    <main><div className="wrap">
      <div className="bar"><h1 className="pt">메인 페이지 문구</h1><Link className="btn ghost sm" href="/admin">← 관리자 홈</Link></div>
      {sp.ok && <p className="ok" role="status">{sp.ok}</p>}
      {sp.err && <p className="err" role="alert">{sp.err}</p>}
      <p className="meta" style={{ whiteSpace: 'normal' }}>메인 페이지 맨 위 소개 문구와 조합원 전용 안내를 고칩니다. 칸을 비우면 기본 문구가 나옵니다.</p>

      <h2 className="sec">현재 모습</h2>
      <section className="hero" aria-label="미리보기"><div className="wrap">
        <h1><HeroTitle text={t.heroTitle} /></h1>
        <p>{t.heroSub}</p>
        <div className="btns"><span className="btn">{t.applyLabel}</span><span className="btn ghost">{t.instaLabel}</span><span className="btn ghost">{t.kakaoLabel}</span></div>
      </div></section>

      <h2 className="sec">문구 고치기</h2>
      <form action={saveHomeText} className="form">
        {HOME_KEYS.map((k) => (
          <label key={k}>{HOME_LABELS[k]} <span className="meta">(최대 {HOME_LIMITS[k]}자)</span>
            {MULTI.includes(k)
              ? <textarea name={k} rows={3} maxLength={HOME_LIMITS[k] + 20} defaultValue={t[k]} placeholder={HOME_DEFAULTS[k]} />
              : <input name={k} maxLength={HOME_LIMITS[k] + 20} defaultValue={t[k]} placeholder={HOME_DEFAULTS[k]} />}
            {k === 'heroTitle' && <span className="meta" style={{ whiteSpace: 'normal', fontWeight: 400 }}>줄을 나누려면 Enter(최대 3줄), 색을 입힐 단어는 *별표*로 감싸세요. 예: 함께 일하는 사람들의 ⏎ *목소리*, 한국외대 노동조합</span>}
          </label>
        ))}
        <button className="btn">저장</button>
      </form>
      <form action={resetHomeText}><button className="btn ghost sm">기본 문구로 되돌리기</button></form>
    </div></main>
  );
}
