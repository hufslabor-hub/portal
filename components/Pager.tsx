import Link from 'next/link';

export default function Pager({ base, page, pages }: { base: string; page: number; pages: number }) {
  if (pages <= 1) return null;
  const href = (n: number) => `${base}${base.includes('?') ? '&' : '?'}page=${n}`;
  const start = Math.max(1, Math.min(page - 2, pages - 4)), end = Math.min(pages, start + 4);
  const nums = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  return (
    <nav className="pager" aria-label="페이지 이동">
      {page > 1 ? <Link href={href(page - 1)} aria-label="이전 페이지">‹</Link> : <span className="off" aria-hidden="true">‹</span>}
      {nums.map((n) => (n === page ? <span key={n} className="cur" aria-current="page">{n}</span> : <Link key={n} href={href(n)}>{n}</Link>))}
      {page < pages ? <Link href={href(page + 1)} aria-label="다음 페이지">›</Link> : <span className="off" aria-hidden="true">›</span>}
    </nav>
  );
}
