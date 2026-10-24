import Md from '@/components/Md';
import { notFound } from 'next/navigation';
import { PROTECTED_PAGES, getPage } from '@/lib/content';
import { requireMember } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function StaticPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,40}$/.test(slug)) notFound();
  if (PROTECTED_PAGES.includes(slug)) await requireMember(`/page/${slug}`);
  const page = await getPage(slug);
  if (!page) notFound();
  return (<main><div className="wrap"><h1 className="pt">{page.title}</h1><Md text={page.body} /></div></main>);
}
