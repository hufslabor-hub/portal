import Md from '@/components/Md';
import DocGrid, { extractDocs } from '@/components/DocGrid';
import { notFound } from 'next/navigation';
import { PROTECTED_PAGES, getPage } from '@/lib/content';
import { requireMember } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function StaticPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,40}$/.test(slug)) notFound();
  const page = await getPage(slug);
  if (PROTECTED_PAGES.includes(slug) || page?.membersOnly) await requireMember(`/page/${slug}`);
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
  }
  return (<main><div className="wrap"><h1 className="pt">{page.title}</h1><Md text={page.body} /></div></main>);
}
