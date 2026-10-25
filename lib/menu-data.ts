export type MenuItem = { id: string; name: string; href: string; sub?: MenuItem[] };

// 관리자가 아직 메뉴를 고친 적이 없을 때 쓰는 기본 메뉴
export const DEFAULT_MENU: MenuItem[] = [
  { id: 'notice', name: '공고', href: '/c/notice' },
  { id: 'news', name: '우리소식', href: '/c/news', sub: [
    { id: 'bargaining', name: '임단협뉴스', href: '/c/bargaining' },
    { id: 'letter', name: '위원장 서신', href: '/c/letter' },
    { id: 'newsletter', name: '뉴스레터', href: '/c/newsletter' },
  ] },
  { id: 'agreement', name: '단체협약', href: '/page/agreement' },
  { id: 'bylaws', name: '규약', href: '/page/bylaws' },
  { id: 'community', name: '커뮤니티', href: '', sub: [
    { id: 'members', name: '조합원 찾기', href: '/members' },
    { id: 'board', name: '자유게시판', href: '/board' },
    { id: 'chat', name: '그룹챗', href: '/chat' },
  ] },
  { id: 'about', name: '조합소개', href: '/page/about', sub: [
    { id: 'greeting', name: '위원장 인사말', href: '/page/greeting' },
    { id: 'history', name: '조합 역사', href: '/page/history' },
    { id: 'officers', name: '역대 임원진', href: '/page/officers' },
    { id: 'rules', name: '지부규정', href: '/page/rules' },
    { id: 'forms', name: '양식', href: '/c/forms' },
  ] },
];
