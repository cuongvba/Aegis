import { describe, expect, it } from 'vitest';
import { smartSortImageFiles, type BatchImageItem } from '../src/components/office/smartImageSort';

const mk = (name: string, lastModified = 1000): BatchImageItem => ({
  id: name,
  name,
  dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
  width: 800,
  height: 1100,
  lastModified,
  pageHint: (() => {
    const m = name.match(/(?:trang|page|p)[_\-\s.(]*(\d{1,4})/i);
    return m ? Number(m[1]) : null;
  })(),
});

describe('smartSortImageFiles', () => {
  it('orders multi-digit page numbers naturally instead of lexicographically', () => {
    const input = [mk('page_10.jpg'), mk('page_2.jpg'), mk('Trang 1.png'), mk('page_3.jpg')];
    const sorted = smartSortImageFiles(input, 'SMART');
    expect(sorted.map((x) => x.name)).toEqual(['Trang 1.png', 'page_2.jpg', 'page_3.jpg', 'page_10.jpg']);
  });

  it('sorts by download timestamp when TIME strategy is chosen', () => {
    const input = [mk('fb_999.jpg', 300), mk('fb_111.jpg', 100), mk('fb_555.jpg', 200)];
    const sorted = smartSortImageFiles(input, 'TIME');
    expect(sorted.map((x) => x.name)).toEqual(['fb_111.jpg', 'fb_555.jpg', 'fb_999.jpg']);
  });
});
