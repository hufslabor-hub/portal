'use client';
import { useState } from 'react';
import { finalizeUpload, getUploadUrl } from '@/app/admin/actions';

export default function UploadBox({ targetId }: { targetId: string }) {
  const [msg, setMsg] = useState('');
  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      setMsg('업로드 중…');
      const { url, path, contentType } = await getUploadUrl(file.name, file.size);
      const r = await fetch(url, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file });
      if (!r.ok) throw new Error('업로드 실패');
      const pub = await finalizeUpload(path);
      const ta = document.getElementById(targetId) as HTMLTextAreaElement;
      ta.value = (ta.value ? ta.value.trimEnd() + '\n' : '') + `${file.name.replace(/\|/g, '-')} | ${pub}`;
      setMsg(`✔ ${file.name} 추가됨 (저장 버튼을 눌러야 반영됩니다)`);
    } catch (err) { setMsg(err instanceof Error ? err.message : '오류가 발생했습니다.'); }
    e.target.value = '';
  }
  return (
    <div className="form"><label>파일 올리기 (PDF·이미지·문서, 30MB 이하)
      <input type="file" onChange={onPick} accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.docx,.xlsx,.pptx,.hwp,.hwpx,.zip" />
    </label>{msg && <p className="meta">{msg}</p>}</div>
  );
}
