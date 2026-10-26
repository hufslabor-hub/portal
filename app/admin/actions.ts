'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath, revalidateTag } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';
import { del } from '@vercel/blob';
import { adminAuth, db } from '@/lib/firebase';
import { blobToken } from '@/lib/blob';
import { limit } from '@/lib/ratelimit';
import { setLock } from '@/lib/locks';
import { extOf } from '@/lib/upload-rules';
import { requireAdmin, SESSION, SESSION_SEC } from '@/lib/auth';
import { CATEGORIES, isCat } from '@/lib/content';

export async function login(_prev: string | null, fd: FormData): Promise<string | null> {
  const email = String(fd.get('email') ?? '').slice(0, 200);
  const password = String(fd.get('password') ?? '').slice(0, 200);
  if (!(await limit('login', email.toLowerCase(), 10, 900))) return '시도가 너무 많습니다. 15분 뒤에 다시 시도해 주세요.';
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_WEB_API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  if (!r.ok) return '이메일 또는 비밀번호가 올바르지 않습니다.';
  const { idToken } = await r.json();
  const dec = await adminAuth().verifyIdToken(idToken);
  if (dec.admin !== true) return '관리자 권한이 없는 계정입니다.';
  const cookie = await adminAuth().createSessionCookie(idToken, { expiresIn: SESSION_SEC * 1000 });
  (await cookies()).set(SESSION, cookie, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: SESSION_SEC });
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
  await db().collection('pages').doc(slug).set({ title: text(fd, 'title', 200), body: text(fd, 'body', 200000), hub: fd.get('hub') === 'on', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  await setLock(`/page/${slug}`, fd.get('membersOnly') === 'on');
  revalidatePath('/', 'layout');
  revalidateTag('menu');
  redirect('/admin');
}

// ── 조합원 승인/해제/삭제 ──
export async function setMember(fd: FormData) {
  await requireAdmin();
  const uid = text(fd, 'uid', 128), on = fd.get('on') === '1';
  const u = await adminAuth().getUser(uid);
  if (u.customClaims?.admin) throw new Error('관리자 계정은 여기서 바꿀 수 없습니다.');
  await adminAuth().setCustomUserClaims(uid, { ...(u.customClaims ?? {}), member: on });
  if (!on) await adminAuth().revokeRefreshTokens(uid); // 이미 로그인한 세션도 즉시 무효화
  revalidatePath('/admin/members');
}

export async function deleteUser(fd: FormData) {
  await requireAdmin();
  const uid = text(fd, 'uid', 128);
  const u = await adminAuth().getUser(uid);
  if (u.customClaims?.admin) throw new Error('관리자 계정은 삭제할 수 없습니다.');
  await adminAuth().deleteUser(uid);
  revalidatePath('/admin/members');
}

// ── 업로드된 파일 검사: 앞 16바이트(파일 시그니처)가 확장자와 맞지 않으면 즉시 삭제 ──
const starts = (b: Uint8Array, sig: number[]) => sig.every((v, i) => b[i] === v);
function signatureOk(ext: string, b: Uint8Array) {
  switch (ext) {
    case 'pdf': return starts(b, [0x25, 0x50, 0x44, 0x46, 0x2d]);
    case 'png': return starts(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case 'jpg': case 'jpeg': return starts(b, [0xff, 0xd8, 0xff]);
    case 'gif': return starts(b, [0x47, 0x49, 0x46, 0x38]);
    case 'webp': return starts(b, [0x52, 0x49, 0x46, 0x46]) && starts(b.slice(8), [0x57, 0x45, 0x42, 0x50]);
    case 'docx': case 'xlsx': case 'pptx': case 'hwpx': return starts(b, [0x50, 0x4b, 0x03, 0x04]);
    case 'hwp': return starts(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]) || starts(b, [0x48, 0x57, 0x50, 0x20]);
    default: return false;
  }
}

export async function verifyUpload(url: string): Promise<boolean> {
  await requireAdmin();
  let u: URL;
  try { u = new URL(url); } catch { throw new Error('잘못된 주소입니다.'); }
  // 우리 Blob 저장소의 uploads/ 경로만 검사(임의 주소 요청 방지)
  if (u.protocol !== 'https:' || !u.hostname.endsWith('.blob.vercel-storage.com') || !u.pathname.startsWith('/uploads/')) throw new Error('잘못된 주소입니다.');
  const res = await fetch(url, { headers: { Range: 'bytes=0-15' } });
  const head = new Uint8Array(await res.arrayBuffer()).slice(0, 16);
  if (!res.ok || !signatureOk(extOf(u.pathname), head)) {
    const token = blobToken();
    await del(url, token ? { token } : undefined).catch(() => {});
    throw new Error('파일 내용이 확장자와 맞지 않아 삭제했습니다.');
  }
  return true;
}

export async function gotoPage(fd: FormData) {
  await requireAdmin();
  const slug = text(fd, 'slug', 40);
  if (!/^[a-z0-9-]{1,40}$/.test(slug)) throw new Error('주소는 영문 소문자, 숫자, -만 쓸 수 있습니다.');
  redirect(`/admin/page/${slug}`);
}
