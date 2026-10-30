import type { Metadata } from 'next';
import Md from '@/components/Md';
import Comments from '@/components/Comments';
import { notFound } from 'next/navigation';
import { excerptOf, firstImage, getPost } from '@/lib/content';
import { getRole } from '@/lib/auth';
import { getLocks, isLocked, requireUnlocked } from '@/lib/locks';

export const dynamic = 'force-dynamic';

// 댓글을 받는 카테고리 (lib/content.ts 의 CATEGORIES 키). 다른 카테고리에도 열려면 여기에 키를 추가하세요.
const COMMENT_CATS: string[] = ['bargaining'];   // 임단협뉴스

const ICON: Record<string, string> = { pdf: '📕', png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', webp: '🖼️', docx: '📘', hwp: '📄', hwpx: '📄', xlsx: '📗', pptx: '📙' };
const extOf = (name: string, url: string) => (name.split('.').pop() ?? url.split('?')[0].split('.').pop() ?? '').toLowerCase().slice(0, 5);
const fmt = (b?: number) => (!b ? '' : b >= 1048576 ? `${(b / 1048576).toFixed(1)}MB` : `${Math.max(1, Math.round(b / 1024))}KB`);

// 공유 미리보기·탭 제목. 조합원 전용 글은 로그인하지 않은 사람(검색 로봇 포함)에게 제목을 드러내지 않음.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) return { title: '글을 찾을 수 없습니다' };
  const [locks, role] = await Promise.all([getLocks(), getRole()]);
  if (!role && isLocked(`/c/${post.category}`, locks)) return { title: '조합원 전용', robots: { index: false } };
  const description = excerptOf(post.body, 120) || '한국외국어대학교 노동조합';
  return { title: post.title, description, openGraph: { title: post.title, description, type: 'article', images: [firstImage(post.body) || '/og.png'] } };
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();
  await requireUnlocked(`/c/${post.category}`, `/p/${id}`);
  return (
    <main><div className="wrap"><article>
      <h1 className="pt">{post.title}</h1>
      <p className="meta">{post.createdAt.slice(0, 10)}</p>
      <Md text={post.body} />
      {post.files.length > 0 && (
        <>
          <h2>첨부파일 {post.files.length}개</h2>
          <ul className="files">
            {post.files.map((f) => {
              const ext = extOf(f.name, f.url);
              return (
                <li key={f.url}>
                  <a className="file" href={f.url} target="_blank" rel="noopener noreferrer">
                    <span className="ficon" aria-hidden="true">{ICON[ext] ?? '📎'}</span>
                    <span className="fname">{f.name}</span>
                    <span className="fsize">{[ext.toUpperCase(), fmt(f.size)].filter(Boolean).join(' · ')}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </article>
      {COMMENT_CATS.includes(post.category) && <Comments scope="post" postId={post.id} path={`/p/${id}`} />}
    </div></main>
  );
}
