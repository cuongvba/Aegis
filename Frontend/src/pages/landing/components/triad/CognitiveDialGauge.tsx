import React from 'react';
import { Zap, ShieldCheck, Clock, Coins, CheckCircle2 } from 'lucide-react';
import type { CognitiveTierData } from './cognitiveTriadData';

interface CognitiveDialGaugeProps {
  tier: CognitiveTierData;
  isVi: boolean;
}

export const CognitiveDialGauge: React.FC<CognitiveDialGaugeProps> = ({ tier, isVi }) => {
  const percent = tier.metrics.sciConsensus;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-4 flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-cyan-400" />
          {isVi ? 'Chỉ Số Đồng Thuận & Hiệu Năng' : 'Consensus Index & Metrics'}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold">
          {tier.tierNumber}
        </span>
      </div>

      {/* Center Animated Circular Gauge */}
      <div className="flex items-center justify-center gap-5 py-2">
        <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="text-slate-800 stroke-current"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Animated progress circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="text-cyan-400 stroke-current transition-all duration-700 ease-out"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-base font-black text-white font-mono">{percent}%</span>
            <span className="text-[9px] text-cyan-300 font-mono font-bold uppercase tracking-tight">SCI</span>
          </div>
        </div>

        {/* Right Details */}
        <div className="space-y-1 text-left text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock size={12} className="text-cyan-400 shrink-0" />
            <span>{isVi ? 'Độ trễ:' : 'Latency:'}</span>
            <span className="font-mono font-bold text-cyan-300">{tier.metrics.latency}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Coins size={12} className="text-amber-400 shrink-0" />
            <span>{isVi ? 'Chi phí:' : 'Tokens:'}</span>
            <span className="font-mono font-bold text-amber-300">{tier.metrics.tokenCost}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Zap size={12} className="text-emerald-400 shrink-0" />
            <span>{isVi ? 'FinOps:' : 'FinOps:'}</span>
            <span className="font-mono font-bold text-emerald-300">{tier.metrics.finOpsSavings}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <CheckCircle2 size={12} className="text-purple-400 shrink-0" />
            <span className="text-[10px] text-purple-300 font-bold">{tier.metrics.antiHallucination}</span>
          </div>
        </div>
      </div>

      {/* Neural Pipeline Flow Steps */}
      <div className="pt-3 border-t border-slate-900">
        <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-2">
          {isVi ? 'Tuyến Dòng Chảy Nhận Thức:' : 'Cognitive Pipeline Path:'}
        </div>
        <div className="flex flex-wrap items-center gap-1 text-[10px]">
          {tier.routingFlow.map((step, idx) => (
            <React.Fragment key={idx}>
              <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-medium font-mono text-[10px]">
                {step}
              </span>
              {idx < tier.routingFlow.length - 1 && (
                <span className="text-cyan-500 font-mono">→</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

