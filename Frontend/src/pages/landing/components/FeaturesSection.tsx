import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Brain, Zap, ShieldCheck, QrCode, FileUp, GraduationCap,
  Wand2, Mic, Network, ArrowUpRight, Sparkles, Users, Building2
} from 'lucide-react';
import { InteractiveFeatureLab } from './InteractiveFeatureLab';
import { GlobalComparisonMatrix } from './GlobalComparisonMatrix';

const ICONS = [Wand2, FileUp, Mic, Brain, GraduationCap, Zap, ShieldCheck, QrCode, Network];
const ICON_STYLES = [
  'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
  'bg-indigo-500/15 border-indigo-500/30 text-indigo-400',
  'bg-rose-500/15 border-rose-500/30 text-rose-400',
  'bg-purple-500/15 border-purple-500/30 text-purple-400',
  'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
  'bg-amber-500/15 border-amber-500/30 text-amber-400',
  'bg-sky-500/15 border-sky-500/30 text-sky-400',
  'bg-teal-500/15 border-teal-500/30 text-teal-400',
  'bg-fuchsia-500/15 border-fuchsia-500/30 text-fuchsia-400',
];

const DEFAULT_TAGS = [
  '3 Chạm / 10 Giây • PLG',
  'MTEF v5 → LaTeX <2ms • -99% DB',
  '🎙️ Voice + Video + QR Zalo',
  'UAR → WPSE → Symposium • SCI 98.4%',
  'IRT 3-PL • DKT • FSRS v5 • 9 Dạng Đề',
  '6 Gameshow 60fps • <2ms RAM Lock',
  '3-Layer RLS • SHA-256 Merkle • PKI',
  '1-Sec QR • 13 Ngôn Ngữ Quốc Tế',
  'VietQR 25k • Stripe • Alipay • Web3',
];

const DEFAULT_ROUTES = [
  '/creator/studio',
  '/creator/questions',
  '/creator/questions',
  '/symposium',
  '/practice',
  '/arena',
  '/login',
  '/login',
  '/paywall',
];

const ITEM_PERSONAS: Array<Array<'all' | 'teacher' | 'enterprise' | 'learner'>> = [
  ['all', 'teacher'],
  ['all', 'teacher', 'enterprise'],
  ['all', 'teacher', 'learner'],
  ['all', 'teacher', 'enterprise'],
  ['all', 'teacher', 'learner', 'enterprise'],
  ['all', 'teacher', 'learner'],
  ['all', 'enterprise'],
  ['all', 'enterprise', 'learner'],
  ['all', 'teacher', 'enterprise'],
];

interface FeatureItem {
  title: string;
  desc: string;
  tag?: string;
  route?: string;
  cta?: string;
}

export function FeaturesSection() {
  const { t, i18n } = useTranslation('landing');
  const isVi = i18n.language?.startsWith('vi');
  const navigate = useNavigate();
  const [persona, setPersona] = useState<'all' | 'teacher' | 'enterprise' | 'learner'>('all');

  const rawItems = t('features.items', { returnObjects: true }) as FeatureItem[];
  const items = Array.isArray(rawItems) ? rawItems : [];
  const personas = t('features.personas', { returnObjects: true }) as any;

  const filteredItems = items
    .map((item, idx) => ({ item, idx }))
    .filter(({ idx }) => {
      if (persona === 'all') return true;
      const allowed = ITEM_PERSONAS[idx % ITEM_PERSONAS.length];
      return allowed.includes(persona);
    });

  return (
    <section id="features" className="py-20 sm:py-28 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
            <Sparkles size={13} /> {t('features.badge', { defaultValue: 'The Cognitive Intelligence & Verification Standard' })}
          </span>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            {t('features.title')}
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            {t('features.subtitle')}
          </p>
        </div>

        {/* Persona Filter Switcher */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {[
            { id: 'all', icon: Sparkles, label: personas?.all || '🌐 Toàn bộ Hệ sinh thái' },
            { id: 'teacher', icon: Users, label: personas?.teacher || '👩‍🏫 Giáo viên & Nhà trường (Mầm non → Đại học)' },
            { id: 'enterprise', icon: Building2, label: personas?.enterprise || '🏦 Ngân hàng & Tập đoàn Đa chi nhánh' },
            { id: 'learner', icon: GraduationCap, label: personas?.learner || '🎓 Học sinh & Tự luyện thi Thích ứng' },
          ].map(p => {
            const Icon = p.icon;
            const active = persona === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPersona(p.id as any)}
                className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900/70 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Icon size={14} />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Bento Breakthrough Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map(({ item, idx }) => {
            const Icon = ICONS[idx % ICONS.length] ?? Brain;
            const tag = item.tag || (item as any).metric || DEFAULT_TAGS[idx % DEFAULT_TAGS.length];
            const route = item.route || DEFAULT_ROUTES[idx % DEFAULT_ROUTES.length];
            return (
              <div
                key={item.title}
                onClick={() => navigate(route)}
                className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl p-6
                           hover:border-cyan-500/50 hover:bg-slate-900/90 hover:-translate-y-1 transition-all duration-300
                           flex flex-col justify-between cursor-pointer shadow-lg hover:shadow-cyan-950/40"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div
                      className={`w-11 h-11 rounded-xl border flex items-center justify-center ${ICON_STYLES[idx % ICON_STYLES.length]}`}
                    >
                      <Icon size={20} aria-hidden="true" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-950/90 border border-slate-800 text-cyan-300">
                      {tag}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
                  <span>{item.cta || t('features.tryNow', { defaultValue: isVi ? 'Trải nghiệm trực tiếp' : 'Experience Live' })}</span>
                  <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Technology Sandbox Lab */}
        <InteractiveFeatureLab />

        {/* Global Competitive Comparison Matrix */}
        <GlobalComparisonMatrix />
      </div>
    </section>
  );
}
export default FeaturesSection;
