'use server';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '@/lib/firebase';
import { getSession } from '@/lib/auth';
import { limit } from '@/lib/ratelimit';
import { splitName } from '@/lib/members';
import { toMsg, type ChatMsg } from '@/lib/chat';

export async function sendChat(raw: string): Promise<{ ok: true; msg: ChatMsg } | { ok: false; error: string }> {
  const s = await getSession(true);
  if (!s) return { ok: false, error: '로그인이 필요합니다.' };
  const text = String(raw ?? '').replace(/\r\n/g, '\n').trim().slice(0, 500);
  if (!text) return { ok: false, error: '내용을 입력하세요.' };
  if (!(await limit('chat', s.uid, 20, 60))) return { ok: false, error: '메시지를 너무 빨리 보내고 있습니다. 잠시 후 다시 보내 주세요.' };
  const name = splitName(s.name).name || s.email.split('@')[0] || '조합원';
  const now = Date.now();
  const ref = db().collection('chat_messages').doc();
  // expireAt: Firestore TTL 정책을 걸면 60일 지난 대화는 자동 삭제됨
  await ref.set({ uid: s.uid, name, text, createdAt: Timestamp.fromMillis(now), expireAt: Timestamp.fromMillis(now + 60 * 86400_000) });
  return { ok: true, msg: toMsg(await ref.get(), s.uid) };
}

export async function deleteChat(id: string): Promise<boolean> {
  const s = await getSession(true);
  if (!s || !/^[A-Za-z0-9]{10,40}$/.test(id)) return false;
  const ref = db().collection('chat_messages').doc(id);
  const d = await ref.get();
  if (!d.exists || (s.role !== 'admin' && d.data()!.uid !== s.uid)) return false;
  await ref.delete();
  return true;
}
