import React, { useMemo } from 'react';
import 'katex/dist/katex.min.css';
// @ts-ignore
import 'katex/dist/contrib/mhchem';
import { sanitizeWmfInText, convertWmfDataUriToSvg, cleanSvgDataUri } from '@/shared/lib/quiz/wmfDecoder';
import { useMathConfig } from '@/shared/context/MathConfigContext';
import { compileMathAndMarkdownHtml, getFormulaMetrics } from '@/shared/lib/quiz/mathHtmlCompiler';

interface MathRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
  subjectCode?: string;
  fontScale?: number;
}

/**
 * [World-Class Math & Multimodal Media Renderer — Zero-Monolith UI <= 250 LOC]
 * Tự động phân tích và render:
 * 1. Phương án hoặc câu hỏi dạng Data URI Base64 ("data:image/png;base64,...") -> Thẻ <img>
 * 2. Hình vẽ minh họa dạng Markdown "![...](data:image/...)" -> Thẻ <img> kèm chú thích
 * 3. Công thức toán học LaTeX inline ($...$) hoặc block ($$...$$) -> Vector SVG siêu tốc qua KaTeX
 * 4. Bảng biểu Markdown có chứa công thức KaTeX bên trong các ô <th>/<td>
 * 5. Tự động chuyển đổi định dạng WMF (MathType) sang Vector SVG sắc nét
 */
export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  className = '',
  inline = false,
  subjectCode,
  fontScale,
}) => {
  const mathConfig = useMathConfig();
  const effectiveBaseUnit =
    fontScale ||
    (subjectCode && mathConfig.settings.subjectProfiles?.[subjectCode]?.baseFontUnit) ||
    mathConfig.baseFontUnit ||
    1.45;

  const sanitizedContent = useMemo(() => {
    return sanitizeWmfInText(content || '');
  }, [content]);

  const renderedHtml = useMemo(() => {
    return compileMathAndMarkdownHtml(sanitizedContent, effectiveBaseUnit);
  }, [sanitizedContent, effectiveBaseUnit]);

  let trimmed = sanitizedContent?.trim()?.replace(/[\.\s\t]+$/, '') || '';
  if (trimmed.startsWith('data:image/x-wmf') || trimmed.startsWith('data:image/wmf')) {
    trimmed = convertWmfDataUriToSvg(trimmed);
  } else if (trimmed.startsWith('data:image/svg+xml')) {
    trimmed = cleanSvgDataUri(trimmed);
  }

  if (
    ((trimmed.startsWith('data:image/') || trimmed.startsWith('data:image/x-wmf')) && !/\s/.test(trimmed)) ||
    (trimmed.startsWith('http') &&
      !/\s/.test(trimmed) &&
      (trimmed.endsWith('.png') || trimmed.endsWith('.jpg') || trimmed.endsWith('.webp') || trimmed.endsWith('.svg')))
  ) {
    const isSvgMath = trimmed.startsWith('data:image/svg+xml');
    const metrics = isSvgMath ? getFormulaMetrics(trimmed, effectiveBaseUnit) : null;
    return (
      <div className={`inline-flex items-center my-1 mx-1 ${className}`}>
        <img
          src={trimmed}
          alt="Công thức / Hình ảnh"
          style={
            metrics
              ? {
                  height: `${metrics.heightEm.toFixed(2)}em`,
                  maxHeight: '14em',
                  width: 'auto',
                  maxWidth: '100%',
                  verticalAlign: metrics.vAlign,
                  objectFit: 'contain',
                }
              : undefined
          }
          className={`${
            metrics ? '' : 'h-auto min-h-[2.2em] max-h-36 w-auto max-w-full'
          } object-contain rounded-lg border border-slate-300 bg-white px-2 py-0.5 shadow-sm hover:scale-105 transition-transform cursor-zoom-in`}
          onClick={(e) => {
            e.stopPropagation();
            window.open(trimmed, '_blank');
          }}
        />
      </div>
    );
  }

  if (inline) {
    return (
      <span
        className={`math-rendered-inline inline align-baseline ${className}`}
        dangerouslySetInnerHTML={{ __html: renderedHtml || sanitizedContent }}
      />
    );
  }

  return (
    <div
      className={`math-rendered leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml || sanitizedContent }}
    />
  );
};
export default MathRenderer;
