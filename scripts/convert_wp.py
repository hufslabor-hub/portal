"""WordPress 내보내기(XML) → seed.json (posts, pages). 사용: python3 scripts/convert_wp.py export.xml seed.json"""
import re, sys, json
from bs4 import BeautifulSoup, NavigableString

CAT = {'공고': 'notice', '우리소식': 'news', '임단협뉴스': 'bargaining', '지부장 서신': 'letter',
       'HUFS Labor Newsletter': 'newsletter', '2024년': 'bargaining', '2025년': 'bargaining'}
PAGES = {34: 'rules', 181: 'agreement', 360: 'about', 362: 'history', 364: 'officers', 369: 'greeting', 483: 'bylaws'}

def md(node):
    out = []
    for c in node.children:
        if isinstance(c, NavigableString):
            out.append(re.sub(r'\s+', ' ', str(c).replace('\xa0', ' ')))
            continue
        n, inner = c.name, md(c)
        if n in ('script', 'style'): continue
        if n == 'br': out.append('  \n')
        elif n in ('b', 'strong'): out.append(f'**{inner.strip()}**' if inner.strip() else '')
        elif n in ('i', 'em'): out.append(f'*{inner.strip()}*' if inner.strip() else '')
        elif n == 'a' and c.get('href', '').startswith('https://'): out.append(f"[{inner.strip() or c['href']}]({c['href']})")
        elif n == 'img' and c.get('src', '').startswith('https://'): out.append(f"\n\n![{c.get('alt','')}]({c['src']})\n\n")
        elif n in ('h1', 'h2', 'h3', 'h4'): out.append(f"\n\n## {inner.strip()}\n\n")
        elif n == 'li': out.append(f"\n- {inner.strip()}")
        elif n == 'table':
            rows = [[re.sub(r'\s+', ' ', td.get_text(' ', strip=True)).replace('|', '/') for td in tr.find_all(['td', 'th'])] for tr in c.find_all('tr')]
            rows = [r for r in rows if r]
            if rows:
                w = max(map(len, rows)); rows = [r + [''] * (w - len(r)) for r in rows]
                out.append('\n\n| ' + ' | '.join(rows[0]) + ' |\n|' + '---|' * w + '\n' + '\n'.join('| ' + ' | '.join(r) + ' |' for r in rows[1:]) + '\n\n')
        elif n in ('p', 'div', 'ul', 'ol', 'figure', 'blockquote', 'section'): out.append(f"\n\n{inner.strip()}\n\n" if n not in ('ul', 'ol') else f"\n{inner}\n\n")
        else: out.append(inner)
    return ''.join(out)

def clean(html):
    html = re.sub(r'<!--.*?-->', '', html, flags=re.S)
    t = md(BeautifulSoup(html, 'html.parser'))
    return re.sub(r'\n{3,}', '\n\n', t).strip()

def field(it, tag): 
    m = re.search(rf'<{tag}>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</{tag}>', it, re.S); return m.group(1).strip() if m else ''

posts, pages = [], {}
for it in re.findall(r'<item>(.*?)</item>', open(sys.argv[1], encoding='utf-8').read(), re.S):
    if field(it, 'wp:status') != 'publish': continue
    typ, pid, title = field(it, 'wp:post_type'), int(field(it, 'wp:post_id')), field(it, 'title')
    body = clean(re.search(r'<content:encoded><!\[CDATA\[(.*?)\]\]>', it, re.S).group(1))
    if typ == 'page' and pid in PAGES: pages[PAGES[pid]] = {'title': title, 'body': body}
    elif typ == 'post':
        cats = [CAT[c] for c in re.findall(r'<category domain="category"[^>]*><!\[CDATA\[(.*?)\]\]>', it) if c in CAT]
        posts.append({'id': f'wp{pid}', 'title': title, 'category': cats[0] if cats else 'news', 'body': body,
                      'createdAt': field(it, 'wp:post_date_gmt') or field(it, 'wp:post_date'), 'published': True, 'files': []})
json.dump({'posts': posts, 'pages': pages}, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(posts), 'posts', len(pages), 'pages')
