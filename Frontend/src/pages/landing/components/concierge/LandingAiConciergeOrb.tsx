import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, MessageSquare, X } from 'lucide-react';

interface LandingAiConciergeOrbProps {
  isOpen: boolean;
  onOpen: () => void;
  isVi: boolean;
}

export const LandingAiConciergeOrb: React.FC<LandingAiConciergeOrbProps> = ({
  isOpen,
  onOpen,
  isVi
}) => {
  const [showTeaser, setShowTeaser] = useState(false);
  const [teaserDismissed, setTeaserDismissed] = useState(false);

  useEffect(() => {
    if (isOpen || teaserDismissed) {
      setShowTeaser(false);
      return;
    }
    const timer = setTimeout(() => {
      setShowTeaser(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, [isOpen, teaserDismissed]);

  if (isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Proactive Teaser Balloon */}
      {showTeaser && !teaserDismissed && (
        <div
          onClick={onOpen}
          className="mb-3 max-w-xs sm:max-w-sm p-3.5 rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-950/98 to-slate-900/95 border border-cyan-400/50 shadow-2xl shadow-cyan-950/60 backdrop-blur-xl cursor-pointer text-left relative animate-in fade-in slide-in-from-bottom-3 duration-300 hover:scale-102 transition-all group"
        >
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              setTeaserDismissed(true);
              setShowTeaser(false);
            }}
            className="absolute top-2 right-2 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Đóng thông báo"
          >
            <X size={12} />
          </button>

          <div className="flex items-start gap-2.5 pr-4">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center shrink-0 mt-0.5">
              <Bot size={18} className="animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-black text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                <span>{isVi ? 'Trợ Lý Tư Vấn Toàn Cầu 24/7' : 'Global AI Solution Advisor'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </p>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                {isVi
                  ? '👋 Xin chào! Hãy bấm vào đây để được tư vấn giải pháp khảo thí, bảo mật ngân hàng hoặc bóc tách đề thi tức thì!'
                  : '👋 Welcome! Click here for instant tailored advice on our cognitive exam & banking security infrastructure!'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Quantum Orb Trigger */}
      <button
        type="button"
        onClick={onOpen}
        title={isVi ? 'Mở Trợ lý AI Tư vấn Giải pháp (24/7)' : 'Open AI Solution Advisor (24/7)'}
        className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 text-white shadow-2xl shadow-cyan-900/50 hover:scale-105 active:scale-95 transition-all duration-300 ring-2 ring-cyan-400/50 hover:ring-cyan-300 cursor-pointer"
      >
        <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 opacity-50 blur-md group-hover:opacity-90 animate-pulse transition-opacity" />

        <MessageSquare className="w-6 h-6 text-white relative z-10 transition-transform group-hover:scale-110" />
        <Sparkles className="w-4 h-4 text-cyan-200 absolute -top-0.5 -right-0.5 z-10 animate-bounce" />

        {/* Live indicator dot */}
        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-950 z-20" />
      </button>
    </div>
  );
};

