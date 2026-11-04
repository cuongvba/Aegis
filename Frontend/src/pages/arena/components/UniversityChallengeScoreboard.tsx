import React from 'react';
import type { ArenaPlayer } from '@/types/arena';

interface Props {
  teamAScore: number;
  teamBScore: number;
  currentStage: string;
  players: ArenaPlayer[];
}

export function UniversityChallengeScoreboard({ teamAScore, teamBScore, currentStage }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 p-4 text-white shadow-xl">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-2xl shadow-inner">
          🎓
        </span>
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-200 block">
            BBC UNIVERSITY CHALLENGE • {currentStage === 'STARTER_QUESTION' ? 'VÒNG KHỞI ĐỘNG' : 'VÒNG ĐỘI NHÓM'}
          </span>
          <h2 className="text-lg sm:text-xl font-black text-white">Đại Học Đỉnh Cao (Liên Trường)</h2>
        </div>
      </div>

      {/* 2 Đội Đối Kháng Tỉ Số */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl bg-blue-950/80 border border-blue-400/30 px-3 py-1.5 backdrop-blur-sm">
          <span className="text-sm">🏛️</span>
          <div className="text-left">
            <span className="block text-[9px] uppercase font-bold text-blue-300">ĐH Bách Khoa</span>
            <span className="font-mono text-base font-black text-blue-200">{teamAScore}đ</span>
          </div>
        </div>

        <span className="font-black text-xs text-indigo-300">VS</span>

        <div className="flex items-center gap-2 rounded-xl bg-violet-950/80 border border-violet-400/30 px-3 py-1.5 backdrop-blur-sm">
          <span className="text-sm">🌐</span>
          <div className="text-left">
            <span className="block text-[9px] uppercase font-bold text-violet-300">ĐH Ngoại Thương</span>
            <span className="font-mono text-base font-black text-violet-200">{teamBScore}đ</span>
          </div>
        </div>
      </div>
    </div>
  );
}

