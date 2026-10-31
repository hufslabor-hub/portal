import 'server-only';
import { unstable_cache } from 'next/cache';
import { db } from './firebase';

/** 메인 페이지에서 관리자가 고칠 수 있는 문구. 값이 없거나 비어 있으면 기본 문구(지금 화면과 같음)가 나옵니다. */
export const HOME_DEFAULTS = {
  heroTitle: '함께 일하는 사람들의\n*목소리*, 한국외대 노동조합',
  heroSub: '공고와 교섭 소식을 가장 먼저 확인하세요.',
  applyLabel: '가입신청서',
  instaLabel: '인스타그램',
  kakaoLabel: '카카오톡 채널',
  memberBoxTitle: '로그인하고 조합원 전용 소식과 자료 보기',
  memberBoxSub: '조합원 로그인 / 가입 신청',
} as const;
export type HomeKey = keyof typeof HOME_DEFAULTS;
export type HomeText = Record<HomeKey, string>;
export const HOME_KEYS = Object.keys(HOME_DEFAULTS) as HomeKey[];
export const HOME_LIMITS: Record<HomeKey, number> = { heroTitle: 120, heroSub: 200, applyLabel: 20, instaLabel: 20, kakaoLabel: 20, memberBoxTitle: 80, memberBoxSub: 60 };
export const HOME_LABELS: Record<HomeKey, string> = {
  heroTitle: '큰 제목', heroSub: '제목 아래 설명', applyLabel: '버튼 1 (가입신청서)', instaLabel: '버튼 2 (인스타그램)', kakaoLabel: '버튼 3 (카카오톡)',
  memberBoxTitle: '조합원 전용 안내 — 제목', memberBoxSub: '조합원 전용 안내 — 설명',
};

export async function loadHomeText(): Promise<HomeText> {
  const d = await db().collection('settings').doc('home').get();
  const v = d.exists ? d.data()! : {};
  const out = {} as HomeText;
  for (const k of HOME_KEYS) out[k] = typeof v[k] === 'string' && v[k].trim() ? v[k] : HOME_DEFAULTS[k];
  return out;
}
/** 저장하면 revalidateTag('home') 으로 바로 갱신됩니다. */
export const getHomeText = unstable_cache(loadHomeText, ['home-text'], { revalidate: 300, tags: ['home'] });

export type TitleSeg = { text: string; em: boolean };
/** 큰 제목 표기: 줄 바꿈은 Enter, 강조는 *단어*. HTML 은 쓰지 않으므로 어떤 글자를 넣어도 안전합니다. */
export function parseHeroTitle(s: string): TitleSeg[][] {
  return s.replace(/\r\n/g, '\n').split('\n').map((line) =>
    line.split(/(\*[^*\n]+\*)/).filter(Boolean).map((p) => (/^\*[^*\n]+\*$/.test(p) ? { text: p.slice(1, -1), em: true } : { text: p, em: false })));
}
