import React, { useState } from 'react';
import { Volume2, Star, Sparkles, Play } from 'lucide-react';
import type { PracticeConfig, TopicSummary } from '@/types/quiz';
import { speakKidText } from './kidsSpeech';

interface KidsWorldHubProps {
  topics: TopicSummary[];
  stars: number;
  onStartQuest: (config: PracticeConfig) => void;
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
  keywords: string[];
}

const ISLANDS: IslandDef[] = [
  {
    id: 'english',
    emoji: '🦁',
    titleKey: 'kidsIslandEnglish',
    descKey: 'kidsIslandEnglishDesc',
    gradient: 'from-amber-400 via-orange-400 to-rose-400',
    border: 'border-amber-200',
    keywords: ['TIENG_ANH', 'ENGLISH', 'ENG'],
  },
  {
    id: 'math',
    emoji: '🧮',
    titleKey: 'kidsIslandMath',
    descKey: 'kidsIslandMathDesc',
    gradient: 'from-sky-400 via-cyan-400 to-indigo-500',
    border: 'border-cyan-200',
    keywords: ['TOAN', 'MATH'],
  },
  {
    id: 'science',
    emoji: '🚀',
    titleKey: 'kidsIslandScience',
    descKey: 'kidsIslandScienceDesc',
    gradient: 'from-emerald-400 via-teal-400 to-cyan-500',
    border: 'border-emerald-200',
    keywords: ['SINH_HOC', 'VAT_LY', 'HOA_HOC', 'KHTN', 'SCIENCE'],
  },
  {
    id: 'explore',
    emoji: '🌈',
    titleKey: 'kidsIslandExplore',
    descKey: 'kidsIslandExploreDesc',
    gradient: 'from-fuchsia-400 via-purple-400 to-indigo-500',
    border: 'border-purple-200',
    keywords: ['GENERAL', 'GPLX', 'STUDIO'],
  },
];

function getPetStage(stars: number, t: (k: string) => string) {
  if (stars >= 50) return { emoji: '🦉', label: t('kidsPetGuardian') };
  if (stars >= 20) return { emoji: '🐉', label: t('kidsPetDragon') };
  if (stars >= 5) return { emoji: '🐣', label: t('kidsPetChick') };
  return { emoji: '🥚', label: t('kidsPetEgg') };
}

export const KidsWorldHub: React.FC<KidsWorldHubProps> = ({
  topics,
  stars,
  onStartQuest,
  t,
  lang,
}) => {
  const [questSize, setQuestSize] = useState<number>(5);
  const pet = getPetStage(stars, t);

  const resolveTopicKey = (island: IslandDef): string => {
    const matched = topics.find((tp) =>
      island.keywords.some(
        (kw) =>
          tp.key.toUpperCase().includes(kw) ||
          tp.name.toUpperCase().includes(kw)
      )
    );
    if (matched) return matched.key;
    return topics[0]?.key || island.keywords[0];
  };

  const handleIslandClick = (island: IslandDef) => {
    speakKidText(`${t(island.titleKey)}! ${t('kidsGoPlay')}`, lang);
    const topicKey = resolveTopicKey(island);
    onStartQuest({
      mode: 'kids',
      topicConfigs: [
        {
          topicKey,
          numberOfQuestions: questSize,
          isRandom: true,
          startIndex: 1,
        },
      ],
      shuffleOptions: true,
      shuffleQuestions: true,
      timeLimitSec: 0,
      autoNextOnTimeout: false,
      enableQuestionTimer: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* Mascot AstroOwl Banner */}
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
                <Sparkles size={13} /> AEGIS KIDS WORLD
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                {t('kidsHeroTitle')}
              </h2>
              <p className="text-sm font-bold text-slate-800/85 mt-1 flex items-center gap-2">
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

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-3xl bg-white/90 px-4 py-3 shadow-md flex items-center gap-2.5 border-2 border-amber-200">
              <span className="text-3xl">{pet.emoji}</span>
              <div>
                <div className="text-[11px] font-extrabold uppercase text-slate-500">{pet.label}</div>
                <div className="text-lg font-black text-amber-600 flex items-center gap-1">
                  <Star size={18} className="fill-amber-400 text-amber-500" /> {stars}
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white/90 px-3 py-2 shadow-md border-2 border-white flex items-center gap-1.5">
              {[5, 7, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQuestSize(n)}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-black transition ${
                    questSize === n
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {n} {t('matrixQuestionsUnit')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Adventure Island Grid (Fitts's Law Chunky Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        {ISLANDS.map((island) => (
          <button
            key={island.id}
            type="button"
            onClick={() => handleIslandClick(island)}
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
                <Play size={24} className="fill-current" />
              </div>
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 self-start rounded-full bg-white/25 px-3.5 py-1 text-xs font-black backdrop-blur-xs">
              ✨ {questSize} {t('matrixQuestionsUnit')} • {t('kidsGoPlay')}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
