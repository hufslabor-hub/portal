import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

// 본문에 HTML을 쓸 수 있지만, 아래 허용 목록 밖의 태그·속성(script, style, onclick 등)은 모두 제거됨 → XSS 차단.
// 정렬/들여쓰기는 style 대신 미리 정해 둔 class 이름만 허용.
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
    img: [...(A.img ?? []), 'width', 'height'],
    td: [...(A.td ?? []), 'colSpan', 'rowSpan'],
    th: [...(A.th ?? []), 'colSpan', 'rowSpan'],
  },
} as unknown as typeof defaultSchema;

export default function Md({ text }: { text: string }) {
  return (
    <div className="prose">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, schema]]}
        components={{
          table: ({ children }) => <div className="tbl"><table>{children}</table></div>,
          a: ({ href, children }) => <a href={href} rel="noopener noreferrer" target="_blank">{children}</a>,
          img: ({ src, alt, width, height }) => (typeof src === 'string' && src.startsWith('https://') ? <img src={src} alt={alt ?? ''} width={width} height={height} loading="lazy" decoding="async" /> : null),
        }}
      >{text}</Markdown>
    </div>
  );
}
