import React, { useState } from 'react';
import { Award, CheckCircle2, Play, Shield, Sparkles, Volume2, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { KidsDynamicStageCanvas } from './KidsDynamicStageCanvas';
import { speakKidText } from './kidsSpeech';
import { playKidMelody } from './kidsMusicEngine';
import {
  getStudioAssets,
  recordHeroAscension,
  type DynamicKidsCourseGame,
} from './kidsStudioRegistry';

interface Props {
  open: boolean;
  game: DynamicKidsCourseGame | null;
  lang: string;
  onClose: () => void;
  onHeroEarned: (stars: number) => void;
}

export const KidsGameHeroPlayerModal: React.FC<Props> = ({ open, game, lang, onClose, onHeroEarned }) => {
  const [heroName, setHeroName] = useState('Chiến Binh Nhí');
  const [heroEmoji, setHeroEmoji] = useState('🦉');
  const [heroImg, setHeroImg] = useState<string | undefined>(undefined);
  const [started, setStarted] = useState(false);
  const [epIdx, setEpIdx] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [completedHero, setCompletedHero] = useState(false);

  if (!open || !game) return null;

  const charAssets = getStudioAssets('CHARACTER');
  const ep = game.episodes[epIdx] || game.episodes[0];

  const handleStartEpisode = (idx: number) => {
    setEpIdx(idx);
    setSelectedChoice(null);
    setFeedback(null);
    const target = game.episodes[idx];
    if (target?.musicAssetId) playKidMelody(target.musicAssetId === 'mu-hero' ? 'happy' : 'twinkle');
    if (target?.audioDataUrl) new Audio(target.audioDataUrl).play().catch(() => {});
    else if (target?.narration) speakKidText(target.narration, lang);
  };

  const handleNextOrAnswer = () => {
    if (ep.challengeOptions && ep.challengeOptions.length > 0) {
      if (selectedChoice === null) {
        setFeedback('Hãy chọn 1 đáp án để vượt qua thử thách tập này!');
        return;
      }
      if (selectedChoice !== (ep.challengeCorrectIndex ?? 0)) {
        setFeedback('Chưa chính xác rồi, thử suy nghĩ lại một chút nhé Hero!');
        return;
      }
    }

    if (epIdx < game.episodes.length - 1) {
      handleStartEpisode(epIdx + 1);
    } else {
      setCompletedHero(true);
      onHeroEarned(5);
      recordHeroAscension({
        id: `hero-${Date.now()}`,
        gameId: game.id,
        gameTitle: game.title,
        heroName: heroName.trim() || 'Hero Nhí',
        heroAvatar: heroEmoji,
        heroImageUrl: heroImg,
        badgeTitle: game.heroBadgeTitle || 'Anh Hùng Tri Thức',
        completedAt: new Date().toISOString(),
      });
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      speakKidText(`Xin chúc mừng ${heroName}! Bạn đã hoàn thành xuất sắc tất cả các tập và chính thức trở thành ${game.heroBadgeTitle}!`, lang);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border-4 border-amber-300 bg-white text-slate-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-500 text-white">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-300" />
            <h2 className="text-sm sm:text-base font-black">{game.title} ({game.episodes.length} Tập)</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-white/20"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {!started ? (
            <div className="rounded-3xl bg-amber-50 border-2 border-amber-200 p-5 space-y-4 text-center">
              <div className="text-4xl">🦸‍♂️✨</div>
              <h3 className="text-lg font-black text-slate-900">Hóa Thân Thành Nhân Vật Chính!</h3>
              <p className="text-slate-600 font-semibold">Chọn tên và hình ảnh đại diện của bạn. Bạn sẽ trực tiếp xuất hiện trong mọi tập của trò chơi và trở thành <b>{game.heroBadgeTitle}</b>!</p>
              <input
                value={heroName}
                onChange={(e) => setHeroName(e.target.value)}
                placeholder="Nhập tên Hero của bạn..."
                className="w-full max-w-sm mx-auto block rounded-2xl border-2 border-amber-300 bg-white px-4 py-2.5 text-sm font-black text-center"
              />
              <div className="flex flex-wrap justify-center gap-2">
                {charAssets.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setHeroEmoji(c.emoji || '🦸'); setHeroImg(c.dataUrl); }}
                    className={`p-2.5 rounded-2xl border-2 transition ${heroEmoji === (c.emoji || '🦸') && heroImg === c.dataUrl ? 'border-indigo-600 bg-indigo-50 scale-110' : 'border-slate-200 bg-white'}`}
                  >
                    {c.dataUrl ? <img src={c.dataUrl} alt={c.name} className="w-10 h-10 rounded-xl object-cover" /> : <span className="text-3xl">{c.emoji}</span>}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setStarted(true); handleStartEpisode(0); }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-white text-sm font-black shadow-lg hover:scale-105 transition"
              >
                <Play className="w-4 h-4 fill-current" /> Bắt Đầu Hóa Thân — Tập 1
              </button>
            </div>
          ) : completedHero ? (
            <div className="rounded-3xl bg-gradient-to-br from-amber-100 via-white to-indigo-100 border-4 border-amber-300 p-8 text-center space-y-4">
              <div className="text-6xl animate-bounce">🏆</div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500 text-white font-black text-xs">
                <Award className="w-4 h-4" /> DANH HIỆU HERO CHÍNH THỨC
              </div>
              <h3 className="text-2xl font-black text-slate-900">Chúc mừng {heroEmoji} {heroName}!</h3>
              <p className="text-sm font-bold text-indigo-800">
                Bạn đã chinh phục trọn vẹn {game.episodes.length} tập và chính thức trở thành <b>"{game.heroBadgeTitle}"</b> (+5 ⭐)!
              </p>
              <button onClick={onClose} className="px-6 py-2.5 rounded-2xl bg-indigo-600 text-white font-black">Hoàn Tất & Lưu Danh Hero</button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="font-black text-indigo-700 text-sm">{ep.episodeTitle}</span>
                <button onClick={() => speakKidText(ep.narration, lang)} className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-sky-100 text-sky-800 font-bold">
                  <Volume2 className="w-3.5 h-3.5" /> Nghe Lời Dẫn
                </button>
              </div>

              <KidsDynamicStageCanvas
                scene={ep}
                playerOverride={{ name: heroName, emoji: heroEmoji, imageUrl: heroImg }}
              />

              {ep.challengeQuestion && ep.challengeOptions && (
                <div className="rounded-2xl bg-indigo-50 border-2 border-indigo-200 p-4 space-y-2.5">
                  <div className="font-black text-indigo-900 text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" /> Thử thách qua tập: {ep.challengeQuestion}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ep.challengeOptions.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setSelectedChoice(idx); setFeedback(null); }}
                        className={`p-3 rounded-xl border-2 text-left font-bold transition ${selectedChoice === idx ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-white bg-white text-slate-800 hover:border-indigo-300'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {feedback && <div className="text-rose-600 font-bold">{feedback}</div>}
                </div>
              )}

              <div className="flex justify-end">
                <button onClick={handleNextOrAnswer} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-md">
                  <CheckCircle2 className="w-4 h-4" />
                  {epIdx < game.episodes.length - 1 ? `Qua Tập ${epIdx + 2}` : 'Hoàn Thành & Trở Thành HERO!'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
