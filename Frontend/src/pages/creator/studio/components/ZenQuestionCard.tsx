import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  CheckCircle2, 
  HelpCircle, 
  Pencil, 
  KeyRound, 
  PenLine, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  FileText 
} from 'lucide-react';
import { MathRenderer } from '@/components/common/MathRenderer';
import { ZenQuestionPatch, ZenQuestionPreview } from '../types/zen-studio.types';
import { isChoiceAnswerForm, resolveCorrectIndexes } from '../utils/zen-answer';
import { ZenQuestionEditor } from './ZenQuestionEditor';

interface ZenQuestionCardProps {
  question: ZenQuestionPreview;
  onUpdate: (order: number, patch: ZenQuestionPatch) => void;
}

/**
 * Lọc nội dung ngữ cảnh liên kết: loại bỏ chỉ thị lặp lại nếu tiêu đề đã chứa toàn bộ chỉ thị
 */
const getCleanedContextContent = (title?: string, content?: string): string => {
  if (!content) return '';
  if (!title) return content.trim();

  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[■•\-\*]/g, '')
      .replace(/\[\s*ngữ cảnh\s*#?\d*\s*\]/gi, '')
      .replace(/\(từ câu \d+.*?\)/gi, '')
      .replace(/[^\p{L}\p{N}]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const cNorm = norm(content);
  const tNorm = norm(title);

  if (!cNorm || cNorm === tNorm || tNorm.includes(cNorm) || cNorm.includes(tNorm)) {
    return '';
  }
  if (tNorm.length > 15 && cNorm.startsWith(tNorm)) {
    return content.slice(title.length).trim().replace(/^[:\-\s]+/, '').trim();
  }
  return content.trim();
};

export const ZenQuestionCard: React.FC<ZenQuestionCardProps> = ({ question: q, onUpdate }) => {
  const { t } = useTranslation('creator');
  const [editing, setEditing] = useState(false);
  const [isContextCollapsed, setIsContextCollapsed] = useState(false);

  const options = q.options ?? [];
  const correct = resolveCorrectIndexes(q.correctAnswer, options.length);
  const showRawAnswer = !!q.correctAnswer && !isChoiceAnswerForm(q.correctAnswer, options.length);

  const cleanedContext = getCleanedContextContent(q.contextTitle, q.contextContent);
  const titleText = (q.contextTitle || '').trim();
  const hasContext = Boolean(titleText || cleanedContext);

  // Tọa độ toàn cục 5D Spatial SSoT dạng e_p_s_d_q (VD: 1127_0_0_1_6)
  const fullCoord = q.fullQuestionIndex || (q.hierarchyIndex && q.hierarchyIndex !== '0_0_0_0' ? `${q.hierarchyIndex}_${q.sourceQuestionNo || q.order}` : (q.sourceQuestionNo ? `0_0_0_0_${q.sourceQuestionNo}` : ''));

  return (
    <article
      className={`p-5 rounded-2xl border transition-all ${
        editing
          ? 'bg-slate-900 border-amber-400/50 shadow-lg shadow-amber-500/10'
          : 'bg-slate-900/80 border-indigo-500/30'
      }`}
    >
      <header className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800/60">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-extrabold text-sm text-slate-200">{t('preview.questionNum', { num: q.order })}</span>
          {fullCoord && fullCoord !== '0_0_0_0_0' && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-slate-950 text-cyan-400 border border-slate-800" title={`Tọa độ toàn cục 5D (e_p_s_d_q): ${fullCoord}`}>
              {fullCoord}
            </span>
          )}
          {q.edited && (
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {t('editor.editedBadge')}
            </span>
          )}
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-slate-800/90 hover:bg-amber-500/20 hover:text-amber-200 text-slate-300 border border-slate-700/80 transition-colors cursor-pointer"
          >
            <Pencil className="w-3 h-3" />
            <span>{t('editor.edit')}</span>
          </button>
        )}
      </header>

      {editing ? (
        <ZenQuestionEditor
          question={q}
          onCancel={() => setEditing(false)}
          onSave={(patch) => {
            onUpdate(q.order, patch);
            setEditing(false);
          }}
        />
      ) : (
        <>
          {/* ─── SHARED CONTEXT / READING PASSAGE / STIMULUS (NGỮ CẢNH DÙNG CHUNG) ─── */}
          {hasContext && (
            <div className="mb-4 overflow-hidden rounded-2xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 p-4 shadow-md transition-all">
              <div className="flex items-center justify-between gap-2 border-b border-indigo-900/60 pb-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
                    <BookOpen className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 truncate">
                      {titleText || 'Bài Đọc Hiểu / Tình Huống Dùng Chung'}
                    </h4>
                    <span className="text-[10px] text-indigo-400/80">
                      Ngữ cảnh liên kết chuỗi câu hỏi
                    </span>
                  </div>
                </div>

                {cleanedContext && (
                  <button
                    type="button"
                    onClick={() => setIsContextCollapsed((prev) => !prev)}
                    className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-950/80 px-2.5 py-1 text-[11px] font-bold text-indigo-300 hover:bg-indigo-900/60 transition cursor-pointer"
                  >
                    {isContextCollapsed ? (
                      <>
                        <span>Mở rộng</span>
                        <ChevronDown className="h-3 w-3" />
                      </>
                    ) : (
                      <>
                        <span>Thu gọn</span>
                        <ChevronUp className="h-3 w-3" />
                      </>
                    )}
                  </button>
                )}
              </div>

              {!isContextCollapsed && cleanedContext && (
                <div className="max-h-64 overflow-y-auto pr-1 text-xs md:text-sm leading-relaxed text-slate-200 font-sans bg-slate-950/70 p-3 rounded-xl border border-indigo-900/40">
                  <MathRenderer content={cleanedContext} />
                </div>
              )}
            </div>
          )}

          {/* Nội Dung Câu Hỏi */}
          <div className="text-sm md:text-base text-slate-100 leading-relaxed mb-4 text-left">
            <MathRenderer content={q.content} />
          </div>

          {/* Các ý phụ SubItems (Dạng Đúng/Sai hoặc chùm ý) */}
          {q.subItems && q.subItems.length > 0 && (
            <div className="mb-4 space-y-2 p-3 rounded-xl bg-slate-950/50 border border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Các mệnh đề kiểm tra:</span>
              <div className="grid grid-cols-1 gap-2">
                {q.subItems.map((sub: any, sIdx: number) => (
                  <div key={sIdx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-start gap-2">
                    <span className="font-bold text-amber-400 shrink-0">{sub.key || String.fromCharCode(97 + sIdx)})</span>
                    <div className="flex-1 text-slate-200">
                      <MathRenderer content={sub.content || sub.statement} inline />
                    </div>
                    {sub.expectedAnswer && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        sub.expectedAnswer === 'Đúng' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {sub.expectedAnswer}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Các phương án A, B, C, D (Chỉ hiển thị cho câu trắc nghiệm đơn/nhiều lựa chọn, không lặp lại cho câu có subItems Đúng/Sai) */}
          {options.length > 0 && (!q.subItems || q.subItems.length === 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-3 text-left">
              {options.map((opt, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl text-xs md:text-sm border flex items-start gap-2 ${
                    correct.includes(i)
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200 font-medium'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-300'
                  }`}
                >
                  <span className="font-bold text-slate-400 shrink-0">{String.fromCharCode(65 + i)}.</span>
                  <div className="flex-1">
                    <MathRenderer content={opt} inline />
                  </div>
                  {correct.includes(i) && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                </div>
              ))}
            </div>
          )}

          {(correct.length > 0 || showRawAnswer) && (!q.subItems || q.subItems.length === 0) && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-200 mb-2">
              <KeyRound className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <strong className="mr-1.5">{t('preview.correctAnswer')}</strong>
                {showRawAnswer ? q.correctAnswer : correct.map((i) => String.fromCharCode(65 + i)).join(', ')}
              </div>
            </div>
          )}

          {q.explanation ? (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs md:text-sm text-slate-300 text-left">
              <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="text-slate-200 mr-1">{t('preview.explanation')}</strong>
                <MathRenderer content={q.explanation} />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-300 cursor-pointer"
            >
              <PenLine className="w-3.5 h-3.5" />
              {t('editor.addExplanation')}
            </button>
          )}
        </>
      )}
    </article>
  );
};
