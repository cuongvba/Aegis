/**
 * Aegis — HeroSection (Landing Page)
 * =========================================
 * Màn hình đầu tiên — quyết định phần lớn tỉ lệ ở lại của khách truy cập.
 * FSD Layer: pages/landing/components/
 */
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, ArrowRight, Building2 } from 'lucide-react';
import { HeroInteractiveSandbox } from './hero/HeroInteractiveSandbox';

export function HeroSection() {
  const { t } = useTranslation('landing');
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28">
      {/* Ambient glow background — nhất quán thẩm mỹ với Dashboard */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] rounded-full bg-cyan-600/10 blur-[130px]" />
        <div className="absolute top-[10%] right-[5%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[35%] w-[700px] h-[700px] rounded-full bg-purple-600/10 blur-[160px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-8">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
          <Sparkles size={13} className="text-cyan-400" aria-hidden="true" />
          {t('hero.eyebrow')}
        </span>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
          {t('hero.headline')}{' '}
          <span className="block sm:inline bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            {t('hero.headlineHighlight')}
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed">
          {t('hero.subheadline')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/register')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-full font-bold text-sm text-white
                       bg-[var(--brand-gradient)] shadow-[var(--tenant-shadow-primary)]
                       transition-all active:scale-95 hover:brightness-110 cursor-pointer
                       flex items-center justify-center gap-2"
          >
            {t('hero.ctaPrimary')} <ArrowRight size={16} aria-hidden="true" />
          </button>
          <a
            href="#segments"
            className="w-full sm:w-auto px-6 py-3.5 rounded-full font-bold text-sm text-slate-200
                       bg-slate-900/80 border border-slate-700 hover:border-slate-500 hover:bg-slate-800
                       transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Building2 size={16} aria-hidden="true" /> {t('hero.ctaSecondary')}
          </a>
        </div>

        {/* Hero Interactive Proof Sandbox */}
        <HeroInteractiveSandbox />
      </div>
    </section>
  );
}
