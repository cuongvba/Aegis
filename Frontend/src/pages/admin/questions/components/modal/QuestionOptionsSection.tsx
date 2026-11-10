import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { QuestionType } from '@/types/quiz';
import { LETTERS, isOptionSelectedAsCorrect } from '../../types';
import { MathRenderer } from '@/components/common/MathRenderer';
import { SmartRichMediaToolbar } from '@/components/common/SmartRichMediaToolbar';
import { handleSmartRichPaste, hasRichPreviewContent } from '@/shared/lib/quiz/smartClipboardMedia';
import { parseMultiTfAnswer, serializeMultiTfAnswer } from '@/shared/lib/quiz/normalizers';

interface QuestionOptionsSectionProps {
  questionType: QuestionType;
  options: string[];
  setOptions: (v: string[]) => void;
  correctAnswer: string;
  setCorrectAnswer: (v: string) => void;
  isEditing: boolean;
  notifySmartMedia: (msg: string) => void;
}

export const QuestionOptionsSection: React.FC<QuestionOptionsSectionProps> = ({
  questionType,
  options,
  setOptions,
  correctAnswer,
  setCorrectAnswer,
  isEditing,
  notifySmartMedia,
}) => {
  const hasOptions =
    questionType === 'SINGLE' ||
    questionType === 'MULTI' ||
    questionType === 'ORDERING' ||
    questionType === 'MATCHING' ||
    questionType === 'MULTI_TRUE_FALSE';

  if (!hasOptions) {
    return (
      <div className="p-6 border border-dashed border-slate-850 rounded-2xl bg-slate-950/20 text-slate-500 text-center min-h-[160px] flex flex-col items-center justify-center">
        <p className="text-xs font-semibold">Loại câu hỏi này không yêu cầu phương án lựa chọn.</p>
        <p className="text-[10px] text-slate-600 mt-1">
          Đáp án đúng sẽ được điền trực tiếp vào ô tương ứng ở cột bên phải.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
          Các phương án lựa chọn
        </label>
        {questionType === 'MATCHING' && (
          <p className="text-[9px] text-cyan-400 font-bold mt-0.5">
            Định dạng nối cặp: Vế trái =&gt; Vế phải
          </p>
        )}
        {questionType === 'ORDERING' && (
          <p className="text-[9px] text-cyan-400 font-bold mt-0.5">
            Nhập các phần tử cần sắp xếp thứ tự.
          </p>
        )}
      </div>

      <div className="space-y-2">
        {options.map((opt, idx) => {
          const isMultiTf = questionType === 'MULTI_TRUE_FALSE';
          const tfKey = String.fromCharCode('a'.charCodeAt(0) + idx);
          const tfMap = isMultiTf ? parseMultiTfAnswer(correctAnswer) : {};
          const tfVal = tfMap[tfKey];
          const isCorrect = isMultiTf
            ? tfVal === true
            : isOptionSelectedAsCorrect(opt, idx, correctAnswer, questionType, options);

          return (
            <div
              key={idx}
              className={`flex items-start gap-2 p-2 rounded-2xl border transition-all ${
                isMultiTf
                  ? tfVal === true
                    ? 'bg-emerald-950/20 border-emerald-500/50 shadow-sm ring-1 ring-emerald-500/20'
                    : tfVal === false
                    ? 'bg-rose-950/20 border-rose-500/50 shadow-sm ring-1 ring-rose-500/20'
                    : 'border-transparent bg-slate-900/30'
                  : isCorrect
                  ? 'bg-emerald-950/20 border-emerald-500/50 shadow-sm ring-1 ring-emerald-500/20'
                  : 'border-transparent'
              }`}
            >
              <div className="flex flex-col items-center gap-1 shrink-0 mt-1">
                {isMultiTf ? (
                  <span
                    className={`w-12 text-center text-[11px] font-black py-1.5 rounded-xl border select-none transition-colors ${
                      tfVal === true
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow-sm'
                        : tfVal === false
                        ? 'bg-rose-500 text-slate-950 border-rose-400 font-extrabold shadow-sm'
                        : 'bg-purple-950/80 border-purple-800 text-purple-300 font-mono'
                    }`}
                  >
                    {tfKey})
                  </span>
                ) : (
                  <span
                    className={`w-12 text-center text-[10px] font-black py-2 rounded-xl border select-none transition-colors ${
                      isCorrect
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {LETTERS[idx] ?? String(idx + 1)} ({idx + 1})
                  </span>
                )}

                {isMultiTf ? (
                  <div className="flex flex-col gap-1 w-12">
                    <button
                      type="button"
                      disabled={!isEditing}
                      onClick={() => {
                        const next = { ...tfMap, [tfKey]: true };
                        setCorrectAnswer(serializeMultiTfAnswer(next));
                      }}
                      className={`text-[9px] py-0.5 rounded font-black border transition-all cursor-pointer ${
                        tfVal === true
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Đúng
                    </button>
                    <button
                      type="button"
                      disabled={!isEditing}
                      onClick={() => {
                        const next = { ...tfMap, [tfKey]: false };
                        setCorrectAnswer(serializeMultiTfAnswer(next));
                      }}
                      className={`text-[9px] py-0.5 rounded font-black border transition-all cursor-pointer ${
                        tfVal === false
                          ? 'bg-rose-500 text-slate-950 border-rose-400 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Sai
                    </button>
                  </div>
                ) : (
                  (questionType === 'SINGLE' || questionType === 'MULTI') && (
                    <label
                      className={`flex items-center gap-1 cursor-pointer px-2 py-0.5 rounded-lg border transition-all select-none ${
                        isCorrect
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-sm shadow-emerald-500/20'
                          : 'bg-slate-950/40 border-slate-850 text-slate-500 hover:border-slate-800'
                      } ${!isEditing ? 'pointer-events-none' : ''}`}
                    >
                      <input
                        type={questionType === 'SINGLE' ? 'radio' : 'checkbox'}
                        name="correct-answer-toggle"
                        checked={isCorrect}
                        disabled={!isEditing}
                        onChange={() => {
                          if (questionType === 'SINGLE') {
                            setCorrectAnswer(String(idx + 1));
                          } else {
                            const current = (correctAnswer || '')
                              .split(/[;,]+/)
                              .map(x => x.trim())
                              .filter(Boolean);
                            const val = String(idx + 1);
                            const next = current.includes(val)
                              ? current.filter(x => x !== val)
                              : [...current, val];
                            setCorrectAnswer(next.sort((a, b) => Number(a) - Number(b)).join(','));
                          }
                        }}
                        className="w-3.5 h-3.5 text-emerald-600 bg-slate-950 border-slate-800 rounded focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                      />
                      <span
                        className={`text-[9px] ${
                          isCorrect ? 'text-emerald-300 font-extrabold' : 'text-slate-400'
                        }`}
                      >
                        Đúng
                      </span>
                    </label>
                  )
                )}
              </div>

              <div className="flex-1 flex flex-col gap-1">
                {isEditing && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      Hỗ trợ Ctrl+V Ảnh / Công thức / Audio cho phương án:
                    </span>
                    <SmartRichMediaToolbar
                      compact
                      value={opt}
                      onChange={nextOpt => {
                        const next = [...options];
                        next[idx] = nextOpt;
                        setOptions(next);
                      }}
                      onNotify={notifySmartMedia}
                    />
                  </div>
                )}
                <textarea
                  placeholder={
                    questionType === 'MATCHING'
                      ? `Cặp ${idx + 1} (Ví dụ: Chó => Sủa)`
                      : `Phương án ${LETTERS[idx] ?? String(idx + 1)} (có thể gõ chữ, Ctrl+V dán ảnh hoặc bấm nút Ảnh/Thu âm)`
                  }
                  value={opt}
                  onChange={e => {
                    const next = [...options];
                    next[idx] = e.target.value;
                    setOptions(next);
                  }}
                  onPaste={e => {
                    handleSmartRichPaste(
                      e,
                      opt,
                      nextOpt => {
                        const next = [...options];
                        next[idx] = nextOpt;
                        setOptions(next);
                      },
                      notifySmartMedia
                    );
                  }}
                  disabled={!isEditing}
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none resize-none h-14 disabled:opacity-90 disabled:cursor-not-allowed transition-colors ${
                    isCorrect
                      ? 'bg-emerald-950/30 border-emerald-500/60 focus:border-emerald-400'
                      : 'bg-slate-950/60 border-slate-800 focus:border-blue-500'
                  }`}
                />
                {hasRichPreviewContent(opt) && (
                  <div className="p-2 bg-slate-950/90 border border-slate-850 rounded-xl text-xs text-slate-300">
                    <MathRenderer content={opt} />
                  </div>
                )}
              </div>

              {isEditing && options.length > 2 && (
                <button
                  type="button"
                  onClick={() => {
                    const next = options.filter((_, i) => i !== idx);
                    setOptions(next);
                    if (questionType === 'SINGLE' || questionType === 'MULTI') {
                      const current = correctAnswer
                        .split(/[;,]+/)
                        .map(x => x.trim())
                        .filter(Boolean);
                      const adjusted = current
                        .map(val => {
                          const num = Number(val);
                          if (num === idx + 1) return null;
                          if (num > idx + 1) return String(num - 1);
                          return val;
                        })
                        .filter((x): x is string => x !== null);
                      setCorrectAnswer(adjusted.join(','));
                    }
                  }}
                  className="p-2.5 bg-red-950/40 hover:bg-red-900/40 text-red-400 rounded-xl border border-red-900/20 transition-colors mt-1.5 cursor-pointer active:scale-95"
                  title="Xóa phương án này"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          );
        })}

        {isEditing && (
          <button
            type="button"
            onClick={() => setOptions([...options, ''])}
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-bold px-3.5 py-2 rounded-xl border border-dashed border-blue-900/60 bg-blue-950/15 hover:bg-blue-950/30 transition-all active:scale-95 cursor-pointer ml-14 w-fit"
          >
            <Plus size={12} /> Thêm phương án {LETTERS[options.length] ?? String(options.length + 1)} (
            {options.length + 1})
          </button>
        )}
      </div>
    </div>
  );
};

