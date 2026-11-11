import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Shield, Cpu, Database } from 'lucide-react';
import { TRUST_METRICS } from './merkleData';

export const TrustMetricsTicker: React.FC = () => {
  const { i18n } = useTranslation('landing');
  const isVi = i18n.language?.startsWith('vi') ?? true;

  const icons = [Database, Cpu, Sparkles, Shield];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-12">
      {TRUST_METRICS.map((item, idx) => {
        const Icon = icons[idx] || Shield;
        return (
          <div
            key={item.id}
            className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 hover:border-emerald-500/40 transition-all text-left relative overflow-hidden group shadow-lg"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 group-hover:bg-emerald-500/10 rounded-full blur-2xl transition-all" />
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Icon size={16} />
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-emerald-300 border border-emerald-900/50">
                {isVi ? item.badgeVi : item.badgeEn}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white mb-1 bg-gradient-to-r from-white via-slate-100 to-emerald-200 bg-clip-text text-transparent">
              {item.metric}
            </div>
            <p className="text-xs text-slate-400 font-medium">
              {isVi ? item.labelVi : item.labelEn}
            </p>
          </div>
        );
      })}
    </div>
  );
};
