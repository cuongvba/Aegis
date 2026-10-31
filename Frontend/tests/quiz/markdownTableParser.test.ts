import { describe, it, expect } from 'vitest';
import { parseAndTokenizeTables } from '../../src/shared/lib/quiz/markdownTableParser';

describe('markdownTableParser', () => {
  it('should parse standard grouped frequency distribution table', () => {
    const input = `Sau khi khảo sát tổng số giờ xem truyền hình:
| Số giờ xem truyền hình | [0; 2) | [2; 4) | [4; 6) | [6; 8) | [8; 10) |
| --- | --- | --- | --- | --- |
| Tần số | 20 | 35 | 30 | 10 | 5 |
Giá trị trung bình bằng bao nhiêu?`;

    const tokens: Record<string, string> = {};
    const processed = parseAndTokenizeTables(input, tokens);

    expect(Object.keys(tokens).length).toBe(1);
    const tokenKey = Object.keys(tokens)[0];
    expect(processed).toContain(tokenKey);
    expect(processed).not.toContain('| Tần số |');

    const html = tokens[tokenKey];
    expect(html).toContain('<table');
    expect(html).toContain('Số giờ xem truyền hình');
    expect(html).toContain('[0; 2)');
    expect(html).toContain('20');
    expect(html).toContain('35');
    expect(html).toContain('</th>');
    expect(html).toContain('</td>');
  });

  it('should parse table with alignments correctly', () => {
    const input = `Bảng phân bố:
| Nhóm | Tần số |
| :--- | ---: |
| A | 10 |
| B | 20 |`;

    const tokens: Record<string, string> = {};
    parseAndTokenizeTables(input, tokens);

    expect(Object.keys(tokens).length).toBe(1);
    const html = Object.values(tokens)[0];
    expect(html).toContain('text-left');
    expect(html).toContain('text-right');
  });

  it('should ignore non-table pipe text', () => {
    const input = 'Giá trị tuyệt đối |x| + |y| = 5 không phải là bảng.';
    const tokens: Record<string, string> = {};
    const processed = parseAndTokenizeTables(input, tokens);

    expect(Object.keys(tokens).length).toBe(0);
    expect(processed).toBe(input);
  });
});

