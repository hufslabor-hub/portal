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
// 3) 메뉴/페이지 보정: 커뮤니티·조합사업 연결, 조합사업은 '하위 메뉴 카드' 페이지로
{
  const m2 = await mref.get();
  if (m2.exists) {
    const items = m2.data().items;
    let changed = false;
    const community = items.find((i) => i.name === '커뮤니티');
    if (community && !community.href) { community.href = '/community'; changed = true; }
    const projects = items.find((i) => i.name === '조합사업');
    if (projects && !projects.href) { projects.href = '/page/projects'; changed = true; }
    if (changed) { await mref.set({ items }); console.log('메뉴: 커뮤니티/조합사업에 연결 주소를 넣었습니다.'); }
  }
  const p = await pr.get();
  const body = String(p.data()?.body ?? '');
  await pr.set({ hub: true, ...(body.includes('준비 중입니다') ? { body: '' } : {}) }, { merge: true });
  // 잠금 설정 저장소 만들기(없으면 기본 잠금 + 기존에 조합원 전용으로 표시한 페이지)
  const lref = db.collection('settings').doc('locks');
  if (!(await lref.get()).exists) {
    const paths = new Set(['/c/news', '/c/bargaining', '/page/agreement', '/page/bylaws', '/page/rules', '/page/projects']);
    (await db.collection('pages').where('membersOnly', '==', true).get()).docs.forEach((d) => paths.add('/page/' + d.id));
    await lref.set({ paths: [...paths] });
    console.log('잠금: 기본 잠금 설정을 저장했습니다.');
  }
}
// 4) 우리소식 하위 메뉴 순서(우리소식 → 공고 → 나머지)와 /projects 처럼 /page/ 가 빠진 주소 보정
{
  const m3 = await mref.get();
  if (m3.exists) {
    const items = m3.data().items;
    let changed = false;
    const news = items.find((i) => i.href === '/c/news');
    if (news) {
      const rest = (news.sub ?? []).filter((x) => x.href !== '/c/news' && x.href !== '/c/notice');
      const next = [{ id: 'news-all', name: '우리소식', href: '/c/news' }, { id: 'notice-sub', name: '공고', href: '/c/notice' }, ...rest];
      if (JSON.stringify(next) !== JSON.stringify(news.sub)) { news.sub = next; changed = true; }
    }
    const KNOWN = new Set(['community', 'members', 'board', 'chat', 'me', 'search', 'login', 'signup', 'forgot', 'admin']);
    const fix = (it) => { const m = it.href.match(/^\/([a-z0-9-]+)$/); if (m && !KNOWN.has(m[1])) { it.href = '/page/' + m[1]; changed = true; } };
    items.forEach((i) => { fix(i); (i.sub ?? []).forEach(fix); });
    if (changed) { await mref.set({ items }); console.log('메뉴: 우리소식 하위 메뉴 순서와 잘못된 주소를 고쳤습니다.'); }
  }
}
console.log('완료. 사이트에는 30초 안에 반영됩니다.');
