import React, { useMemo } from 'react';
import { MathRenderer } from '@/components/common/MathRenderer';

export type MarginPreset = 'narrow' | 'normal' | 'wide';

interface PaginatedA4ViewerProps {
  content: string;
  pageHeader?: string;
  zoomPct: number;
  fontFamily: string;
  fontSizePx: number;
  lineHeight: number;
  marginPreset: MarginPreset;
  twoColumnExam: boolean;
}

const MARGIN_PADDING_MAP: Record<MarginPreset, string> = {
  narrow: 'px-6 py-7 sm:px-9 sm:py-9',
  normal: 'px-8 py-10 sm:px-14 sm:py-12',
  wide: 'px-10 py-12 sm:px-20 sm:py-16',
};

function paginateMarkdown(raw: string): string[] {
  const source = (raw || '').trim();
  if (!source) return ['*Chưa có nội dung.*'];

  // 1. Respect explicit page breaks first (---page--- or <!-- Trang N -->)
  const explicitSections = source
    .split(/\n*(?:---page---|<!--\s*Trang\s+\d+\s*-->)\n*/gi)
    .map((s) => s.trim())
    .filter(Boolean);

  const pages: string[] = [];
  const maxCharsPerPage = 1850;
  const maxBlocksPerPage = 18;

  for (const section of explicitSections) {
    const blocks = section.split(/\n{2,}/).filter((b) => b.trim().length > 0);
    let currentBlocks: string[] = [];
    let currentChars = 0;

    for (const block of blocks) {
      const cleanLen = block.replace(/data:image\/[^)\s]+/g, '[IMG]').length;
      const isQuestionStart = /^(?:\*\*)?(?:Câu|Bài)\s+\d+[\.:]/i.test(block.trim());

      const wouldOverflow =
        currentBlocks.length > 0 &&
        (currentChars + cleanLen > maxCharsPerPage || currentBlocks.length >= maxBlocksPerPage);

      if (wouldOverflow && (!isQuestionStart || currentBlocks.length >= 4)) {
        pages.push(currentBlocks.join('\n\n'));
        currentBlocks = [];
        currentChars = 0;
      }

      currentBlocks.push(block);
      currentChars += cleanLen;
    }

    if (currentBlocks.length > 0) {
      pages.push(currentBlocks.join('\n\n'));
    }
  }

  return pages.length > 0 ? pages : ['*Chưa có nội dung.*'];
}

export const PaginatedA4Viewer: React.FC<PaginatedA4ViewerProps> = ({
  content,
  pageHeader,
  zoomPct,
  fontFamily,
  fontSizePx,
  lineHeight,
  marginPreset,
  twoColumnExam,
}) => {
  const pages = useMemo(() => paginateMarkdown(content), [content]);
  const padClass = MARGIN_PADDING_MAP[marginPreset];

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-300/90 p-4 sm:p-6 max-h-[72vh] overflow-auto space-y-6 print:max-h-none print:overflow-visible print:bg-white print:border-0 print:p-0 print:space-y-0">
      {pages.map((pageContent, idx) => (
        <article
          key={idx}
          style={{
            transform: `scale(${zoomPct / 100})`,
            transformOrigin: 'top center',
            fontFamily,
            fontSize: `${fontSizePx}px`,
            lineHeight,
          }}
          className={`mx-auto max-w-[794px] min-h-[1050px] flex flex-col justify-between rounded-lg bg-white ${padClass} text-slate-900 shadow-2xl border border-slate-200 print:shadow-none print:border-0 print:min-h-0 print:break-after-page`}
        >
          <div>
            {pageHeader && (
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 pb-2 mb-4 border-b border-slate-200">
                <span className="truncate max-w-[70%]">{pageHeader}</span>
                <span>Aegis Office Studio</span>
              </div>
            )}

            <div className={twoColumnExam ? 'columns-1 md:columns-2 gap-6 [column-rule:1px_solid_#e2e8f0]' : ''}>
              <MathRenderer
                content={pageContent}
                className="space-y-2.5 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:px-2.5 [&_th]:py-1.5 [&_td]:border [&_td]:border-slate-300 [&_td]:px-2.5 [&_td]:py-1.5 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2 [&_mark]:bg-amber-200 [&_mark]:px-1 [&_mark]:rounded"
              />
            </div>
          </div>

          <footer className="flex items-center justify-between text-[11px] font-semibold text-slate-400 pt-3 mt-6 border-t border-slate-200">
            <span>Soạn thảo chuẩn A4 • KaTeX Vector Math</span>
            <span className="font-bold text-slate-500">
              Trang {idx + 1} / {pages.length}
            </span>
          </footer>
        </article>
      ))}
    </div>
  );
};
