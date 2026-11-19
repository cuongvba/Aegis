import React, { useState } from 'react';
import {
  ChevronDown,
  FileText,
  Film,
  Globe,
  Home,
  Lock,
  Music,
  Palette,
  Settings2,
  ShieldCheck,
  Wand2,
  Feather,
} from 'lucide-react';
import type { KidsLocaleProfile } from '@/services/kidsCurriculum.service';
import type { KidsVoiceProfile } from './kidsSpeech';

interface Props {
  isVi: boolean;
  lang: string;
  activeLocale?: KidsLocaleProfile;
  voices: KidsVoiceProfile[];
  selectedVoiceId: string;
  voiceRate: number;
  onGoHome: () => void;
  onGoOffice: () => void;
  onPlayMusic: () => void;
  onOpenTheater: () => void;
  onOpenYouthCreator: () => void;
  onOpenStages: () => void;
  onOpenReview: () => void;
  onOpenAiBuilder: () => void;
  onOpenLocaleModal: () => void;
  onOpenParentGate: () => void;
  onSelectVoice: (voiceId: string) => void;
  onSelectRate: (rate: number) => void;
}

export const KidsHeaderBar: React.FC<Props> = ({
  isVi,
  lang,
  activeLocale,
  voices,
  selectedVoiceId,
  voiceRate,
  onGoHome,
  onGoOffice,
  onPlayMusic,
  onOpenTheater,
  onOpenYouthCreator,
  onOpenStages,
  onOpenReview,
  onOpenAiBuilder,
  onOpenLocaleModal,
  onOpenParentGate,
  onSelectVoice,
  onSelectRate,
}) => {
  const [studioMenuOpen, setStudioMenuOpen] = useState(false);

  return (
    <header className="rounded-3xl bg-white/90 backdrop-blur-md border-4 border-white px-3.5 py-2.5 shadow-xl flex flex-wrap items-center justify-between gap-2.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onGoHome}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 text-xs font-black transition"
          title={isVi ? 'Quay về Trang chính' : 'Back to Home'}
        >
          <Home size={14} className="text-sky-600" />
          <span className="hidden sm:inline">{isVi ? 'Trang chính' : 'Home'}</span>
        </button>

        <div className="flex items-center gap-2 pl-1">
          <span className="text-2xl sm:text-3xl">🦉</span>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-orange-600 leading-none">Aegis Global</div>
            <h1 className="text-sm sm:text-base font-black text-slate-900 leading-tight">KIDS WONDERLAND</h1>
          </div>
        </div>
      </div>

      {/* Playful Kids Primary Actions */}
      <div className="flex items-center gap-1.5 bg-amber-50/90 border border-amber-200/80 rounded-2xl p-1">
        <button
          type="button"
          onClick={onPlayMusic}
          className="inline-flex items-center gap-1 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-700 px-3 py-1.5 text-xs font-black transition"
        >
          <Music size={14} /> {isVi ? 'Nhạc' : 'Music'}
        </button>
        <button
          type="button"
          onClick={onOpenTheater}
          className="inline-flex items-center gap-1 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1.5 text-xs font-black transition"
        >
          <Film size={14} /> {isVi ? 'Rạp Phim' : 'Theater'}
        </button>
        <button
          type="button"
          onClick={onOpenYouthCreator}
          className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-400 to-rose-400 text-white px-3 py-1.5 text-xs font-black shadow-sm hover:brightness-105 transition"
        >
          <Feather size={14} /> {isVi ? 'Sáng Tác' : 'Create'}
        </button>
      </div>

      {/* Teacher / Parent Studio Menu + Locale */}
      <div className="flex items-center gap-1.5">
        <div className="relative">
          <button
            type="button"
            onClick={() => setStudioMenuOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-300 px-3 py-2 text-xs font-black transition shadow-sm"
          >
            <Settings2 size={14} /> {isVi ? 'Giáo viên / Ba mẹ' : 'Studio & Voice'} <ChevronDown size={12} />
          </button>

          {studioMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border-2 border-slate-200 shadow-2xl p-2 z-50 space-y-1 text-xs text-slate-800">
              <button onClick={() => { onOpenAiBuilder(); setStudioMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-amber-50 font-bold text-left">
                <Wand2 size={14} className="text-amber-600" /> {isVi ? 'AI Tạo Bài Học Mới' : 'AI Lesson Builder'}
              </button>
              <button onClick={() => { onOpenStages(); setStudioMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-cyan-50 font-bold text-left">
                <Palette size={14} className="text-cyan-600" /> {isVi ? 'Sân Khấu & Chủ Đề (DB)' : 'Stage Manager'}
              </button>
              <button onClick={() => { onOpenReview(); setStudioMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-emerald-50 font-bold text-left">
                <ShieldCheck size={14} className="text-emerald-600" /> {isVi ? 'Duyệt Bài Bé Sáng Tác' : 'Review Submissions'}
              </button>
              <button onClick={() => { onOpenParentGate(); setStudioMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-50 font-bold text-left">
                <Lock size={14} className="text-rose-600" /> {isVi ? 'Cổng Phụ Huynh' : 'Parent Gate'}
              </button>
              <button onClick={() => { onGoOffice(); setStudioMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-indigo-50 font-bold text-left text-indigo-700">
                <FileText size={14} /> {isVi ? 'Mở Office Studio' : 'Open Office Studio'}
              </button>

              {voices.length > 0 && (
                <div className="pt-2 mt-1 border-t border-slate-200 space-y-1.5 px-1">
                  <div className="text-[11px] font-black text-slate-500">{isVi ? 'Giọng đọc & Tốc độ AI' : 'AI Voice & Speed'}</div>
                  <select
                    value={selectedVoiceId}
                    onChange={(e) => onSelectVoice(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-2 py-1.5 font-bold text-slate-800"
                  >
                    <option value="">🎙️ {isVi ? 'Giọng mặc định' : 'Auto Voice'}</option>
                    {voices.map((v) => (
                      <option key={v.voiceId} value={v.voiceId}>🎙️ {v.displayName}</option>
                    ))}
                  </select>
                  <select
                    value={voiceRate}
                    onChange={(e) => onSelectRate(Number(e.target.value) || 1.0)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-2 py-1.5 font-bold text-slate-800"
                  >
                    <option value={0.75}>🐢 0.75x</option>
                    <option value={0.9}>🐢 0.9x</option>
                    <option value={1}>🦉 1.0x</option>
                    <option value={1.15}>🚀 1.15x</option>
                    <option value={1.3}>⚡ 1.3x</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenLocaleModal}
          className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-800 hover:border-cyan-400 transition"
          title="Global Languages & Cultural Registry"
        >
          <Globe size={13} className="text-cyan-600" />
          <span>{activeLocale ? `${activeLocale.flagEmoji} ${activeLocale.nativeName}` : lang.toUpperCase()}</span>
        </button>
      </div>
    </header>
  );
};
