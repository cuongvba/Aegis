import { describe, it, expect } from 'vitest';
import {
  compileMathAndMarkdownHtml,
  normalizeLatexEquation,
  normalizeVectorSvg,
} from '@/shared/lib/quiz/mathHtmlCompiler';

describe('mathHtmlCompiler — KaTeX, Vector SVG & Recursive Token Expansion Suite', () => {
  it('normalizes \\vec{AB}, \\hat{ABC}, and \\angle ABC to standard KaTeX commands', () => {
    expect(normalizeLatexEquation('\\vec{MN} = (9; -12; 0)')).toBe('\\overrightarrow{MN} = (9; -12; 0)');
    expect(normalizeLatexEquation('\\hat{ABC} = 60^\\circ')).toBe('\\widehat{ABC} = 60^\\circ');
    expect(normalizeLatexEquation('\\angle ABC = 90^\\circ')).toBe('\\widehat{ABC} = 90^\\circ');
  });

  it('normalizes KaTeX SVG vector arrow viewBox to Golden Ratio 4000x522', () => {
    const rawSvg = '<svg width="400em" height="0.522em" viewBox="0 0 400000 522" preserveAspectRatio="xMaxYMin slice"><path d="M0 0"/></svg>';
    const out = normalizeVectorSvg(rawSvg);
    expect(out).toContain('viewBox="0 0 4000 522"');
    expect(out).toContain('class="aegis-vector-arrow"');
  });

  it('renders complex inline formulas (fractions, cases, subscripts, vectors) with automatic \\displaystyle', () => {
    const input = 'Cho hàm số $y = \\frac{ax+b}{cx+d}$, cấp số nhân $(u_{n})$ với $u_{1} = 2$ và $\\overrightarrow{AB}$.';
    const html = compileMathAndMarkdownHtml(input) ?? '';

    expect(html).toContain('class="katex"');
    expect(html).toContain('aegis-vector-arrow');
    expect(html).not.toContain('__AEGIS_KATEX_INLINE_');
  });

  it('renders piecewise system of equations (\\begin{cases}) without leaking raw tokens', () => {
    const input = 'Hệ phương trình $\\left\\{\\begin{matrix} x = 5 + 3t \\\\ y = 10 - 4t \\\\ z = 0 \\end{matrix}\\right.$ có nghiệm là:';
    const html = compileMathAndMarkdownHtml(input) ?? '';

    expect(html).toContain('class="katex"');
    expect(html).not.toContain('[Lỗi công thức');
    expect(html).not.toContain('__AEGIS_');
  });

  it('resolves multi-level nested KaTeX formulas inside Markdown tables completely (End-to-End Question 6)', () => {
    const input = [
      'Khảo sát thời gian (đơn vị: phút) học trực tuyến trong một ngày của 42 học sinh:',
      '| Thời gian học trực tuyến | $[10;20)$ | $[20;30)$ | $[30;40)$ | $[40;50)$ | $[50;60)$ | $[60;70)$ |',
      '| --- | --- | --- | --- | --- | --- | --- |',
      '| Số học sinh | $4$ | $8$ | $14$ | $7$ | $4$ | $5$ |',
      'Trung vị của mẫu số liệu trên thuộc nhóm nào sau đây?',
    ].join('\n');

    const html = compileMathAndMarkdownHtml(input) ?? '';

    expect(html).toContain('<table');
    expect(html).toContain('<th');
    expect(html).toContain('<td');
    expect(html).toContain('class="inline-math');
    expect(html).toContain('class="katex"');
    expect(html).not.toContain('__AEGIS_KATEX_INLINE_');
    expect(html).not.toContain('__AEGIS_TABLE_TOKEN_');
  });

  it('escapes raw HTML tags in IT/Computer Science questions while preserving <u> and <mark>', () => {
    const input = 'Thẻ <ol start="10"> khác với <u>từ gạch chân</u> và <mark>từ nổi bật</mark>.';
    const html = compileMathAndMarkdownHtml(input) ?? '';

    expect(html).toContain('&lt;ol start="10"&gt;');
    expect(html).toContain('<u class="underline');
    expect(html).toContain('<mark class="bg-amber-400/20');
  });
});
