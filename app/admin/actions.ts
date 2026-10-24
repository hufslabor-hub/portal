'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';
import { randomUUID } from 'node:crypto';
import { adminAuth, bucket, db } from '@/lib/firebase';
import { requireAdmin, SESSION, SESSION_SEC } from '@/lib/auth';
import { CATEGORIES, isCat } from '@/lib/content';

export async function login(_prev: string | null, fd: FormData): Promise<string | null> {
  const email = String(fd.get('email') ?? '').slice(0, 200);
  const password = String(fd.get('password') ?? '').slice(0, 200);
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_WEB_API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  if (!r.ok) return '이메일 또는 비밀번호가 올바르지 않습니다.';
  const { idToken } = await r.json();
  const dec = await adminAuth().verifyIdToken(idToken);
  if (dec.admin !== true) return '관리자 권한이 없는 계정입니다.';
  const cookie = await adminAuth().createSessionCookie(idToken, { expiresIn: SESSION_SEC * 1000 });
  (await cookies()).set(SESSION, cookie, { httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: SESSION_SEC });
  redirect('/admin');
}

export async function logout() {
  (await cookies()).delete(SESSION);
  redirect('/admin/login');
}

const ID = /^[A-Za-z0-9_-]{1,40}$/;
const text = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? '').trim().slice(0, max);

function parseFiles(raw: string) {
  return raw.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 10).map((l) => {
    const [name, ...u] = l.split('|'); const url = u.join('|').trim();
    if (!url.startsWith('https://')) throw new Error(`첨부 주소는 https:// 로 시작해야 합니다: ${l}`);
    return { name: name.trim().slice(0, 100) || '첨부파일', url };
  });
}

export async function savePost(fd: FormData) {
  await requireAdmin();
  const id = text(fd, 'id', 40);
  const category = text(fd, 'category', 20), title = text(fd, 'title', 200);
  if (!isCat(category)) throw new Error('카테고리가 올바르지 않습니다.');
  if (!title) throw new Error('제목을 입력하세요.');
  const data = { title, category, body: text(fd, 'body', 100000), files: parseFiles(text(fd, 'files', 4000)), published: fd.get('published') === 'on', updatedAt: FieldValue.serverTimestamp() };
  const col = db().collection('posts');
  if (id === 'new') { const ref = col.doc(); await ref.set({ ...data, createdAt: FieldValue.serverTimestamp() }); }
  else { if (!ID.test(id)) throw new Error('잘못된 요청'); await col.doc(id).set(data, { merge: true }); }
  revalidatePath('/', 'layout');
  redirect('/admin');
}

export async function deletePost(fd: FormData) {
  await requireAdmin();
  const id = text(fd, 'id', 40);
  if (!ID.test(id)) throw new Error('잘못된 요청');
  await db().collection('posts').doc(id).delete();
  revalidatePath('/', 'layout');
  redirect('/admin');
}

export async function savePage(fd: FormData) {
  await requireAdmin();
  const slug = text(fd, 'slug', 40);
  if (!ID.test(slug)) throw new Error('잘못된 요청');
  await db().collection('pages').doc(slug).set({ title: text(fd, 'title', 200), body: text(fd, 'body', 200000), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  revalidatePath('/', 'layout');
  redirect('/admin');
}

// ── 첨부파일 업로드: 브라우저가 Storage로 직접 올리도록 10분짜리 서명 URL을 발급 ──
const EXT: Record<string, string> = {
  pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  hwp: 'application/x-hwp', hwpx: 'application/x-hwpx', zip: 'application/zip',
};
const MAX_BYTES = 30 * 1024 * 1024;

export async function getUploadUrl(fileName: string, size: number) {
  await requireAdmin();
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (!(ext in EXT)) throw new Error('허용되지 않는 파일 형식입니다.');
  if (!(size > 0 && size <= MAX_BYTES)) throw new Error('파일은 30MB 이하만 올릴 수 있습니다.');
  const path = `uploads/${randomUUID()}.${ext}`;
  const [url] = await bucket().file(path).getSignedUrl({ version: 'v4', action: 'write', expires: Date.now() + 10 * 60 * 1000, contentType: EXT[ext] });
  return { url, path, contentType: EXT[ext] };
}

export async function finalizeUpload(path: string) {
  await requireAdmin();
  if (!/^uploads\/[0-9a-f-]{36}\.[a-z0-9]{2,5}$/.test(path)) throw new Error('잘못된 요청');
  const f = bucket().file(path);
  await f.makePublic();
  return `https://storage.googleapis.com/${bucket().name}/${path}`;
}
