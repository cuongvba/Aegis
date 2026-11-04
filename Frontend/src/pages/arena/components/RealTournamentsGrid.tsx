import React from 'react';
import { Play, Sparkles, Trophy, Plus, CheckCircle2, Flame } from 'lucide-react';
import { type ArenaGameCode } from '@/types/arena';

interface RealTournamentsGridProps {
  tournaments: any[];
  onJoinTournament: (tour: any, gameCode?: string) => void;
  isCreating: boolean;
  onOpenCustomModal: () => void;
}

export const RealTournamentsGrid: React.FC<RealTournamentsGridProps> = ({
  tournaments,
  onJoinTournament,
  isCreating,
  onOpenCustomModal,
}) => {
  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-2">
            <Flame className="w-3.5 h-3.5 fill-current animate-pulse text-amber-400" />
            <span>DỮ LIỆU CÂU HỎI THẬT 100% TỪ DATABASE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Giải Đấu Trực Tiếp Đang Khởi Tranh
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Bấm tham gia để thi đấu thời gian thực với ngân hàng câu hỏi chuẩn quốc gia
          </p>
        </div>

        <button
          onClick={onOpenCustomModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>TẠO GIẢI ĐẤU RIÊNG (ĐỀ THẬT)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((tour) => (
          <div
            key={tour.id}
            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-slate-800 bg-slate-900/90 p-6 transition-all duration-300 hover:border-amber-500/50 hover:bg-slate-900 hover:shadow-2xl hover:-translate-y-1"
          >
            {/* Top ambient color strip */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${tour.accentGradient || 'from-amber-500 to-orange-500'}`} />

            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-3xl shadow-inner group-hover:scale-110 transition-transform">
                  {tour.icon}
                </span>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-300">
                  {tour.badge}
                </span>
              </div>

              <h3 className="mt-4 text-xl font-black text-white tracking-tight group-hover:text-amber-400 transition-colors line-clamp-2">
                {tour.title}
              </h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed line-clamp-3">
                {tour.description}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-400 border-t border-slate-800/80 pt-3">
                <span className="flex items-center gap-1.5 text-cyan-400 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  {tour.totalQuestions} Câu hỏi thật
                </span>
                <span className="text-[11px] text-amber-300/80 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  Mặc định: {tour.defaultGameCode}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <button
                disabled={isCreating}
                onClick={() => onJoinTournament(tour, tour.defaultGameCode)}
                className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 font-black text-sm text-slate-950 shadow-lg bg-gradient-to-r ${tour.accentGradient || 'from-amber-400 to-orange-500'} hover:opacity-95 active:scale-98 transition cursor-pointer disabled:opacity-60`}
              >
                <Play className="h-4 w-4 fill-current" />
                TRANH TÀI GIẢI ĐẤU NGAY ➔
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

