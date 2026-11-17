import { Zap } from 'lucide-react';
import { useMemo } from 'react';
import type { QuestionWidgetProps } from './types';

export default function ShortAnswerWidget({
  question,
  answer,
  onUpdate,
  disabled,
  t
}: QuestionWidgetProps) {
  const currentText = answer?.shortText ?? '';

  // Nhận diện dạng điền chữ cái khuyết / điền từ siêu tốc kiểu Olympiad (e.g. b _ _ k, ____)
  const isSpeedFill = useMemo(() => {
    if (question.questionType === 'FILL_BLANK') return true;
    return /(?:_{2,}|(?:\b[a-zA-Z]\s+_[\s_a-zA-Z]*))/.test(question.content || '');
  }, [question.questionType, question.content]);

  const missingLetterHints = useMemo(() => {
    const matches = (question.content || '').match(/\b[a-zA-Z_]{2,}(?:\s+_[a-zA-Z_]*)*\b/g) || [];
    return matches.filter((m) => m.includes('_')).slice(0, 3);
  }, [question.content]);

  if (isSpeedFill) {
    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-teal-700">
          <span className="inline-flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            Điền từ / Chữ cái tốc độ cao
          </span>
          {missingLetterHints.length > 0 && (
            <span className="font-mono text-[11px] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-lg text-teal-800">
              Gợi ý: {missingLetterHints.join(' · ')}
            </span>
          )}
        </div>
        <div className="relative">
          <input
            type="text"
            autoFocus
            autoComplete="off"
            spellCheck={false}
            disabled={disabled}
            value={currentText}
            onChange={(event) => onUpdate({ shortText: event.target.value })}
            placeholder={t('typeAnswer') || 'Gõ nhanh từ / chữ cái còn thiếu...'}
            className="w-full rounded-2xl border-2 border-teal-300 bg-white px-4 py-3.5 pr-20 font-bold text-lg tracking-wide text-slate-900 outline-none ring-teal-200 transition focus:border-teal-500 focus:ring-4 disabled:opacity-60 placeholder:text-slate-400 placeholder:font-normal placeholder:text-sm"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
            {currentText.length} ký tự
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          disabled={disabled}
          value={currentText}
          onChange={(event) => onUpdate({ shortText: event.target.value })}
          placeholder={t('typeAnswer') || 'Nhập đáp án của bạn (ví dụ: từ vựng, con số)...'}
          className="h-28 w-full rounded-2xl border-2 border-slate-200 bg-white p-4 font-semibold text-base text-slate-800 outline-none ring-teal-200 transition focus:border-teal-500 focus:ring-4 disabled:opacity-60 placeholder:text-slate-400 placeholder:font-normal"
        />
        <div className="absolute bottom-3 right-3 text-xs font-bold text-slate-400">
          {currentText.length} ký tự
        </div>
      </div>
    </div>
  );
}
