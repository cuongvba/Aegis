import React from 'react';

interface Props {
  currentStep: number;
}

export function LightningInclineLadder({ currentStep }: Props) {
  return (
    <div className="rounded-3xl border-2 border-rose-500/30 bg-slate-950 p-4 text-white shadow-2xl flex flex-col justify-between space-y-3">
      <div>
        <div className="flex items-center justify-between border-b border-rose-900/50 pb-2 mb-2">
          <span className="text-[11px] font-black uppercase text-rose-400">Dốc Đứng 10 Bậc</span>
          <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-yellow-300">
            Mục Tiêu: 10/10
          </span>
        </div>

        <div className="flex flex-col-reverse gap-1.5">
          {Array.from({ length: 10 }).map((_, idx) => {
            const stepNum = idx + 1;
            const isActive = currentStep === stepNum;
            const isPassed = currentStep > stepNum;

            return (
              <div
                key={stepNum}
                className={`relative flex items-center justify-between rounded-xl border px-3 py-1.5 text-xs font-black transition-all duration-300 ${
                  isActive
                    ? 'border-yellow-400 bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-[0_0_15px_rgba(251,191,36,0.5)] scale-[1.02]'
                    : isPassed
                    ? 'border-emerald-600/70 bg-emerald-950/40 text-emerald-300'
                    : 'border-slate-800 bg-slate-900/50 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-black/40 text-[10px]">
                    {stepNum}
                  </span>
                  <span className="text-[11px] truncate">
                    {stepNum === 10 ? '👑 ĐỈNH VINH QUANG' : `Bậc Số ${stepNum}`}
                  </span>
                </div>

                {isActive && (
                  <span className="flex items-center gap-1 rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-black text-slate-950 animate-bounce">
                    🚀 BẬC {stepNum}
                  </span>
                )}
                {isPassed && <span className="text-emerald-400 text-xs">✓</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-rose-950 text-[11px] text-slate-400 leading-tight">
        ⚡ <strong>Luật Nhanh Như Chớp:</strong> Đúng liên tiếp 10 câu để chiến thắng. Chỉ cần sai 1 câu, bạn sẽ lập tức tụt dốc về Bậc 0!
      </div>
    </div>
  );
}

