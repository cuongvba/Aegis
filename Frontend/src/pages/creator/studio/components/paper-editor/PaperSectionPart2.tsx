import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { MathRenderer } from '@/components/common/MathRenderer';
import { PaperQuestionItem } from './paper-editor.types';

interface PaperSectionPart2Props {
  questions: PaperQuestionItem[];
  startIndex: number;
  onUpdateQuestion: (id: string, patch: Partial<PaperQuestionItem>) => void;
  onRemoveQuestion: (id: string) => void;
  onAddQuestion: () => void;
  isEditable?: boolean;
}

export const PaperSectionPart2: React.FC<PaperSectionPart2Props> = ({
  questions,
  startIndex,
  onUpdateQuestion,
  onRemoveQuestion,
  onAddQuestion,
  isEditable = true,
}) => {
  return (
    <div className="space-y-4 mb-6 text-slate-900 font-serif">
      {/* Section Header */}
      <div className="bg-slate-100 p-2.5 rounded-lg border-l-4 border-amber-600">
        <h3 className="font-bold text-sm sm:text-base uppercase text-amber-950">
          PHẦN II. Câu trắc nghiệm đúng sai.
        </h3>
        <p className="text-xs text-slate-600 italic">
          Thí sinh trả lời từ câu {startIndex} đến câu {startIndex + questions.length - 1}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.
        </p>
      </div>

      {/* Questions list */}
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q.id} className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-400 transition">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="font-bold text-xs sm:text-sm text-amber-900 shrink-0">
                Câu {startIndex + idx}:
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
                className="w-full text-xs sm:text-sm text-slate-900 p-2 rounded-lg border border-slate-200 focus:border-amber-600 focus:outline-none mb-2 font-sans"
                placeholder="Nhập mệnh đề dẫn chung cho 4 ý a, b, c, d..."
              />
            ) : null}

            <div className="text-xs sm:text-sm mb-3">
              <MathRenderer content={q.content} />
            </div>

            {/* 4 Statements a, b, c, d */}
            <div className="space-y-2 text-xs sm:text-sm">
              {q.options.map((opt, oIdx) => (
                <div
                  key={opt.key}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
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
                        className="flex-1 bg-transparent border-b border-transparent focus:border-amber-500 focus:outline-none text-xs sm:text-sm font-sans"
                        placeholder={`Mệnh đề ${opt.key}...`}
                      />
                    ) : null}
                    <div className="flex-1">
                      <MathRenderer content={opt.text} />
                    </div>
                  </div>

                  {/* True / False Toggle */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={!isEditable}
                      onClick={() => {
                        const newOptions = [...q.options];
                        newOptions[oIdx] = { ...opt, isCorrect: true };
                        onUpdateQuestion(q.id, { options: newOptions });
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                        opt.isCorrect
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
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
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                        !opt.isCorrect
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      Sai
                    </button>
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
          className="w-full py-2 border-2 border-dashed border-slate-300 hover:border-amber-600 text-slate-600 hover:text-amber-600 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus size={14} />
          <span>+ Thêm câu Đúng/Sai Phần II</span>
        </button>
      )}
    </div>
  );
};
