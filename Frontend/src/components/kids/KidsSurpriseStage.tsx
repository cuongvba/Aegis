import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, ArrowRight, Sparkles, Star } from 'lucide-react';
import { KidsConceptAtom, KidsStageTheme } from '@/services/kidsCurriculum.service';
import { playStageSfx } from './kidsMusicEngine';
import { speakKidText } from './kidsSpeech';

interface KidsSurpriseStageProps {
  stageTheme: KidsStageTheme;
  atoms: KidsConceptAtom[];
  lang: string;
  onEarnStar: () => void;
  onFinishDiscovery: () => void;
}

export const KidsSurpriseStage: React.FC<KidsSurpriseStageProps> = ({
  stageTheme,
  atoms,
  lang,
  onEarnStar,
  onFinishDiscovery,
}) => {
  const [openedIndices, setOpenedIndices] = useState<number[]>([]);
  const [revealedIdx, setRevealedIdx] = useState<number | null>(null);
  const isVi = lang === 'vi';

  const propsPool = stageTheme.props && stageTheme.props.length > 0
    ? stageTheme.props
    : [{ emoji: '🎈', labelVi: 'Bóng Bí Ẩn', labelEn: 'Mystery Balloon', colorHex: '#f43f5e' }];

  const handleTapProp = (idx: number) => {
    const prop = propsPool[idx % propsPool.length];
    const atom = atoms[idx];
    playStageSfx(stageTheme.sfxType);
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.65 }, colors: [prop.colorHex, '#fbbf24', '#38bdf8'] });

    if (!openedIndices.includes(idx)) {
      setOpenedIndices((prev) => [...prev, idx]);
      onEarnStar();
    }
    setRevealedIdx(idx);

    const speakMsg = isVi
      ? `${prop.labelVi}! ${atom.secondaryText}. ${atom.sampleSentenceVi}`
      : `${prop.labelEn}! ${atom.primaryText}. ${atom.sampleSentenceEn}`;
    if (atom.voiceAudioUrl) {
      new Audio(atom.voiceAudioUrl).play().catch(() => speakKidText(speakMsg, isVi ? 'vi' : 'en'));
    } else {
      speakKidText(speakMsg, isVi ? 'vi' : 'en');
    }
  };

  const allOpened = openedIndices.length >= atoms.length;
  const activeAtom = revealedIdx !== null ? atoms[revealedIdx] : null;
  const activeProp = revealedIdx !== null ? propsPool[revealedIdx % propsPool.length] : null;

  return (
    <div
      style={stageTheme.backdropImageUrl ? { backgroundImage: `linear-gradient(rgba(15,23,42,0.45), rgba(15,23,42,0.55)), url(${stageTheme.backdropImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      className={`rounded-[2.4rem] bg-gradient-to-br ${stageTheme.backgroundGradient} p-5 sm:p-7 text-white shadow-2xl border-4 border-white space-y-5`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/25 backdrop-blur-sm px-4 py-1.5 text-xs sm:text-sm font-black">
          <span className="text-lg">{stageTheme.badgeEmoji}</span>
          {isVi ? stageTheme.titleVi : stageTheme.titleEn}
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/90 text-amber-700 px-3.5 py-1.5 text-xs font-black shadow-sm">
          <Star size={14} className="fill-amber-400 text-amber-500" />
          {openedIndices.length}/{atoms.length} {isVi ? 'đã mở' : 'opened'}
        </div>
      </div>

      <p className="text-center text-sm sm:text-base font-black drop-shadow-xs">
        ✨ {isVi ? 'Bé hãy chạm vào các vật phẩm sắc màu để khám phá điều bí mật nhé!' : 'Tap any colorful surprise to discover what is hidden inside!'}
      </p>

      {/* Interactive Props Playground */}
      <div className="flex flex-wrap justify-center gap-4 py-2">
        {atoms.map((atom, idx) => {
          const prop = propsPool[idx % propsPool.length];
          const isOpened = openedIndices.includes(idx);
          return (
            <button
              key={atom.atomCode}
              type="button"
              onClick={() => handleTapProp(idx)}
              style={{ borderColor: prop.colorHex }}
              className={`group relative w-28 h-32 sm:w-32 sm:h-36 rounded-[2rem] border-4 shadow-xl transition-all flex flex-col items-center justify-center gap-1.5 p-2 ${
                isOpened
                  ? 'bg-white text-slate-900 scale-95'
                  : 'bg-white/90 text-slate-900 hover:-translate-y-2 hover:scale-105 active:scale-95 animate-pulse'
              }`}
            >
              <span className="text-5xl sm:text-6xl drop-shadow-sm group-hover:scale-110 transition-transform">
                {isOpened ? atom.emoji : prop.emoji}
              </span>
              <span className="text-[11px] font-black text-center leading-tight line-clamp-2" style={{ color: prop.colorHex }}>
                {isOpened ? (isVi ? atom.secondaryText : atom.primaryText) : (isVi ? prop.labelVi : prop.labelEn)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Surprise Reveal Card */}
      {activeAtom && activeProp && (
        <div className="rounded-3xl bg-white text-slate-900 p-5 shadow-xl border-4 border-amber-200 flex flex-col sm:flex-row items-center gap-4 animate-fadeIn">
          {activeAtom.imageUrl ? (
            <img src={activeAtom.imageUrl} alt={activeAtom.secondaryText} className="w-24 h-24 rounded-2xl object-cover border-2 border-amber-200 shrink-0" />
          ) : (
            <div className="text-6xl sm:text-7xl shrink-0">{activeAtom.emoji}</div>
          )}
          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-indigo-600">
              <Sparkles size={12} /> {isVi ? activeProp.labelVi : activeProp.labelEn}
              {activeAtom.authorName && <span className="text-rose-600 ml-1">• ✍️ {activeAtom.authorName}</span>}
            </div>
            <h4 className="text-2xl font-black text-slate-900">
              {activeAtom.primaryText} <span className="text-orange-600">— {activeAtom.secondaryText}</span>
            </h4>
            <p className="text-xs sm:text-sm font-bold text-slate-600">
              {isVi ? activeAtom.sampleSentenceVi : activeAtom.sampleSentenceEn}
            </p>
            {(activeAtom.funFactVi || activeAtom.funFactEn) && (
              <p className="text-xs font-semibold text-cyan-700 bg-cyan-50 rounded-xl px-3 py-1.5 inline-block mt-1">
                💡 {isVi ? activeAtom.funFactVi : activeAtom.funFactEn}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => speakKidText(isVi ? `${activeAtom.secondaryText}. ${activeAtom.sampleSentenceVi}` : `${activeAtom.primaryText}. ${activeAtom.sampleSentenceEn}`, isVi ? 'vi' : 'en')}
            className="rounded-2xl bg-indigo-600 text-white px-4 py-2.5 text-xs font-black inline-flex items-center gap-1.5 shadow-md hover:bg-indigo-500 shrink-0"
          >
            <Volume2 size={15} /> {isVi ? 'Nghe lại' : 'Listen'}
          </button>
        </div>
      )}

      <div className="flex justify-center pt-1">
        <button
          type="button"
          onClick={onFinishDiscovery}
          className={`inline-flex items-center gap-2 rounded-3xl px-7 py-3.5 text-sm sm:text-base font-black shadow-xl transition ${
            allOpened
              ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 hover:scale-105'
              : 'bg-white/25 hover:bg-white/35 text-white backdrop-blur-sm'
          }`}
        >
          {allOpened
            ? (isVi ? 'Tuyệt Vời! Sang Vòng Trò Chơi Kho Báu' : 'Awesome! Start Treasure Games')
            : (isVi ? 'Vào Vòng Chơi Ngay' : 'Jump to Games')}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
