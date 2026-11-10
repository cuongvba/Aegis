import katex from 'katex';
import { convertWmfDataUriToSvg, cleanSvgDataUri } from '@/shared/lib/quiz/wmfDecoder';
import { parseAndTokenizeTables } from '@/shared/lib/quiz/markdownTableParser';

/**
 * Tính toán độ cao động và căn chỉnh trục dọc cho công thức toán học SVG/WMF:
 */
export function getFormulaMetrics(src: string, customBaseUnit?: number): { heightEm: number; isComplex: boolean; vAlign: string } {
  let lineFactor = 1.0;
  let heightEm = 1.45;
  let vAlign = '-0.30em';

  try {
    if (src.startsWith('data:image/svg+xml;base64,')) {
      const base64Str = src.slice('data:image/svg+xml;base64,'.length);
      const head = atob(base64Str.slice(0, 1200));
      const lfMatch = head.match(/data-line-factor=["']([\d.]+)["']/i);
      if (lfMatch) {
        lineFactor = parseFloat(lfMatch[1]);
      } else {
        const vbMatch = head.match(/viewBox=["'][\d.-]+\s+[\d.-]+\s+([\d.-]+)\s+([\d.-]+)["']/i);
        const fsMatches = [...head.matchAll(/font-size:([\d.]+)/gi)].map((m) => parseFloat(m[1]));
        if (vbMatch && fsMatches.length > 0) {
          fsMatches.sort((a, b) => a - b);
          const medianFs = fsMatches[Math.floor(fsMatches.length / 2)];
          const h = parseFloat(vbMatch[2]);
          if (medianFs > 0) {
            lineFactor = Math.max(0.8, Math.min(10.0, h / medianFs));
          }
        }
      }
    }
  } catch {}

  const baseUnit = customBaseUnit && customBaseUnit > 0 ? customBaseUnit : 1.45;
  heightEm = Math.max(1.2, lineFactor * baseUnit);
  vAlign = `-${((heightEm - 1.0) * 0.48 + 0.12).toFixed(2)}em`;

  return { heightEm, isComplex: lineFactor > 1.8, vAlign };
}

/**
 * Chuẩn hóa SVG vector của KaTeX:
 * Mặc định KaTeX sinh ra SVG width="400em" với viewBox="0 0 400000 522".
 * Hàm này tối ưu hóa viewBox và width về 4em / 4000 units (tỷ lệ vàng 7.6:1).
 */
export function normalizeVectorSvg(html: string): string {
  if (!html.includes('xMaxYMin slice')) return html;
  return html.replace(
    /<svg[^>]*preserveAspectRatio="xMaxYMin slice"[^>]*>[\s\S]*?<\/svg>/g,
    '<svg xmlns="http://www.w3.org/2000/svg" width="4em" height="0.522em" viewBox="0 0 4000 522" preserveAspectRatio="xMaxYMin slice" class="aegis-vector-arrow" style="width: 4em !important; height: inherit !important; position: absolute !important; top: 0 !important; right: 0 !important; left: auto !important; fill: currentColor !important; stroke: currentColor !important; stroke-width: 0.5px !important; display: block !important;"><path d="M0 241v40h3891c-47.3 35.3-84 78-110 128 -16.7 32-27.7 63.7-33 95 0 1.3-.2 2.7-.5 4-.3 1.3-.5 2.3-.5 3 0 7.3 6.7 11 20 11 8 0 13.2-.8 15.5-2.5 2.3-1.7 4.2-5.5 5.5-11.5 2-13.3 5.7-27 11-41 14.7-44.7 39-84.5 73-119.5s73.7-60.2 119-75.5c6-2 9-5.7 9-11s-3-9-9-11c-45.3-15.3-85 -40.5-119-75.5s-58.3-74.8-73-119.5c-4.7-14-8.3-27.3-11-40-1.3-6.7-3.2-10.8-5.5 -12.5-2.3-1.7-7.5-2.5-15.5-2.5-14 0-21 3.7-21 11 0 2 2 10.3 6 25 20.7 83.3 67 151.7 139 205zm0 0v40h3900v-40z" style="fill: currentColor !important; stroke: none !important;"/></svg>'
  );
}

/**
 * Chuẩn hóa ký hiệu toán học LaTeX (vector, góc, mũ) trước khi đưa vào KaTeX
 */
export function normalizeLatexEquation(equation: string): string {
  return equation
    .trim()
    .replace(/\\vec\{([^{}]+)\}/g, '\\overrightarrow{$1}')
    .replace(/\\vec\s+([a-zA-Z0-9]+)/g, '\\overrightarrow{$1}')
    .replace(/\\hat\{([^{}]+)\}/g, '\\widehat{$1}')
    .replace(/\\hat\s+([a-zA-Z0-9]+)/g, '\\widehat{$1}')
    .replace(/\\angle\s*\{?([A-Z]{3})\}?/g, '\\widehat{$1}')
    .replace(/∠\s*([A-Z]{3})/g, '\\widehat{$1}')
    .replace(/[\u20D7⃗]/g, '');
}

/**
 * Biên dịch nội dung câu hỏi/phương án/lời giải chứa LaTeX ($...$, $$...$$),
 * Bảng biểu Markdown, Hình ảnh, Audio/Video và Code thành HTML an toàn.
 */
export function compileMathAndMarkdownHtml(sanitizedContent: string, effectiveBaseUnit: number = 1.45): string | null {
  if (!sanitizedContent) return '';

  const trimmed = sanitizedContent.trim().replace(/[\.\s\t]+$/, '');
  if (
    ((trimmed.startsWith('data:image/') || trimmed.startsWith('data:image/x-wmf') || trimmed.startsWith('data:image/wmf')) &&
      !/\s/.test(trimmed)) ||
    (trimmed.startsWith('http') &&
      !/\s/.test(trimmed) &&
      (trimmed.endsWith('.png') || trimmed.endsWith('.jpg') || trimmed.endsWith('.webp') || trimmed.endsWith('.svg')))
  ) {
    return null;
  }

  if (
    trimmed.startsWith('data:audio/') ||
    (trimmed.startsWith('http') && (trimmed.endsWith('.mp3') || trimmed.endsWith('.wav') || trimmed.endsWith('.ogg') || trimmed.endsWith('.m4a')))
  ) {
    return `<div class="my-2 p-2 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center gap-2"><audio controls class="w-full h-8"><source src="${trimmed}" /></audio></div>`;
  }

  const mediaTokens: Record<string, string> = {};
  let tokenCounter = 0;

  const buildVideoHtml = (src: string) => {
    const ytMatch = src.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i);
    if (ytMatch) {
      return `<div class="my-3 rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-lg max-w-xl mx-auto aspect-video"><iframe src="https://www.youtube.com/embed/${ytMatch[1]}" title="Video bài học" class="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
    }
    return `<div class="my-3 p-2.5 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col gap-1.5 max-w-xl mx-auto"><span class="text-[11px] font-bold text-amber-400">🎬 Video trực quan:</span><video controls preload="metadata" class="w-full max-h-80 rounded-xl bg-black"><source src="${src}" /></video></div>`;
  };

  let processed = sanitizedContent.replace(/\[Audio(?:\s+Listening)?\]\(((?:data:audio\/|http)[^)]+)\)/gi, (_match, src) => {
    const token = `__AEGIS_AUDIO_TOKEN_${tokenCounter++}__`;
    mediaTokens[token] = `<div class="my-2 p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col gap-1"><span class="text-[11px] font-bold text-sky-400">🎧 Bài nghe Audio:</span><audio controls class="w-full h-8"><source src="${src}" /></audio></div>`;
    return token;
  });

  processed = processed.replace(/\[Video(?:\s+[^\]]*)?\]\(((?:data:video\/|http)[^)]+)\)/gi, (_match, src) => {
    const token = `__AEGIS_VIDEO_TOKEN_${tokenCounter++}__`;
    mediaTokens[token] = buildVideoHtml(src);
    return token;
  });

  processed = processed.replace(/!\[([^\]]*)\]\((data:image\/[^;]+;base64,[^)]+|https?:\/\/[^)\s]+)\)/g, (_match, alt, src) => {
    const safeSrc = src.startsWith('data:image/x-wmf') || src.startsWith('data:image/wmf') ? convertWmfDataUriToSvg(src) : src;
    const token = `__AEGIS_IMG_TOKEN_${tokenCounter++}__`;
    mediaTokens[token] = `<div class="my-3 flex flex-col items-center"><div class="inline-block p-2.5 rounded-2xl bg-white border border-slate-200 shadow-md max-w-full"><img src="${safeSrc}" alt="${alt || 'Hình minh họa'}" class="max-h-96 max-w-full rounded-xl object-contain bg-white block mx-auto" /></div><span class="text-[11px] text-slate-400 mt-1.5 italic">${alt || 'Hình minh họa'}</span></div>`;
    return token;
  });

  processed = processed.replace(/(?<!(?:src=["']|\())(data:image\/[a-zA-Z0-9.+_-]+;base64,[A-Za-z0-9+/=]+)(?!\))/g, (_match, src) => {
    const safeSrc =
      src.startsWith('data:image/x-wmf') || src.startsWith('data:image/wmf')
        ? convertWmfDataUriToSvg(src)
        : src.startsWith('data:image/svg+xml')
        ? cleanSvgDataUri(src)
        : src;
    const token = `__AEGIS_IMG_TOKEN_${tokenCounter++}__`;
    const metrics = getFormulaMetrics(safeSrc, effectiveBaseUnit);
    mediaTokens[token] = `<img src="${safeSrc}" alt="Công thức" style="height: ${metrics.heightEm.toFixed(2)}em; max-height: var(--math-max-height, 14em); width: auto; max-width: 100%; vertical-align: ${metrics.vAlign}; object-fit: contain;" class="inline-block rounded px-2 py-0.5 mx-1 align-middle border border-slate-300 bg-white shadow-sm hover:scale-105 transition-transform cursor-zoom-in" />`;
    return token;
  });

  processed = processed.replace(/(?<!\$)\\ce\{([^\}]+)\}(?!\$)/g, '$\\ce{$1}$');

  processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (_match, equation) => {
    try {
      const normalized = normalizeLatexEquation(equation);
      const rendered = katex.renderToString(normalized, { displayMode: true, throwOnError: false, strict: false });
      const token = `__AEGIS_KATEX_BLOCK_${tokenCounter++}__`;
      mediaTokens[token] = `<div class="block-math my-2 text-[1.1em] overflow-x-auto overflow-y-hidden py-1 tracking-wide">${normalizeVectorSvg(rendered)}</div>`;
      return token;
    } catch {
      return `<span class="text-rose-400 font-mono text-xs">[Lỗi công thức: ${equation}]</span>`;
    }
  });

  processed = processed.replace(/(?<!\\)\$([^\$\n\r]+?)\$/g, (_match, equation) => {
    try {
      const normalized = normalizeLatexEquation(equation);
      const hasComplexStructures = /\\(?:frac|dfrac|cfrac|sqrt|int|iint|iiint|oint|sum|prod|lim|matrix|pmatrix|bmatrix|vmatrix|cases)/.test(normalized);
      const formulaToRender = hasComplexStructures && !normalized.includes('\\displaystyle') ? `{\\displaystyle ${normalized}}` : normalized;
      const rendered = katex.renderToString(formulaToRender, { displayMode: false, throwOnError: false, strict: false });
      const token = `__AEGIS_KATEX_INLINE_${tokenCounter++}__`;
      mediaTokens[token] = `<span class="inline-math font-medium tracking-wide mx-0.5">${normalizeVectorSvg(rendered)}</span>`;
      return token;
    } catch {
      return `<span class="text-rose-400 font-mono text-xs">[Lỗi công thức: ${equation}]</span>`;
    }
  });

  processed = parseAndTokenizeTables(processed, mediaTokens);

  processed = processed.replace(/<u(?:\s+[^>]*)?>([\s\S]+?)<\/u>/gi, (_match, text) => {
    const token = `__AEGIS_U_TOKEN_${tokenCounter++}__`;
    mediaTokens[token] = `<u class="underline decoration-2 decoration-sky-400 underline-offset-4 font-bold text-sky-300">${text}</u>`;
    return token;
  });

  processed = processed.replace(/<mark(?:\s+[^>]*)?>([\s\S]+?)<\/mark>/gi, (_match, text) => {
    const token = `__AEGIS_MARK_TOKEN_${tokenCounter++}__`;
    mediaTokens[token] = `<mark class="bg-amber-400/20 text-amber-200 px-1 py-0.5 rounded font-semibold border-b border-amber-400/50">${text}</mark>`;
    return token;
  });

  processed = processed.replace(/```(?:[a-zA-Z0-9_+-]*\n)?([\s\S]+?)```/g, (_match, code) => {
    const token = `__AEGIS_CODE_BLOCK_${tokenCounter++}__`;
    const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    mediaTokens[token] = `<pre class="my-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 font-mono text-xs overflow-x-auto leading-relaxed whitespace-pre-wrap select-text"><code>${escapedCode}</code></pre>`;
    return token;
  });

  processed = processed.replace(/`([^`\n]+)`/g, (_match, code) => {
    const token = `__AEGIS_CODE_TOKEN_${tokenCounter++}__`;
    const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    mediaTokens[token] = `<code class="font-mono bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-[0.9em] border border-slate-700/60">${escapedCode}</code>`;
    return token;
  });

  processed = processed.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\u200B/g, '');
  processed = processed.replace(/\*\*([^\*]+?)\*\*/g, '<strong>$1</strong>');
  processed = processed.replace(/\n/g, '<br/>');
  processed = processed.replace(/(?:<br\/>)+(?=(?:__AEGIS_TABLE_TOKEN_|__AEGIS_KATEX_BLOCK_))/g, '');
  processed = processed.replace(/(?<=(?:__AEGIS_TABLE_TOKEN_\d+__|__AEGIS_KATEX_BLOCK_\d+__))(?:<br\/>)+/g, '');

  let hasRemainingToken = true;
  let passCount = 0;
  while (hasRemainingToken && passCount < 4) {
    hasRemainingToken = false;
    for (const [token, html] of Object.entries(mediaTokens)) {
      if (processed.includes(token)) {
        processed = processed.split(token).join(html);
        hasRemainingToken = true;
      }
    }
    passCount++;
  }

  return processed;
}
