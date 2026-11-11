import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Wand2, Brain, Gauge, Sparkles, CheckCircle2,
  Zap, ShieldCheck, Flame
} from 'lucide-react';
import { MathRenderer } from '@/components/common/MathRenderer';

export const HeroInteractiveSandbox: React.FC = () => {
  const { t } = useTranslation('landing');
  const [tab, setTab] = useState<'mathtype' | 'ai' | 'irt'>('mathtype');
  const [parsed, setParsed] = useState(false);
  const [parsingTime, setParsingTime] = useState<string | null>(null);

  // IRT state
  const [tfAnswers, setTfAnswers] = useState<Record<string, boolean>>({ a: true, b: false, c: true, d: false });
  const correctTf: Record<string, boolean> = { a: true, b: false, c: true, d: true };
  const matchedCount = ['a', 'b', 'c', 'd'].filter(k => tfAnswers[k] === correctTf[k]).length;
  const irtScore = matchedCount === 4 ? 1.0 : matchedCount === 3 ? 0.5 : matchedCount === 2 ? 0.25 : matchedCount === 1 ? 0.1 : 0;
  const theta = (-1.0 + (matchedCount * 0.75)).toFixed(2);

  const handleParseTest = () => {
    setParsed(false);
    setTimeout(() => {
      setParsingTime((0.85 + Math.random() * 0.7).toFixed(2));
      setParsed(true);
    }, 120);
  };

  const sampleMathQuestion = 'Cho tích phân $I = \\int_{0}^{\\pi/2} \\frac{\\sin^3 x}{\\sin^3 x + \\cos^3 x} \\, dx$. Khi đó $I = \\frac{\\pi}{4}$.';

  return (
    <div className="pt-8 max-w-3xl mx-auto text-left">
      <div className="rounded-3xl border border-cyan-500/30 bg-slate-900/80 backdrop-blur-2xl shadow-2xl shadow-cyan-950/30 overflow-hidden">
        {/* Top Control Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="ms-2 text-[11px] font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={12} /> {t('hero.sandbox.badge')}
            </span>
          </div>

          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-0.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setTab('mathtype')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                tab === 'mathtype' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wand2 size={12} /> {t('hero.sandbox.tabMathtype')}
            </button>
            <button
              type="button"
              onClick={() => setTab('ai')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                tab === 'ai' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Brain size={12} /> {t('hero.sandbox.tabAi')}
            </button>
            <button
              type="button"
              onClick={() => setTab('irt')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                tab === 'irt' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Gauge size={12} /> {t('hero.sandbox.tabIrt')}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6">
          {/* TAB 1: MathType / Word Deconstruction */}
          {tab === 'mathtype' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs text-slate-300 font-semibold">
                  {t('hero.sandbox.mathtypePrompt')}
                </span>
                <button
                  type="button"
                  onClick={handleParseTest}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 shadow-md transition-all cursor-pointer self-start sm:self-auto"
                >
                  <Zap size={13} className="fill-slate-950" /> {t('hero.sandbox.btnParse')}
                </button>
              </div>

              {/* Code input snippet */}
              <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3 font-mono text-[11px] text-slate-400 space-y-1">
                <div className="text-slate-500">{t('hero.sandbox.commentWord')}</div>
                <div className="text-amber-300 truncate">
                  [OLE_EQUATION: 0105000002000000080000004571756174696f6e2e44534d5434]
                </div>
                <div className="text-slate-300">
                  Câu hỏi: Tính $I = \int_{'{'}0{'}'}^{'{\\pi/2}'} \frac{'{'}\sin^3 x{'}'}{'{'}\sin^3 x + \cos^3 x{'}'} dx$
                </div>
              </div>

              {/* Live Render Output */}
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4 transition-all">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-cyan-400" /> {t('hero.sandbox.katexResult')}
                  </span>
                  {parsingTime && (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-black">
                      ⚡ {parsingTime}ms • {t('hero.sandbox.metricSaved')}
                    </span>
                  )}
                </div>
                <div className="text-sm sm:text-base text-slate-100 py-1">
                  <MathRenderer content={sampleMathQuestion} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Wolf Pack AI Swarm */}
          {tab === 'ai' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">
                  {t('hero.sandbox.aiPrompt')}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-black text-[10px]">
                  {t('hero.sandbox.aiConsensus')}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 space-y-1">
                  <div className="font-bold text-cyan-400 flex items-center gap-1">
                    <Zap size={12} /> {t('hero.sandbox.agentAlpha')}
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {t('hero.sandbox.agentAlphaDesc')}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 space-y-1">
                  <div className="font-bold text-rose-400 flex items-center gap-1">
                    <ShieldCheck size={12} /> {t('hero.sandbox.agentBeta')}
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {t('hero.sandbox.agentBetaDesc')}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 space-y-1">
                  <div className="font-bold text-amber-400 flex items-center gap-1">
                    <Flame size={12} /> {t('hero.sandbox.agentGamma')}
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {t('hero.sandbox.agentGammaDesc')}
                  </p>
                </div>
                <div className="rounded-xl bg-indigo-950/30 border border-indigo-500/40 p-3 space-y-1">
                  <div className="font-bold text-indigo-300 flex items-center gap-1">
                    <Sparkles size={12} /> {t('hero.sandbox.agentDelta')}
                  </div>
                  <p className="text-emerald-300 text-[11px] font-semibold leading-relaxed">
                    {t('hero.sandbox.agentDeltaDesc')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IRT 3-PL & GDPT 2025 */}
          {tab === 'irt' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-semibold">
                  {t('hero.sandbox.irtPrompt')}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">
                    {t('hero.sandbox.irtScore')} <strong className="text-amber-400 font-mono text-sm">{irtScore}</strong>/1.0
                  </span>
                  <span className="text-slate-400">
                    {t('hero.sandbox.irtTheta')} <strong className="text-emerald-400 font-mono text-sm">{theta}</strong>
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { key: 'a', text: 'Hàm số đồng biến trên từng khoảng xác định' },
                  { key: 'b', text: 'Đồ thị có tiệm cận đứng tại x = 2' },
                  { key: 'c', text: 'Giá trị cực tiểu đạt tại x = -1' },
                  { key: 'd', text: 'Phương trình f(x) = 0 có đúng 3 nghiệm thực' },
                ].map(item => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800"
                  >
                    <span className="text-slate-300 font-medium">
                      <strong className="text-cyan-400 me-2">{item.key})</strong> {item.text}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTfAnswers(p => ({ ...p, [item.key]: true }))}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                          tfAnswers[item.key] === true ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {t('hero.sandbox.trueBtn')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTfAnswers(p => ({ ...p, [item.key]: false }))}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                          tfAnswers[item.key] === false ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {t('hero.sandbox.falseBtn')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-[11px] text-slate-400 italic">
                {t('hero.sandbox.irtHint')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
