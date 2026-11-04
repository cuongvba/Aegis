import React from 'react';
import { Star } from 'lucide-react';
import type { ArenaPlayer } from '@/types/arena';
import { playArenaSfx } from '@/services/arena.service';

interface Props {
  currentStage: string;
  qIndex: number;
  totalQuestions: number;
  players: ArenaPlayer[];
  winnerPlayerId?: string | null;
  starUsed: boolean;
  onUseStar: () => void;
  onNextStage: (next: string) => void;
}

export function OlympiaStageBar({
  currentStage,
  qIndex,
  totalQuestions,
  players,
  winnerPlayerId,
  starUsed,
  onUseStar,
  onNextStage,
}: Props) {
  const getStageTitle = (stage: string) => {
    switch (stage) {
      case 'KHOI_DONG': return 'V1: KHỞI ĐỘNG';
      case 'VUOT_CNV': return 'V2: VƯỢT CNV';
      case 'TANG_TOC': return 'V3: TĂNG TỐC';
      case 'VE_DICH': return 'V4: VỀ ĐÍCH';
      default: return 'OLYMPIA';
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md shrink-0">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-sm font-black shadow text-slate-950">
          🏛️
        </span>
        <div className="leading-tight">
          <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
            {getStageTitle(currentStage)}
          </span>
          <span className="text-xs font-black text-white">Câu {qIndex + 1}/{totalQuestions || 1}</span>
        </div>
      </div>

      {/* Dải Mini-Podiums Thí Sinh Nằm Ngang */}
      <div className="flex items-center gap-2 overflow-x-auto py-0.5 max-w-xl">
        {players.map((p, idx) => {
          if (!p) return null;
          const pId = p.id || (p as any).Id || String(idx);
          const isWinner = Boolean(winnerPlayerId && pId && winnerPlayerId === pId);
          const pName = p.name || (p as any).Name || 'Thí Sinh';
          const pScore = p.score ?? (p as any).Score ?? 0;
          const pAvatar = p.avatar || '🎓';
          return (
            <div
              key={pId}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
                isWinner
                  ? 'border-amber-400 bg-amber-500/20 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)] ring-1 ring-amber-400'
                  : 'border-slate-800 bg-slate-950/60 text-slate-300'
              }`}
            >
              <span className="text-sm">{pAvatar}</span>
              <span className="truncate max-w-[70px] text-[11px] text-slate-200">{pName}</span>
              <span className="font-mono text-amber-400 font-extrabold">{pScore}đ</span>
              {isWinner && <span className="animate-pulse text-[10px] text-amber-300 font-black">🔔</span>}
            </div>
          );
        })}
      </div>

      {/* Quick Controls */}
      <div className="flex items-center gap-1.5">
        {currentStage === 'VE_DICH' && (
          <button
            disabled={starUsed}
            onClick={onUseStar}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition ${
              starUsed ? 'bg-slate-800 text-slate-500' : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
            }`}
          >
            <Star className="h-3 w-3 inline mr-1 fill-current" /> ⭐x2
          </button>
        )}
        <button
          onClick={() => {
            const stages = ['KHOI_DONG', 'VUOT_CNV', 'TANG_TOC', 'VE_DICH', 'FINISHED'];
            const cur = stages.indexOf(currentStage);
            if (cur >= 0 && cur < stages.length - 1) onNextStage(stages[cur + 1]);
          }}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-bold"
        >
          Chuyển Vòng ➔
        </button>
      </div>
    </div>
  );
}

