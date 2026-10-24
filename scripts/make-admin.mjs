// 사용: node --env-file=.env.local scripts/make-admin.mjs 이메일  (Firebase 콘솔에서 해당 계정을 먼저 만들어 두세요)
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
initializeApp({ credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') }) });
const u = await getAuth().getUserByEmail(process.argv[2]);
await getAuth().setCustomUserClaims(u.uid, { admin: true });
console.log(`${u.email} 에 관리자 권한을 부여했습니다. (다시 로그인해야 적용)`);
