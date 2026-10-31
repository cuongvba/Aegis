import { Cpu, X, Sparkles, Layers } from 'lucide-react';

interface DocxCigRulesPanelProps {
  showCigRules: boolean;
  setShowCigRules: (val: boolean) => void;
}

export function DocxCigRulesPanel({ showCigRules, setShowCigRules }: DocxCigRulesPanelProps) {
  if (!showCigRules) return null;

  return (
    <div className="bg-slate-950/95 border border-purple-500/30 rounded-2xl p-4 shadow-xl shadow-black/40 space-y-3 animate-in fade-in duration-150 mb-2.5 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/20">
            <Cpu size={16} />
          </span>
          <div>
            <h4 className="text-xs font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
              Universal Cognitive Ingestion Engine (PISA v7.0)
              <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles size={11} />
                ⭐ R_GEN Master Active
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Kiến trúc nhận thức phân tầng File &rarr; EXAM &rarr; PART &rarr; SUB_PART &rarr; DIRECTIVE &rarr; QUESTION_STEM. Tự động tiền luận giải dạng câu hỏi qua chỉ thị làm bài.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCigRules(false)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Rules Grid & R_Gen Spotlight */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
        {/* R_Gen Master Card */}
        <div className="bg-gradient-to-br from-amber-950/30 via-slate-900/90 to-purple-950/30 border border-amber-500/40 p-2.5 rounded-xl space-y-1 shadow-sm sm:col-span-1">
          <div className="text-[10px] font-black text-amber-300 flex items-center gap-1 uppercase">
            ⭐ R_GEN Universal
          </div>
          <p className="text-[10px] text-slate-300 leading-snug">Quy tắc tổng thể nhận diện 8 dạng câu hỏi từ chỉ thị</p>
          <span className="text-[9px] bg-amber-500/20 text-amber-200 px-1.5 py-0.5 rounded border border-amber-500/40 font-mono font-bold block truncate">
            Priority 1 (PISA v7.0)
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl space-y-1">
          <div className="text-[10px] font-bold text-teal-400 flex items-center gap-1">
            📐 THCS KNTT/CTM
          </div>
          <p className="text-[10px] text-slate-400 leading-snug">Trắc nghiệm & Tự luận MathType WMF / SVG</p>
          <span className="text-[9px] bg-teal-950 text-teal-300 px-1.5 py-0.5 rounded border border-teal-800/60 font-mono block truncate">VN_THCS_INTEGRATED</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl space-y-1">
          <div className="text-[10px] font-bold text-indigo-400 flex items-center gap-1">
            🇬🇧 Tiếng Anh / SAT / IELTS
          </div>
          <p className="text-[10px] text-slate-400 leading-snug">Đề 4 kỹ năng, đọc hiểu, điền từ, matching</p>
          <span className="text-[9px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800/60 font-mono block truncate">GLOBAL_ENGLISH</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl space-y-1">
          <div className="text-[10px] font-bold text-purple-400 flex items-center gap-1">
            🎯 GDPT 2025 Đa Mệnh Đề
          </div>
          <p className="text-[10px] text-slate-400 leading-snug">Đúng/Sai 4 ý a,b,c,d & Trả lời ngắn điền số</p>
          <span className="text-[9px] bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800/60 font-mono block truncate">GDPT_2025_MATRIX</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl space-y-1">
          <div className="text-[10px] font-bold text-pink-400 flex items-center gap-1">
            🤖 AI Autopilot & 0-Code
          </div>
          <p className="text-[10px] text-slate-400 leading-snug">Học ngữ pháp đề dị biệt 0ms Hot-Reload</p>
          <span className="text-[9px] bg-pink-950 text-pink-300 px-1.5 py-0.5 rounded border border-pink-800/60 font-mono block truncate">Dynamic Grammar</span>
        </div>
      </div>
    </div>
  );
}
