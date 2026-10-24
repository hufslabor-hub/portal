// 기존 조합원 명단(CSV)을 승인된 조합원으로 등록합니다. 비밀번호는 옮기지 않으며, --send를 주면 비밀번호 설정 메일을 보냅니다.
// CSV 첫 줄(제목): email,name,dept   (예: kim@hufs.ac.kr,김철수,교무처)
// 사용: node --env-file=.env.local scripts/import_members.mjs members.csv [--send]
import { readFileSync } from 'node:fs';
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

initializeApp({ credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') }) });
const auth = getAuth();
const send = process.argv.includes('--send');
const rows = readFileSync(process.argv[2], 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean).slice(1)
  .map((l) => l.split(',').map((x) => x.trim().replace(/^"|"$/g, '')));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ok = 0;
for (const [email, name = '', dept = ''] of rows) {
  try {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('이메일 형식 오류');
    let u;
    try { u = await auth.getUserByEmail(email); }
    catch { u = await auth.createUser({ email, displayName: dept ? `${name} (${dept})` : name }); }
    await auth.setCustomUserClaims(u.uid, { ...(u.customClaims ?? {}), member: true });
    if (send) {
      const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${process.env.FIREBASE_WEB_API_KEY}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestType: 'PASSWORD_RESET', email }) });
      if (!r.ok) throw new Error('메일 발송 실패');
      await sleep(400);
    }
    ok++;
  } catch (e) { console.warn('실패:', email, e.message); }
}
console.log(`완료 ${ok}/${rows.length}${send ? ' (비밀번호 설정 메일 발송)' : ' (메일은 보내지 않음)'}`);
