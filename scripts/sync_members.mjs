// 승인된 조합원(member 권한이 있는 계정)을 '조합원 찾기' 목록에 등록합니다. 이미 정한 공개 설정은 유지하며, 여러 번 실행해도 안전합니다.
// 사용: node --env-file=.env.local scripts/sync_members.mjs
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') }) });
const db = getFirestore();
let n = 0, token;
do {
  const page = await getAuth().listUsers(1000, token);
  for (const u of page.users) {
    if (u.customClaims?.member !== true) continue;
    const m = (u.displayName ?? '').match(/^(.*?)\s*\((.*)\)\s*$/);
    const name = (m ? m[1] : u.displayName ?? '').trim() || (u.email ?? '').split('@')[0];
    const ref = db.collection('members').doc(u.uid);
    const exists = (await ref.get()).exists;
    await ref.set({ name, dept: m ? m[2].trim() : '', email: u.email ?? '', ...(exists ? {} : { listed: true, showEmail: false }) }, { merge: true });
    n++;
  }
  token = page.pageToken;
} while (token);
console.log(`조합원 ${n}명을 목록에 등록했습니다. (이메일은 본인이 공개를 켜기 전까지 비공개)`);
