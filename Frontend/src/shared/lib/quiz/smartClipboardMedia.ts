import React from 'react';
import {
  unwrapWordConditionalMathHtml,
  ommlOrMathMlNodeToLatex,
  normalizeUnicodeMathToLatex,
  htmlTableToMarkdown,
  tsvToMarkdownTable,
} from './clipboardMathTableTranspiler';

export { normalizeUnicodeMathToLatex };

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

export function convertWordHtmlToRichMarkdown(rawHtml: string): string | null {
  if (!rawHtml) return null;
  const html = unwrapWordConditionalMathHtml(rawHtml);
  const hasRichStructure = /<(table|m:omath|m:omathpara|math|mml:math|sup|sub|u|img)\b|katex|data-latex/i.test(html);
  if (!hasRichStructure) return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  doc.querySelectorAll('style, script, meta, link, xml, title, head').forEach(el => el.remove());

  // 1. Convert KaTeX / MathJax / Office MathML (m:oMath) / W3C MathML (mml:math) -> LaTeX ($...$)
  const mathSelectors = 'm\\:oMathPara, m\\:oMath, oMathPara, oMath, math, mml\\:math, .katex-mathml, [data-latex]';
  doc.querySelectorAll(mathSelectors).forEach(mathEl => {
    // Skip nested oMath if parent oMathPara is already being processed
    if (mathEl.tagName.toLowerCase().endsWith('omath') && mathEl.parentElement?.tagName.toLowerCase().endsWith('omathpara')) {
      return;
    }
    const tex = ommlOrMathMlNodeToLatex(mathEl);
    if (tex) {
      mathEl.replaceWith(doc.createTextNode(`$${tex}$`));
    }
  });

  // 2. Convert <sup>, <sub>, <u> BEFORE table extraction so cells retain LaTeX/underline
  doc.querySelectorAll('sup').forEach(el => {
    const t = el.textContent?.trim();
    if (t && !/^\[\d+\]$/.test(t)) el.replaceWith(doc.createTextNode(`$^{${t}}$`));
  });
  doc.querySelectorAll('sub').forEach(el => {
    const t = el.textContent?.trim();
    if (t) el.replaceWith(doc.createTextNode(`$_{${t}}$`));
  });
  doc.querySelectorAll('u').forEach(el => {
    const t = el.textContent?.trim();
    if (t) el.replaceWith(doc.createTextNode(`<u>${t}</u>`));
  });

  // 3. Convert <table> -> Markdown Table (| A | B |)
  doc.querySelectorAll('table').forEach(tableEl => {
    const mdTable = htmlTableToMarkdown(tableEl);
    if (mdTable) tableEl.replaceWith(doc.createTextNode(mdTable));
  });

  // 4. Handle <img>: Convert formula-alt images to LaTeX; keep only genuine data/http illustrations
  doc.querySelectorAll('img').forEach(imgEl => {
    const latexAlt = imgEl.getAttribute('data-latex') || imgEl.getAttribute('alt') || '';
    if (latexAlt && /\\[a-zA-Z]+|[\^_{}=]/.test(latexAlt) && latexAlt.length < 300) {
      const cleanTex = latexAlt.replace(/^\$+|\$+$/g, '').trim();
      imgEl.replaceWith(doc.createTextNode(`$${cleanTex}$`));
      return;
    }
    const src = imgEl.getAttribute('src') || '';
    if (src.startsWith('data:image/') || src.startsWith('http://') || src.startsWith('https://')) {
      const alt = (latexAlt || 'Hình minh họa').replace(/[\[\]\r\n]/g, ' ').trim();
      imgEl.replaceWith(doc.createTextNode(`\n![${alt}](${src})\n`));
    } else {
      imgEl.remove();
    }
  });

  doc.querySelectorAll('p, div, tr, li, br').forEach(el => {
    if (el.tagName.toLowerCase() === 'br') el.replaceWith(doc.createTextNode('\n'));
    else el.appendChild(doc.createTextNode('\n'));
  });

  const result = normalizeUnicodeMathToLatex(doc.body.textContent || '')
    .replace(/[ \t]+\n/g, '\n')
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
  const mdTable = tsvToMarkdownTable(trimmed);
  if (mdTable) return mdTable;

  const normalizedMath = normalizeUnicodeMathToLatex(trimmed);
  if (normalizedMath !== trimmed) return normalizedMath;

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
  const html = e.clipboardData?.getData('text/html') || '';
  const plain = e.clipboardData?.getData('text/plain') || '';

  // LUỒNG 1 (ƯU TIÊN SỐ 1): Phân tích cấu trúc HTML từ Word / Excel / Web
  // Chuyển Bảng biểu -> Markdown Table (| A | B |), Công thức OMML/MathML -> LaTeX ($...$).
  // Tuyệt đối KHÔNG lấy ảnh preview (image/png) mà Word/Excel tự sinh kèm trong Clipboard!
  const convertedHtml = convertWordHtmlToRichMarkdown(html);
  if (convertedHtml) {
    e.preventDefault();
    insertAtCursor(targetEl, currentVal, convertedHtml, onChange);
    const hasTable = /\|\s*---/.test(convertedHtml);
    const hasMath = convertedHtml.includes('$');
    if (hasTable && hasMath) {
      onNotify?.('Đã chuyển đổi Bảng biểu -> Markdown & Công thức -> LaTeX tối ưu lưu trữ!');
    } else if (hasTable) {
      onNotify?.('Đã chuyển đổi Bảng biểu Word/Excel -> Chuẩn Markdown Table (tiết kiệm 99% DB)!');
    } else if (hasMath) {
      onNotify?.('Đã chuyển đổi Công thức Toán -> Chuẩn Vector LaTeX ($...$)!');
    } else {
      onNotify?.('Đã chuẩn hóa dữ liệu từ Word/Clipboard!');
    }
    return;
  }

  // LUỒNG 2 (ƯU TIÊN SỐ 2): Phân tích Plain Text (Bảng TSV từ Excel, Công thức Unicode, Link Media)
  const convertedPlain = convertPlainTextToSmartMedia(plain);
  if (convertedPlain) {
    e.preventDefault();
    insertAtCursor(targetEl, currentVal, convertedPlain, onChange);
    if (/\|\s*---/.test(convertedPlain)) {
      onNotify?.('Đã chuyển đổi Bảng dữ liệu -> Chuẩn Markdown Table!');
    } else if (convertedPlain.includes('$')) {
      onNotify?.('Đã chuyển đổi Ký hiệu Toán học -> Chuẩn LaTeX ($...$)!');
    } else {
      onNotify?.('Đã tự động nhận diện và nhúng Đa phương tiện!');
    }
    return;
  }

  // Nếu Clipboard có chứa văn bản thuần (copy chữ bình thường từ Word/Excel/Web),
  // giữ nguyên hành vi dán văn bản mặc định của trình duyệt, KHÔNG đọc fileItem ảnh preview của Office!
  if (plain.trim().length > 0) {
    return;
  }

  // LUỒNG 3 (CHỈ KHI CLIPBOARD LÀ MEDIA THUẦN TÚY): Chụp màn hình Win+Shift+S, Copy Image, Audio, Video
  const items = Array.from(e.clipboardData?.items || []);
  const fileItem = items.find(it => it.kind === 'file' && /^(image|audio|video)\//i.test(it.type));
  if (fileItem) {
    e.preventDefault();
    const file = fileItem.getAsFile();
    if (!file) return;
    if (file.type.startsWith('image/')) {
      const uri = await compressImageToDataUri(file);
      insertAtCursor(targetEl, currentVal, `![Hình minh họa](${uri})`, onChange);
      onNotify?.('Đã dán và nén tối ưu Hình ảnh trực tiếp vào câu hỏi!');
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
