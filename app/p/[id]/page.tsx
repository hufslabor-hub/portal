import Md from '@/components/Md';
import { notFound } from 'next/navigation';
import { getPost } from '@/lib/content';

export const revalidate = 300;

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();
  return (
    <main><div className="wrap"><article>
      <h1 className="pt">{post.title}</h1>
      <p className="meta">{post.createdAt.slice(0, 10)}</p>
      <div className="prose"><Md text={post.body} /></div>
      {post.files.length > 0 && (
        <>
          <h2>첨부파일</h2>
          <ul className="files">{post.files.map((f) => <li key={f.url}><a href={f.url} rel="noopener noreferrer">{f.name}</a></li>)}</ul>
        </>
      )}
    </article></div></main>
  );
}
