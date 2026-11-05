import React from 'react';
import {
  unwrapWordConditionalMathHtml,
  ommlOrMathMlNodeToLatex,
  normalizeUnicodeMathToLatex,
  htmlTableToMarkdown,
  tsvToMarkdownTable,
} from './clipboardMathTableTranspiler';
import {
  extractMathTypeRtfHexChunks,
  extractWordMathTypeHtmlMetadata,
  inspectImageMathSignature,
  transpileClipboardMathTypeViaApi,
} from './mathtypeClipboardClient';

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
        // Chỉ trả về trực tiếp với ảnh JPEG/WebP nhỏ không có kênh trong suốt Alpha;
        // Với ảnh PNG từ Word/MathType (chữ đen trên nền trong suốt), bắt buộc phủ nền trắng #ffffff để tránh lỗi nền đen!
        if (
          file.type !== 'image/png' &&
          width <= maxDim &&
          height <= maxDim &&
          file.size <= 180 * 1024
        ) {
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
        resolve(canvas.toDataURL('image/png'));
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
  const hasRichStructure =
    /<(table|m:omath|m:omathpara|math|mml:math|sup|sub|u|img)\b|katex|data-latex|__AEGIS_MT_SLOT__/i.test(html);
  if (!hasRichStructure) return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  doc.querySelectorAll('style, script, meta, link, xml, title, head').forEach(el => el.remove());

  const mathSelectors = 'm\\:oMathPara, m\\:oMath, oMathPara, oMath, math, mml\\:math, .katex-mathml, [data-latex]';
  doc.querySelectorAll(mathSelectors).forEach(mathEl => {
    if (mathEl.tagName.toLowerCase().endsWith('omath') && mathEl.parentElement?.tagName.toLowerCase().endsWith('omathpara')) {
      return;
    }
    const tex = ommlOrMathMlNodeToLatex(mathEl);
    if (tex) {
      mathEl.replaceWith(doc.createTextNode(`$${tex}$`));
    }
  });

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

  doc.querySelectorAll('table').forEach(tableEl => {
    const mdTable = htmlTableToMarkdown(tableEl);
    if (mdTable) tableEl.replaceWith(doc.createTextNode(mdTable));
  });

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

export async function handleSmartRichPaste(
  e: React.ClipboardEvent<HTMLTextAreaElement | HTMLInputElement>,
  currentVal: string,
  onChange: (nextVal: string) => void,
  onNotify?: (msg: string) => void
) {
  // Đọc đồng bộ toàn bộ dữ liệu Clipboard trong tick sự kiện đầu tiên
  const targetEl = e.currentTarget;
  const start = targetEl?.selectionStart ?? currentVal.length;
  const end = targetEl?.selectionEnd ?? currentVal.length;
  const insertSnippet = (snippet: string) => {
    onChange(`${currentVal.slice(0, start)}${snippet}${currentVal.slice(end)}`);
  };

  const rtf = e.clipboardData?.getData('text/rtf') || e.clipboardData?.getData('application/rtf') || '';
  const html = e.clipboardData?.getData('text/html') || '';
  const plain = e.clipboardData?.getData('text/plain') || '';
  const items = Array.from(e.clipboardData?.items || []);
  const fileItem = items.find(it => it.kind === 'file' && /^(image|audio|video)\//i.test(it.type));
  const clipboardFile = fileItem ? fileItem.getAsFile() : null;

  const rtfHexChunks = extractMathTypeRtfHexChunks(rtf);
  const mtMeta = extractWordMathTypeHtmlMetadata(html);
  const convertedHtml = convertWordHtmlToRichMarkdown(html);

  // LUỒNG 1A (ĐỐI TƯỢNG MATHTYPE TỪ MICROSOFT WORD - RTF MTEF / OLE / WMZ):
  if (
    rtfHexChunks.length > 0 ||
    mtMeta.hasMathTypeOle ||
    (convertedHtml && convertedHtml.includes('__AEGIS_MT_SLOT__'))
  ) {
    e.preventDefault();
    onNotify?.('⏳ Đang giải mã đối tượng MathType từ Word sang công thức LaTeX ($...$)...');
    let imageDataUri: string | undefined;
    if (clipboardFile && clipboardFile.type.startsWith('image/')) {
      const compressedUri = await compressImageToDataUri(clipboardFile);
      const sig = await inspectImageMathSignature(clipboardFile, compressedUri);
      if (sig.isLikelyFormula) {
        imageDataUri = sig.formulaReadyDataUri || compressedUri;
      }
    }

    const mtRes = await transpileClipboardMathTypeViaApi({
      rtfHexChunks,
      localWmzPaths: mtMeta.localWmzPaths,
      imageDataUri,
    });

    if (convertedHtml && convertedHtml.includes('__AEGIS_MT_SLOT__')) {
      let slotIdx = 0;
      const merged = convertedHtml
        .replace(/__AEGIS_MT_SLOT__/g, () => {
          const f = mtRes.formulas[slotIdx] ?? mtRes.singleLatex ?? '';
          slotIdx++;
          return f;
        })
        .replace(/\s+/g, ' ')
        .trim();
      if (merged) {
        insertSnippet(merged);
        onNotify?.('Đã giải mã chính xác đối tượng MathType từ Word sang chuẩn LaTeX ($...$)!');
        return;
      }
    }

    if (mtRes.success && mtRes.singleLatex) {
      insertSnippet(mtRes.formulas.length > 1 ? mtRes.formulas.join(' ') : mtRes.singleLatex);
      onNotify?.('Đã giải mã đối tượng MathType từ Word sang chuẩn LaTeX ($...$)!');
      return;
    }
  }

  // LUỒNG 1B (BẢNG BIỂU & CÔNG THỨC OMML/MATHML TỪ WORD / EXCEL / WEB):
  if (convertedHtml && !convertedHtml.includes('__AEGIS_MT_SLOT__')) {
    e.preventDefault();
    insertSnippet(convertedHtml);
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

  // LUỒNG 2: Plain Text (Bảng TSV từ Excel, Công thức Unicode, Link Media)
  const convertedPlain = convertPlainTextToSmartMedia(plain);
  if (convertedPlain) {
    e.preventDefault();
    insertSnippet(convertedPlain);
    if (/\|\s*---/.test(convertedPlain)) {
      onNotify?.('Đã chuyển đổi Bảng dữ liệu -> Chuẩn Markdown Table!');
    } else if (convertedPlain.includes('$')) {
      onNotify?.('Đã chuyển đổi Ký hiệu Toán học -> Chuẩn LaTeX ($...$)!');
    } else {
      onNotify?.('Đã tự động nhận diện và nhúng Đa phương tiện!');
    }
    return;
  }

  if (plain.trim().length > 0) {
    return;
  }

  // LUỒNG 3: Clipboard chỉ chứa File nhị phân (Khi click trực tiếp vào hộp MathType hoặc chụp ảnh màn hình)
  if (clipboardFile) {
    e.preventDefault();
    if (clipboardFile.type.startsWith('image/')) {
      const uri = await compressImageToDataUri(clipboardFile);
      // Kiểm tra xem ảnh chụp/copy này có phải là ảnh công thức MathType không
      const { isLikelyFormula, formulaReadyDataUri } = await inspectImageMathSignature(clipboardFile, uri);
      if (isLikelyFormula) {
        onNotify?.('⏳ Phát hiện ảnh công thức Toán học, đang chuyển đổi sang chuẩn LaTeX ($...$)...');
        const mtRes = await transpileClipboardMathTypeViaApi({
          imageDataUri: formulaReadyDataUri || uri,
        });
        if (mtRes.success && mtRes.singleLatex) {
          insertSnippet(mtRes.singleLatex);
          onNotify?.('Đã chuyển đổi ảnh công thức MathType sang chuẩn Vector LaTeX ($...$)!');
          return;
        }
      }
      insertSnippet(`![Hình minh họa](${uri})`);
      onNotify?.('Đã dán và nén tối ưu Hình ảnh trực tiếp vào câu hỏi!');
      return;
    }
    if (clipboardFile.type.startsWith('audio/')) {
      const uri = await readBlobAsDataUri(clipboardFile);
      insertSnippet(`[Audio](${uri})`);
      onNotify?.('Đã dán Âm thanh trực tiếp vào câu hỏi!');
      return;
    }
    if (clipboardFile.type.startsWith('video/')) {
      const uri = await readBlobAsDataUri(clipboardFile);
      insertSnippet(`[Video](${uri})`);
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
