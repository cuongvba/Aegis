import React from 'react';

interface Props {
  totalSeats?: number;
  activeCount: number;
  eliminatedCount: number;
  mySeatNumber?: number;
  myStatus: 'ACTIVE' | 'ELIMINATED';
}

export function GoldenBellSeatsGrid({
  totalSeats = 100,
  activeCount,
  eliminatedCount,
  mySeatNumber = 45,
  myStatus,
}: Props) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4 text-white shadow-xl flex flex-col justify-between space-y-3">
      <div>
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <h4 className="text-xs font-black uppercase text-slate-300">Sơ Đồ 100 Ghế Sàn Đấu</h4>
          </div>
          <div className="flex gap-2 text-[10px] font-bold">
            <span className="text-emerald-400">{activeCount} Trên Sàn</span>
            <span className="text-rose-400">{eliminatedCount} Đã Loại</span>
          </div>
        </div>

        {/* 10x10 Mini Matrix Grid */}
        <div className="grid grid-cols-10 gap-1">
          {Array.from({ length: totalSeats }).map((_, idx) => {
            const seatNo = idx + 1;
            const isMe = seatNo === mySeatNumber;
            const isEliminated = isMe ? myStatus === 'ELIMINATED' : seatNo % 7 === 0;

            return (
              <div
                key={seatNo}
                className={`aspect-square flex items-center justify-center rounded-md text-[9px] font-black border transition ${
                  isMe
                    ? 'border-yellow-400 bg-yellow-500/30 text-yellow-300 shadow-[0_0_8px_rgba(250,204,21,0.5)] scale-110'
                    : isEliminated
                    ? 'border-rose-950 bg-rose-950/30 text-rose-500/40 opacity-40'
                    : 'border-emerald-950 bg-emerald-950/20 text-emerald-400/80'
                }`}
                title={isMe ? `Vị trí của bạn: Ghế ${seatNo}` : `Ghế ${seatNo}`}
              >
                {isMe ? '⭐' : seatNo}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 leading-tight">
        💡 <strong>Luật Rung Chuông Vàng:</strong> Trả lời đúng giữ nguyên vị trí, sai 1 câu rời sàn đấu. Thầy Cô có quyền tung bóng cứu trợ để hồi sinh cả lớp.
      </div>
    </div>
  );
}

