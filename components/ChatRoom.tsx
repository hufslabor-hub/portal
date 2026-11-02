'use client';
import { useEffect, useRef, useState } from 'react';
import { deleteChat, sendChat } from '@/app/chat/actions';
import ui from './ChatRoom.module.css';

type Msg = { id: string; name: string; text: string; ts: number; mine: boolean };
const hm = (ts: number) => new Date(ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' });
const atBottom = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 160;

export default function ChatRoom({ initial, isAdmin }: { initial: Msg[]; isAdmin: boolean }) {
  const [msgs, setMsgs] = useState(initial);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const last = useRef(initial.at(-1)?.ts ?? 0);
  const stick = useRef(true);      // 맨 아래를 보고 있을 때만 새 메시지가 오면 따라 내려감
  const first = useRef(true);

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
    const onScroll = () => { stick.current = atBottom(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { stop = true; clearInterval(iv); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('scroll', onScroll); };
  }, []);

  // 처음 열면 가장 최근 대화로, 이후에는 맨 아래를 보고 있을 때만 따라 내려감
  useEffect(() => {
    if (!stick.current) return;
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: first.current ? 'auto' : 'smooth' });
    first.current = false;
  }, [msgs]);

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
    <div className={ui.chat}>
      <div className={ui.list} aria-live="polite">
        {!msgs.length && <p className={ui.empty}>아직 대화가 없습니다. 첫 메시지를 남겨 보세요.</p>}
        {msgs.map((m) => (
          <div key={m.id} className={`${ui.msg}${m.mine ? ` ${ui.mine}` : ''}`}>
            {!m.mine && <span className={ui.who}>{m.name}</span>}
            <div className={ui.bubble}>{m.text}</div>
            <span className={ui.time}>{hm(m.ts)}{(m.mine || isAdmin) && <button type="button" className={ui.del} onClick={() => remove(m.id)}>삭제</button>}</span>
          </div>
        ))}
      </div>
      <form onSubmit={submit} className={ui.form}>
        {err && <p className={ui.err} role="alert">{err}</p>}
        <div className={ui.field}>
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="메시지를 입력하세요" aria-label="메시지" enterKeyHint="send" autoComplete="off" />
          <button className={`btn sm ${ui.send}`} disabled={busy || !text.trim()}>보내기</button>
        </div>
      </form>
    </div>
  );
}
