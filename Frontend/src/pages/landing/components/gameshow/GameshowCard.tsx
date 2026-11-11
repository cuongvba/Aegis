import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LucideIcon, ArrowUpRight, Play } from 'lucide-react';
import { getGameshowTheme } from './gameshowRegistry';

export interface GameshowCardItem {
  code?: string;
  name: string;
  desc: string;
  badge?: string;
  stageFlair?: string[];
  actionText?: string;
}

export interface GameshowCardProps {
  item: GameshowCardItem;
  icon: LucideIcon;
}

export const GameshowCard: React.FC<GameshowCardProps> = ({ item, icon: Icon }) => {
  const navigate = useNavigate();
  const theme = getGameshowTheme(item.code);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelResult, setWheelResult] = useState<string | null>(null);

  const handleInteractiveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.code === 'WHEEL') {
      setWheelSpinning(true);
      setTimeout(() => {
        const scores = ['500 PTS', '1,000 PTS', 'DOUBLE ⭐', 'LUCKY 🎁'];
        setWheelResult(scores[Math.floor(Math.random() * scores.length)]);
        setWheelSpinning(false);
      }, 700);
    } else {
      navigate('/arena');
    }
  };

  return (
    <div
      onClick={() => navigate('/arena')}
      className={`group relative overflow-hidden rounded-2xl border ${theme.borderColor} bg-gradient-to-br ${theme.gradient} p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl cursor-pointer flex flex-col justify-between`}
    >
      <div className={`absolute -top-10 -right-10 w-36 h-36 rounded-full ${theme.glowColor} blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500`} />

      <div className="relative z-10 space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2">
          <div className={`w-12 h-12 rounded-xl bg-slate-950/80 border ${theme.borderColor} ${theme.accentText} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
            <Icon size={22} aria-hidden="true" />
          </div>
          {item.badge && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-950/90 border border-slate-800 text-slate-300">
              {item.badge}
            </span>
          )}
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors mb-1.5">
            {item.name}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {item.desc}
          </p>
        </div>

        {/* Stage Flair Pills */}
        {item.stageFlair && item.stageFlair.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {item.stageFlair.map((step, sIdx) => (
              <span
                key={sIdx}
                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-950/70 border border-slate-800 text-slate-400 group-hover:border-slate-700 group-hover:text-slate-200 transition-colors"
              >
                {step}
              </span>
            ))}
          </div>
        )}

        {/* Special interactive wheel result for WHEEL format */}
        {item.code === 'WHEEL' && wheelResult && (
          <div className="text-[11px] font-bold text-pink-400 bg-pink-950/40 border border-pink-500/30 px-3 py-1 rounded-lg">
            Spin: <span className="text-white font-extrabold">{wheelResult}</span>
          </div>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="relative z-10 pt-4 mt-5 border-t border-slate-800/60 flex items-center justify-between text-xs font-bold text-slate-300 group-hover:text-white">
        <span className="flex items-center gap-1.5">
          <Play size={12} className={theme.accentText} />
          {item.code === 'WHEEL' && wheelSpinning ? '60fps Spinning...' : (item.actionText || 'Play Now')}
        </span>
        <button
          type="button"
          onClick={handleInteractiveClick}
          className="p-1 rounded-lg hover:bg-slate-800/80 text-slate-400 group-hover:text-white transition-colors"
        >
          <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
