import React, { useState } from 'react';
import { BookOpen, FileText } from 'lucide-react';
import { MathRenderer } from '@/components/common/MathRenderer';
import { SmartRichMediaToolbar } from '@/components/common/SmartRichMediaToolbar';
import type { LearnerQuestion } from '@/types/quiz';

interface QuestionContextSectionProps {
  isEditing: boolean;
  editingId: string | null;
  activeQuestion?: LearnerQuestion;
  contexts?: any[];
  contextId?: string;
  contextTitle?: string;
  contextContent?: string;
  setContextId?: (v: string) => void;
  setContextTitle?: (v: string) => void;
  setContextContent?: (v: string) => void;
  isStickyContext?: boolean;
  setIsStickyContext?: (v: boolean) => void;
  stickyCount?: number;
  setStickyCount?: (v: React.SetStateAction<number>) => void;
  notifySmartMedia: (msg: string) => void;
}

export const QuestionContextSection: React.FC<QuestionContextSectionProps> = ({
  isEditing,
  editingId,
  activeQuestion,
  contexts = [],
  contextId = '',
  contextTitle = '',
  contextContent = '',
  setContextId,
  setContextTitle,
  setContextContent,
  isStickyContext = false,
  setIsStickyContext,
  stickyCount = 0,
  setStickyCount,
  notifySmartMedia,
}) => {
  const [contextMode, setContextMode] = useState<'new' | 'existing'>('new');

  if (isEditing && !editingId) {
    return (
      <div className="bg-slate-950/80 border border-indigo-500/40 rounded-2xl p-4 space-y-3 shadow-inner">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen size={14} className="text-indigo-400" /> Bài đọc hiểu / Ngữ cảnh dùng chung
          </span>
          {setIsStickyContext && (
            <label className="flex items-center gap-2 cursor-pointer select-none bg-indigo-950/60 hover:bg-indigo-900/60 px-2.5 py-1 rounded-xl border border-indigo-500/30 transition-colors">
              <input
                type="checkbox"
                checked={isStickyContext}
                onChange={e => setIsStickyContext(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-750 cursor-pointer"
              />
              <span className="text-[11px] font-bold text-amber-300">📌 Ghim cho các câu sau</span>
            </label>
          )}
        </div>

        {isStickyContext && stickyCount > 0 && (
          <div className="px-3 py-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-semibold flex items-center justify-between">
            <span>✨ Đang ở phiên ghim: Đã lưu {stickyCount} câu cho bài đọc này</span>
            <button
              type="button"
              onClick={() => {
                setIsStickyContext?.(false);
                setStickyCount?.(0);
                setContextId?.('');
                setContextTitle?.('');
                setContextContent?.('');
              }}
              className="text-[10px] text-amber-400 underline hover:text-white font-bold cursor-pointer"
            >
              Bỏ ghim &amp; Đổi bài đọc
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setContextMode('new')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              contextMode === 'new'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            + Viết bài đọc mới
          </button>
          {contexts.length > 0 && (
            <button
              type="button"
              onClick={() => setContextMode('existing')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                contextMode === 'existing'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Chọn từ ngân hàng ({contexts.length})
            </button>
          )}
        </div>

        {contextMode === 'existing' && contexts.length > 0 ? (
          <div className="space-y-2">
            <select
              value={contextId}
              onChange={e => {
                const sel = contexts.find(c => c.id === e.target.value);
                if (sel) {
                  setContextId?.(sel.id);
                  setContextTitle?.(sel.title);
                  setContextContent?.(sel.content);
                } else {
                  setContextId?.('');
                  setContextTitle?.('');
                  setContextContent?.('');
                }
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="">-- Chọn bài đọc hiểu dùng chung có sẵn --</option>
              {contexts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.questionCount || 0} câu liên kết)
                </option>
              ))}
            </select>
            {contextContent && (
              <div className="text-xs text-slate-300 max-h-32 overflow-y-auto p-2.5 bg-slate-950/80 rounded-xl border border-indigo-900/30 whitespace-pre-wrap leading-relaxed">
                {contextContent}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Tiêu đề bài đọc (ví dụ: Bài đọc hiểu Tiếng Anh - Passage 1)..."
              value={contextTitle}
              onChange={e => setContextTitle?.(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[10px] text-slate-400">
                Hỗ trợ Ctrl+V dán Ảnh / Bảng Word / Công thức hoặc chọn công cụ:
              </span>
              {setContextContent && (
                <SmartRichMediaToolbar
                  value={contextContent}
                  onChange={val => setContextContent(val)}
                  onNotify={notifySmartMedia}
                />
              )}
            </div>
            <textarea
              placeholder="Nhập nội dung đoạn văn, bảng dữ liệu tài chính hoặc bài đọc tiếng Anh..."
              value={contextContent}
              onChange={e => setContextContent?.(e.target.value)}
              rows={3}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none font-sans leading-relaxed"
            />
          </div>
        )}
      </div>
    );
  }

  if (activeQuestion?.contextTitle || activeQuestion?.contextContent) {
    return (
      <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
            <FileText size={14} /> {activeQuestion.contextTitle || 'Bài đọc liên kết'}
          </span>
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30 font-semibold">
            Ngữ cảnh / Dữ liệu dùng chung
          </span>
        </div>
        <div className="text-xs text-slate-300 max-h-44 overflow-y-auto leading-relaxed whitespace-pre-wrap bg-slate-950/60 p-3 rounded-xl border border-indigo-900/40 font-sans">
          <MathRenderer content={activeQuestion.contextContent || ''} />
        </div>
      </div>
    );
  }

  return null;
};

