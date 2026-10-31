import { describe, it, expect } from 'vitest';
import katex from 'katex';

describe('MathRenderer Vector Normalization', () => {
  it('should transform KaTeX overrightarrow from 400em to 4em with sane 4000 viewBox', () => {
    const raw = katex.renderToString('\\overrightarrow{AB}');
    expect(raw).toContain('width="400em"');
    expect(raw).toContain('viewBox="0 0 400000 522"');

    // Applied normalizer
    const normalized = raw.replace(
      /<svg[^>]*preserveAspectRatio="xMaxYMin slice"[^>]*>[\s\S]*?<\/svg>/g,
      '<svg xmlns="http://www.w3.org/2000/svg" width="4em" height="0.522em" viewBox="0 0 4000 522" preserveAspectRatio="xMaxYMin slice" class="aegis-vector-arrow"><path d="M0 241v40h3891c-47.3 35.3-84 78-110 128 -16.7 32-27.7 63.7-33 95 0 1.3-.2 2.7-.5 4-.3 1.3-.5 2.3-.5 3 0 7.3 6.7 11 20 11 8 0 13.2-.8 15.5-2.5 2.3-1.7 4.2-5.5 5.5-11.5 2-13.3 5.7-27 11-41 14.7-44.7 39-84.5 73-119.5s73.7-60.2 119-75.5c6-2 9-5.7 9-11s-3-9-9-11c-45.3-15.3-85 -40.5-119-75.5s-58.3-74.8-73-119.5c-4.7-14-8.3-27.3-11-40-1.3-6.7-3.2-10.8-5.5 -12.5-2.3-1.7-7.5-2.5-15.5-2.5-14 0-21 3.7-21 11 0 2 2 10.3 6 25 20.7 83.3 67 151.7 139 205zm0 0v40h3900v-40z"/></svg>'
    );

    expect(normalized).not.toContain('width="400em"');
    expect(normalized).not.toContain('400000');
    expect(normalized).toContain('width="4em"');
    expect(normalized).toContain('viewBox="0 0 4000 522"');
    expect(normalized).toContain('h3891');
  });
});
