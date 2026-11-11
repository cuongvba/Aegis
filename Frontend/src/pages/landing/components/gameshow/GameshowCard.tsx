import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LucideIcon, ArrowUpRight, Sparkles, Play } from 'lucide-react';

export interface GameshowCardProps {
  idx: number;
  name: string;
  desc: string;
  icon: LucideIcon;
}

interface GameTheme {
  badge: string;
  stageFlair: string[];
  gradient: string;
  borderColor: string;
  glowColor: string;
  accentText: string;
  actionText: string;
}

const GAME_THEMES: GameTheme[] = [
  {
    badge: '4 Phần Thi VTV • 60s Khởi Động',
    stageFlair: ['Khởi Động', 'VCNV', 'Tăng Tốc', 'Về Đích ⭐'],
    gradient: 'from-amber-950/30 via-slate-900/90 to-yellow-950/20',
    borderColor: 'border-amber-500/30 hover:border-amber-400',
    glowColor: 'bg-amber-500/10',
    accentText: 'text-amber-400',
    actionText: 'Vào Leo Núi Olympia',
  },
  {
    badge: 'Vật Lý 60fps • Ma Trận Ô Chữ',
    stageFlair: ['Ô May Mắn', 'Nhân Đôi', 'Mất Lượt', 'Đoán Chữ'],
    gradient: 'from-purple-950/30 via-slate-900/90 to-pink-950/20',
    borderColor: 'border-purple-500/30 hover:border-pink-400',
    glowColor: 'bg-pink-500/10',
    accentText: 'text-pink-400',
    actionText: 'Quay Nón Kỳ Diệu',
  },
  {
    badge: 'Đối Kháng 4 vs 4 • Chuông Starter 15đ',
    stageFlair: ['Starter Cá Nhân', 'Bonus Nhóm', 'Thảo Luận 15s'],
    gradient: 'from-blue-950/30 via-slate-900/90 to-cyan-950/20',
    borderColor: 'border-blue-500/30 hover:border-cyan-400',
    glowColor: 'bg-blue-500/10',
    accentText: 'text-cyan-400',
    actionText: 'Đối Kháng Liên Trường',
  },
  {
    badge: 'Bảng Ma Trận 30 Ô • Điểm Cược Double',
    stageFlair: ['$100', '$200', '$300', '$400', '$500 • "What is...?"'],
    gradient: 'from-indigo-950/30 via-slate-900/90 to-blue-950/20',
    borderColor: 'border-indigo-500/30 hover:border-indigo-400',
    glowColor: 'bg-indigo-500/10',
    accentText: 'text-indigo-400',
    actionText: 'Lật Bảng Ma Trận',
  },
  {
    badge: 'Cỗ Máy 10 Bậc • Đúng +1 Sai Về 0',
    stageFlair: ['Bậc 1-3', 'Bậc 4-7', 'Bậc 8-9', '🔥 Bậc 10 (Max)'],
    gradient: 'from-rose-950/30 via-slate-900/90 to-orange-950/20',
    borderColor: 'border-rose-500/30 hover:border-orange-400',
    glowColor: 'bg-rose-500/10',
    accentText: 'text-orange-400',
    actionText: 'Leo Dốc Nhanh Như Chớp',
  },
  {
    badge: '100+ Thí Sinh Sàn Đấu • Cứu Trợ Thầy Cô',
    stageFlair: ['Bảng Viết Tay', 'Phao Cứu Trợ', 'Chuông Vàng 🔔'],
    gradient: 'from-yellow-950/30 via-slate-900/90 to-amber-950/20',
    borderColor: 'border-yellow-500/30 hover:border-yellow-400',
    glowColor: 'bg-yellow-500/10',
    accentText: 'text-yellow-300',
    actionText: 'Rung Chuông Vàng Live',
  },
];

export const GameshowCard: React.FC<GameshowCardProps> = ({ idx, name, desc, icon: Icon }) => {
  const navigate = useNavigate();
  const theme = GAME_THEMES[idx % GAME_THEMES.length];
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelResult, setWheelResult] = useState<string | null>(null);

  const handleInteractiveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (idx === 1) { // Chiếc Nón Kỳ Diệu
      setWheelSpinning(true);
      setTimeout(() => {
        const scores = ['Ô 500đ', 'Ô 1,000đ', 'Nhân Đôi ⭐', 'Ô May Mắn 🎁'];
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
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-950/90 border border-slate-800 text-slate-300">
            {theme.badge}
          </span>
        </div>

        {/* Title & Desc */}
        <div>
          <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors mb-1.5">
            {name}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {desc}
          </p>
        </div>

        {/* Stage Flair Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {theme.stageFlair.map((step, sIdx) => (
            <span
              key={sIdx}
              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-950/70 border border-slate-800 text-slate-400 group-hover:border-slate-700 group-hover:text-slate-200 transition-colors"
            >
              {step}
            </span>
          ))}
        </div>

        {/* Special interactive wheel result for Chiếc nón */}
        {idx === 1 && wheelResult && (
          <div className="text-[11px] font-bold text-pink-400 bg-pink-950/40 border border-pink-500/30 px-3 py-1 rounded-lg">
            Kết quả quay thử: <span className="text-white font-extrabold">{wheelResult}</span>
          </div>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="relative z-10 pt-4 mt-5 border-t border-slate-800/60 flex items-center justify-between text-xs font-bold text-slate-300 group-hover:text-white">
        <span className="flex items-center gap-1.5">
          <Play size={12} className={theme.accentText} />
          {idx === 1 && wheelSpinning ? 'Đang quay 60fps...' : theme.actionText}
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

