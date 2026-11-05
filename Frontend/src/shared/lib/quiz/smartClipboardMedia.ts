import React from 'react';

export async function compressImageToDataUri(file: Blob, maxDim = 960): Promise<string> {
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return readBlobAsDataUri(file);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Image read failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(String(reader.result || ''));
      img.onload = () => {
        let { width, height } = img;
        if (width <= maxDim && height <= maxDim && file.size <= 180 * 1024) {
          resolve(String(reader.result || ''));
          return;
        }
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result || ''));
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/webp', 0.86));
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

export function readBlobAsDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Blob read failed'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(blob);
  });
}

function mathMlNodeToLatex(node: Element): string {
  const texAnno = node.querySelector('annotation[encoding*="tex" i]');
  if (texAnno?.textContent?.trim()) return texAnno.textContent.trim();

  const walk = (el: Node): string => {
    if (el.nodeType === Node.TEXT_NODE) return (el.textContent || '').trim();
    if (el.nodeType !== Node.ELEMENT_NODE) return '';
    const tag = (el as Element).localName?.toLowerCase() || '';
    const kids = Array.from(el.childNodes).filter(
      c => c.nodeType === Node.ELEMENT_NODE || (c.nodeType === Node.TEXT_NODE && c.textContent?.trim())
    );
    if (tag === 'mfrac' && kids.length >= 2) return `\\frac{${walk(kids[0])}}{${walk(kids[1])}}`;
    if (tag === 'msqrt') return `\\sqrt{${kids.map(walk).join('')}}`;
    if (tag === 'mroot' && kids.length >= 2) return `\\sqrt[${walk(kids[1])}]{${walk(kids[0])}}`;
    if (tag === 'msup' && kids.length >= 2) return `{${walk(kids[0])}}^{${walk(kids[1])}}`;
    if (tag === 'msub' && kids.length >= 2) return `{${walk(kids[0])}}_{${walk(kids[1])}}`;
    if (tag === 'msubsup' && kids.length >= 3) return `{${walk(kids[0])}}_{${walk(kids[1])}}^{${walk(kids[2])}}`;
    if ((tag === 'mover' || tag === 'munder') && kids.length >= 2) return `${walk(kids[0])}_{${walk(kids[1])}}`;
    if (tag === 'annotation' || tag === 'semantics') return kids.length > 0 ? walk(kids[0]) : '';
    return kids.map(walk).join(' ');
  };
  return walk(node).replace(/\s+/g, ' ').trim();
}

export function normalizeUnicodeMathToLatex(input: string): string {
  return input
    .replace(/([A-Za-z0-9)\]])²/g, '$$$1^{2}$$')
    .replace(/([A-Za-z0-9)\]])³/g, '$$$1^{3}$$')
    .replace(/([A-Za-z])₁/g, '$$$1_{1}$$')
    .replace(/([A-Za-z])₂/g, '$$$1_{2}$$')
    .replace(/([A-Za-z])₃/g, '$$$1_{3}$$')
    .replace(/([A-Za-z])₄/g, '$$$1_{4}$$')
    .replace(/√\(([^)]+)\)/g, '$\\sqrt{$1}$')
    .replace(/√([0-9A-Za-z]+)/g, '$\\sqrt{$1}$')
    .replace(/≤/g, '$\\le$')
    .replace(/≥/g, '$\\ge$')
    .replace(/≠/g, '$\\ne$')
    .replace(/±/g, '$\\pm$');
}

export function convertWordHtmlToRichMarkdown(html: string): string | null {
  if (!html || !/<(table|img|math|mml:math|sup|sub|u)\b/i.test(html)) return null;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  doc.querySelectorAll('style, script, meta, link, xml').forEach(el => el.remove());

  doc.querySelectorAll('math, mml\\:math').forEach(mathEl => {
    const tex = mathMlNodeToLatex(mathEl);
    if (tex) mathEl.replaceWith(doc.createTextNode(`$${tex}$`));
  });

  doc.querySelectorAll('img').forEach(imgEl => {
    const src = imgEl.getAttribute('src') || '';
    if (src.startsWith('data:image/') || src.startsWith('http://') || src.startsWith('https://')) {
      const alt = (imgEl.getAttribute('alt') || 'Hình minh họa').replace(/[\[\]\r\n]/g, ' ').trim();
      imgEl.replaceWith(doc.createTextNode(`\n![${alt}](${src})\n`));
    } else {
      imgEl.remove();
    }
  });

  doc.querySelectorAll('sup').forEach(el => {
    const t = el.textContent?.trim();
    if (t) el.replaceWith(doc.createTextNode(`$^{${t}}$`));
  });
  doc.querySelectorAll('sub').forEach(el => {
    const t = el.textContent?.trim();
    if (t) el.replaceWith(doc.createTextNode(`$_{${t}}$`));
  });
  doc.querySelectorAll('u').forEach(el => {
    const t = el.textContent?.trim();
    if (t) el.replaceWith(doc.createTextNode(`<u>${t}</u>`));
  });

  doc.querySelectorAll('table').forEach(tableEl => {
    const rows = Array.from(tableEl.querySelectorAll('tr'))
      .map(tr =>
        Array.from(tr.querySelectorAll('th, td')).map(cell =>
          (cell.textContent || '').replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').replace(/\|/g, '\\|').trim()
        )
      )
      .filter(r => r.length > 0 && r.some(c => c.length > 0));
    if (rows.length > 0) {
      const colCount = Math.max(...rows.map(r => r.length));
      const padRow = (r: string[]) => Array.from({ length: colCount }, (_, i) => r[i] || '');
      const header = `| ${padRow(rows[0]).join(' | ')} |`;
      const divider = `| ${Array.from({ length: colCount }, () => '---').join(' | ')} |`;
      const body = rows.slice(1).map(r => `| ${padRow(r).join(' | ')} |`).join('\n');
      const mdTable = `\n${header}\n${divider}${body ? `\n${body}` : ''}\n`;
      tableEl.replaceWith(doc.createTextNode(mdTable));
    }
  });

  doc.querySelectorAll('p, div, tr, li, br').forEach(el => {
    if (el.tagName.toLowerCase() === 'br') el.replaceWith(doc.createTextNode('\n'));
    else el.appendChild(doc.createTextNode('\n'));
  });

  const result = normalizeUnicodeMathToLatex(doc.body.textContent || '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return result || null;
}

export function convertPlainTextToSmartMedia(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (!/\s/.test(trimmed)) {
    if (/^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)[A-Za-z0-9_-]+/i.test(trimmed) || /^https?:\/\/[^\s]+\.(?:mp4|webm|mov)(?:\?[^\s]*)?$/i.test(trimmed)) {
      return `[Video](${trimmed})`;
    }
    if (/^https?:\/\/[^\s]+\.(?:mp3|wav|ogg|m4a)(?:\?[^\s]*)?$/i.test(trimmed)) {
      return `[Audio](${trimmed})`;
    }
    if (/^https?:\/\/[^\s]+\.(?:png|jpe?g|webp|gif|svg)(?:\?[^\s]*)?$/i.test(trimmed)) {
      return `![Hình minh họa](${trimmed})`;
    }
  }
  const lines = trimmed.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length >= 2 && lines.every(l => l.includes('\t'))) {
    const rows = lines.map(l => l.split('\t').map(c => c.trim().replace(/\|/g, '\\|')));
    const colCount = Math.max(...rows.map(r => r.length));
    if (colCount >= 2) {
      const pad = (r: string[]) => Array.from({ length: colCount }, (_, i) => r[i] || '');
      const header = `| ${pad(rows[0]).join(' | ')} |`;
      const divider = `| ${Array.from({ length: colCount }, () => '---').join(' | ')} |`;
      const body = rows.slice(1).map(r => `| ${pad(r).join(' | ')} |`).join('\n');
      return `\n${header}\n${divider}\n${body}\n`;
    }
  }
  if (/[²³₁₂₃₄√≤≥≠±]/.test(trimmed)) {
    return normalizeUnicodeMathToLatex(trimmed);
  }
  return null;
}

export function insertAtCursor(
  targetEl: HTMLTextAreaElement | HTMLInputElement | null,
  currentVal: string,
  snippet: string,
  onChange: (nextVal: string) => void
) {
  if (!targetEl) {
    onChange(currentVal ? `${currentVal}\n${snippet}` : snippet);
    return;
  }
  const start = targetEl.selectionStart ?? currentVal.length;
  const end = targetEl.selectionEnd ?? currentVal.length;
  const nextVal = `${currentVal.slice(0, start)}${snippet}${currentVal.slice(end)}`;
  onChange(nextVal);
}

export async function handleSmartRichPaste(
  e: React.ClipboardEvent<HTMLTextAreaElement | HTMLInputElement>,
  currentVal: string,
  onChange: (nextVal: string) => void,
  onNotify?: (msg: string) => void
) {
  const targetEl = e.currentTarget;
  const items = Array.from(e.clipboardData?.items || []);
  const fileItem = items.find(it => it.kind === 'file' && /^(image|audio|video)\//i.test(it.type));

  if (fileItem) {
    e.preventDefault();
    const file = fileItem.getAsFile();
    if (!file) return;
    if (file.type.startsWith('image/')) {
      const uri = await compressImageToDataUri(file);
      insertAtCursor(targetEl, currentVal, `![Hình minh họa](${uri})`, onChange);
      onNotify?.('Đã dán và tối ưu hóa Hình ảnh trực tiếp vào câu hỏi!');
      return;
    }
    if (file.type.startsWith('audio/')) {
      const uri = await readBlobAsDataUri(file);
      insertAtCursor(targetEl, currentVal, `[Audio](${uri})`, onChange);
      onNotify?.('Đã dán Âm thanh trực tiếp vào câu hỏi!');
      return;
    }
    if (file.type.startsWith('video/')) {
      const uri = await readBlobAsDataUri(file);
      insertAtCursor(targetEl, currentVal, `[Video](${uri})`, onChange);
      onNotify?.('Đã dán Video trực tiếp vào câu hỏi!');
      return;
    }
  }

  const html = e.clipboardData?.getData('text/html') || '';
  const convertedHtml = convertWordHtmlToRichMarkdown(html);
  if (convertedHtml) {
    e.preventDefault();
    insertAtCursor(targetEl, currentVal, convertedHtml, onChange);
    onNotify?.('Đã tự động chuyển đổi Bảng biểu / Hình ảnh / Công thức từ Word!');
    return;
  }

  const plain = e.clipboardData?.getData('text/plain') || '';
  const convertedPlain = convertPlainTextToSmartMedia(plain);
  if (convertedPlain) {
    e.preventDefault();
    insertAtCursor(targetEl, currentVal, convertedPlain, onChange);
    onNotify?.('Đã tự động nhận diện và chuyển đổi dữ liệu Đa phương tiện / Bảng biểu!');
  }
}

export function hasRichPreviewContent(text?: string): boolean {
  if (!text) return false;
  return (
    text.includes('$') ||
    text.includes('\\') ||
    text.includes('data:image/') ||
    text.includes('data:audio/') ||
    text.includes('data:video/') ||
    text.includes('![') ||
    text.includes('[Audio') ||
    text.includes('[Video') ||
    text.includes('<u') ||
    /\|\s*---/.test(text) ||
    /youtube\.com|youtu\.be/i.test(text)
  );
}
