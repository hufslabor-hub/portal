'use client';
import { useState } from 'react';
import { upload } from '@vercel/blob/client';

export default function UploadBox({ targetId }: { targetId: string }) {
  const [msg, setMsg] = useState('');
  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      setMsg('업로드 중…');
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
      const blob = await upload(`uploads/${crypto.randomUUID()}.${ext}`, file, { access: 'public', handleUploadUrl: '/api/upload' });
      const ta = document.getElementById(targetId) as HTMLTextAreaElement;
      ta.value = (ta.value ? ta.value.trimEnd() + '\n' : '') + `${file.name.replace(/\|/g, '-')} | ${blob.url}`;
      setMsg(`✔ ${file.name} 추가됨 (저장 버튼을 눌러야 반영됩니다)`);
    } catch (err) { setMsg(err instanceof Error ? err.message : '업로드에 실패했습니다.'); }
    e.target.value = '';
  }
  return (
    <div className="form"><label>파일 올리기 (PDF·이미지·문서, 30MB 이하)
      <input type="file" onChange={onPick} accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.docx,.xlsx,.pptx,.hwp,.hwpx,.zip" />
    </label>{msg && <p className="meta">{msg}</p>}</div>
  );
}
