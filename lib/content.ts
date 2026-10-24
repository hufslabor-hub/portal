import 'server-only';
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

export type Post = {
  id: string; title: string; category: Cat; body: string; createdAt: string;
  files: { name: string; url: string }[];
};

function toPost(d: FirebaseFirestore.DocumentSnapshot): Post {
  const v = d.data()!;
  return {
    id: d.id, title: String(v.title), category: v.category, body: String(v.body ?? ''),
    createdAt: v.createdAt.toDate().toISOString(),
    files: (v.files ?? []).filter((f: { url: string }) => String(f.url).startsWith('https://')),
  };
}

// 복합 색인 필요: published + category + createdAt (첫 실행 시 콘솔 오류의 링크로 생성)
export async function getPosts(category?: Cat, limit = 30): Promise<Post[]> {
  let q: FirebaseFirestore.Query = db().collection('posts').where('published', '==', true);
  if (category) q = q.where('category', '==', category);
  const s = await q.orderBy('createdAt', 'desc').limit(limit).get();
  return s.docs.map(toPost);
}

export async function getPost(id: string): Promise<Post | null> {
  const d = await db().collection('posts').doc(id).get();
  return d.exists && d.data()!.published ? toPost(d) : null;
}

export async function getPage(slug: string): Promise<{ title: string; body: string } | null> {
  const d = await db().collection('pages').doc(slug).get();
  return d.exists ? { title: d.data()!.title, body: d.data()!.body ?? '' } : null;
}

// 로그인한 조합원(또는 관리자)만 볼 수 있는 항목
export const PROTECTED_CATS: Cat[] = ['news', 'bargaining'];
export const PROTECTED_PAGES = ['agreement', 'bylaws'];
