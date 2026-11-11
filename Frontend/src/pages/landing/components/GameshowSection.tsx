import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Trophy, CircleDot, Users, Grid3x3, Flame, BellRing,
  Puzzle, PlusCircle, ArrowRight, Sparkles, Cpu
} from 'lucide-react';
import { InteractiveArenaBuzzer } from './gameshow/InteractiveArenaBuzzer';
import { GameshowCard } from './gameshow/GameshowCard';

const BUILT_IN_ICONS = [Trophy, CircleDot, Users, Grid3x3, Flame, BellRing];

export function GameshowSection() {
  const { t } = useTranslation('landing');
  const navigate = useNavigate();

  const items = (t('gameshows.items', { returnObjects: true }) as Array<{ name: string; desc: string }>) || [];

  return (
    <section id="gameshows" className="py-20 sm:py-28 bg-slate-950/80 border-y border-slate-800/80 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-amber-500/5 blur-[160px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-300">
            <Cpu size={14} className="text-amber-400" />
            <span>Open Arena Engine • Kiến Trúc Cắm Rút (Plug-In) Vô Hạn</span>
          </span>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Đấu Trường Trực Tuyến &lt;2ms —{' '}
            <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-amber-300 bg-clip-text text-transparent">
              Không Giới Hạn Format
            </span>
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Hệ sinh thái duy nhất sở hữu <strong className="text-white font-bold">Kiến Trúc Đấu Trường Mở (IArenaGamePlugin)</strong>:
            Không chỉ tái hiện hoàn chỉnh 6 gameshow truyền hình kinh điển, hệ thống cho phép Nhà trường, Doanh nghiệp và Creator
            <strong className="text-amber-300 font-bold"> tự định nghĩa luật chơi, thang điểm, vòng quay và cắm rút (Plug-In) vô hạn format mới</strong>.
          </p>
        </div>

        {/* Live Interactive Buzzer Demo */}
        <InteractiveArenaBuzzer />

        {/* The Built-in & Extensible Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {items.slice(0, 6).map((item, idx) => (
            <GameshowCard
              key={item.name}
              idx={idx}
              name={item.name}
              desc={item.desc}
              icon={BUILT_IN_ICONS[idx] ?? Trophy}
            />
          ))}
        </div>

        {/* The "Infinite Plugin & Dynamic Template" Master Card */}
        <div className="rounded-3xl border border-cyan-500/40 bg-gradient-to-r from-slate-900 via-cyan-950/30 to-indigo-950/40 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 text-center lg:text-left max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                <Puzzle size={14} />
                <span>Kiến Trúc Dynamic Plug-In Độc Bản</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Bạn Muốn Format Khác? Tự Tạo &amp; Cắm Rút (Plug-In) Trong 60 Giây
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Đã tích hợp sẵn các mẫu nâng cao: <strong className="text-cyan-300">Ai Là Triệu Phú (Millionaire)</strong>, <strong className="text-cyan-300">Kẻ Săn Mồi (The Chase)</strong>, <strong className="text-cyan-300">Đấu Trí 1 vs 100</strong>, <strong className="text-cyan-300">Đuổi Hình Bắt Chữ</strong>.
                Hoặc tùy biến tùy thích: Chế độ cướp chuông, thang leo dốc, trợ giúp AI Socrates, ma trận điểm thưởng — Tất cả chạy trên xung nhịp RAM &lt;2ms.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <button
                type="button"
                onClick={() => navigate('/arena')}
                className="px-6 py-3.5 rounded-full font-bold text-sm text-white bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 hover:brightness-110 shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles size={16} />
                <span>Vào Đấu Trường Arena</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/creator/studio')}
                className="px-6 py-3.5 rounded-full font-bold text-sm text-slate-200 bg-slate-900/90 border border-slate-700 hover:bg-slate-800 hover:border-cyan-400 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlusCircle size={16} />
                <span>Tạo Format Độc Quyền</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default GameshowSection;
