import { requireSession } from '@/lib/auth';
import { recentMessages } from '@/lib/chat';
import ChatRoom from '@/components/ChatRoom';

export const dynamic = 'force-dynamic';
export const metadata = { title: '그룹챗' };

export default async function Chat() {
  const s = await requireSession('/chat');
  return (
    <main className="chat-page"><div className="wrap">
      <h1 className="pt">조합원 그룹챗</h1>
      <p className="meta" style={{ whiteSpace: 'normal' }}>로그인한 조합원만 볼 수 있고, 이름이 함께 표시됩니다. 대화는 5초마다 새로 확인합니다.</p>
      <ChatRoom initial={await recentMessages(s.uid)} isAdmin={s.role === 'admin'} />
    </div></main>
  );
}
