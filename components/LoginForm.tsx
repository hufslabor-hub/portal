'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { memberLogin } from '@/app/member-actions';

export default function LoginForm({ next }: { next: string }) {
  const [err, act, pending] = useActionState(memberLogin, null);
  return (
    <form action={act} className="form">
      <input type="hidden" name="next" value={next} />
      <label>이메일<input name="email" type="email" autoComplete="username" required /></label>
      <label>비밀번호<input name="password" type="password" autoComplete="current-password" required /></label>
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn" disabled={pending}>{pending ? '확인 중…' : '로그인'}</button>
      <p className="meta">아직 계정이 없나요? <Link href="/signup">가입 신청</Link> · <Link href="/forgot">비밀번호 찾기</Link></p>
    </form>
  );
}
