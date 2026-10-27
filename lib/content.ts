import 'server-only';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { db } from './firebase';

export const CATEGORIES = {
  news: '우리소식',
  notice: '공고',
  bargaining: '임단협뉴스',
  letter: '위원장 서신',
  newsletter: '뉴스레터',
  forms: '양식',
} as const;
export type Cat = keyof typeof CATEGORIES;
export const isCat = (v: string): v is Cat => v in CATEGORIES;
export const PAGE_SIZE = 20;

export type FileItem = { name: string; url: string; size?: number };
export type Post = { id: string; title: string; category: Cat; body: string; createdAt: string; files: FileItem[] };
/** 목록용(본문 없이 요약·썸네일만) */
export type PostCard = { id: string; title: string; category: Cat; createdAt: string; excerpt: string; thumb: string };

const ENT: Record<string, string> = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
/** 본문(HTML/Markdown)에서 태그·문법을 걷어 낸 보통 글 */
export const toPlain = (s: string) => s
  .replace(/<[^>]+>/g, ' ').replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/&(?:nbsp|amp|lt|gt|quot|#39);/g, (m) => ENT[m] ?? ' ').replace(/[#*_`>|]+/g, ' ').replace(/\s+/g, ' ').trim();
export const excerptOf = (body: string, n = 110) => toPlain(body).slice(0, n);
export const firstImage = (body: string) =>
  (body.match(/<img[^>]+src="(https:\/\/[^"]+)"/)?.[1] ?? body.match(/!\[[^\]]*\]\((https:\/\/[^)\s]+)\)/)?.[1] ?? '').replace(/&amp;/g, '&');

function toPost(d: FirebaseFirestore.DocumentSnapshot): Post {
  const v = d.data()!;
  return {
    id: d.id, title: String(v.title), category: v.category, body: String(v.body ?? ''),
    createdAt: v.createdAt.toDate().toISOString(),
    files: (v.files ?? []).filter((f: { url: string }) => String(f.url).startsWith('https://'))
      .map((f: { name: string; url: string; size?: unknown }) => ({ name: String(f.name), url: String(f.url), ...(typeof f.size === 'number' ? { size: f.size } : {}) })),
  };
}
function toCard(d: FirebaseFirestore.DocumentSnapshot): PostCard {
  const v = d.data()!, body = String(v.body ?? '');
  return { id: d.id, title: String(v.title), category: v.category, createdAt: v.createdAt.toDate().toISOString(), excerpt: excerptOf(body), thumb: firstImage(body) };
}

// 복합 색인 필요: published + category + createdAt (첫 실행 시 콘솔 오류의 링크로 생성)
/** 게시판 한 쪽(20개)과 전체 개수. 5분 캐시, 관리자가 글을 저장·삭제하면 즉시 갱신 */
export const getPostsPage = unstable_cache(async (category: Cat, page: number) => {
  const base = db().collection('posts').where('published', '==', true).where('category', '==', category);
  const [total, snap] = await Promise.all([
    base.count().get(),
    base.orderBy('createdAt', 'desc').offset((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).get(),
  ]);
  return { total: total.data().count, posts: snap.docs.map(toCard) };
}, ['posts-page'], { revalidate: 300, tags: ['posts'] });

/** 홈 화면용 최신 글 */
export const getRecent = unstable_cache(async (category: Cat, n: number) => {
  const s = await db().collection('posts').where('published', '==', true).where('category', '==', category).orderBy('createdAt', 'desc').limit(n).get();
  return s.docs.map(toCard);
}, ['posts-recent'], { revalidate: 300, tags: ['posts'] });

/** 검색용 목록: 제목과 본문 앞 1,500자(캐시 크기 제한 때문). 15분 캐시 */
export const getSearchIndex = unstable_cache(async () => {
  const s = await db().collection('posts').orderBy('createdAt', 'desc').limit(500).get();
  return s.docs.filter((d) => d.data().published !== false).map((d) => {
    const v = d.data();
    return { id: d.id, title: String(v.title), category: v.category as Cat, createdAt: v.createdAt.toDate().toISOString(), text: toPlain(String(v.body ?? '')).slice(0, 1500) };
  });
}, ['search-index'], { revalidate: 900, tags: ['posts'] });

export const getPost = cache(async (id: string): Promise<Post | null> => {
  const d = await db().collection('posts').doc(id).get();
  return d.exists && d.data()!.published ? toPost(d) : null;
});

export const getPage = cache(async (slug: string): Promise<{ title: string; body: string; hub: boolean } | null> => {
  const d = await db().collection('pages').doc(slug).get();
  return d.exists ? { title: d.data()!.title, body: d.data()!.body ?? '', hub: d.data()!.hub === true } : null;
});
