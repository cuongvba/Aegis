import React, { useState } from 'react';
import { Volume2, Star, Sparkles, Play, Wand2, Loader2 } from 'lucide-react';
import { kidsCurriculumService, KidsLessonPlan } from '@/services/kidsCurriculum.service';
import { KidsLessonPlayer } from './KidsLessonPlayer';
import { KidsAiBuilderModal } from './KidsAiBuilderModal';
import { speakKidText } from './kidsSpeech';

interface KidsWorldHubProps {
  stars: number;
  onEarnStars: (delta: number) => void;
  t: (key: string) => string;
  lang: string;
}

interface IslandDef {
  id: string;
  emoji: string;
  titleKey: string;
  descKey: string;
  gradient: string;
  border: string;
}

const ISLANDS: IslandDef[] = [
  {
    id: 'english',
    emoji: '🦁',
    titleKey: 'kidsIslandEnglish',
    descKey: 'kidsIslandEnglishDesc',
    gradient: 'from-amber-400 via-orange-400 to-rose-400',
    border: 'border-amber-200',
  },
  {
    id: 'math',
    emoji: '🧮',
    titleKey: 'kidsIslandMath',
    descKey: 'kidsIslandMathDesc',
    gradient: 'from-sky-400 via-cyan-400 to-indigo-500',
    border: 'border-cyan-200',
  },
  {
    id: 'science',
    emoji: '🚀',
    titleKey: 'kidsIslandScience',
    descKey: 'kidsIslandScienceDesc',
    gradient: 'from-emerald-400 via-teal-400 to-cyan-500',
    border: 'border-emerald-200',
  },
  {
    id: 'explore',
    emoji: '🌈',
    titleKey: 'kidsIslandExplore',
    descKey: 'kidsIslandExploreDesc',
    gradient: 'from-fuchsia-400 via-purple-400 to-indigo-500',
    border: 'border-purple-200',
  },
];

function getPetStage(stars: number, t: (k: string) => string) {
  if (stars >= 50) return { emoji: '🦉', label: t('kidsPetGuardian') };
  if (stars >= 20) return { emoji: '🐉', label: t('kidsPetDragon') };
  if (stars >= 5) return { emoji: '🐣', label: t('kidsPetChick') };
  return { emoji: '🥚', label: t('kidsPetEgg') };
}

export const KidsWorldHub: React.FC<KidsWorldHubProps> = ({
  stars,
  onEarnStars,
  t,
  lang,
}) => {
  const [ageBand, setAgeBand] = useState<string>('all');
  const [activePlan, setActivePlan] = useState<KidsLessonPlan | null>(null);
  const [loadingIsland, setLoadingIsland] = useState<string | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const isVi = lang === 'vi';
  const pet = getPetStage(stars, t);

  const launchIslandAdventure = async (islandId: string, band: string = ageBand) => {
    setLoadingIsland(islandId);
    try {
      const plan = await kidsCurriculumService.generateDailyAdventure(islandId, band, 3);
      setActivePlan(plan);
    } finally {
      setLoadingIsland(null);
    }
  };

  if (activePlan) {
    return (
      <KidsLessonPlayer
        plan={activePlan}
        lang={lang}
        onEarnStars={onEarnStars}
        onExit={() => setActivePlan(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2.2rem] bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 p-5 sm:p-7 shadow-xl border-4 border-white text-slate-900">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => speakKidText(t('kidsMascotGreeting'), lang)}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/90 shadow-lg flex items-center justify-center text-5xl sm:text-6xl hover:scale-105 active:scale-95 transition shrink-0"
              title={t('kidsSpeakGreeting')}
            >
              🦉
            </button>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-xs font-black text-orange-700 mb-1.5">
                <Sparkles size={13} /> AEGIS KIDS COGNITIVE GENESIS
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                {t('kidsHeroTitle')}
              </h2>
              <p className="text-sm font-bold text-slate-800/85 mt-1 flex flex-wrap items-center gap-2">
                {t('kidsMascotGreeting')}
                <button
                  type="button"
                  onClick={() => speakKidText(t('kidsMascotGreeting'), lang)}
                  className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-black text-indigo-700 shadow-xs hover:bg-white"
                >
                  <Volume2 size={14} /> {t('kidsListen')}
                </button>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="rounded-3xl bg-white/90 px-4 py-2.5 shadow-md flex items-center gap-2.5 border-2 border-amber-200">
              <span className="text-3xl">{pet.emoji}</span>
              <div>
                <div className="text-[11px] font-extrabold uppercase text-slate-500">{pet.label}</div>
                <div className="text-lg font-black text-amber-600 flex items-center gap-1">
                  <Star size={18} className="fill-amber-400 text-amber-500" /> {stars}
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white/90 px-2.5 py-2 shadow-md border-2 border-white flex items-center gap-1">
              {[
                { val: 'all', label: isVi ? 'Mọi tuổi' : 'All' },
                { val: '3-5', label: '3–5' },
                { val: '6-8', label: '6–8' },
                { val: '9-11', label: '9–11' },
              ].map((b) => (
                <button
                  key={b.val}
                  type="button"
                  onClick={() => setAgeBand(b.val)}
                  className={`px-2.5 py-1.5 rounded-2xl text-xs font-black transition ${
                    ageBand === b.val ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-3xl bg-slate-900 text-white px-4 py-3 text-xs font-black shadow-lg hover:bg-slate-800 transition"
            >
              <Wand2 size={14} className="text-amber-300" />
              {isVi ? 'AI Tạo Bài Mới' : 'AI Builder'}
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        {ISLANDS.map((island) => {
          const isLoading = loadingIsland === island.id;
          return (
            <button
              key={island.id}
              type="button"
              disabled={Boolean(loadingIsland)}
              onClick={() => {
                speakKidText(`${t(island.titleKey)}! ${t('kidsGoPlay')}`, lang);
                launchIslandAdventure(island.id);
              }}
              className={`group relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${island.gradient} p-6 sm:p-7 text-left text-white shadow-xl border-4 ${island.border} hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98] transition-all min-h-[168px] flex flex-col justify-between`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-block text-5xl sm:text-6xl drop-shadow-md group-hover:scale-110 transition-transform">
                    {island.emoji}
                  </span>
                  <h3 className="mt-3 text-xl sm:text-2xl font-black tracking-tight drop-shadow-xs">
                    {t(island.titleKey)}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm font-bold text-white/90">
                    {t(island.descKey)}
                  </p>
                </div>
                <div className="rounded-full bg-white/25 backdrop-blur-sm p-3.5 group-hover:bg-white group-hover:text-indigo-600 transition">
                  {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Play size={24} className="fill-current" />}
                </div>
              </div>
              <div className="mt-4 inline-flex items-center gap-1.5 self-start rounded-full bg-white/25 px-3.5 py-1 text-xs font-black backdrop-blur-xs">
                ✨ {isVi ? 'Khám phá → Chơi → Nói → Thử thách' : 'Discover → Play → Speak → Quest'}
              </div>
            </button>
          );
        })}
      </div>

      <KidsAiBuilderModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onBuiltAndPlay={(isl, band) => {
          setAgeBand(band);
          launchIslandAdventure(isl, band);
        }}
        lang={lang}
      />
    </div>
  );
};
