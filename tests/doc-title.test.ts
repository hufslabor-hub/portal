import { describe, expect, it } from 'vitest';
import { parseDocTitle } from '../lib/doc-title';

// 실행: npm i -D vitest 한 번 설치한 뒤  npx vitest run
describe('parseDocTitle', () => {
  it('2022_2023학년도 형식', () => {
    expect(parseDocTitle('2022_2023학년도 단체협약서_한국외국어대학교')).toEqual({ year: '2022~2023학년도', ys: 2023, org: '한국외국어대학교' });
  });
  it('2023학년도 형식', () => {
    expect(parseDocTitle('2023학년도 단체협약서 지식출판콘텐츠원')).toMatchObject({ year: '2023학년도', org: '지식출판콘텐츠원' });
  });
  it('2024년도, 확장자, 하이픈', () => {
    expect(parseDocTitle('2024년도 단체협약서-후생파트.pdf')).toMatchObject({ year: '2024학년도', org: '후생파트' });
  });
  it('학년도가 없으면 연도 없이 조직만', () => {
    expect(parseDocTitle('후생파트 단체협약서')).toEqual({ year: '', ys: 0, org: '후생파트' });
  });
});
