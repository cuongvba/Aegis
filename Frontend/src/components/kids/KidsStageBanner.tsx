import React, { useEffect } from 'react';
import { Volume2, Star, Flame } from 'lucide-react';
import { speakKidText, stopKidSpeech } from './kidsSpeech';

interface KidsStageBannerProps {
  questionContent: string;
  currentIndex: number;
  totalQuestions: number;
  streak: number;
  stars: number;
  feedback: string;
  lang: string;
  t: (key: string) => string;
}

export const KidsStageBanner: React.FC<KidsStageBannerProps> = ({
  questionContent,
  currentIndex,
  totalQuestions,
  streak,
  stars,
  feedback,
  lang,
  t,
}) => {
  useEffect(() => {
    speakKidText(questionContent, lang);
    return () => stopKidSpeech();
  }, [questionContent, lang]);

  const pct = totalQuestions > 0 ? Math.round(((currentIndex + 1) / totalQuestions) * 100) : 0;

  return (
    <div className="rounded-3xl bg-gradient-to-r from-amber-100 via-rose-50 to-cyan-100 border-4 border-white p-3.5 sm:p-4 shadow-md space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-3xl sm:text-4xl animate-bounce" style={{ animationDuration: '2.2s' }}>
            🦉
          </span>
          <div>
            <div className="text-xs sm:text-sm font-black text-slate-800">
              {feedback || t('kidsMascotCheer')}
            </div>
            <div className="flex items-center gap-2 text-[11px] font-extrabold text-amber-700">
              <span className="inline-flex items-center gap-1">
                <Star size={12} className="fill-amber-400 text-amber-500" /> {stars}
              </span>
              {streak > 0 && (
                <span className="inline-flex items-center gap-1 text-orange-600">
                  <Flame size={12} /> {streak} {t('kidsStreakLabel')}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => speakKidText(questionContent, lang)}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-3.5 py-2 text-xs font-black text-white shadow-sm hover:brightness-105 active:scale-95 transition"
        >
          <Volume2 size={15} /> {t('kidsReadAloud')}
        </button>
      </div>

      <div className="h-3 w-full rounded-full bg-white/90 overflow-hidden border border-amber-200/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 via-pink-400 to-cyan-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
