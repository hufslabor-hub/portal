/**
 * 마크다운은 "1)" 로 시작하는 줄도 번호 목록으로 해석하고, 브라우저는 번호 목록을 "1." "2." 로 그립니다.
 * 그래서 원본의 "1) 2)" 번호가 "1. 2." 로 바뀌어 보였습니다.
 *
 * 이 플러그인은 원문에서 "숫자)" 로 시작한 번호 목록을 찾아, 번호를 브라우저가 매기지 않게 하고
 * 원문에 적힌 번호("1)", "2)", 건너뛴 "4)" 포함)를 각 항목 앞에 글자로 그대로 붙입니다.
 * (CSS 카운터나 브라우저 차이에 기대지 않으므로 어떤 환경에서도 같은 번호로 보임)
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
          let expect = typeof n.start === 'number' ? n.start : 1;
          n.ordered = false;                                   // 브라우저가 "1." 로 매기지 않게 함
          n.start = null;
          n.data = { ...n.data, hProperties: { ...n.data?.hProperties, className: ['paren-x'] } };
          for (const it of n.children ?? []) {
            const o = it?.position?.start?.offset;
            const got = typeof o === 'number' ? Number(src.slice(o, o + 12).match(NUM)?.[1]) : NaN;
            const num = Number.isFinite(got) ? got : expect;   // 원문에 적힌 번호를 그대로 사용
            expect = num + 1;
            const label = { type: 'text', value: `${num}) ` };
            const first = it.children?.[0];
            if (first?.type === 'paragraph') first.children = [label, ...(first.children ?? [])];
            else it.children = [{ type: 'paragraph', children: [label] }, ...(it.children ?? [])];
          }
        }
      }
      (n?.children ?? []).forEach(walk);
    };
    walk(tree);
  };
}
