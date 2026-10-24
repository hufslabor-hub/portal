'use client';
import { useState } from 'react';
import { upload } from '@vercel/blob/client';
import { MAX_BYTES, MIME, extOf } from '@/lib/upload-rules';
import { verifyUpload } from '@/app/admin/actions';

export default function UploadBox({ targetId }: { targetId: string }) {
  const [msg, setMsg] = useState('');
  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const ext = extOf(file.name);
      if (!(ext in MIME)) throw new Error('올릴 수 없는 파일 형식입니다.');
      if (file.size > MAX_BYTES) throw new Error('파일은 30MB 이하만 올릴 수 있습니다.');
      setMsg('업로드 중…');
      const blob = await upload(`uploads/${crypto.randomUUID()}.${ext}`, file, { access: 'public', handleUploadUrl: '/api/upload', contentType: MIME[ext][0] });
      setMsg('파일 검사 중…');
      await verifyUpload(blob.url); // 파일 내용(앞부분)이 확장자와 맞는지 서버에서 확인, 다르면 삭제
      const ta = document.getElementById(targetId) as HTMLTextAreaElement;
      ta.value = (ta.value ? ta.value.trimEnd() + '\n' : '') + `${file.name.replace(/\|/g, '-')} | ${blob.url}`;
      setMsg(`✔ ${file.name} 추가됨 (저장 버튼을 눌러야 반영됩니다)`);
    } catch (err) { setMsg(err instanceof Error ? err.message : '업로드에 실패했습니다.'); }
    e.target.value = '';
  }
  return (
    <div className="form"><label>파일 올리기 (PDF·이미지·문서, 30MB 이하)
      <input type="file" onChange={onPick} accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.docx,.xlsx,.pptx,.hwp,.hwpx" />
    </label>{msg && <p className="meta" role="status">{msg}</p>}</div>
  );
}
