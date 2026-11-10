import React from 'react';
import { MathRenderer } from '@/components/common/MathRenderer';
import { SmartRichMediaToolbar } from '@/components/common/SmartRichMediaToolbar';
import { handleSmartRichPaste, hasRichPreviewContent } from '@/shared/lib/quiz/smartClipboardMedia';

interface QuestionContentSectionProps {
  content: string;
  setContent: (v: string) => void;
  isEditing: boolean;
  pasteNotice: string | null;
  notifySmartMedia: (msg: string) => void;
}

export const QuestionContentSection: React.FC<QuestionContentSectionProps> = ({
  content,
  setContent,
  isEditing,
  pasteNotice,
  notifySmartMedia,
}) => {
  return (
    <div className="space-y-2">
      {pasteNotice && (
        <div className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-between animate-fade-in">
          <span>✨ {pasteNotice}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Nội dung câu hỏi (Hỗ trợ Ctrl+V Ảnh / Bảng Word / Công thức / Audio / Video)
          </label>
          {isEditing && (
            <SmartRichMediaToolbar
              value={content}
              onChange={setContent}
              onNotify={notifySmartMedia}
            />
          )}
        </div>
        <textarea
          required
          placeholder="Nhập câu hỏi hoặc bấm Ctrl+V để dán trực tiếp Hình ảnh chụp màn hình, Bảng biểu/Công thức từ file Word, hoặc bấm nút Thu âm giọng cô / Video ở trên..."
          value={content}
          onChange={e => setContent(e.target.value)}
          onPaste={e => handleSmartRichPaste(e, content, setContent, notifySmartMedia)}
          disabled={!isEditing}
          className="w-full h-24 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-none disabled:opacity-75 disabled:cursor-not-allowed"
        />
        {hasRichPreviewContent(content) && (
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-1">
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
              Trực quan hóa Nội dung (Ảnh / Audio / Video / Bảng / KaTeX):
            </span>
            <MathRenderer content={content} />
          </div>
        )}
      </div>
    </div>
  );
};

