'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import s from './InstallHint.module.css';

const KEY = 'install-hint-dismissed-v1';

// 휴대폰 브라우저에서 처음 열었을 때 '홈 화면에 추가' 안내를 한 번 보여 줌(이미 앱으로 열었거나 닫았으면 안 보임)
export default function InstallHint() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      const nav = navigator as Navigator & { standalone?: boolean };
      const standalone = window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
      const ua = navigator.userAgent;
      const mobile = /iPhone|iPad|iPod|Android/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const inApp = /KAKAOTALK|Instagram|FBAN|FBAV|NAVER\(inapp|Line\//i.test(ua);   // 앱 안의 브라우저에서는 홈 화면 추가가 안 됨
      if (mobile && !standalone && !inApp && !localStorage.getItem(KEY)) setShow(true);
    } catch { /* 저장소를 못 쓰는 환경이면 안내를 띄우지 않음 */ }
  }, []);
  if (!show) return null;
  const close = () => { try { localStorage.setItem(KEY, '1'); } catch { /* 무시 */ } setShow(false); };
  return (
    <div className={s.bar} role="region" aria-label="앱 설치 안내">
      <span>홈 화면에 추가하면 앱처럼 쓸 수 있어요.</span>
      <Link href="/install" onClick={close}>방법 보기</Link>
      <button type="button" onClick={close} aria-label="안내 닫기">✕</button>
    </div>
  );
}
