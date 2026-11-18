import React, { useEffect, useState } from 'react';
import { Volume2, Mic, ArrowRight, Sparkles, Star, Trophy, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { KidsLessonPlan, recordAtomOutcome } from '@/services/kidsCurriculum.service';
import { KidsSurpriseStage } from './KidsSurpriseStage';
import { speakKidText, stopKidSpeech } from './kidsSpeech';

interface KidsLessonPlayerProps {
  plan: KidsLessonPlan;
  lang: string;
  onEarnStars: (count: number) => void;
  onExit: () => void;
}

export const KidsLessonPlayer: React.FC<KidsLessonPlayerProps> = ({
  plan,
  lang,
  onEarnStars,
  onExit,
}) => {
  const [inSurpriseStage, setInSurpriseStage] = useState(Boolean(plan.stageTheme && plan.atoms.length > 0));
  const [stepIndex, setStepIndex] = useState(0);
  const [tappedCount, setTappedCount] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [earnedStars, setEarnedStars] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const isVi = lang === 'vi';
  // Filter out EXPOSE_CARD when Play-First Surprise Stage already revealed all atoms interactively
  const playableActivities = plan.stageTheme
    ? plan.activities.filter((a) => a.activityType !== 'EXPOSE_CARD')
    : plan.activities;
  const activity = playableActivities[stepIndex];
  const total = playableActivities.length;

  useEffect(() => {
    if (inSurpriseStage || !activity || isCompleted) return;
    setTappedCount([]);
    setFeedback(null);
    const speech = isVi ? activity.speechTextVi : activity.speechTextEn;
    speakKidText(speech, isVi ? 'vi' : 'en');
    return () => stopKidSpeech();
  }, [inSurpriseStage, stepIndex, isCompleted, isVi]);

  if (inSurpriseStage && plan.stageTheme && plan.atoms.length > 0) {
    return (
      <KidsSurpriseStage
        stageTheme={plan.stageTheme}
        atoms={plan.atoms}
        lang={lang}
        onEarnStar={() => { setEarnedStars((s) => s + 1); onEarnStars(1); }}
        onFinishDiscovery={() => setInSurpriseStage(false)}
      />
    );
  }

  if (isCompleted || !activity) {
    return (
      <div className="rounded-[2.5rem] bg-gradient-to-br from-amber-100 via-white to-cyan-100 border-4 border-white p-8 text-center shadow-2xl space-y-5">
        <div className="text-7xl animate-bounce">🏆</div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
          {isVi ? 'Tuyệt vời! Bé đã chinh phục xong chặng học!' : 'Awesome! Adventure Complete!'}
        </h2>
        <p className="text-base font-bold text-amber-700 flex items-center justify-center gap-2">
          <Star className="fill-amber-400 text-amber-500" /> +{earnedStars} {isVi ? 'Sao Trí Tuệ' : 'Wisdom Stars'}
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => { setStepIndex(0); setEarnedStars(0); setIsCompleted(false); }}
            className="inline-flex items-center gap-2 rounded-2xl bg-white border-2 border-indigo-200 px-5 py-3 font-black text-indigo-700 hover:bg-indigo-50"
          >
            <RotateCcw size={18} /> {isVi ? 'Chơi lại' : 'Play Again'}
          </button>
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-6 py-3 font-black text-white shadow-lg"
          >
            <Trophy size={18} /> {isVi ? 'Về Bản Đồ Đảo' : 'Back to Islands'}
          </button>
        </div>
      </div>
    );
  }

  const advanceNext = () => {
    if (stepIndex + 1 >= total) {
      confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
      setIsCompleted(true);
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const awardStar = (msg: string) => {
    setEarnedStars((s) => s + 1);
    onEarnStars(1);
    recordAtomOutcome(activity.atomCode, true);
    confetti({ particleCount: 40, spread: 55, origin: { y: 0.7 } });
    setFeedback({ ok: true, msg });
    speakKidText(msg, isVi ? 'vi' : 'en');
  };

  const handleOptionPick = (isCorrect: boolean) => {
    if (feedback?.ok) return;
    if (isCorrect) {
      awardStar(isVi ? 'Tuyệt vời quá! Bé giỏi lắm!' : 'Superstar! You got it!');
    } else {
      recordAtomOutcome(activity.atomCode, false);
      const retryMsg = isVi ? 'Gần đúng rồi! Bé thử chọn lại nhé!' : 'Almost! Try another one!';
      setFeedback({ ok: false, msg: retryMsg });
      speakKidText(retryMsg, isVi ? 'vi' : 'en');
    }
  };

  const pct = Math.round(((stepIndex + 1) / total) * 100);

  return (
    <div className="rounded-[2.2rem] bg-gradient-to-br from-amber-50 via-white to-sky-50 border-4 border-white p-5 sm:p-7 shadow-2xl space-y-5 text-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onExit}
          className="rounded-2xl bg-slate-100 hover:bg-slate-200 px-3.5 py-2 text-xs font-black text-slate-700"
        >
          ← {isVi ? 'Bản đồ Đảo' : 'Islands'}
        </button>
        <div className="flex-1 max-w-md h-3.5 rounded-full bg-slate-200/80 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-pink-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-2xl bg-amber-100 px-3 py-1.5 text-xs font-black text-amber-800">
          <Star size={14} className="fill-amber-400 text-amber-500" /> +{earnedStars}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-600">
          <Sparkles size={14} /> {isVi ? activity.titleVi : activity.titleEn} ({stepIndex + 1}/{total})
        </div>
        <button
          type="button"
          onClick={() => speakKidText(isVi ? activity.speechTextVi : activity.speechTextEn, isVi ? 'vi' : 'en')}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-indigo-600 text-white px-3.5 py-2 text-xs font-black shadow-sm hover:bg-indigo-500"
        >
          <Volume2 size={15} /> {isVi ? 'Nghe lại' : 'Listen'}
        </button>
      </div>

      {activity.activityType === 'EXPOSE_CARD' && (
        <div className="rounded-3xl bg-white border-2 border-amber-200 p-6 text-center space-y-4 shadow-sm">
          <div className="text-7xl sm:text-8xl animate-bounce" style={{ animationDuration: '2.4s' }}>
            {activity.emoji}
          </div>
          <div>
            <h3 className="text-3xl sm:text-4xl font-black text-indigo-700">{activity.primaryText}</h3>
            {activity.phonetic && <p className="text-sm font-mono text-slate-400 mt-0.5">{activity.phonetic}</p>}
            <p className="text-xl font-extrabold text-orange-600 mt-1">{activity.secondaryText}</p>
          </div>
          <p className="text-sm font-bold text-slate-600 max-w-lg mx-auto">
            {isVi ? activity.promptVi : activity.promptEn}
          </p>
          {(activity.funFactVi || activity.funFactEn) && (
            <div className="rounded-2xl bg-cyan-50 border border-cyan-200 px-4 py-2.5 text-xs font-bold text-cyan-800 max-w-lg mx-auto">
              💡 {isVi ? activity.funFactVi : activity.funFactEn}
            </div>
          )}
          <button
            type="button"
            onClick={() => { awardStar(isVi ? 'Giỏi lắm! Sang bước chơi nào!' : 'Great! Let’s play!'); setTimeout(advanceNext, 700); }}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-7 py-3.5 text-base font-black text-white shadow-lg hover:brightness-105"
          >
            {isVi ? 'Bé Đã Nhớ! Tiếp Tục' : 'Got It! Next'} <ArrowRight size={18} />
          </button>
        </div>
      )}

      {activity.activityType === 'INTERACT_COUNT' && (
        <div className="rounded-3xl bg-white border-2 border-cyan-200 p-6 text-center space-y-5">
          <p className="text-lg sm:text-xl font-black text-slate-800">
            {isVi ? activity.promptVi : activity.promptEn}
          </p>
          <div className="flex flex-wrap justify-center gap-3 py-2">
            {Array.from({ length: activity.visualCount || 3 }).map((_, idx) => {
              const active = tappedCount.includes(idx);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (!active) {
                      const next = [...tappedCount, idx];
                      setTappedCount(next);
                      speakKidText(String(next.length), isVi ? 'vi' : 'en');
                    }
                  }}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl text-4xl sm:text-5xl flex items-center justify-center border-4 transition-all ${
                    active
                      ? 'bg-amber-100 border-amber-400 scale-110 shadow-md'
                      : 'bg-slate-50 border-slate-200 hover:scale-105'
                  }`}
                >
                  {activity.emoji}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
            {activity.options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleOptionPick(opt.isCorrect)}
                className="rounded-3xl bg-gradient-to-b from-indigo-500 to-indigo-600 py-4 text-2xl font-black text-white shadow-md hover:brightness-110 active:scale-95 transition"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {activity.activityType === 'SPEAK_ECHO' && (
        <div className="rounded-3xl bg-white border-2 border-purple-200 p-6 text-center space-y-5">
          <div className="text-7xl">{activity.emoji}</div>
          <p className="text-xl sm:text-2xl font-black text-indigo-700">
            {isVi ? activity.promptVi : activity.promptEn}
          </p>
          <button
            type="button"
            onClick={() => awardStar(isVi ? 'Phát âm tuyệt vời lắm bé ơi!' : 'Amazing speaking!')}
            className="inline-flex items-center gap-3 rounded-3xl bg-gradient-to-r from-fuchsia-500 to-indigo-600 px-8 py-4 text-lg font-black text-white shadow-xl hover:scale-105 active:scale-95 transition"
          >
            <Mic size={22} /> {isVi ? 'Bé Đã Đọc To!' : 'I Said It Out Loud!'}
          </button>
        </div>
      )}

      {activity.activityType === 'MINI_CHALLENGE' && (
        <div className="rounded-3xl bg-white border-2 border-emerald-200 p-6 text-center space-y-5">
          <p className="text-xl sm:text-2xl font-black text-slate-900">
            {isVi ? activity.promptVi : activity.promptEn}
          </p>
          <div className="grid grid-cols-2 gap-3.5 max-w-xl mx-auto">
            {activity.options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleOptionPick(opt.isCorrect)}
                className="rounded-3xl border-4 border-slate-100 bg-slate-50 hover:border-cyan-400 hover:bg-cyan-50 p-5 flex flex-col items-center gap-2 transition active:scale-95 shadow-sm"
              >
                <span className="text-5xl">{opt.emoji}</span>
                <span className="text-base sm:text-lg font-black text-slate-800">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {feedback && (
        <div className={`rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 font-black text-sm ${
          feedback.ok ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300' : 'bg-amber-100 text-amber-800 border-2 border-amber-300'
        }`}>
          <span>🦉 {feedback.msg}</span>
          {feedback.ok && activity.activityType !== 'EXPOSE_CARD' && (
            <button
              type="button"
              onClick={advanceNext}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 text-white px-4 py-2 text-xs font-black hover:bg-emerald-500"
            >
              {isVi ? 'Tiếp theo' : 'Next'} <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
