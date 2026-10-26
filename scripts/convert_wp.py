"""WordPress 내보내기(XML) → seed.json.
서식(가운데 정렬, 들여쓰기, 내어쓰기, 표 병합)을 '허용된 HTML 일부'로 보존합니다. 사용: python3 scripts/convert_wp.py export.xml seed.json"""
import re, sys, json, html
from bs4 import BeautifulSoup, NavigableString, Tag, Comment

CAT = {'공고': 'notice', '우리소식': 'news', '임단협뉴스': 'bargaining', '지부장 서신': 'letter',
       'HUFS Labor Newsletter': 'newsletter', '2024년': 'bargaining', '2025년': 'bargaining'}
PAGES = {34: 'rules', 181: 'agreement', 360: 'about', 362: 'history', 364: 'officers', 369: 'greeting', 483: 'bylaws'}
BLOCK = {'p', 'div', 'ul', 'ol', 'table', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'blockquote', 'figure', 'pre', 'section', 'article', 'center'}
MARK = re.compile(r'^(\d{1,2}(?:-\d{1,2})*[.)]|[가-힣A-Za-z][.)]|\(\d{1,2}\)|\([가-힣]\)|[①-⑩]|[∎※○●•·▶▷◆◇■□ㆍ]|-)(?=\s)')
esc = lambda t: html.escape(t, quote=True)

def inline(nodes, wp, seen):
    out = []
    for c in nodes:
        if isinstance(c, Comment): continue
        if isinstance(c, NavigableString):
            out.append(html.escape(str(c).replace('\xa0', ' '), quote=False)); continue
        n = c.name
        if n in ('script', 'style', 'iframe', 'form', 'noscript'): continue
        if n == 'br': out.append('<br>'); continue
        inner = inline(c.children, wp, seen)
        if n in ('strong', 'b', 'em', 'i', 'u', 'sup', 'sub'):
            tag = {'b': 'strong', 'i': 'em'}.get(n, n)
            out.append(f'<{tag}>{inner}</{tag}>' if inner.strip() else inner)
        elif n == 'a':
            href = (c.get('href') or '').strip().replace(' ', '%20')
            txt = c.get_text(strip=True)
            if 'wp-block-file__button' in (c.get('class') or []) or (txt in ('다운로드', 'Download') and href in seen): continue
            seen.add(href)
            out.append(f'<a href="{esc(href)}">{inner}</a>' if href.startswith('https://') else inner)
        elif n == 'img':
            src = (c.get('src') or '').strip().replace(' ', '%20')
            dims = ''.join(f' {k}="{c.get(k)}"' for k in ('width', 'height') if str(c.get(k) or '').isdigit())   # 크기를 알면 로딩 중 화면이 흔들리지 않음
            if src.startswith('https://'): out.append(f'<img src="{esc(src)}" alt="{esc(c.get("alt") or "")}"{dims}>')
        else:
            out.append(inner)
    return ''.join(out)

def make_p(s, wp, style='', cls=(), raw=False):
    s = s.lstrip('\n')
    n = len(s) - len(s.lstrip(' \t'))                    # 앞쪽 공백(&nbsp;) 개수 = 들여쓰기
    s = re.sub(r'(?:\s|<br>)+$', '', re.sub(r'^(?:\s|<br>)+', '', s))
    s = re.sub(r'[ \t]*\n[ \t]*', ' ' if wp else '<br>', s)
    s = re.sub(r'[ \t]+', ' ', s)
    if not s or (not re.sub(r'<[^>]+>|\s', '', s) and '<img' not in s): return None
    lead = re.match(r'^(?:<[^>]+>|\s)*' + PUA, s) is not None   # 한글 문서 머리표('')로 시작 = 큰 제목
    s = re.sub(r'[ \t]+', ' ', re.sub(PUA, '', s)).strip()
    if not re.sub(r'<[^>]+>|\s', '', s) and '<img' not in s: return None
    if raw: return s
    if h := heading_of(html.unescape(re.sub(r'<[^>]+>', '', s))): return h
    if lead: return '<h2 class="sec">' + re.sub(r'</?(?:strong|u|em)>', '', s).strip() + '</h2>'
    classes = []
    align = re.search(r'text-align:\s*(center|right)', style) or re.search(r'has-text-align-(center|right)', ' '.join(cls))
    if align: classes.append('ta-' + align.group(1))
    lvl = min(4, n // 2)
    px = re.search(r'(?:padding-left|margin-left):\s*(\d+)px', style)
    if px: lvl = max(lvl, min(4, round(int(px.group(1)) / 40)))
    if lvl: classes.append(f'in{lvl}')
    m = None if align else MARK.match(s)
    if m:
        classes.append('li')
        s = f'<span class="mk">{m.group(1)}</span><span class="tx">{s[m.end():].lstrip()}</span>'
    return f'<p class="{" ".join(classes)}">{s}</p>' if classes else f'<p>{s}</p>'

def cell(td, wp):
    if any(isinstance(c, Tag) and c.name in BLOCK for c in td.children):
        parts = [make_p(inline([c], wp, set()), wp, raw=True) if not (isinstance(c, Tag) and c.name in BLOCK) else make_p(inline(c.children, wp, set()), wp, raw=True) for c in td.children]
        return '<br>'.join(p for p in parts if p)
    return make_p(inline(td.children, wp, set()), wp, raw=True) or ''

def table(t, wp):
    rows = []
    for tr in t.find_all('tr'):
        cs = []
        for td in tr.find_all(['td', 'th'], recursive=False):
            at = ''
            for a in ('colspan', 'rowspan'):
                try:
                    v = int(td.get(a, 1))
                    if 1 < v <= 30: at += f' {a}="{v}"'
                except ValueError: pass
            cs.append(f'<{td.name}{at}>{cell(td, wp)}</{td.name}>')
        if cs: rows.append('<tr>' + ''.join(cs) + '</tr>')
    return '<table><tbody>' + ''.join(rows) + '</tbody></table>' if rows else ''

PUA = '[\ue000-\uf8ff\U000f0000-\U0010ffff]'
ERA = re.compile(r'^(?:\d+\)\s*)?(제\s*\d+\s*대\s*노동조합)\s*[\(（]\s*(.+?)\s*[\)）]\s*$')
CHAPTER = re.compile(r'^제\s*\d+\s*[장절](?:\s|\(|（).{0,50}$')

def heading_of(plain):
    """제N대 노동조합(기간) → 연혁 제목, 제N장 ... → 큰 제목. 해당 없으면 None."""
    t = re.sub(r'\s+', ' ', re.sub(PUA, '', plain)).strip()
    m = ERA.match(t)
    if m:
        name = re.sub(r'제\s*(\d+)\s*대\s*노동조합', r'제\1대 노동조합', m.group(1))
        period = re.sub(r'\s*[~～∼〜]\s*', ' ~ ', m.group(2)).strip()
        return f'<h3 class="era"><span class="t">{html.escape(name)}</span><span class="d">{html.escape(period)}</span></h3>'
    if CHAPTER.match(t) and not t.endswith(('.', '다')):
        return f'<h2 class="sec">{html.escape(t)}</h2>'
    return None

def lst(t, wp):
    """목록을 만들되, 목록 항목 한 줄짜리 '제N대 노동조합(기간)' 같은 제목은 제목으로 분리."""
    out, cur = [], []
    def flush():
        if cur: out.append(f'<{t.name}>' + ''.join(cur) + f'</{t.name}>'); cur.clear()
    for li in t.find_all('li', recursive=False):
        h = heading_of(li.get_text())
        if h: flush(); out.append(h); continue
        txt = inline([c for c in li.children if not (isinstance(c, Tag) and c.name in ('ul', 'ol'))], wp, set())
        txt = make_p(txt, wp, raw=True) or ''
        sub = ''.join(''.join(lst(c, wp)) for c in li.children if isinstance(c, Tag) and c.name in ('ul', 'ol'))
        cur.append(f'<li>{txt}{sub}</li>')
    flush()
    return out

def handle(t, wp):
    n = t.name
    if n == 'hr': return ['<hr>']
    if n in ('ul', 'ol'): return lst(t, wp)
    if n == 'table': return [x] if (x := table(t, wp)) else []
    if re.fullmatch(r'h[1-6]', n):
        h = 'h2' if n in ('h1', 'h2') else 'h3'
        txt = make_p(inline(t.children, wp, set()), wp, raw=True)
        return [f'<{h}>{txt}</{h}>'] if txt else []
    if n == 'blockquote':
        return ['<blockquote>' + ''.join(blocks(t.children, wp)) + '</blockquote>']
    if any(isinstance(c, Tag) and c.name in BLOCK for c in t.children):
        return blocks(t.children, wp)
    plain = t.get_text()
    if h := heading_of(plain): return [h]
    if re.match(r'\s*' + PUA, plain):                      # 한글 문서의 '' 같은 머리표로 시작하는 줄 = 큰 제목
        txt = make_p(inline(t.children, wp, set()), wp, raw=True)
        return [f'<h2 class="sec">{re.sub(r"</?strong>", "", txt)}</h2>'] if txt else []
    p = make_p(inline(t.children, wp, set()), wp, t.get('style', ''), t.get('class') or [])
    return [p] if p else []

def blocks(children, wp):
    out, buf = [], []
    def flush():
        if not buf: return
        s = inline(buf, wp, set())
        for part in ([s] if wp else re.split(r'\n\s*\n', s)):
            if p := make_p(part, wp): out.append(p)
        buf.clear()
    for c in children:
        if isinstance(c, Comment): continue
        if isinstance(c, Tag) and c.name in BLOCK: flush(); out.extend(handle(c, wp))
        else: buf.append(c)
    flush()
    return out

def convert(raw):
    wp = '<!-- wp:' in raw                                # 블록 에디터 글은 줄바꿈이 공백, 클래식 글은 줄바꿈이 <br>
    soup = BeautifulSoup(raw, 'html.parser')
    out = blocks(soup.children, wp)
    for i in range(1, len(out)):                          # 제목 바로 아래 굵은 한 줄 → 부제
        if out[i - 1].startswith('<h3 class="era"') and re.fullmatch(r'<p>(?:<strong>.*?</strong>\s*)+</p>', out[i], re.S):
            inner = re.sub(r'</?strong>', '', out[i])[3:-4].strip()
            if len(re.sub(r'<[^>]+>', '', inner)) <= 120:
                out[i] = '<p class="lead">' + re.sub(r'^[:：]\s*', '', inner) + '</p>'
    return '\n\n'.join(out)

NOTE = '<p class="note">※ 2025년 12월 11일까지의 공식 명칭은 전국대학노동조합 한국외국어대학교지부이며, 현재 공식 명칭은 한국외국어대학교 노동조합입니다.</p>'
H_P1 = '<p><strong>전국대학노동조합 한국외국어대학교지부 역 사</strong></p>'
H_P2 = '<p><strong>(1987-2021. </strong><strong>현재까지</strong><strong>)</strong></p>'

def finish(slug, body):
    """현재 공식 명칭 반영(과거 문서 본문은 그대로 두고, 머리말과 안내만 수정)."""
    if slug == 'history' and H_P1 in body and H_P2 in body:
        body = body.replace(H_P1, '<h2 class="sec top">한국외국어대학교 노동조합 역사</h2>').replace(H_P2, '<p class="sub">(1987-2021. 현재까지)</p>\n\n' + NOTE)
    if slug == 'about': body = NOTE + '\n\n' + body
    return body

def field(it, tag):
    m = re.search(rf'<{tag}>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</{tag}>', it, re.S)
    return m.group(1).strip() if m else ''

if __name__ == '__main__':
    posts, pages = [], {}
    for it in re.findall(r'<item>(.*?)</item>', open(sys.argv[1], encoding='utf-8').read(), re.S):
        if field(it, 'wp:status') != 'publish': continue
        typ, pid, title = field(it, 'wp:post_type'), int(field(it, 'wp:post_id')), field(it, 'title')
        body = convert(re.search(r'<content:encoded><!\[CDATA\[(.*?)\]\]>', it, re.S).group(1))
        if typ == 'page' and pid in PAGES:
            slug = PAGES[pid]
            pages[slug] = {'title': '위원장 인사말' if slug == 'greeting' else title, 'body': finish(slug, body)}
        elif typ == 'post':
            cats = [CAT[c] for c in re.findall(r'<category domain="category"[^>]*><!\[CDATA\[(.*?)\]\]>', it) if c in CAT]
            posts.append({'id': f'wp{pid}', 'title': title, 'category': cats[0] if cats else 'news', 'body': body,
                          'createdAt': field(it, 'wp:post_date_gmt') or field(it, 'wp:post_date'), 'published': True, 'files': []})
    json.dump({'posts': posts, 'pages': pages}, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(len(posts), 'posts', len(pages), 'pages')
