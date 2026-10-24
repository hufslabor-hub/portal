import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// 원본 HTML은 렌더링하지 않음(기본값) → XSS 차단. 표는 가로 스크롤 가능하게 감쌈.
export default function Md({ text }: { text: string }) {
  return (
    <div className="prose">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => <div className="tbl"><table>{children}</table></div>,
          a: ({ href, children }) => <a href={href} rel="noopener noreferrer" target="_blank">{children}</a>,
          img: ({ src, alt }) => (typeof src === 'string' && src.startsWith('https://') ? <img src={src} alt={alt ?? ''} loading="lazy" /> : null),
        }}
      >{text}</Markdown>
    </div>
  );
}
