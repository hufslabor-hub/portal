import type { Metadata } from 'next';
import Link from 'next/link';
import Md from '@/components/Md';
import DocGrid, { extractDocs } from '@/components/DocGrid';
import { notFound } from 'next/navigation';
import { getPage } from '@/lib/content';
import { getRole } from '@/lib/auth';
import { getMenu } from '@/lib/menu';
import { getLocks, isLocked, normPath, requireUnlocked } from '@/lib/locks';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,40}$/.test(slug)) return {};
  const page = await getPage(slug);
  if (!page) return {};
  const [locks, role] = await Promise.all([getLocks(), getRole()]);
  if (!role && isLocked(`/page/${slug}`, locks)) return { title: '조합원 전용', robots: { index: false } };
  return { title: page.title, openGraph: { title: page.title, type: 'website', images: ['/og.png'] } };
}

export default async function StaticPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,40}$/.test(slug)) notFound();
  await requireUnlocked(`/page/${slug}`);
  const page = await getPage(slug);
  if (!page) notFound();

  if (slug === 'agreement') {
    const { docs, rest } = extractDocs(page.body);
    if (docs.length) {
      return (
        <main><div className="wrap">
          <h1 className="pt">{page.title}</h1>
          <p className="meta" style={{ whiteSpace: 'normal' }}>조직별 단체협약서입니다. 누르면 새 창에서 PDF가 열립니다.</p>
          <DocGrid docs={docs} />
          {rest && <Md text={rest} />}
        </div></main>
      );
    }
    if (!page.body.trim()) {   // 아직 협약서 링크가 하나도 없을 때
      return (<main><div className="wrap"><h1 className="pt">{page.title}</h1><p className="meta" style={{ whiteSpace: 'normal' }}>등록된 단체협약서가 없습니다. 관리자 화면에서 이 페이지에 <b>2024학년도 단체협약서_조직이름</b> 형식의 링크를 추가해 주세요.</p></div></main>);
    }
  }

  // '하위 메뉴를 카드로 보여주기'가 켜진 페이지: 이 페이지가 상위 메뉴일 때 그 하위 메뉴를 카드로 나열
  let cards: { id: string; name: string; href: string }[] = [];
  let locks: string[] = [];
  if (page.hub) {
    const m = await getMenu();
    locks = m.locks;
    cards = m.items.find((i) => normPath(i.href) === `/page/${slug}`)?.sub ?? [];
  }
  const role = cards.length ? await getRole() : null;
  return (
    <main><div className="wrap">
      <h1 className="pt">{page.title}</h1>
      {cards.length > 0 && (
        <div className="docs">
          {cards.map((c) => (
            <article key={c.id} className="doc">
              <h3>{!role && isLocked(c.href, locks) ? `${c.name} 🔒` : c.name}</h3>
              {c.href.startsWith('https://')
                ? <a className="btn sm" href={c.href} target="_blank" rel="noopener noreferrer">열기</a>
                : <Link className="btn sm" href={c.href || '#'}>열기</Link>}
            </article>
          ))}
        </div>
      )}
      <Md text={page.body} />
    </div></main>
  );
}
