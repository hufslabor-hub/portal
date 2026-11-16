// 예전에 저장된 그룹챗 메시지에서 이름과 회원 번호를 지우고, 되돌릴 수 없는 암호값(authorHash)만 남깁니다. (여러 번 실행해도 안전)
// 이 작업을 안 해도 화면에는 별명으로만 보입니다. 데이터베이스에 남은 이름까지 없애고 싶을 때 한 번 실행하세요.
// 사용: node --env-file=.env.local scripts/anonymize_chat.mjs
import { createHmac } from 'node:crypto';
import { cert, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

initializeApp({ credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') }) });
const db = getFirestore();
// lib/anon.ts 의 anonHash 와 같은 계산 (비밀 키: ANON_SECRET, 없으면 FIREBASE_PRIVATE_KEY. 환경변수에 적힌 값 그대로 사용)
const secret = process.env.ANON_SECRET ?? process.env.FIREBASE_PRIVATE_KEY ?? 'dev';
const hash = (uid) => createHmac('sha256', secret).update(uid).digest('hex').slice(0, 24);

const snap = await db.collection('chat_messages').get();
let n = 0, batch = db.batch(), pending = 0;
for (const d of snap.docs) {
  const v = d.data();
  if (v.uid === undefined && v.name === undefined) continue;
  batch.update(d.ref, { authorHash: v.authorHash ?? hash(String(v.uid ?? '')), uid: FieldValue.delete(), name: FieldValue.delete() });
  n++; pending++;
  if (pending === 400) { await batch.commit(); batch = db.batch(); pending = 0; }
}
if (pending) await batch.commit();
console.log(`${n}개 메시지에서 이름과 회원 번호를 지웠습니다. (전체 ${snap.size}개)`);
