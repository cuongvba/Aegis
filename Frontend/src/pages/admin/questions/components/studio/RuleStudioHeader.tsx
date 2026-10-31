import React from 'react';
import { Cpu, RotateCw, RefreshCw, Sparkles } from 'lucide-react';

interface RuleStudioHeaderProps {
  loadingRules: boolean;
  onReloadEngine: () => Promise<void>;
  onResetAndReseed: () => Promise<void>;
}

export const RuleStudioHeader: React.FC<RuleStudioHeaderProps> = ({
  loadingRules,
  onReloadEngine,
  onResetAndReseed
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-950/40 via-purple-950/40 to-slate-900/60 border border-purple-500/30 rounded-3xl p-6 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-sans shadow-xl">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
          <Cpu size={28} className="animate-pulse" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-white">Universal Cognitive Ingestion Studio</h2>
            <span className="text-[10px] uppercase font-black tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              PISA v7.0 Engine · Global 🌍
            </span>
            <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles size={11} />
              ⭐ R_GEN Master Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Hạ tầng nhận thức phân tầng 5 cấp độ vạn năng. Tự động tiền luận giải dạng câu hỏi qua chỉ thị làm bài và học ngữ pháp đề thi 0-code qua AI Rule Autopilot.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onResetAndReseed}
          disabled={loadingRules}
          className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600/80 to-orange-600/80 hover:from-amber-500 hover:to-orange-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md shadow-amber-500/20 border border-amber-400/30 disabled:opacity-50"
          title="Xóa bỏ quy tắc cũ trong DB và thiết lập lại 14 bộ quy tắc chuẩn mới"
        >
          <RefreshCw size={13} className={loadingRules ? 'animate-spin' : ''} />
          Tái Thiết Lập Chuẩn (Reseed)
        </button>

        <button
          type="button"
          onClick={onReloadEngine}
          disabled={loadingRules}
          className="flex items-center gap-1.5 bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-700/60 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm disabled:opacity-50"
        >
          <RotateCw size={13} className={loadingRules ? 'animate-spin' : ''} />
          Hot-Reload (0ms)
        </button>
      </div>
    </div>
  );
};

