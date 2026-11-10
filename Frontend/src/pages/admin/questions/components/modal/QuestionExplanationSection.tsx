import React from 'react';
import { MathRenderer } from '@/components/common/MathRenderer';
import { SmartRichMediaToolbar } from '@/components/common/SmartRichMediaToolbar';
import { handleSmartRichPaste, hasRichPreviewContent } from '@/shared/lib/quiz/smartClipboardMedia';

interface QuestionExplanationSectionProps {
  citation: string;
  setCitation: (v: string) => void;
  isEditing: boolean;
  notifySmartMedia: (msg: string) => void;
}

export const QuestionExplanationSection: React.FC<QuestionExplanationSectionProps> = ({
  citation,
  setCitation,
  isEditing,
  notifySmartMedia,
}) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
          Lời giải / Trích dẫn nguồn (Hỗ trợ Ctrl+V Ảnh / Công thức)
        </label>
        {isEditing && (
          <SmartRichMediaToolbar
            compact
            value={citation}
            onChange={setCitation}
            onNotify={notifySmartMedia}
          />
        )}
      </div>
      <textarea
        placeholder="Giải thích đáp án, dán ảnh lời giải chi tiết hoặc trích dẫn nguồn..."
        value={citation}
        onChange={e => setCitation(e.target.value)}
        onPaste={e => handleSmartRichPaste(e, citation, setCitation, notifySmartMedia)}
        rows={2}
        disabled={!isEditing}
        className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none h-14 disabled:opacity-75 disabled:cursor-not-allowed"
      />
      {hasRichPreviewContent(citation) && (
        <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300">
          <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block mb-1">
            Trực quan hóa Lời giải / Trích dẫn:
          </span>
          <MathRenderer content={citation} />
        </div>
      )}
    </div>
  );
};

