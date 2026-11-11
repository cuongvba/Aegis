import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Brain, Zap, Shield, Sparkles, ChevronDown,
  ArrowRight, CheckCircle2, MessageSquare
} from 'lucide-react';
import { MathRenderer } from '@/components/common/MathRenderer';
import {
  CognitiveTierData,
  COGNITIVE_TIERS_VI,
  COGNITIVE_TIERS_EN
} from './cognitiveTriadData';
import { CognitiveDialGauge } from './CognitiveDialGauge';

export const CognitiveTriadSection: React.FC = () => {
  const { i18n } = useTranslation('landing');
  const navigate = useNavigate();
  const isVi = i18n.language?.startsWith('vi') ?? true;
  const tiers = isVi ? COGNITIVE_TIERS_VI : COGNITIVE_TIERS_EN;

  const [activeTierId, setActiveTierId] = useState<'uar' | 'wpse' | 'symposium'>('wpse');
  const [showCot, setShowCot] = useState(false);

  const activeTier = tiers.find(t => t.id === activeTierId) || tiers[1];

  return (
    <section id="cognitive-triad" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto text-center relative">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-cyan-600/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="space-y-3 max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          <Brain size={14} className="text-cyan-400" />
          <span>{isVi ? 'Hệ Ba Ngôi Nhận Thức AI (Aegis Epistemic Triad)' : 'Aegis Epistemic Triad Engine'}</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
          {isVi ? (
            <>Từ Phản Xạ <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">0-Token</span> Đến Đại Hội Thảo <span className="bg-gradient-to-r from-purple-400 to-rose-400 bg-clip-text text-transparent">6 Pha</span></>
          ) : (
            <>From <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">0-Token Reflex</span> to <span className="bg-gradient-to-r from-purple-400 to-rose-400 bg-clip-text text-transparent">6-Phase Council</span></>
          )}
        </h2>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          {isVi
            ? 'Không lãng phí token cho bài toán đơn giản, không để ảo giác xâm nhập câu hỏi phức tạp. Hệ thống tự động thích ứng qua 3 tầng nhận thức bảo toàn chuỗi tư duy (CoT).'
            : 'Zero token waste on simple factoids, zero hallucination on complex paradoxes. Autonomous multi-agent verification preserving Chain-of-Thought.'}
        </p>
      </div>

      {/* Interactive 3-Tier Switcher */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-2xl mx-auto mb-8">
        {tiers.map(t => {
          const isActive = t.id === activeTierId;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setActiveTierId(t.id);
                setShowCot(false);
              }}
              className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-xl shadow-cyan-500/25 scale-102 ring-2 ring-cyan-400/40'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>{t.badge}</span>
              <span className="font-mono text-[11px] opacity-80">• {t.tierNumber}</span>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Stage */}
      <div className="max-w-4xl mx-auto rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-900/90 backdrop-blur-2xl shadow-2xl p-5 sm:p-7 text-left space-y-5">
        {/* Tier Headline & Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800/80">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Sparkles size={18} className="text-cyan-400" />
              <span>{activeTier.nameKey}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">{activeTier.subtitle}</p>
          </div>
          <span className="self-start sm:self-center px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono text-[11px] font-bold">
            ⚡ {activeTier.metrics.latency} • {activeTier.metrics.tokenCost}
          </span>
        </div>

        {/* Query Input Pill */}
        <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-start gap-2.5">
          <MessageSquare size={16} className="text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-mono">
            {activeTier.sampleInput}
          </div>
        </div>

        {/* Dual Grid: Gauge on Left, Result on Right */}
        <div className="grid md:grid-cols-2 gap-4">
          <CognitiveDialGauge tier={activeTier} isVi={isVi} />

          {/* Right Verified Output Box */}
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 space-y-3 flex flex-col justify-between shadow-lg shadow-cyan-950/20">
            <div>
              <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-cyan-400" />
                  {isVi ? 'Phản Hồi Đã Được Kiểm Định (Verified)' : 'Verified Epistemic Resolution'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                  {isVi ? '0 Ảo Giác' : 'Zero Hallucination'}
                </span>
              </div>
              <div className="text-xs sm:text-sm text-slate-100 leading-relaxed py-1">
                <MathRenderer content={activeTier.outputContent} />
              </div>
            </div>

            {/* Toggle CoT Trace */}
            <div className="pt-2 border-t border-cyan-500/20">
              <button
                type="button"
                onClick={() => setShowCot(!showCot)}
                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>{showCot ? (isVi ? 'Ẩn Vết Tư Duy CoT' : 'Hide CoT Trace') : (isVi ? 'Xem Vết Tư Duy CoT (Chain-of-Thought)' : 'Inspect CoT Reasoning Trace')}</span>
                <ChevronDown size={13} className={`transition-transform ${showCot ? 'rotate-180' : ''}`} />
              </button>

              {showCot && (
                <div className="mt-2.5 p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1.5 animate-in fade-in duration-150">
                  {activeTier.cotTrace.map((line, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-cyan-200/90">
                      <span className="text-cyan-500">›</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Navigation CTA */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-slate-400">
            {isVi ? 'Tất cả các tầng đều được bảo toàn trên cơ chế Semantic Cache & By-Pass LLM.' : 'All tiers backed by Semantic Vector Caching & By-Pass LLM.'}
          </span>
          <button
            type="button"
            onClick={() => navigate('/creator/studio')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isVi ? 'Thử Nghiệm Trong Zen Studio' : 'Launch Zen Studio'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
};

