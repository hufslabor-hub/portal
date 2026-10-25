import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '@/lib/firebase';
import { getSession } from '@/lib/auth';
import { toMsg } from '@/lib/chat';

export const dynamic = 'force-dynamic';

// 새 메시지 확인용(화면이 5초마다 호출). 로그인한 조합원만 응답.
export async function GET(req: Request) {
  const s = await getSession(true);
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const after = Number(new URL(req.url).searchParams.get('after'));
  if (!Number.isFinite(after) || after < 0) return NextResponse.json({ error: 'bad request' }, { status: 400 });
  const snap = await db().collection('chat_messages').where('createdAt', '>', Timestamp.fromMillis(after)).orderBy('createdAt', 'asc').limit(100).get();
  return NextResponse.json({ messages: snap.docs.map((d) => toMsg(d, s.uid)) }, { headers: { 'Cache-Control': 'no-store' } });
}
