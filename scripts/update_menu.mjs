// 이미 저장된 메뉴와 페이지를 이번 요청에 맞게 고칩니다(여러 번 실행해도 안전).
//  - 규약을 '조합소개' 하위 메뉴로 이동, '지부규정' 메뉴 삭제
//  - 지부규정 페이지를 조합원 전용으로 표시
//  - 단체협약 카드의 '연구협력산학단' → '연구산학협력단'
//  - '조합사업' 페이지가 없으면 안내 문구가 든 빈 페이지를 만듦(관리자 화면에서 내용 작성)
// 사용: node --env-file=.env.local scripts/update_menu.mjs
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') }) });
const db = getFirestore();

// 1) 메뉴
const mref = db.collection('settings').doc('menu');
const m = await mref.get();
if (!m.exists) {
  console.log('메뉴: 저장된 메뉴가 없어 새 기본 메뉴가 그대로 적용됩니다.');
} else {
  const items = m.data().items;
  const about = items.find((i) => i.href === '/page/about');
  if (!about) console.warn('메뉴: 조합소개(/page/about) 메뉴를 찾지 못해 규약 이동을 건너뜁니다.');
  else {
    let bylaws = null;
    const top = items.findIndex((i) => i.href === '/page/bylaws');
    if (top >= 0) bylaws = items.splice(top, 1)[0];
    about.sub = (about.sub ?? []).filter((x) => x.href !== '/page/rules');          // 지부규정 삭제
    if (!about.sub.some((x) => x.href === '/page/bylaws')) {
      const item = { id: bylaws?.id ?? 'bylaws', name: bylaws?.name ?? '규약', href: '/page/bylaws' };
      const f = about.sub.findIndex((x) => x.href === '/c/forms');
      about.sub.splice(f >= 0 ? f : about.sub.length, 0, item);                      // '양식' 앞에 넣음
    }
    await mref.set({ items });
    console.log('메뉴: 규약을 조합소개로 옮기고 지부규정을 삭제했습니다.');
  }
}

// 2) 페이지
await db.collection('pages').doc('rules').set({ membersOnly: true }, { merge: true });
const ag = await db.collection('pages').doc('agreement').get();
if (ag.exists) {
  const body = String(ag.data().body ?? '');
  const next = body.replace(/(>[^<]*)연구협력산학단([^<]*<\/a>)/g, '$1연구산학협력단$2');
  if (next !== body) { await ag.ref.set({ body: next }, { merge: true }); console.log('단체협약: 이름을 연구산학협력단으로 바꿨습니다.'); }
}
const pr = db.collection('pages').doc('projects');
if (!(await pr.get()).exists) {
  await pr.set({ title: '조합사업', body: '<p class="note">조합사업 안내는 준비 중입니다. 관리자 화면에서 내용을 작성해 주세요.</p>' });
  console.log('조합사업: 빈 페이지를 만들었습니다.');
}
console.log('완료. 사이트에는 1~2분 안에 반영됩니다.');
