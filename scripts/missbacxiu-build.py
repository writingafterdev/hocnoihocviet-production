"""Build src/content/missbacxiu/tab1.json from a dump of missbacxiu's doc (tab 1 "Ý tưởng phổ biến" only).

The dump is a JSON list of blocks read from the doc's /mobilebasic page (text lines and tables with cell spans).
Usage: python3 -I scripts/missbacxiu-build.py dump.json src/content/missbacxiu/tab1.json
"""
import json, re, sys, unicodedata


raw = json.load(open(sys.argv[1]))
OUT = sys.argv[2]

# Tab 1 runs from "MACRO A" to just before the BTVN forecast lists.
start = next(i for i, b in enumerate(raw) if b['kind'] == 'text' and b['t'].strip() == 'MACRO A')
end = next(i for i, b in enumerate(raw) if b['kind'] == 'text' and b['t'].strip() == 'BTVN')
blocks = raw[start:end]

VI = re.compile(r'[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹáàãéèíìóòõúùýĂÂĐÊÔƠƯ]', re.I)
DATE = re.compile(r'\((?:đề thi thật\s*)?(T\d{1,2}[./]\d{4}|\d{1,2}[./]\d{1,2}[./]\d{4})\)', re.I)
PROMPT_CUE = re.compile(r"\?|agree|disagree|discuss|opinion|outweigh|positive or negative|what (are|is|can|should|problems|effects|measures)|why |how can", re.I)
BLANK = re.compile(r'^[….\s]+$')


def clean(t):
    t = unicodedata.normalize('NFC', t.replace(' ', ' '))
    t = t.replace('->', '→').replace('=>', '⇒')
    t = re.sub(r'[ \t]+', ' ', t).strip()
    t = re.sub(r'\s+([,.;:?!])(?=\s|$)', r'\1', t)
    return t


def line(l):
    t = clean(l['t'])
    if not t:
        return None
    out = {'t': t}
    if l['tag'] == 'li':
        out['li'] = int(l.get('lvl') or 0)
    elif l['tag'].startswith('h'):
        out['h'] = True
    if l.get('links'):
        hrefs = [h for h in l['links'] if h.startswith('http')]
        # Google wraps outbound links; unwrap them.
        hrefs = [re.sub(r'^https://www\.google\.com/url\?q=([^&]+).*$', lambda m: __import__('urllib.parse').parse.unquote(m.group(1)), h) for h in hrefs]
        if hrefs:
            out['href'] = hrefs[0]
    return out


def cell_lines(c):
    ls = [x for x in (line(l) for l in c['lines']) if x]
    if ls and all(BLANK.match(x['t']) for x in ls):
        return {'blank': True, 'lines': []}
    return {'lines': ls}


def english_head(s):
    """The English part of a line: cut at a '→' or at a '(…)' whose own content is Vietnamese."""
    for m in re.finditer(r'\s(\(|→)', s):
        i = m.start(1)
        if m.group(1) == '(':
            depth, j = 0, i
            while j < len(s):
                depth += {'(': 1, ')': -1}.get(s[j], 0)
                if depth == 0: break
                j += 1
            seg = s[i:j + 1]
        else:
            seg = s[i:]
        if VI.search(seg) and not VI.search(s[:i]):
            return s[:i].strip(), s[i:].strip()
    return s, ''


def is_prompt(t):
    s = DATE.sub('', re.sub(r'^(\d+\.|⇒|→|-|\*)\s*', '', t)).strip()
    s, _ = english_head(s)
    if len(s.split()) < 7:
        return False
    head = re.sub(r'\([^)]*\)', '', s)
    if VI.search(head):
        return False
    if not s[:1].isupper():
        return False
    return bool(PROMPT_CUE.search(head)) or head.rstrip().endswith('.')


def split_prompt(t):
    s = re.sub(r'^(\d+\.|⇒|→|-|\*)\s*', '', t).strip()
    date = None
    m = DATE.search(s)
    if m:
        date = m.group(1)
        s = (s[:m.start()] + ' ' + s[m.end():]).strip()
        s = re.sub(r'\s+', ' ', s)
    s, rest = english_head(s)
    hint = None
    # a trailing Vietnamese parenthetical (possibly unclosed) is a hint
    m = re.search(r'\s*\(([^()]*(?:\([^()]*\)[^()]*)*)\)?\s*$', s)
    if m and VI.search(m.group(1)) and m.start() > 20:
        hint = m.group(1).strip()
        s = s[:m.start()].strip()
        m2 = DATE.search(s)
        if m2 and not date:
            date = m2.group(1); s = s[:m2.start()].strip()
    if rest:
        r = rest.lstrip('→ ').strip()
        if r.startswith('(') and r.count('(') > r.count(')'): r = r[1:]
        elif r.startswith('(') and r.endswith(')'): r = r[1:-1]
        hint = (hint + ' ' + r).strip() if hint else r
    return s, hint, date


def prompts_from(lines):
    """Pull exam prompts (with a following hint) out of a cell; keep everything else as its notes."""
    out, label = [], None
    for x in lines:
        t = x['t']
        if is_prompt(t):
            text, hint, date = split_prompt(t)
            p = {'text': text}
            if hint: p['hint'] = hint
            if date: p['date'] = date
            if label: p['label'] = label
            out.append(p)
        elif out and (t[:1] in '(→⇒' or t[:1].islower()) and not t.endswith(':'):
            # a Vietnamese note right after a prompt explains how to use the idea for it
            h = t.strip()
            h = h.rstrip('.')
            if h.startswith('(') and h.endswith(')'): h = h[1:-1]
            out[-1]['hint'] = (out[-1].get('hint', '') + ' ' + h).strip() if out[-1].get('label') == label else h
        else:
            # a short label line groups the prompts after it ("Ý tưởng về cha mẹ bận:")
            if len(t) < 140:
                label = t.rstrip(':')
    return out


def table(b, tid):
    rows = b['rows']
    head = [clean(' '.join(l['t'] for l in c['lines'])) for c in rows[0]]
    ncol = sum(c['cs'] for c in rows[0])
    grid, carry = [], {}  # carry: col -> (cell, rows left)
    for r in rows[1:]:
        cells, it, col = [None] * ncol, iter(r), 0
        while col < ncol:
            if col in carry:
                cell, left = carry[col]
                cells[col] = {'span': 'up'}
                carry[col] = (cell, left - 1)
                if left - 1 == 0: del carry[col]
                col += 1
                continue
            c = next(it, None)
            if c is None:
                break
            cl = cell_lines(c)
            if c['cs'] > 1: cl['cs'] = c['cs']
            if c['rs'] > 1:
                cl['rs'] = c['rs']
                for k in range(c['cs']):
                    carry[col + k] = (cl, c['rs'] - 1)
            cells[col] = cl
            for k in range(1, c['cs']):
                cells[col + k] = {'span': 'left'}
            col += c['cs']
        grid.append([c if c is not None else {'lines': []} for c in cells])
    return {'kind': 'table', 'id': tid, 'head': head, 'rows': grid}


# ---- walk tab 1 into macros -> parts -> blocks ----
macros, cur, part, tcount = [], None, None, {}
TITLES = {'A': 'Nguyên nhân', 'B': 'Tác động', 'C': 'Giải pháp'}
for b in blocks:
    if b['kind'] == 'text':
        t = clean(b['t'])
        m = re.match(r'^MACRO ([ABC])\.\s*(.+)$', t)
        if re.fullmatch(r'MACRO [ABC]', t):
            continue
        if m:
            cur = {'id': m.group(1), 'name': TITLES[m.group(1)], 'title': m.group(2).strip(), 'parts': []}
            macros.append(cur)
            part = {'id': f"{cur['id']}-intro", 'title': None, 'blocks': []}
            cur['parts'].append(part)
            continue
        if cur and (b['tag'] == 'h1' or (cur['id'] == 'B' and b['tag'] == 'h2' and re.match(r'^(\d\.|⇒|DOMESTIC)', t))):
            title = re.sub(r'^(⇒\s*)?[A-Z]\.\s*', '', t).strip()
            part = {'id': f"{cur['id']}-{len(cur['parts'])}", 'title': title.capitalize() if title.isupper() else title, 'blocks': []}
            cur['parts'].append(part)
            continue
        ln = line(b)
        if ln:
            if b['tag'] in ('h2', 'h3'): ln['h'] = b['tag']
            part['blocks'].append({'kind': 'text', **ln})
    else:
        n = tcount.get(cur['id'], 0) + 1; tcount[cur['id']] = n
        part['blocks'].append(table(b, f"{cur['id']}-t{n}"))

# ---- tidy names: sentence-case headers and section titles ----
HEAD = {'NGUYÊN NHÂN CỐT LÕI': 'Nguyên nhân cốt lõi', 'CỤ THỂ HÓA': 'Cụ thể hoá', 'VẤN ĐỀ XÃ HỘI': 'Vấn đề xã hội', 'VOCAB': 'Từ vựng',
        'ĐỀ ÁP DỤNG': 'Đề áp dụng', 'ĐỀ': 'Đề', 'GIẢI': 'Giải', 'NGUYÊN NHÂN ÁP DỤNG': 'Nguyên nhân áp dụng', 'THỬ VIẾT THÀNH ĐOẠN': 'Thử viết thành đoạn',
        'FIELDS': 'Lĩnh vực', 'POSITIVE': 'Tích cực', 'NEGATIVE': 'Tiêu cực', 'B1. POSITIVE IMPACT': 'Tác động tích cực', 'B2. NEGATIVE IMPACT': 'Tác động tiêu cực',
        'CỤ THỂ HÓA (CHAIN)': 'Cụ thể hoá (mạch ý)', 'ĐỀ LUYỆN TƯ DUY': 'Đề luyện tư duy', 'MỤC ÁP DỤNG': 'Mục áp dụng',
        'ACTIONS BY STAKEHOLDERS': 'Hành động của các bên', 'POWER': 'Quyền lực', 'CỤ THỂ HÓA CHÍNH SÁCH': 'Cụ thể hoá chính sách',
        'IMPACT (SUPER IMPORTANT**)': 'Tác động', 'DẠNG ĐỀ': 'Dạng đề', 'VÍ DỤ': 'Ví dụ', 'CÁCH XỬ LÝ': 'Cách xử lý', 'HỌC THÊM': 'Học thêm'}
PART = {'B-1': ('Công nghệ', 'AI, Internet, mạng xã hội, điện thoại thông minh, tự động hoá, học online…'), 'B-2': ('Toàn cầu hoá', None),
        'B-3': ('Thực phẩm nội địa và nhập khẩu', 'Phần này là dàn ý định hướng, bạn tự triển khai thêm nhé.'), 'B-4': ('Kho tác động', 'Tác động phổ biến')}
MACRO = {'A': 'Nguyên nhân cốt lõi của mọi vấn đề', 'B': 'Tác động phổ biến', 'C': 'Giải pháp của mọi vấn đề'}
for mc in macros:
    mc['title'] = MACRO[mc['id']]
    for pt in mc['parts']:
        if pt['id'] in PART:
            pt['title'], note = PART[pt['id']]
            if note: pt['note'] = note
        for blk in pt['blocks']:
            if blk['kind'] == 'table':
                blk['head'] = [HEAD.get(h.upper(), h) for h in blk['head']]

# ---- prompts index: every prompt in a table's last "đề" column, tagged by where it sits ----
prompts = []
for mc in macros:
    for pt in mc['parts']:
        for blk in pt['blocks']:
            if blk['kind'] != 'table':
                continue
            cols = [i for i, h in enumerate(blk['head']) if re.search(r'ĐỀ (ÁP DỤNG|LUYỆN)', h, re.I)]
            for ri, row in enumerate(blk['rows']):
                for ci in cols:
                    c = row[ci] if ci < len(row) else None
                    if not c or 'lines' not in c:
                        continue
                    ps = prompts_from(c['lines'])
                    if ps:
                        c['prompts'] = ps
                    for p in ps:
                        prompts.append({**p, 'macro': mc['id'], 'table': blk['id'], 'row': ri})

# de-dup prompt texts for the library list
seen, uniq = set(), []
for p in prompts:
    k = re.sub(r'\W+', ' ', p['text'].lower()).strip()
    if k in seen:
        continue
    seen.add(k)
    uniq.append(p)

json.dump({'source': '[missbac.xiu V4] chống bí ý task 2 · tab 1 Ý tưởng phổ biến', 'macros': macros}, open(OUT, 'w'), ensure_ascii=False, indent=1)
print('macros', [(m['id'], len(m['parts']), sum(1 for p in m['parts'] for b in p['blocks'] if b['kind'] == 'table')) for m in macros])
print('prompts', len(prompts), 'unique', len(uniq), 'with hint', sum(1 for p in uniq if p.get('hint')), 'dated', sum(1 for p in uniq if p.get('date')))
