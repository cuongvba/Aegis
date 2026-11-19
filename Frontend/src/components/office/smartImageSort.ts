export interface BatchImageItem {
  id: string;
  file?: File;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
  lastModified: number;
  pageHint: number | null;
}

const PAGE_HINT_REGEX = /(?:trang|page|pg|slide|cau|câu|p|img|hinh|pic)[_\-\s.(]*(\d{1,4})/i;

export function extractPageHint(fileName: string): number | null {
  const m = fileName.match(PAGE_HINT_REGEX);
  if (m && m[1]) {
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > 0) return n;
  }
  const trailing = fileName.match(/(\d{1,4})\.[a-z0-9]+$/i);
  if (trailing && trailing[1] && trailing[1].length <= 4) {
    const n = Number(trailing[1]);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function smartSortImageFiles(
  items: BatchImageItem[],
  strategy: 'SMART' | 'NAME' | 'TIME' = 'SMART',
): BatchImageItem[] {
  const copy = [...items];
  if (strategy === 'TIME') {
    return copy.sort((a, b) => a.lastModified - b.lastModified || a.name.localeCompare(b.name, undefined, { numeric: true }));
  }
  if (strategy === 'NAME') {
    return copy.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  }
  // SMART: Page hints (Trang 1, Page 2...) -> Natural numeric filename -> Download time
  return copy.sort((a, b) => {
    if (a.pageHint !== null && b.pageHint !== null && a.pageHint !== b.pageHint) {
      return a.pageHint - b.pageHint;
    }
    if (a.pageHint !== null && b.pageHint === null) return -1;
    if (a.pageHint === null && b.pageHint !== null) return 1;
    const cmp = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    return cmp !== 0 ? cmp : a.lastModified - b.lastModified;
  });
}

export function readImageFile(file: File): Promise<BatchImageItem> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Không đọc được ảnh ${file.name}`));
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const img = new Image();
      img.onload = () => {
        resolve({
          id: `${file.name}_${file.lastModified}_${Math.random().toString(36).slice(2, 7)}`,
          file,
          name: file.name,
          dataUrl,
          width: img.naturalWidth || 800,
          height: img.naturalHeight || 1100,
          lastModified: file.lastModified || Date.now(),
          pageHint: extractPageHint(file.name),
        });
      };
      img.onerror = () => reject(new Error(`Ảnh không hợp lệ: ${file.name}`));
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export function buildMergedDocumentMarkdown(
  title: string,
  items: BatchImageItem[],
  oneImagePerPage: boolean,
): string {
  const lines: string[] = [`# ${title || 'Tài liệu Ghép từ Ảnh'}`, ''];
  items.forEach((item, idx) => {
    lines.push(`![Trang ${idx + 1} - ${item.name}](${item.dataUrl})`);
    if (oneImagePerPage && idx < items.length - 1) {
      lines.push('', '---page---', '');
    } else {
      lines.push('');
    }
  });
  return lines.join('\n').trim();
}
