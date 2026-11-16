import { createHmac } from 'node:crypto';

// 그룹챗 익명 이름: 회원 표식(authorHash)과 날짜(한국 시간)로 만든 별명이라 같은 날에는 같은 별명, 날짜가 바뀌면 새 별명.
// 데이터베이스에는 이름이 저장되지 않고 화면에 보이는 별명만 계산해서 보여 줌.
export const ANIMALS = ['여우', '곰', '호랑이', '사자', '토끼', '다람쥐', '고래', '돌고래', '펭귄', '수달', '판다', '부엉이', '참새', '독수리', '거북이', '사슴', '늑대', '고양이', '강아지', '오리',
  '기린', '코끼리', '하마', '코알라', '치타', '표범', '너구리', '고슴도치', '앵무새', '알파카', '낙타', '얼룩말', '캥거루', '두더지', '청설모', '올빼미', '갈매기', '물개', '해달', '비버'];

export const kstDay = (ms: number) => new Date(ms + 9 * 3600_000).toISOString().slice(0, 10);

export function chatAlias(secret: string, authorHash: string, ms: number): string {
  const h = createHmac('sha256', secret).update(`${authorHash}|${kstDay(ms)}`).digest();
  return `익명 ${ANIMALS[h[0] % ANIMALS.length]}${String(((h[1] << 8) | h[2]) % 100).padStart(2, '0')}`;
}
