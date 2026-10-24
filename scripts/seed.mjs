// 사용: node --env-file=.env.local scripts/seed.mjs seed.json
import { readFileSync } from 'node:fs';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

initializeApp({ credential: cert({
  projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') }) });
const db = getFirestore();
const { posts, pages } = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const batch = db.batch();
for (const { id, createdAt, ...p } of posts) batch.set(db.collection('posts').doc(id), { ...p, createdAt: Timestamp.fromDate(new Date(createdAt.replace(' ', 'T') + 'Z')) });
for (const [slug, p] of Object.entries(pages)) batch.set(db.collection('pages').doc(slug), p);
await batch.commit();
console.log(`posts ${posts.length}, pages ${Object.keys(pages).length} 업로드 완료`);
