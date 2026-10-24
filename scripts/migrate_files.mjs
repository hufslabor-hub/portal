// 기존 사이트의 첨부(PDF·이미지)를 Firebase Storage로 옮기고 seed.json의 주소를 새 주소로 바꿉니다.
// 사용: node --env-file=.env.local scripts/migrate_files.mjs seed.json seed.migrated.json
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cert, initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

initializeApp({ credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') }) });
const bucket = getStorage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
let text = readFileSync(process.argv[2], 'utf8');
const urls = [...new Set(text.match(/https:\/\/hufslabor\.mycafe24\.com\/wp-content\/uploads\/[^\s)"'<>\]\\]+/g) ?? [])];
console.log(`옮길 파일 ${urls.length}개`);
let ok = 0;
for (const u of urls) {
  try {
    const res = await fetch(u);
    if (!res.ok) throw new Error(res.status);
    const ext = (u.split('?')[0].split('.').pop() ?? 'bin').toLowerCase().slice(0, 5);
    const path = `wp/${createHash('sha1').update(u).digest('hex').slice(0, 16)}.${ext}`;
    const f = bucket.file(path);
    await f.save(Buffer.from(await res.arrayBuffer()), { contentType: res.headers.get('content-type') ?? undefined });
    await f.makePublic();
    text = text.split(u).join(`https://storage.googleapis.com/${bucket.name}/${path}`);
    ok++;
  } catch (e) { console.warn('실패:', u, String(e)); }
}
writeFileSync(process.argv[3], text);
console.log(`완료 ${ok}/${urls.length}. 실패한 주소는 기존 주소 그대로 남아 있습니다.`);
