import React, { useEffect, useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Headphones, Volume2 } from 'lucide-react';
import type { NotebookPodcastTurnDto } from '@/services/notebook.service';
import { speakKidText, stopKidSpeech } from '@/components/kids/kidsSpeech';

interface NotebookPodcastPlayerProps {
  title: string;
  turns: NotebookPodcastTurnDto[];
  language?: string;
}

export const NotebookPodcastPlayer: React.FC<NotebookPodcastPlayerProps> = ({
  title,
  turns,
  language = 'vi',
}) => {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [rate, setRate] = useState<number>(1.0);

  const locale = language === 'en' ? 'en-US' : 'vi-VN';

  useEffect(() => {
    return () => stopKidSpeech();
  }, []);

  const playTurn = (idx: number) => {
    const turn = turns[idx];
    if (!turn) return;
    setActiveIdx(idx);
    setIsPlaying(true);
    speakKidText(turn.text, locale, turn.voiceId, rate);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopKidSpeech();
      setIsPlaying(false);
    } else {
      playTurn(activeIdx);
    }
  };

  if (!turns || turns.length === 0) return null;

  return (
    <div className="rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-indigo-950/70 via-slate-900 to-fuchsia-950/50 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
            <Headphones size={16} />
          </div>
          <div>
            <h4 className="text-sm font-black text-white">{title}</h4>
            <p className="text-[11px] text-slate-400">
              Podcast 2 MC (Cô Hoài Mỹ & Chú Nam Minh) · Lượt {activeIdx + 1}/{turns.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => playTurn(Math.max(0, activeIdx - 1))} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200">
            <SkipBack size={14} />
          </button>
          <button type="button" onClick={togglePlay} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:brightness-110 px-4 py-2 text-xs font-black text-white shadow-md">
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? 'Tạm dừng' : 'Nghe Podcast'}
          </button>
          <button type="button" onClick={() => playTurn(Math.min(turns.length - 1, activeIdx + 1))} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200">
            <SkipForward size={14} />
          </button>
          <select
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="rounded-xl bg-slate-950 border border-slate-700 px-2 py-1.5 text-xs font-bold text-amber-300"
          >
            <option value={0.9}>0.9x</option>
            <option value={1.0}>1.0x</option>
            <option value={1.15}>1.15x</option>
          </select>
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {turns.map((turn, idx) => {
          const active = idx === activeIdx && isPlaying;
          const isFemale = turn.speaker === 'HOST_F';
          return (
            <button
              key={idx}
              type="button"
              onClick={() => playTurn(idx)}
              className={`w-full text-left rounded-xl p-3 border transition flex items-start gap-2.5 ${
                active
                  ? 'border-fuchsia-400 bg-fuchsia-950/40 shadow-md'
                  : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
              }`}
            >
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${
                isFemale ? 'bg-pink-500/20 text-pink-300' : 'bg-sky-500/20 text-sky-300'
              }`}>
                {turn.speakerName}
              </span>
              <span className="text-xs text-slate-200 leading-relaxed flex-1">{turn.text}</span>
              <Volume2 size={14} className={active ? 'text-fuchsia-300 shrink-0' : 'text-slate-600 shrink-0'} />
            </button>
          );
        })}
      </div>
    </div>
  );
};
