import { describe, it, expect } from 'vitest';
import { splitTableCells, parseAndTokenizeTables } from '@/shared/lib/quiz/markdownTableParser';

describe('markdownTableParser — World-Class Table & Nested Token Suite', () => {
  describe('splitTableCells', () => {
    it('splits standard GFM table rows into trimmed cells', () => {
      const row = '| Thời gian | $[10;20)$ | $[20;30)$ |';
      expect(splitTableCells(row)).toEqual(['Thời gian', '$[10;20)$', '$[20;30)$']);
    });

    it('preserves pipe characters inside HTML tags (<span class="katex">|x|</span>)', () => {
      const row = '| Giá trị tuyệt đối | <span class="katex">|x - 2|</span> | $5$ |';
      expect(splitTableCells(row)).toEqual(['Giá trị tuyệt đối', '<span class="katex">|x - 2|</span>', '$5$']);
    });

    it('preserves escaped pipe characters (\\|)', () => {
      const row = '| Tập hợp | A \\| B | Kết quả |';
      expect(splitTableCells(row)).toEqual(['Tập hợp', 'A \\| B', 'Kết quả']);
    });
  });

  describe('parseAndTokenizeTables', () => {
    it('returns original text when no pipe character is present', () => {
      const tokens: Record<string, string> = {};
      const input = 'Cho hàm số bậc ba có đồ thị như hình vẽ.';
      expect(parseAndTokenizeTables(input, tokens)).toBe(input);
      expect(Object.keys(tokens)).toHaveLength(0);
    });

    it('converts GFM grouped frequency table into semantic HTML5 table token', () => {
      const tokens: Record<string, string> = {};
      const input = [
        'Khảo sát thời gian học trực tuyến:',
        '| Thời gian | [10;20) | [20;30) |',
        '| :--- | :---: | ---: |',
        '| Số học sinh | 4 | 8 |',
        'Trung vị của mẫu số liệu là bao nhiêu?',
      ].join('\n');

      const out = parseAndTokenizeTables(input, tokens);
      expect(out).toContain('__AEGIS_TABLE_TOKEN_0__');
      const tableHtml = tokens['__AEGIS_TABLE_TOKEN_0__'];
      expect(tableHtml).toContain('<table');
      expect(tableHtml).toContain('text-left');
      expect(tableHtml).toContain('text-center');
      expect(tableHtml).toContain('text-right');
      expect(tableHtml).toContain('Số học sinh');
    });

    it('immediately resolves nested __AEGIS_KATEX_INLINE_n__ tokens inside table headers and cells (Question 103_1_0_0_6 Regression Guard)', () => {
      const tokens: Record<string, string> = {
        __AEGIS_KATEX_INLINE_0__: '<span class="inline-math">[10;20)</span>',
        __AEGIS_KATEX_INLINE_1__: '<span class="inline-math">[20;30)</span>',
        __AEGIS_KATEX_INLINE_2__: '<span class="inline-math">[30;40)</span>',
      };

      const input = [
        '| Thời gian học trực tuyến | __AEGIS_KATEX_INLINE_0__ | __AEGIS_KATEX_INLINE_1__ | __AEGIS_KATEX_INLINE_2__ |',
        '| --- | --- | --- | --- |',
        '| Số học sinh | 4 | 8 | 14 |',
      ].join('\n');

      const out = parseAndTokenizeTables(input, tokens);
      const tableTokenKey = out.trim();
      const tableHtml = tokens[tableTokenKey];

      expect(tableHtml).toBeDefined();
      expect(tableHtml).not.toContain('__AEGIS_KATEX_INLINE_');
      expect(tableHtml).toContain('<span class="inline-math">[10;20)</span>');
      expect(tableHtml).toContain('<span class="inline-math">[20;30)</span>');
      expect(tableHtml).toContain('<span class="inline-math">[30;40)</span>');
    });
  });
});
