// 이미 올라간 페이지에 현재 명칭을 반영합니다(글 전체를 덮어쓰지 않고 해당 부분만 고침, 여러 번 실행해도 안전).
// 사용: node --env-file=.env.local scripts/rename_union.mjs
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') }) });
const db = getFirestore();
const NOTE = '<p>※ 2025년 12월 11일까지의 공식 명칭은 전국대학노동조합 한국외국어대학교지부이며, 현재 공식 명칭은 한국외국어대학교 노동조합입니다.</p>';
const P1 = '<p><strong>전국대학노동조합 한국외국어대학교지부 역 사</strong></p>', P2 = '<p><strong>(1987-2021. </strong><strong>현재까지</strong><strong>)</strong></p>';

async function edit(slug, fn) {
  const ref = db.collection('pages').doc(slug);
  const snap = await ref.get();
  if (!snap.exists) return console.warn('없음:', slug);
  const next = fn(snap.data());
  if (!next) return console.log('변경 없음:', slug);
  await ref.set(next, { merge: true });
  console.log('수정:', slug);
}

await edit('greeting', (d) => (d.title === '위원장 인사말' ? null : { title: '위원장 인사말' }));
await edit('history', (d) => {
  if (d.body.includes(NOTE)) return null;
  if (!d.body.includes(P1) || !d.body.includes(P2)) { console.warn('history 본문이 달라 건너뜀(관리자 화면에서 직접 수정하세요)'); return null; }
  return { body: d.body.replace(P1, '<p><strong>한국외국어대학교 노동조합 역사</strong></p>').replace(P2, P2 + '\n\n' + NOTE) };
});
await edit('about', (d) => (d.body.includes(NOTE) ? null : { body: NOTE + '\n\n' + d.body }));
