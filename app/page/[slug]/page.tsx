import Markdown from 'react-markdown';
import { notFound } from 'next/navigation';
import { getPage } from '@/lib/content';

export const revalidate = 300;

export default async function StaticPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,40}$/.test(slug)) notFound();
  const page = await getPage(slug);
  if (!page) notFound();
  return (<><h1>{page.title}</h1><div className="prose"><Markdown>{page.body}</Markdown></div></>);
}
