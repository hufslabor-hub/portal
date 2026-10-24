'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { signup } from '../member-actions';

export default function Signup() {
  const [res, act, pending] = useActionState(signup, null);
  return (
    <main><div className="wrap narrow">
      <h1 className="pt">가입 신청</h1>
      <p className="meta">신청 후 노동조합 사무실이 조합원 여부를 확인하고 승인합니다.</p>
      <form action={act} className="form">
        <label>이름<input name="name" maxLength={40} required /></label>
        <label>소속 부서 (선택)<input name="dept" maxLength={60} /></label>
        <label>이메일<input name="email" type="email" autoComplete="username" required /></label>
        <label>비밀번호 (8자 이상)<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }} />
        {res && <p className={res.ok ? 'ok' : 'err'} role="alert">{res.msg}</p>}
        <button className="btn" disabled={pending}>{pending ? '접수 중…' : '가입 신청'}</button>
        <p className="meta"><Link href="/login">로그인으로 돌아가기</Link></p>
      </form>
    </div></main>
  );
}
