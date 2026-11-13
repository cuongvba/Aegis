import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { MathRenderer } from '@/components/common/MathRenderer';
import { SmartRichMediaToolbar } from '@/components/common/SmartRichMediaToolbar';
import { handleSmartRichPaste } from '@/shared/lib/quiz/smartClipboardMedia';
import { PaperQuestionItem } from './paper-editor.types';

interface PaperSectionPart2Props {
  questions: PaperQuestionItem[];
  onUpdateQuestion: (id: string, patch: Partial<PaperQuestionItem>) => void;
  onRemoveQuestion: (id: string) => void;
  onAddQuestion: () => void;
  isEditable?: boolean;
}

export const PaperSectionPart2: React.FC<PaperSectionPart2Props> = ({
  questions,
  onUpdateQuestion,
  onRemoveQuestion,
  onAddQuestion,
  isEditable = true,
}) => {
  return (
    <div className="space-y-4 mb-6 text-slate-900 font-serif">
      {/* Section Header: GDPT 2025 resets from Question 1 */}
      <div className="bg-slate-100 p-2.5 rounded-xl border-l-4 border-amber-600">
        <h3 className="font-bold text-sm sm:text-base uppercase text-amber-950">
          PHẦN II. Câu trắc nghiệm đúng sai.
        </h3>
        <p className="text-xs text-slate-600 italic">
          Thí sinh trả lời từ câu 1 đến câu {questions.length || 1}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.
        </p>
      </div>

      {/* Questions list */}
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q.id} className="p-3 sm:p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 shadow-sm transition space-y-2.5">
            {/* Question Header Row: Title & Rich Media Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-100">
              <span className="font-bold text-xs sm:text-sm text-amber-900">
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
                className="w-full text-xs sm:text-sm text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:border-amber-600 focus:outline-none font-sans"
                placeholder="Nhập mệnh đề dẫn chung (hỗ trợ Ctrl+V dán Ảnh, Công thức Toán, Bảng)..."
              />
            ) : null}

            {/* Math Preview */}
            <div className="text-xs sm:text-sm text-slate-800 bg-slate-50/70 p-2 rounded-xl border border-slate-100">
              <MathRenderer content={q.content} />
            </div>

            {/* 4 Statements a, b, c, d */}
            <div className="space-y-2 text-xs sm:text-sm pt-1">
              {q.options.map((opt, oIdx) => (
                <div
                  key={opt.key}
                  className="flex flex-col gap-1 p-2 rounded-xl bg-slate-50/80 border border-slate-200"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="font-bold text-slate-800 shrink-0">{opt.key})</span>
                      {isEditable ? (
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => {
                            const newOptions = [...q.options];
                            newOptions[oIdx] = { ...opt, text: e.target.value };
                            onUpdateQuestion(q.id, { options: newOptions });
                          }}
                          onPaste={(e) => handleSmartRichPaste(e, opt.text, (v) => {
                            const newOptions = [...q.options];
                            newOptions[oIdx] = { ...opt, text: v };
                            onUpdateQuestion(q.id, { options: newOptions });
                          }, () => {})}
                          className="flex-1 bg-transparent border-b border-dashed border-slate-300 focus:border-amber-500 focus:outline-none text-xs sm:text-sm font-sans"
                          placeholder={`Mệnh đề ${opt.key} (hỗ trợ Ctrl+V)...`}
                        />
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isEditable && (
                        <SmartRichMediaToolbar
                          compact
                          value={opt.text}
                          onChange={(v) => {
                            const newOptions = [...q.options];
                            newOptions[oIdx] = { ...opt, text: v };
                            onUpdateQuestion(q.id, { options: newOptions });
                          }}
                        />
                      )}
                      <button
                        type="button"
                        disabled={!isEditable}
                        onClick={() => {
                          const newOptions = [...q.options];
                          newOptions[oIdx] = { ...opt, isCorrect: true };
                          onUpdateQuestion(q.id, { options: newOptions });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          opt.isCorrect ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        Đúng
                      </button>
                      <button
                        type="button"
                        disabled={!isEditable}
                        onClick={() => {
                          const newOptions = [...q.options];
                          newOptions[oIdx] = { ...opt, isCorrect: false };
                          onUpdateQuestion(q.id, { options: newOptions });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          !opt.isCorrect ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        Sai
                      </button>
                    </div>
                  </div>

                  <div className="pl-6 text-xs text-slate-700">
                    <MathRenderer content={opt.text} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isEditable && (
        <button
          type="button"
          onClick={onAddQuestion}
          className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-amber-600 text-slate-600 hover:text-amber-600 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus size={14} />
          <span>+ Thêm câu Đúng/Sai Phần II</span>
        </button>
      )}
    </div>
  );
};
