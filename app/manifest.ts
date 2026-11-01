import type { MetadataRoute } from 'next';

// 홈 화면에 추가했을 때의 앱 정보(이름·아이콘·색·주소창 없는 화면)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '한국외국어대학교 노동조합',
    short_name: 'HUFS UNION',
    description: '공고와 교섭 소식을 가장 먼저 확인하세요.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    lang: 'ko',
    background_color: '#14213d',
    theme_color: '#14213d',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
