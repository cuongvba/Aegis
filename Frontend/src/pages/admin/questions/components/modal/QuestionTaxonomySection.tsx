import React, { useState } from 'react';
import { Sparkles, FileText } from 'lucide-react';
import type { LearnerQuestion } from '@/types/quiz';

interface QuestionTaxonomySectionProps {
  domainCode?: string;
  setDomainCode?: (v: string) => void;
  targetLevel?: string;
  setTargetLevel?: (v: string) => void;
  assessmentPurpose?: string;
  setAssessmentPurpose?: (v: string) => void;
  issuingOrg?: string;
  setIssuingOrg?: (v: string) => void;
  benchmarkYear?: number;
  setBenchmarkYear?: (v: number | undefined) => void;
  tags?: string[];
  setTags?: (v: string[]) => void;
  activeQuestion?: LearnerQuestion;
  isEditing: boolean;
}

export const QuestionTaxonomySection: React.FC<QuestionTaxonomySectionProps> = ({
  domainCode = 'EDUCATION',
  setDomainCode,
  targetLevel = '',
  setTargetLevel,
  assessmentPurpose = '',
  setAssessmentPurpose,
  issuingOrg = '',
  setIssuingOrg,
  benchmarkYear = 2025,
  setBenchmarkYear,
  tags = [],
  setTags,
  activeQuestion,
  isEditing,
}) => {
  const [modalTagInput, setModalTagInput] = useState('');

  const addTag = () => {
    let clean = modalTagInput.trim();
    if (!clean) return;
    if (!clean.startsWith('#')) clean = `#${clean}`;
    if (tags && !tags.includes(clean)) {
      setTags?.([...tags, clean]);
    }
    setModalTagInput('');
  };

  return (
    <div className="space-y-3">
      {/* Xuất xứ đề thi gốc nếu có */}
      {(activeQuestion?.sourceExamName || activeQuestion?.sourceQuestionNo) && (
        <div className="p-2.5 bg-gradient-to-r from-blue-950/40 to-indigo-950/30 border border-blue-500/30 rounded-xl flex items-center justify-between text-xs">
          <span className="text-blue-300 font-bold flex items-center gap-1">
            <FileText size={12} /> {activeQuestion.sourceExamName || 'Đề thi gốc'}
          </span>
          {activeQuestion.sourceQuestionNo && (
            <span className="text-emerald-300 font-mono font-bold">
              Câu {activeQuestion.sourceQuestionNo}
            </span>
          )}
        </div>
      )}

      {/* Phân hệ đa ngành & Smart tags */}
      <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-2xl space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={12} className="text-amber-400" /> Phân Loại Đa Ngành &amp; Thẻ
          </label>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-semibold text-slate-400 uppercase">Miền ngành nghề</label>
          <select
            value={domainCode}
            onChange={e => setDomainCode?.(e.target.value)}
            disabled={!isEditing}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-75"
          >
            <option value="EDUCATION">🎓 Giáo dục &amp; Ngoại ngữ</option>
            <option value="BANKING">🏦 Ngân hàng &amp; Tài chính</option>
            <option value="HEALTHCARE">🏥 Y tế &amp; Dược phẩm</option>
            <option value="HSE">🛡️ An toàn lao động HSE</option>
            <option value="GOV_DRIVING">🚗 Sát hạch Giao thông</option>
            <option value="IT_SECURITY">💻 Công nghệ &amp; An ninh mạng</option>
            <option value="GENERAL">🌐 Chung / Đa lĩnh vực</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Khối/Cấp bậc (vd: Lớp 12)"
            value={targetLevel}
            onChange={e => setTargetLevel?.(e.target.value)}
            disabled={!isEditing}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-75"
          />
          <input
            type="text"
            placeholder="Kỳ thi (vd: Tốt nghiệp)"
            value={assessmentPurpose}
            onChange={e => setAssessmentPurpose?.(e.target.value)}
            disabled={!isEditing}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-75"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-semibold text-slate-400 uppercase">Thẻ #Hashtag</label>
          {isEditing && (
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Thêm #tag..."
                value={modalTagInput}
                onChange={e => setModalTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                +
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 min-h-[28px] p-2 bg-slate-950/60 rounded-xl border border-slate-850">
            {(!tags || tags.length === 0) ? (
              <span className="text-[10px] text-slate-600 italic">Chưa có hashtag</span>
            ) : (
              tags.map(t => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950/60 border border-indigo-700/50 text-indigo-300"
                >
                  {t}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => setTags?.(tags.filter(x => x !== t))}
                      className="hover:text-red-400 transition-colors cursor-pointer"
                    >
                      &times;
                    </button>
                  )}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

