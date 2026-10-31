import React from 'react';
import { BookOpen, Edit3, Trash2, Sparkles, Tag, ShieldAlert } from 'lucide-react';
import { QuestionParsingRule } from '@/services/parsing-rules.service';

interface RuleRegistryGridProps {
  rules: QuestionParsingRule[];
  onEditRule: (rule: QuestionParsingRule) => void;
  onDeleteRule: (ruleCode: string) => void;
}

export const RuleRegistryGrid: React.FC<RuleRegistryGridProps> = ({
  rules,
  onEditRule,
  onDeleteRule
}) => {
  const masterRule = rules.find(r => r.ruleCode === 'GENERAL_UNIVERSAL_INGESTION');
  const otherRules = rules.filter(r => r.ruleCode !== 'GENERAL_UNIVERSAL_INGESTION');

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <BookOpen size={20} className="text-purple-400" />
            Danh Mục Quy Tắc CIG 4 Chiều ({rules.length})
          </h3>
          <p className="text-xs text-slate-400">Các mẫu ngữ pháp nhận thức đã được nạp và JIT compile vào bộ nhớ RAM hệ thống.</p>
        </div>
      </div>

      {/* R_GEN MASTER RULE HERO CARD */}
      {masterRule && (
        <div className="bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-purple-950/40 border-2 border-amber-500/50 hover:border-amber-400/70 rounded-3xl p-6 backdrop-blur-xl shadow-2xl shadow-amber-500/10 transition-all space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="p-1 rounded-lg bg-amber-500/20 text-amber-300">
                  <Sparkles size={16} />
                </span>
                <h4 className="text-base font-black text-white tracking-wide">
                  {masterRule.ruleName}
                </h4>
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                  {masterRule.ruleCode}
                </span>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Độ Ưu Tiên: #{masterRule.priority} (Rule #1)
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                {masterRule.description}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEditRule(masterRule)}
                className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                <Edit3 size={13} />
                Biên Tập 4-Specs & Tiền Luận Giải
              </button>
            </div>
          </div>

          {/* Supported Question Types Badges */}
          <div className="pt-2 border-t border-amber-500/20 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300/90 uppercase tracking-wider">
              <Tag size={12} />
              8 Dạng Câu Hỏi Được Tự Động Luận Giải Qua Chỉ Thị:
            </div>
            <div className="flex flex-wrap gap-2">
              {['MULTI_TRUE_FALSE (Đúng/Sai)', 'SHORT_ANSWER (Điền số)', 'ORDERING (Sắp xếp)', 'MATCHING (Nối cặp)', 'MULTI (Nhiều lựa chọn)', 'FILL_BLANK (Điền khuyết)', 'ESSAY (Tự luận)', 'SINGLE (Trắc nghiệm đơn)'].map((label, idx) => (
                <span key={idx} className="text-[11px] bg-slate-950/80 border border-amber-500/30 text-slate-200 px-2.5 py-1 rounded-xl font-medium">
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Regex Previews */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px] font-mono bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
            <div>
              <span className="text-slate-500 text-[10px] block uppercase font-sans font-bold">Anchor Regex:</span>
              <span className="text-amber-300 truncate block">{masterRule.anchorSpec?.regexPattern}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block uppercase font-sans font-bold">Options Regex:</span>
              <span className="text-emerald-300 truncate block">{masterRule.interactionSpec?.optionRegexPattern}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block uppercase font-sans font-bold">Answer Regex:</span>
              <span className="text-teal-300 truncate block">{masterRule.evaluationSpec?.answerRegexPattern}</span>
            </div>
          </div>
        </div>
      )}

      {/* OTHER CANONICAL RULES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {otherRules.map((rule) => (
          <div
            key={rule.ruleCode}
            className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 backdrop-blur-xl transition-all space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-white leading-snug">{rule.ruleName}</h4>
                  <span className="text-[10px] font-mono text-slate-500">{rule.ruleCode}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    P: {rule.priority}
                  </span>
                  <button
                    onClick={() => onEditRule(rule)}
                    className="p-1 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Chỉnh sửa quy tắc 4-Specs"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => onDeleteRule(rule.ruleCode)}
                    className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Xóa quy tắc"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                {rule.description}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px] font-mono">
              <div className="text-slate-400 flex items-center justify-between">
                <span className="text-slate-500 text-[10px]">Anchor:</span>
                <span className="text-amber-400/90 truncate max-w-[170px]">{rule.anchorSpec?.regexPattern}</span>
              </div>
              <div className="text-slate-400 flex items-center justify-between">
                <span className="text-slate-500 text-[10px]">Options:</span>
                <span className="text-emerald-400/90 truncate max-w-[170px]">{rule.interactionSpec?.optionRegexPattern}</span>
              </div>
              <div className="text-slate-400 flex items-center justify-between">
                <span className="text-slate-500 text-[10px]">Answer:</span>
                <span className="text-teal-400/90 truncate max-w-[170px]">{rule.evaluationSpec?.answerRegexPattern}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

