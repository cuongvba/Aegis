import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, Star, Sparkles, Play, Wand2, Loader2, Music, Film, Lock, Palette, Feather, ShieldCheck, Globe } from 'lucide-react';
import { kidsCurriculumService, KidsLessonPlan, KidsLocaleProfile } from '@/services/kidsCurriculum.service';
import { useLearnerI18n } from '@/lib/i18n';
import { KidsMagicalBackdrop } from '@/components/kids/KidsMagicalBackdrop';
import { KidsLessonPlayer } from '@/components/kids/KidsLessonPlayer';
import { KidsAiBuilderModal } from '@/components/kids/KidsAiBuilderModal';
import { KidsParentGateModal } from '@/components/kids/KidsParentGateModal';
import { KidsTheaterModal } from '@/components/kids/KidsTheaterModal';
import { KidsStageManagerModal } from '@/components/kids/KidsStageManagerModal';
import { YouthCreatorStudioModal } from '@/components/kids/YouthCreatorStudioModal';
import { KidsReviewModal } from '@/components/kids/KidsReviewModal';
import { KidsGlobalLocaleModal } from '@/components/kids/KidsGlobalLocaleModal';
import { playKidMelody } from '@/components/kids/kidsMusicEngine';
import {
  speakKidText,
  fetchKidsVoices,
  getSelectedKidVoiceId,
  setSelectedKidVoiceId,
  getSelectedKidVoiceRate,
  setSelectedKidVoiceRate,
  KidsVoiceProfile,
} from '@/components/kids/kidsSpeech';

interface KingdomDef {
  id: string;
  emoji: string;
  titleVi: string;
  titleEn: string;
  descVi: string;
  descEn: string;
  gradient: string;
  border: string;
}

const KINGDOMS: KingdomDef[] = [
  {
    id: 'music',
    emoji: '🎵',
    titleVi: 'Vương Quốc Lời Ca Tiếng Hát',
    titleEn: 'Sing & Music Kingdom',
    descVi: 'Giai điệu vui tươi, bài ca ABC & 7 nốt nhạc cầu vồng!',
    descEn: 'Cheerful melodies, ABC songs & rainbow musical notes!',
    gradient: 'from-rose-400 via-pink-500 to-amber-400',
    border: 'border-rose-200',
  },
  {
    id: 'animals',
    emoji: '🦁',
    titleVi: 'Thế Giới Muôn Thú',
    titleEn: 'Wild Animal Safari',
    descVi: 'Sư tử, voi con, cá heo, bướm xinh & âm thanh thiên nhiên!',
    descEn: 'Lions, elephants, dolphins & wonderful wildlife facts!',
    gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
    border: 'border-emerald-200',
  },
  {
    id: 'toys',
    emoji: '🧸',
    titleVi: 'Thế Giới Đồ Chơi & Số Đếm',
    titleEn: 'Toyland & Counting',
    descVi: 'Gấu bông, tàu hỏa, khối xếp hình & bóng bay sắc màu!',
    descEn: 'Teddy bears, toy trains, building blocks & balloons!',
    gradient: 'from-sky-400 via-cyan-500 to-indigo-500',
    border: 'border-cyan-200',
  },
  {
    id: 'fairytale',
    emoji: '🧚',
    titleVi: 'Thế Giới Thần Tiên & Cổ Tích',
    titleEn: 'Fairy Tale Wonderland',
    descVi: 'Lâu đài pha lê, kỳ lân ánh sao, cô tiên & cầu vồng!',
    descEn: 'Magic castles, unicorns, garden fairies & rainbows!',
    gradient: 'from-fuchsia-400 via-purple-500 to-indigo-600',
    border: 'border-purple-200',
  },
  {
    id: 'heritage',
    emoji: '🐉',
    titleVi: 'Huyền Tích & Anh Hùng Dân Tộc',
    titleEn: 'National Heritage & Heroes',
    descVi: 'Con Rồng Cháu Tiên, Thánh Gióng, Bánh Chưng & tinh hoa cội nguồn!',
    descEn: 'Legends, national heroes & timeless cultural pride of every homeland!',
    gradient: 'from-red-500 via-amber-500 to-yellow-500',
    border: 'border-amber-200',
  },
];

function getPetStage(stars: number, isVi: boolean) {
  if (stars >= 50) return { emoji: '🦉', label: isVi ? 'Vệ Binh Ngôi Sao' : 'Star Guardian' };
  if (stars >= 20) return { emoji: '🐉', label: isVi ? 'Rồng Nhí Trí Tuệ' : 'Wisdom Dragon' };
  if (stars >= 5) return { emoji: '🐣', label: isVi ? 'Gà Con Thông Thái' : 'Baby Chick' };
  return { emoji: '🥚', label: isVi ? 'Trứng Kỳ Diệu' : 'Magic Egg' };
}

export const KidsWorldPage: React.FC = () => {
  const navigate = useNavigate();
  const { lang, setLang, t } = useLearnerI18n();
  const isVi = lang === 'vi';

  const [ageBand, setAgeBand] = useState('all');
  const [stars, setStars] = useState<number>(() => Number(localStorage.getItem('aegis-kids-stars') || '0') || 0);
  const [activePlan, setActivePlan] = useState<KidsLessonPlan | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isTheaterOpen, setIsTheaterOpen] = useState(false);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [isYouthCreatorOpen, setIsYouthCreatorOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isLocaleModalOpen, setIsLocaleModalOpen] = useState(false);
  const [locales, setLocales] = useState<KidsLocaleProfile[]>([]);
  const [activeLocaleCode, setActiveLocaleCode] = useState<string>(() => localStorage.getItem('aegis-kids-locale') || 'vi-VN');
  const [voices, setVoices] = useState<KidsVoiceProfile[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(() => getSelectedKidVoiceId());
  const [voiceRate, setVoiceRate] = useState<number>(() => getSelectedKidVoiceRate());
  const [isGateOpen, setIsGateOpen] = useState(false);

  useEffect(() => {
    kidsCurriculumService.getLocaleProfiles().then(setLocales).catch(() => {});
  }, []);

  const activeLocale = locales.find((l) => l.localeCode === activeLocaleCode) || locales[0];
  const speechLang = activeLocale?.speechTag || lang;

  useEffect(() => {
    const load = () => {
      fetchKidsVoices(speechLang).then(setVoices).catch(() => {});
    };
    load();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = load;
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, [speechLang]);

  const pet = getPetStage(stars, isVi);

  const earnStars = (delta: number) => {
    setStars((prev) => {
      const next = prev + delta;
      localStorage.setItem('aegis-kids-stars', String(next));
      return next;
    });
  };

  const launchKingdom = async (kingdomId: string, band: string = ageBand, stageCode?: string) => {
    setLoadingId(kingdomId);
    playKidMelody(kingdomId === 'music' ? 'twinkle' : 'happy');
    try {
      const plan = await kidsCurriculumService.generateDailyAdventure(kingdomId, band, 3, stageCode, activeLocale?.regionCode);
      setActivePlan(plan);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div dir={activeLocale?.direction || 'ltr'} className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-sky-200 via-amber-100/70 to-rose-100 text-slate-900">
      <KidsMagicalBackdrop particleMode={activePlan?.stageTheme?.particleMode || 'sky'} />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-4 sm:py-6 space-y-6">
        {/* Top Bar riêng của Kids World */}
        <header className="rounded-3xl bg-white/85 backdrop-blur-md border-4 border-white px-4 py-3 shadow-lg flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🦉</span>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-orange-600">Aegis Global</div>
              <h1 className="text-base sm:text-lg font-black text-slate-900">KIDS WONDERLAND</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => playKidMelody('twinkle')}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-pink-100 hover:bg-pink-200 text-pink-700 px-3 py-2 text-xs font-black transition"
            >
              <Music size={14} /> {isVi ? 'Nghe Nhạc' : 'Music'}
            </button>
            <button
              type="button"
              onClick={() => setIsTheaterOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-2 text-xs font-black transition"
            >
              <Film size={14} /> {isVi ? 'Rạp Phim & Đàn' : 'Theater'}
            </button>
            <button
              type="button"
              onClick={() => setIsStageModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-cyan-100 hover:bg-cyan-200 text-cyan-800 px-3 py-2 text-xs font-black transition"
            >
              <Palette size={14} /> {isVi ? 'Sân Khấu (DB)' : 'Stages'}
            </button>
            <button
              type="button"
              onClick={() => setIsYouthCreatorOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-amber-400 to-rose-400 text-white px-3 py-2 text-xs font-black shadow-sm hover:brightness-105 transition"
            >
              <Feather size={14} /> {isVi ? 'Sáng Tác' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setIsReviewOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-3 py-2 text-xs font-black transition"
            >
              <ShieldCheck size={14} /> {isVi ? 'Duyệt Bài' : 'Review'}
            </button>
            <button
              type="button"
              onClick={() => setIsAiOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-900 text-amber-300 px-3 py-2 text-xs font-black hover:bg-slate-800 transition"
            >
              <Wand2 size={14} /> {isVi ? 'AI Tạo Bài' : 'AI Builder'}
            </button>
            {voices.length > 0 && (
              <div className="inline-flex items-center gap-1.5">
                <select
                  value={selectedVoiceId}
                  onChange={(e) => {
                    const vid = e.target.value;
                    setSelectedVoiceId(vid);
                    setSelectedKidVoiceId(vid);
                    speakKidText(isVi ? 'Xin chào bé yêu! Mình cùng khám phá nhé!' : 'Hello little explorer!', speechLang, vid, voiceRate);
                  }}
                  aria-label="Kids Voice"
                  className="rounded-2xl border-2 border-indigo-200 bg-indigo-50/70 px-2.5 py-1.5 text-xs font-black text-indigo-800 hover:border-indigo-400 focus:outline-none max-w-[165px]"
                  title={isVi ? 'Chọn giọng đọc AI' : 'Select AI Voice'}
                >
                  <option value="">🎙️ {isVi ? 'Giọng mặc định' : 'Auto Voice'}</option>
                  {voices.map((v) => (
                    <option key={v.voiceId} value={v.voiceId}>
                      🎙️ {v.displayName}
                    </option>
                  ))}
                </select>
                <select
                  value={voiceRate}
                  onChange={(e) => {
                    const r = Number(e.target.value) || 1.0;
                    setVoiceRate(r);
                    setSelectedKidVoiceRate(r);
                    speakKidText(isVi ? 'Tốc độ đọc mới nè bé ơi!' : 'Here is my new reading speed!', speechLang, selectedVoiceId, r);
                  }}
                  aria-label="Voice Speed"
                  className="rounded-2xl border-2 border-amber-200 bg-amber-50/80 px-2 py-1.5 text-xs font-black text-amber-800 hover:border-amber-400 focus:outline-none"
                  title={isVi ? 'Tốc độ đọc' : 'Reading Speed'}
                >
                  <option value={0.75}>🐢 0.75x</option>
                  <option value={0.9}>🐢 0.9x</option>
                  <option value={1}>🦉 1.0x</option>
                  <option value={1.15}>🚀 1.15x</option>
                  <option value={1.3}>⚡ 1.3x</option>
                </select>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsLocaleModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-800 hover:border-cyan-400 transition"
              title="Global Languages & Cultural Registry"
            >
              <Globe size={13} className="text-cyan-600" />
              <span>{activeLocale ? `${activeLocale.flagEmoji} ${activeLocale.nativeName}` : lang.toUpperCase()}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsGateOpen(true)}
              className="inline-flex items-center gap-1 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-2 text-xs font-black transition"
            >
              <Lock size={13} /> {isVi ? 'Phụ huynh' : 'Parent'}
            </button>
          </div>
        </header>

        {activePlan ? (
          <KidsLessonPlayer
            plan={activePlan}
            lang={speechLang}
            onEarnStars={earnStars}
            onExit={() => setActivePlan(null)}
          />
        ) : (
          <>
            {/* Hero Mascot & Thú cưng */}
            <section className="rounded-[2.4rem] bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 p-6 shadow-xl border-4 border-white flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => speakKidText(t('kidsMascotGreeting'), speechLang)}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/95 shadow-lg flex items-center justify-center text-5xl sm:text-6xl hover:scale-105 active:scale-95 transition shrink-0"
                >
                  🦉
                </button>
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-xs font-black text-orange-700 mb-1">
                    <Sparkles size={13} /> {isVi ? 'THẾ GIỚI TUỔI THƠ KỲ DIỆU' : 'MAGICAL CHILDHOOD UNIVERSE'}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                    {isVi ? 'Chào Bé Yêu! Mình Cùng Phiêu Lưu Nhé!' : 'Welcome Little Explorer!'}
                  </h2>
                  <p className="text-sm font-bold text-slate-800/85 mt-1 flex flex-wrap items-center gap-2">
                    {t('kidsMascotGreeting')}
                    <button
                      type="button"
                      onClick={() => speakKidText(t('kidsMascotGreeting'), speechLang)}
                      className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-black text-indigo-700"
                    >
                      <Volume2 size={14} /> {t('kidsListen')}
                    </button>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="rounded-3xl bg-white/95 px-4 py-2.5 shadow-md flex items-center gap-2.5 border-2 border-amber-200">
                  <span className="text-3xl">{pet.emoji}</span>
                  <div>
                    <div className="text-[11px] font-extrabold uppercase text-slate-500">{pet.label}</div>
                    <div className="text-lg font-black text-amber-600 flex items-center gap-1">
                      <Star size={18} className="fill-amber-400 text-amber-500" /> {stars}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl bg-white/95 px-2.5 py-2 shadow-md flex items-center gap-1">
                  {[{ v: 'all', l: isVi ? 'Mọi tuổi' : 'All' }, { v: '3-5', l: '3–5' }, { v: '6-8', l: '6–8' }, { v: '9-11', l: '9–11' }].map((b) => (
                    <button
                      key={b.v}
                      type="button"
                      onClick={() => setAgeBand(b.v)}
                      className={`px-2.5 py-1.5 rounded-2xl text-xs font-black transition ${
                        ageBand === b.v ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {b.l}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* 4 Vương Quốc Tuổi Thơ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {KINGDOMS.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  disabled={Boolean(loadingId)}
                  onClick={() => {
                    speakKidText(isVi ? k.titleVi : k.titleEn, speechLang);
                    launchKingdom(k.id);
                  }}
                  className={`group relative overflow-hidden rounded-[2.2rem] bg-gradient-to-br ${k.gradient} p-6 sm:p-7 text-left text-white shadow-xl border-4 ${k.border} hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98] transition-all min-h-[176px] flex flex-col justify-between`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-block text-5xl sm:text-6xl drop-shadow-md group-hover:scale-110 transition-transform">
                        {k.emoji}
                      </span>
                      <h3 className="mt-3 text-xl sm:text-2xl font-black tracking-tight drop-shadow-xs">
                        {isVi ? k.titleVi : k.titleEn}
                      </h3>
                      <p className="mt-1 text-xs sm:text-sm font-bold text-white/95">
                        {isVi ? k.descVi : k.descEn}
                      </p>
                    </div>
                    <div className="rounded-full bg-white/25 backdrop-blur-sm p-3.5 group-hover:bg-white group-hover:text-indigo-600 transition">
                      {loadingId === k.id ? <Loader2 size={24} className="animate-spin" /> : <Play size={24} className="fill-current" />}
                    </div>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1.5 self-start rounded-full bg-white/25 px-3.5 py-1 text-xs font-black">
                    ✨ {isVi ? 'Âm thanh · Hình ảnh · Trò chơi 4 bước' : 'Music · Visuals · 4-Step Adventure'}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <KidsTheaterModal
        isOpen={isTheaterOpen}
        onClose={() => setIsTheaterOpen(false)}
        lang={speechLang}
        culturalScaleId={activeLocale?.culturalScaleId || 'western_major'}
      />
      <KidsGlobalLocaleModal
        isOpen={isLocaleModalOpen}
        onClose={() => setIsLocaleModalOpen(false)}
        locales={locales}
        activeLocaleCode={activeLocaleCode}
        onSelectLocale={(loc) => {
          setActiveLocaleCode(loc.localeCode);
          localStorage.setItem('aegis-kids-locale', loc.localeCode);
          setLang(loc.langCode as any);
        }}
        onAddedLocale={(loc) => setLocales((prev) => [...prev, loc])}
      />
      <KidsStageManagerModal
        isOpen={isStageModalOpen}
        onClose={() => setIsStageModalOpen(false)}
        onSelectStageToPlay={(st) => launchKingdom(st.preferredIslands?.[0] || 'fairytale', ageBand, st.stageCode)}
        lang={lang}
      />
      <YouthCreatorStudioModal isOpen={isYouthCreatorOpen} onClose={() => setIsYouthCreatorOpen(false)} lang={lang} />
      <KidsReviewModal isOpen={isReviewOpen} onClose={() => setIsReviewOpen(false)} lang={lang} />
      <KidsAiBuilderModal
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        onBuiltAndPlay={(isl, band) => { setAgeBand(band); launchKingdom(isl, band); }}
        lang={lang}
        regionCode={activeLocale?.regionCode}
        languageCode={activeLocale?.langCode}
      />
      <KidsParentGateModal
        isOpen={isGateOpen}
        onClose={() => setIsGateOpen(false)}
        onUnlocked={() => { setIsGateOpen(false); navigate('/practice'); }}
        t={t}
      />
    </div>
  );
};
