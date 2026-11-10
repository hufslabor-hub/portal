import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { remarkParenLists } from '@/lib/remark-paren-lists';
import styles from './Md.module.css';

// 본문에 HTML을 쓸 수 있지만, 아래 허용 목록 밖의 태그·속성(script, style, onclick 등)은 모두 제거됨 → XSS 차단.
// 정렬/들여쓰기는 style 대신 미리 정해 둔 class 이름만 허용.
// ── 허용 class 목록(새 서식을 추가하려면 여기와 globals.css를 함께 고칠 것) ──
//   p: ta-center ta-right in1~in4 li lead sub note   span: t d mk tx   h2: sec top   h3: era
//   img: width height   td/th: colSpan rowSpan   ul: class paren-x(괄호 번호 "1)" 목록)
const A = defaultSchema.attributes ?? {};
const schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'u', 'span'],
  attributes: {
    ...A,
    p: [['className', 'ta-center', 'ta-right', 'in1', 'in2', 'in3', 'in4', 'li', 'lead', 'sub', 'note']],
    span: [['className', 't', 'd', 'mk', 'tx']],
    h2: [['className', 'sec', 'top']],
    h3: [['className', 'era']],
    ul: [...(A.ul ?? []), ['className', 'paren-x']],
    img: [...(A.img ?? []), 'width', 'height'],
    td: [...(A.td ?? []), 'colSpan', 'rowSpan'],
    th: [...(A.th ?? []), 'colSpan', 'rowSpan'],
  },
} as unknown as typeof defaultSchema;

export default function Md({ text }: { text: string }) {
  return (
    <div className="prose">
      <Markdown
        remarkPlugins={[remarkGfm, remarkParenLists]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, schema]]}
        components={{
          // "1)" 번호 목록(플러그인이 paren-x 표시를 붙임)은 번호가 글자로 들어 있어 번호 기호 없이 들여쓰기만 적용
          ul: ({ node: _node, className, ...rest }) => <ul {...rest} className={String(className ?? '').includes('paren-x') ? styles.parenx : className} />,
          table: ({ children }) => <div className="tbl"><table>{children}</table></div>,
          a: ({ href, children }) => <a href={href} rel="noopener noreferrer" target="_blank">{children}</a>,
          img: ({ src, alt, width, height }) => (typeof src === 'string' && src.startsWith('https://') ? <img src={src} alt={alt ?? ''} width={width} height={height} loading="lazy" decoding="async" /> : null),
        }}
      >{text}</Markdown>
    </div>
  );
}
