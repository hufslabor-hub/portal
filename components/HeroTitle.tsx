import { Fragment } from 'react';
import { parseHeroTitle } from '@/lib/home-text';

/** 메인 큰 제목. 줄 바꿈과 *강조*만 지원하고 HTML 은 그대로 글자로 표시합니다. */
export default function HeroTitle({ text }: { text: string }) {
  return (
    <>
      {parseHeroTitle(text).map((segs, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {segs.map((s, j) => (s.em ? <em key={j}>{s.text}</em> : s.text))}
        </Fragment>
      ))}
    </>
  );
}
