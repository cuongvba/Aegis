import React from 'react';
import { HeartHandshake } from 'lucide-react';

interface Props {
  qIndex: number;
  totalQuestions: number;
  myStatus: 'ACTIVE' | 'ELIMINATED';
  myScore: number;
  onRescue: () => void;
}

export function GoldenBellHeaderBar({ qIndex, totalQuestions, myStatus, myScore, onRescue }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 p-4 text-white shadow-xl">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-2xl shadow-inner animate-bounce">
          🔔
        </span>
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-100 block">
            BATTLE ROYALE • CÂU SỐ {qIndex + 1}/{totalQuestions || 50}
          </span>
          <h2 className="text-lg sm:text-xl font-black text-white">Đấu Trường Rung Chuông Vàng</h2>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="rounded-xl bg-black/20 px-3 py-1.5 text-center backdrop-blur-sm">
          <span className="block text-[10px] text-amber-100 font-bold">Vị Trí Của Bạn</span>
          <span className={`font-black text-xs px-2 py-0.5 rounded ${
            myStatus === 'ACTIVE' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
          }`}>
            {myStatus === 'ACTIVE' ? 'Ghế 45 (Trên Sàn)' : 'Đã Rời Sàn'}
          </span>
        </div>
        <div className="rounded-xl bg-white/20 px-3 py-1.5 text-center backdrop-blur-sm">
          <span className="block text-[10px] text-amber-100 font-bold">Điểm Số</span>
          <span className="font-black text-lg text-white">{myScore}đ</span>
        </div>
        <button
          onClick={onRescue}
          className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-black text-amber-700 shadow-md hover:bg-yellow-50 active:scale-95 transition cursor-pointer"
        >
          <HeartHandshake className="h-4 w-4 text-rose-600" />
          <span>Cứu Trợ 🎈</span>
        </button>
      </div>
    </div>
  );
}

