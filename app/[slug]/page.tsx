import { notFound, redirect } from 'next/navigation';

// /projects 처럼 /page/ 없이 적힌 짧은 주소를 /page/projects 로 안내(없는 주소는 404)
export default async function Short({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (/^[a-z0-9-]{1,40}$/.test(slug)) redirect(`/page/${slug}`);
  notFound();
}
