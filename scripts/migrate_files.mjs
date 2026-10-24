// 기존 사이트의 첨부(PDF·이미지)를 Vercel Blob으로 옮기고 seed.json의 주소를 새 주소로 바꿉니다.
// 사용: node --env-file=.env.local scripts/migrate_files.mjs seed.json seed.migrated.json
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { put } from '@vercel/blob';

const storeId = process.env.hufslabor_STORE_ID;
const token = process.env.hufslabor_READ_WRITE_TOKEN ?? process.env.BLOB_READ_WRITE_TOKEN;
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
    const { url } = await put(path, Buffer.from(await res.arrayBuffer()), {
      access: 'public', storeId, token, addRandomSuffix: false, allowOverwrite: true,
      contentType: res.headers.get('content-type') ?? undefined,
    });
    text = text.split(u).join(url);
    ok++;
  } catch (e) { console.warn('실패:', u, String(e)); }
}
writeFileSync(process.argv[3], text);
console.log(`완료 ${ok}/${urls.length}. 실패한 주소는 기존 주소 그대로 남아 있습니다.`);
