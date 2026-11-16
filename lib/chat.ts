import 'server-only';
import { db } from './firebase';
import { anonHash, chatAlias } from './anon';

/** name 은 실제 이름이 아니라 그날의 익명 별명(예: 익명 여우07) */
export type ChatMsg = { id: string; name: string; text: string; ts: number; mine: boolean };

export function toMsg(d: FirebaseFirestore.DocumentSnapshot, uid: string): ChatMsg {
  const v = d.data()!;
  const ts: number = v.createdAt.toMillis();
  const author: string = v.authorHash ?? anonHash(String(v.uid ?? ''));   // 예전 메시지(uid만 저장)도 같은 방식으로 익명 처리
  return { id: d.id, name: chatAlias(author, ts), text: String(v.text), ts, mine: author === anonHash(uid) };
}
export async function recentMessages(uid: string, n = 50): Promise<ChatMsg[]> {
  const s = await db().collection('chat_messages').orderBy('createdAt', 'desc').limit(n).get();
  return s.docs.reverse().map((d) => toMsg(d, uid));
}
