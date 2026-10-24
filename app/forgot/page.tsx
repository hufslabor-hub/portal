'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { resetPassword } from '../member-actions';

export default function Forgot() {
  const [res, act, pending] = useActionState(resetPassword, null);
  return (
    <main><div className="wrap narrow">
      <h1 className="pt">비밀번호 찾기</h1>
      <p className="meta">가입한 이메일을 입력하면 비밀번호를 새로 정하는 메일을 보내 드립니다.</p>
      <form action={act} className="form">
        <label>이메일<input name="email" type="email" autoComplete="username" required /></label>
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }} />
        {res && <p className={res.ok ? 'ok' : 'err'} role="status">{res.msg}</p>}
        <button className="btn" disabled={pending}>{pending ? '보내는 중…' : '재설정 메일 받기'}</button>
        <p className="meta"><Link href="/login">로그인으로 돌아가기</Link></p>
      </form>
    </div></main>
  );
}
