'use client';
import { useActionState } from 'react';
import { login } from '../actions';

export default function Login() {
  const [err, act, pending] = useActionState(login, null);
  return (
    <main><div className="wrap narrow">
      <h1 className="pt">관리자 로그인</h1>
      <form action={act} className="form">
        <label>이메일<input name="email" type="email" autoComplete="username" required /></label>
        <label>비밀번호<input name="password" type="password" autoComplete="current-password" required /></label>
        {err && <p className="err" role="alert">{err}</p>}
        <button className="btn" disabled={pending}>{pending ? '확인 중…' : '로그인'}</button>
      </form>
    </div></main>
  );
}
