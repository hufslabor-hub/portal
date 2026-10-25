'use client';
import { useEffect, useRef, useState } from 'react';
import { deleteChat, sendChat } from '@/app/chat/actions';

type Msg = { id: string; name: string; text: string; ts: number; mine: boolean };
const hm = (ts: number) => new Date(ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' });

export default function ChatRoom({ initial, isAdmin }: { initial: Msg[]; isAdmin: boolean }) {
  const [msgs, setMsgs] = useState(initial);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const last = useRef(initial.at(-1)?.ts ?? 0);
  const box = useRef<HTMLDivElement>(null);
  const stick = useRef(true);

  const add = (list: Msg[]) => {
    if (!list.length) return;
    last.current = Math.max(last.current, ...list.map((m) => m.ts));
    setMsgs((prev) => {
      const ids = new Set(prev.map((m) => m.id));
      const fresh = list.filter((m) => !ids.has(m.id));
      return fresh.length ? [...prev, ...fresh].slice(-200) : prev;
    });
  };

  useEffect(() => {
    let stop = false;
    const poll = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const r = await fetch(`/api/chat?after=${Math.max(0, last.current - 1)}`, { cache: 'no-store' });
        if (r.status === 401) { location.href = '/login?next=/chat'; return; }
        if (r.ok && !stop) add((await r.json()).messages);
      } catch { /* 네트워크 오류는 다음 확인 때 다시 시도 */ }
    };
    const iv = setInterval(poll, 5000);
    const onVis = () => { if (document.visibilityState === 'visible') poll(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { stop = true; clearInterval(iv); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  useEffect(() => { const el = box.current; if (el && stick.current) el.scrollTop = el.scrollHeight; }, [msgs]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = text.trim();
    if (!v || busy) return;
    setBusy(true); setErr('');
    const r = await sendChat(v);
    setBusy(false);
    if (r.ok) { setText(''); stick.current = true; add([r.msg]); } else setErr(r.error);
  }
  async function remove(id: string) {
    if (!confirm('이 메시지를 삭제할까요?')) return;
    if (await deleteChat(id)) setMsgs((p) => p.filter((m) => m.id !== id));
  }

  return (
    <div className="chat">
      <div className="chatbox" ref={box} onScroll={(e) => { const el = e.currentTarget; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }} aria-live="polite">
        {!msgs.length && <p className="meta">아직 대화가 없습니다. 첫 메시지를 남겨 보세요.</p>}
        {msgs.map((m) => (
          <div key={m.id} className={`msg${m.mine ? ' mine' : ''}`}>
            {!m.mine && <span className="who">{m.name}</span>}
            <div className="bubble">{m.text}</div>
            <span className="meta">{hm(m.ts)}{(m.mine || isAdmin) && <button type="button" className="linkbtn xs" onClick={() => remove(m.id)}> 삭제</button>}</span>
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="chatform">
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="메시지를 입력하세요" aria-label="메시지" enterKeyHint="send" autoComplete="off" />
        <button className="btn sm" disabled={busy || !text.trim()}>보내기</button>
      </form>
      {err && <p className="err" role="alert">{err}</p>}
    </div>
  );
}
