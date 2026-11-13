import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { MathRenderer } from '@/components/common/MathRenderer';
import { SmartRichMediaToolbar } from '@/components/common/SmartRichMediaToolbar';
import { handleSmartRichPaste } from '@/shared/lib/quiz/smartClipboardMedia';
import { PaperQuestionItem } from './paper-editor.types';

interface PaperSectionPart3Props {
  questions: PaperQuestionItem[];
  onUpdateQuestion: (id: string, patch: Partial<PaperQuestionItem>) => void;
  onRemoveQuestion: (id: string) => void;
  onAddQuestion: () => void;
  isEditable?: boolean;
}

export const PaperSectionPart3: React.FC<PaperSectionPart3Props> = ({
  questions,
  onUpdateQuestion,
  onRemoveQuestion,
  onAddQuestion,
  isEditable = true,
}) => {
  return (
    <div className="space-y-4 mb-6 text-slate-900 font-serif">
      {/* Section Header: GDPT 2025 resets from Question 1 */}
      <div className="bg-slate-100 p-2.5 rounded-xl border-l-4 border-cyan-700">
        <h3 className="font-bold text-sm sm:text-base uppercase text-cyan-950">
          PHẦN III. Câu trắc nghiệm trả lời ngắn.
        </h3>
        <p className="text-xs text-slate-600 italic">
          Thí sinh trả lời từ câu 1 đến câu {questions.length || 1}. Thí sinh điền kết quả vào ô tương ứng.
        </p>
      </div>

      {/* Questions list */}
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q.id} className="p-3 sm:p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 shadow-sm transition space-y-2.5">
            {/* Question Header Row: Title & Rich Media Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-100">
              <span className="font-bold text-xs sm:text-sm text-cyan-900">
                Câu {idx + 1}:
              </span>
              <div className="flex items-center gap-1">
                {isEditable && (
                  <SmartRichMediaToolbar
                    value={q.content}
                    onChange={(v) => onUpdateQuestion(q.id, { content: v })}
                  />
                )}
                {isEditable && (
                  <button
                    type="button"
                    onClick={() => onRemoveQuestion(q.id)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                    title="Xóa câu hỏi này"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Question Content Input (with Ctrl+V support) */}
            {isEditable ? (
              <textarea
                value={q.content}
                onChange={(e) => onUpdateQuestion(q.id, { content: e.target.value })}
                onPaste={(e) => handleSmartRichPaste(e, q.content, (v) => onUpdateQuestion(q.id, { content: v }), () => {})}
                rows={2}
                className="w-full text-xs sm:text-sm text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:border-cyan-600 focus:outline-none font-sans"
                placeholder="Nhập nội dung bài toán (hỗ trợ Ctrl+V dán Ảnh, Công thức Toán, Bảng)..."
              />
            ) : null}

            {/* Math Preview */}
            <div className="text-xs sm:text-sm text-slate-800 bg-slate-50/70 p-2 rounded-xl border border-slate-100">
              <MathRenderer content={q.content} />
            </div>

            {/* Answer Field */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-cyan-50/70 border border-cyan-200 text-xs sm:text-sm font-sans">
              <div className="flex items-center gap-2">
                <span className="font-bold text-cyan-900">Đáp án chuẩn (Điền số / kết quả):</span>
                {isEditable ? (
                  <input
                    type="text"
                    value={q.shortAnswerText || ''}
                    onChange={(e) => onUpdateQuestion(q.id, { shortAnswerText: e.target.value })}
                    className="bg-white border border-cyan-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-cyan-950 focus:outline-none focus:border-cyan-600 w-36"
                    placeholder="Ví dụ: 28.5 hoặc -3"
                  />
                ) : (
                  <span className="font-mono font-bold text-cyan-950">{q.shortAnswerText || '______'}</span>
                )}
              </div>

              {isEditable && (
                <SmartRichMediaToolbar
                  compact
                  value={q.shortAnswerText || ''}
                  onChange={(v) => onUpdateQuestion(q.id, { shortAnswerText: v })}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {isEditable && (
        <button
          type="button"
          onClick={onAddQuestion}
          className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-cyan-600 text-slate-600 hover:text-cyan-600 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus size={14} />
          <span>+ Thêm câu trả lời ngắn Phần III</span>
        </button>
      )}
    </div>
  );
};
