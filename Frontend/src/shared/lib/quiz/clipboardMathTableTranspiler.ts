const GREEK_AND_MATH_MAP: Record<string, string> = {
  'α': '\\alpha', 'β': '\\beta', 'γ': '\\gamma', 'δ': '\\delta', 'ε': '\\varepsilon',
  'θ': '\\theta', 'λ': '\\lambda', 'μ': '\\mu', 'π': '\\pi', 'ρ': '\\rho',
  'σ': '\\sigma', 'τ': '\\tau', 'φ': '\\varphi', 'ω': '\\omega', 'Δ': '\\Delta',
  'Ω': '\\Omega', 'Π': '\\Pi', 'Σ': '\\Sigma', '∞': '\\infty', '≤': '\\le',
  '≥': '\\ge', '≠': '\\ne', '±': '\\pm', '∓': '\\mp', '≈': '\\approx',
  '≡': '\\equiv', '∈': '\\in', '∉': '\\notin', '⊂': '\\subset', '⊆': '\\subseteq',
  '∪': '\\cup', '∩': '\\cap', '∅': '\\varnothing', '∀': '\\forall', '∃': '\\exists',
  '⇒': '\\Rightarrow', '⇔': '\\Leftrightarrow', '→': '\\to', '←': '\\leftarrow',
  '⊥': '\\perp', '∥': '\\parallel', '∠': '\\angle', '⋅': '\\cdot', '×': '\\times', '÷': '\\div',
};

const SUP_MAP: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  '⁺': '+', '⁻': '-', '⁼': '=', '⁽': '(', '⁾': ')', 'ⁿ': 'n',
};

const SUB_MAP: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
  '₊': '+', '₋': '-', '₌': '=', '₍': '(', '₎': ')',
};

export function unwrapWordConditionalMathHtml(html: string): string {
  if (!html) return '';
  return html
    // Bảo toàn vị trí của các đối tượng OLE MathType (<v:shape ... o:ole=""> / Equation.DSMT) bằng token __AEGIS_MT_SLOT__
    .replace(
      /<!--\[if\s+gte\s+vml\s+\d+\]>([\s\S]*?)<!\[endif\]-->(?:\s*<!\[if\s+!vml\]>[\s\S]*?<!\[endif\]>)?/gi,
      (_full, vmlInner) =>
        /\bo:ole\b|Equation\.DSMT/i.test(vmlInner)
          ? '<span data-mathtype-slot="true"> __AEGIS_MT_SLOT__ </span>'
          : ''
    )
    .replace(/<!\[if\s+!msEquation\]>[\s\S]*?<!\[endif\]>/gi, '')
    .replace(/<!--\[if\s+!msEquation\]>[\s\S]*?<!\[endif\]-->/gi, '')
    .replace(/<!\[if\s+!vml\]>[\s\S]*?<!\[endif\]>/gi, '')
    .replace(/<!--\[if\s+gte\s+msEquation\s+\d+\]>([\s\S]*?)<!\[endif\]-->/gi, '$1')
    .replace(/<!--\[if\s+gte\s+mso\s+\d+\]>([\s\S]*?)<!\[endif\]-->/gi, (_full, inner) =>
      /<m:oMath/i.test(inner) ? inner : ''
    )
    // Expand self-closing XML tags (<m:deg/>, <m:chr m:val="∫"/>, etc.) so HTML5 DOMParser does not swallow sibling nodes
    .replace(/<((?:m|mml):[a-zA-Z0-9]+)\b([^>]*?)\/>/gi, '<$1$2></$1>');
}

function getAttr(el: Element, localName: string): string {
  for (const attr of Array.from(el.attributes)) {
    if (attr.localName?.toLowerCase() === localName.toLowerCase() || attr.name.toLowerCase().endsWith(`:${localName.toLowerCase()}`)) {
      return attr.value;
    }
  }
  return '';
}

function findDirectChild(el: Element, localTag: string): Element | null {
  for (const child of Array.from(el.children)) {
    const t = (child.localName || child.tagName).toLowerCase().replace(/^.*:/, '');
    if (t === localTag.toLowerCase()) return child;
  }
  return null;
}

function findDirectChildren(el: Element, localTag: string): Element[] {
  return Array.from(el.children).filter(child => {
    const t = (child.localName || child.tagName).toLowerCase().replace(/^.*:/, '');
    return t === localTag.toLowerCase();
  });
}

function mapMathSymbolText(raw: string): string {
  let out = raw;
  for (const [k, v] of Object.entries(GREEK_AND_MATH_MAP)) {
    if (out.includes(k)) out = out.split(k).join(`${v} `);
  }
  return out.replace(/\s+/g, ' ').trim();
}

export function ommlOrMathMlNodeToLatex(node: Element): string {
  const dataLatex = node.getAttribute('data-latex') || node.getAttribute('alttext');
  if (dataLatex?.trim()) return dataLatex.trim();
  const texAnno = node.querySelector('annotation[encoding*="tex" i]');
  if (texAnno?.textContent?.trim()) return texAnno.textContent.trim();

  const walk = (el: Node): string => {
    if (el.nodeType === Node.TEXT_NODE) return mapMathSymbolText(el.textContent || '');
    if (el.nodeType !== Node.ELEMENT_NODE) return '';
    const elem = el as Element;
    const tag = (elem.localName || elem.tagName).toLowerCase().replace(/^.*:/, '');

    if (
      tag === 'rpr' || tag === 'fpr' || tag === 'radpr' || tag === 'ssuppr' ||
      tag === 'ssubpr' || tag === 'ssubsuppr' || tag === 'narypr' || tag === 'dpr' ||
      tag === 'eqarrpr' || tag === 'mpr' || tag === 'accpr' || tag === 'barpr' ||
      tag === 'ctrlpr' || tag === 'funcpr' || tag === 'limlowpr' || tag === 'limupppr'
    ) {
      return '';
    }

    // OMML Fraction <m:f><m:num>...<m:den>...
    if (tag === 'f') {
      const num = findDirectChild(elem, 'num');
      const den = findDirectChild(elem, 'den');
      return `\\frac{${num ? walk(num) : ''}}{${den ? walk(den) : ''}}`;
    }
    // OMML Radical <m:rad><m:deg>...<m:e>...
    if (tag === 'rad') {
      const deg = findDirectChild(elem, 'deg');
      const body = findDirectChild(elem, 'e');
      const degTex = deg ? walk(deg).trim() : '';
      return degTex ? `\\sqrt[${degTex}]{${body ? walk(body) : ''}}` : `\\sqrt{${body ? walk(body) : ''}}`;
    }
    // OMML Superscript / Subscript
    if (tag === 'ssup') {
      const base = findDirectChild(elem, 'e');
      const sup = findDirectChild(elem, 'sup');
      return `{${base ? walk(base) : ''}}^{${sup ? walk(sup) : ''}}`;
    }
    if (tag === 'ssub') {
      const base = findDirectChild(elem, 'e');
      const sub = findDirectChild(elem, 'sub');
      return `{${base ? walk(base) : ''}}_{${sub ? walk(sub) : ''}}`;
    }
    if (tag === 'ssubsup') {
      const base = findDirectChild(elem, 'e');
      const sub = findDirectChild(elem, 'sub');
      const sup = findDirectChild(elem, 'sup');
      return `{${base ? walk(base) : ''}}_{${sub ? walk(sub) : ''}}^{${sup ? walk(sup) : ''}}`;
    }
    // OMML N-ary (Integral, Sum, Product)
    if (tag === 'nary') {
      const pr = findDirectChild(elem, 'narypr');
      const chrEl = pr ? findDirectChild(pr, 'chr') : null;
      const chr = chrEl ? getAttr(chrEl, 'val') : '∫';
      const op = chr === '∑' ? '\\sum' : chr === '∏' ? '\\prod' : chr === '∮' ? '\\oint' : '\\int';
      const sub = findDirectChild(elem, 'sub');
      const sup = findDirectChild(elem, 'sup');
      const body = findDirectChild(elem, 'e');
      const subTex = sub ? walk(sub).trim() : '';
      const supTex = sup ? walk(sup).trim() : '';
      return `${op}${subTex ? `_{${subTex}}` : ''}${supTex ? `^{${supTex}}` : ''} {${body ? walk(body) : ''}}`;
    }
    // OMML Delimiters <m:d>
    if (tag === 'd') {
      const pr = findDirectChild(elem, 'dpr');
      const begEl = pr ? findDirectChild(pr, 'begchr') : null;
      const endEl = pr ? findDirectChild(pr, 'endchr') : null;
      const beg = begEl ? getAttr(begEl, 'val') : '(';
      const end = endEl ? getAttr(endEl, 'val') : ')';
      const parts = findDirectChildren(elem, 'e').map(walk);
      if (beg === '{' && !end) {
        return `\\begin{cases} ${parts.join(' \\\\ ')} \\end{cases}`;
      }
      const l = beg === '{' ? '\\{' : beg === '|' ? '|' : beg || '(';
      const r = end === '}' ? '\\}' : end === '|' ? '|' : end || ')';
      return `\\left${l} ${parts.join(', ')} \\right${r}`;
    }
    // OMML Equation Array <m:eqArr>
    if (tag === 'eqarr') {
      const rows = findDirectChildren(elem, 'e').map(walk).filter(Boolean);
      return rows.length > 1 ? `\\begin{cases} ${rows.join(' \\\\ ')} \\end{cases}` : rows.join(' ');
    }
    // OMML Matrix <m:m>
    if (tag === 'm') {
      const rows = findDirectChildren(elem, 'mr').map(mr =>
        findDirectChildren(mr, 'e').map(walk).join(' & ')
      );
      return `\\begin{pmatrix} ${rows.join(' \\\\ ')} \\end{pmatrix}`;
    }
    // OMML Accent / Bar
    if (tag === 'acc') {
      const pr = findDirectChild(elem, 'accpr');
      const chrEl = pr ? findDirectChild(pr, 'chr') : null;
      const chr = chrEl ? getAttr(chrEl, 'val') : '';
      const body = findDirectChild(elem, 'e');
      const inner = body ? walk(body) : '';
      if (chr === '\u20D7' || chr === '→' || chr === '⃗') return `\\overrightarrow{${inner}}`;
      if (chr === '^' || chr === '\u0302') return `\\widehat{${inner}}`;
      return `\\overline{${inner}}`;
    }
    if (tag === 'bar') {
      const body = findDirectChild(elem, 'e');
      return `\\overline{${body ? walk(body) : ''}}`;
    }
    if (tag === 'func') {
      const fn = findDirectChild(elem, 'fname');
      const body = findDirectChild(elem, 'e');
      const fnName = fn ? walk(fn).trim() : '';
      const latexFn = /^(sin|cos|tan|cot|ln|log|lim)$/i.test(fnName) ? `\\${fnName.toLowerCase()}` : fnName;
      return `${latexFn}{${body ? walk(body) : ''}}`;
    }
    if (tag === 'limlow') {
      const base = findDirectChild(elem, 'e');
      const lim = findDirectChild(elem, 'lim');
      const bTex = base ? walk(base).trim() : '\\lim';
      return `${bTex === 'lim' ? '\\lim' : bTex}_{${lim ? walk(lim) : ''}}`;
    }

    // Standard W3C MathML tags
    const kids = Array.from(elem.childNodes).filter(
      c => c.nodeType === Node.ELEMENT_NODE || (c.nodeType === Node.TEXT_NODE && c.textContent?.trim())
    );
    if (tag === 'mfrac' && kids.length >= 2) return `\\frac{${walk(kids[0])}}{${walk(kids[1])}}`;
    if (tag === 'msqrt') return `\\sqrt{${kids.map(walk).join('')}}`;
    if (tag === 'mroot' && kids.length >= 2) return `\\sqrt[${walk(kids[1])}]{${walk(kids[0])}}`;
    if (tag === 'msup' && kids.length >= 2) return `{${walk(kids[0])}}^{${walk(kids[1])}}`;
    if (tag === 'msub' && kids.length >= 2) return `{${walk(kids[0])}}_{${walk(kids[1])}}`;
    if (tag === 'msubsup' && kids.length >= 3) return `{${walk(kids[0])}}_{${walk(kids[1])}}^{${walk(kids[2])}}`;
    if ((tag === 'mover' || tag === 'munder') && kids.length >= 2) return `${walk(kids[0])}_{${walk(kids[1])}}`;
    if (tag === 'semantics') return kids.length > 0 ? walk(kids[0]) : '';
    if (tag === 'annotation') return '';

    return kids.map(walk).filter(Boolean).join(' ');
  };

  return walk(node).replace(/\s+/g, ' ').trim();
}

export function normalizeUnicodeMathToLatex(input: string): string {
  if (!input) return '';
  // Split by existing $...$ so we never corrupt already-formatted LaTeX
  const segments = input.split(/(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g);
  return segments
    .map((seg, idx) => {
      if (idx % 2 === 1) return seg;
      let s = seg
        .replace(/([A-Za-z0-9)\]])([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿ]+)/g, (_m, base, sups: string) => {
          const mapped = Array.from(sups).map(ch => SUP_MAP[ch] ?? ch).join('');
          return `$${base}^{${mapped}}$`;
        })
        .replace(/([A-Za-z0-9)\]])([₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎]+)/g, (_m, base, subs: string) => {
          const mapped = Array.from(subs).map(ch => SUB_MAP[ch] ?? ch).join('');
          return `$${base}_{${mapped}}$`;
        })
        .replace(/√\(([^)]+)\)/g, '$\\sqrt{$1}$')
        .replace(/√([0-9A-Za-z]+)/g, '$\\sqrt{$1}$');

      for (const [uni, tex] of Object.entries(GREEK_AND_MATH_MAP)) {
        if (s.includes(uni)) s = s.split(uni).join(`$${tex}$`);
      }
      // Merge adjacent inline math blocks like $a$ $\le$ $b$ -> $a \le b$
      return s.replace(/\$\s*\$/g, ' ');
    })
    .join('');
}

export function htmlTableToMarkdown(tableEl: Element): string {
  const rows = Array.from(tableEl.querySelectorAll('tr'))
    .map(tr =>
      Array.from(tr.querySelectorAll('th, td')).map(cell =>
        normalizeUnicodeMathToLatex((cell.textContent || '').replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim()).replace(/\|/g, '\\|')
      )
    )
    .filter(r => r.length > 0 && r.some(c => c.length > 0));
  if (rows.length === 0) return '';
  const colCount = Math.max(...rows.map(r => r.length));
  const padRow = (r: string[]) => Array.from({ length: colCount }, (_, i) => r[i] || '');
  const header = `| ${padRow(rows[0]).join(' | ')} |`;
  const divider = `| ${Array.from({ length: colCount }, () => '---').join(' | ')} |`;
  const body = rows.slice(1).map(r => `| ${padRow(r).join(' | ')} |`).join('\n');
  return `\n${header}\n${divider}${body ? `\n${body}` : ''}\n`;
}

export function tsvToMarkdownTable(text: string): string | null {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2 || !lines.every(l => l.includes('\t'))) return null;
  const rows = lines.map(l =>
    l.split('\t').map(c => normalizeUnicodeMathToLatex(c.trim()).replace(/\|/g, '\\|'))
  );
  const colCount = Math.max(...rows.map(r => r.length));
  if (colCount < 2) return null;
  const pad = (r: string[]) => Array.from({ length: colCount }, (_, i) => r[i] || '');
  const header = `| ${pad(rows[0]).join(' | ')} |`;
  const divider = `| ${Array.from({ length: colCount }, () => '---').join(' | ')} |`;
  const body = rows.slice(1).map(r => `| ${pad(r).join(' | ')} |`).join('\n');
  return `\n${header}\n${divider}\n${body}\n`;
}
