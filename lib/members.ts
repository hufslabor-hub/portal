import 'server-only';

/** 'Firebase 표시 이름'("이름 (부서)")을 이름과 부서로 나눔 */
export const splitName = (d: string) => {
  const m = d.match(/^(.*?)\s*\((.*)\)\s*$/);
  return m ? { name: m[1].trim(), dept: m[2].trim() } : { name: d.trim(), dept: '' };
};
