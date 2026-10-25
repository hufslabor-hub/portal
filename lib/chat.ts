import 'server-only';
import { db } from './firebase';

export type ChatMsg = { id: string; name: string; text: string; ts: number; mine: boolean };

export function toMsg(d: FirebaseFirestore.DocumentSnapshot, uid: string): ChatMsg {
  const v = d.data()!;
  return { id: d.id, name: String(v.name), text: String(v.text), ts: v.createdAt.toMillis(), mine: v.uid === uid };
}
export async function recentMessages(uid: string, n = 50): Promise<ChatMsg[]> {
  const s = await db().collection('chat_messages').orderBy('createdAt', 'desc').limit(n).get();
  return s.docs.reverse().map((d) => toMsg(d, uid));
}
