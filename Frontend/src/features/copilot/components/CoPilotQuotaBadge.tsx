import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, Key, ShieldCheck, ChevronDown, Sparkles,
  ArrowUpRight, AlertCircle, Cpu
} from 'lucide-react';
import type { CoPilotQuotaStatus } from '../types/copilot.types';

interface CoPilotQuotaBadgeProps {
  quota: CoPilotQuotaStatus | null;
  onRefresh?: () => void;
}

export const CoPilotQuotaBadge: React.FC<CoPilotQuotaBadgeProps> = ({ quota, onRefresh }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!quota) return null;

  const isUnlimited = quota.tokensLimitMonth === -1;
  const remaining = isUnlimited ? 'Vô hạn (BYOK)' : `${quota.remainingTokens.toLocaleString()} Tokens`;
  const progressPercent = isUnlimited ? 0 : Math.min(100, quota.percentageUsed);

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      {/* Compact Interactive Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Xem chi tiết tình trạng cổng AI và hạn mức Tokens"
        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 text-slate-300 transition-all cursor-pointer shadow-sm"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <Zap className="w-3 h-3 text-cyan-400" />
        <span className={isUnlimited ? 'text-emerald-300' : 'text-cyan-300'}>
          {remaining}
        </span>
        <ChevronDown className={`w-2.5 h-2.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Detailed Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-slate-950/98 border border-cyan-800/60 shadow-2xl p-4 z-50 backdrop-blur-xl text-left animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <div>
              <div className="text-xs font-black text-white flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tình Trạng & Hạn Mức AI</span>
              </div>
              <p className="text-[10px] text-cyan-300/80 font-mono mt-0.5">{quota.plan}</p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 text-[9px] font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {quota.gatewayStatus}
            </span>
          </div>

          {/* Quota Progress Meter */}
          <div className="py-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Hạn mức tháng:</span>
              <span className="font-mono font-bold text-slate-200">
                {isUnlimited ? (
                  <span className="text-emerald-300">Không giới hạn</span>
                ) : (
                  `${quota.tokensUsedMonth.toLocaleString()} / ${quota.tokensLimitMonth.toLocaleString()}`
                )}
              </span>
            </div>

            {!isUnlimited && (
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    progressPercent > 80
                      ? 'bg-rose-500'
                      : progressPercent > 50
                      ? 'bg-amber-400'
                      : 'bg-gradient-to-r from-cyan-400 to-indigo-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}

            <p className="text-[10px] text-slate-400 leading-snug pt-0.5">
              {quota.statusMessage}
            </p>
          </div>

          {/* Capabilities Matrix */}
          <div className="pt-2 border-t border-slate-900 space-y-1 text-[10px] text-slate-300">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-slate-400">
                <Sparkles className="w-3 h-3 text-amber-400" /> 0-Token Fast-Path:
              </span>
              <span className="font-mono text-emerald-300 font-bold">Miễn phí vĩnh viễn</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-slate-400">
                <Key className="w-3 h-3 text-cyan-400" /> Nguồn khóa BYOK:
              </span>
              <span className="font-mono text-cyan-300">
                {quota.hasByokKey ? `${quota.byokProviders.length} nhà cung cấp` : 'Quỹ công cộng'}
              </span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/settings/ai');
              }}
              className="flex-1 py-1.5 px-2 rounded-xl text-[10px] font-bold bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 hover:border-cyan-500 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Key className="w-3 h-3" />
              <span>Cấu hình BYOK</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/pricing');
              }}
              className="py-1.5 px-3 rounded-xl text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Gói cước</span>
              <ArrowUpRight className="w-3 h-3 opacity-60" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

