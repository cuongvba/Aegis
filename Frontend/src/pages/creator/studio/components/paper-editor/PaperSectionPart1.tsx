import React from 'react';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { MathRenderer } from '@/components/common/MathRenderer';
import { PaperQuestionItem } from './paper-editor.types';

interface PaperSectionPart1Props {
  questions: PaperQuestionItem[];
  onUpdateQuestion: (id: string, patch: Partial<PaperQuestionItem>) => void;
  onRemoveQuestion: (id: string) => void;
  onAddQuestion: () => void;
  isEditable?: boolean;
}

export const PaperSectionPart1: React.FC<PaperSectionPart1Props> = ({
  questions,
  onUpdateQuestion,
  onRemoveQuestion,
  onAddQuestion,
  isEditable = true,
}) => {
  return (
    <div className="space-y-4 mb-6 text-slate-900 font-serif">
      {/* Section Header */}
      <div className="bg-slate-100 p-2.5 rounded-lg border-l-4 border-indigo-700">
        <h3 className="font-bold text-sm sm:text-base uppercase text-indigo-950">
          PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn.
        </h3>
        <p className="text-xs text-slate-600 italic">
          Thí sinh trả lời từ câu 1 đến câu {questions.length}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.
        </p>
      </div>

      {/* Questions list */}
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q.id} className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-400 transition">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="font-bold text-xs sm:text-sm text-indigo-900 shrink-0">
                Câu {idx + 1}:
              </span>
              {isEditable && (
                <button
                  type="button"
                  onClick={() => onRemoveQuestion(q.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 transition"
                  title="Xóa câu hỏi này"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {/* Question Content */}
            {isEditable ? (
              <textarea
                value={q.content}
                onChange={(e) => onUpdateQuestion(q.id, { content: e.target.value })}
                rows={2}
                className="w-full text-xs sm:text-sm text-slate-900 p-2 rounded-lg border border-slate-200 focus:border-indigo-600 focus:outline-none mb-2 font-sans"
                placeholder="Nhập nội dung câu hỏi (hỗ trợ công thức $x^2 + 1$)..."
              />
            ) : null}

            <div className="text-xs sm:text-sm mb-3">
              <MathRenderer content={q.content} />
            </div>

            {/* 4 Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
              {q.options.map((opt, oIdx) => (
                <div
                  key={opt.key}
                  className={`flex items-center gap-2 p-1.5 rounded-lg border transition ${
                    opt.isCorrect ? 'bg-emerald-50 border-emerald-400' : 'bg-slate-50/60 border-slate-200'
                  }`}
                >
                  {isEditable ? (
                    <button
                      type="button"
                      onClick={() => {
                        const newOptions = q.options.map((o, i) => ({
                          ...o,
                          isCorrect: i === oIdx,
                        }));
                        onUpdateQuestion(q.id, { options: newOptions });
                      }}
                      className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 cursor-pointer transition ${
                        opt.isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                      title={opt.isCorrect ? 'Đáp án đúng' : 'Bấm để chọn làm đáp án đúng'}
                    >
                      {opt.key}
                    </button>
                  ) : (
                    <span className="font-bold text-slate-700">{opt.key}.</span>
                  )}

                  {isEditable ? (
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => {
                        const newOptions = [...q.options];
                        newOptions[oIdx] = { ...opt, text: e.target.value };
                        onUpdateQuestion(q.id, { options: newOptions });
                      }}
                      className="flex-1 bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none text-xs sm:text-sm font-sans"
                      placeholder={`Phương án ${opt.key}...`}
                    />
                  ) : null}

                  <div className="flex-1">
                    <MathRenderer content={opt.text} />
                  </div>

                  {opt.isCorrect && <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />}
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
          className="w-full py-2 border-2 border-dashed border-slate-300 hover:border-indigo-600 text-slate-600 hover:text-indigo-600 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus size={14} />
          <span>+ Thêm câu trắc nghiệm Phần I</span>
        </button>
      )}
    </div>
  );
};
