/**
 * 마크다운은 "1)" 로 시작하는 줄도 번호 목록으로 해석하고, 브라우저는 번호 목록을 "1." "2." 로 그립니다.
 * 그래서 원본의 "1) 2)" 번호가 "1. 2." 로 바뀌어 보였습니다.
 *
 * 이 플러그인은 원문에서 "숫자)" 로 시작한 번호 목록을 찾아
 *   - <ol class="paren"> 표시를 붙이고 (CSS 가 "1)" 모양으로 그림)
 *   - 원문의 번호가 순서와 다르면(예: 1) 2) 4)) 그 항목에 value 를 달아 원래 번호를 지킵니다.
 * "1." 로 쓴 목록은 건드리지 않습니다.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
const PAREN = /^[\s>]*\d{1,9}\)/;   // 줄 맨 앞(들여쓰기·인용 표시 제외)이 "숫자)" 인지
const NUM = /^\s*(\d{1,9})/;

export function remarkParenLists() {
  return (tree: any, file: any) => {
    const src = String(file?.value ?? '');
    const walk = (n: any) => {
      const off = n?.position?.start?.offset;
      if (n?.type === 'list' && n.ordered && typeof off === 'number') {
        const line = src.slice(src.lastIndexOf('\n', off - 1) + 1, off + 12);
        if (PAREN.test(line)) {
          n.data = { ...n.data, hProperties: { ...n.data?.hProperties, className: ['paren'] } };
          let expect = typeof n.start === 'number' ? n.start : 1;
          for (const it of n.children ?? []) {
            const o = it?.position?.start?.offset;
            const got = typeof o === 'number' ? Number(src.slice(o, o + 12).match(NUM)?.[1]) : NaN;
            if (Number.isFinite(got) && got !== expect) {
              it.data = { ...it.data, hProperties: { ...it.data?.hProperties, value: got } };
              expect = got;
            }
            expect += 1;
          }
        }
      }
      (n?.children ?? []).forEach(walk);
    };
    walk(tree);
  };
}
