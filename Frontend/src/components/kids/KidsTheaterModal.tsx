import React, { useEffect, useState } from 'react';
import { X, Play, Pause, Music, Film, Sparkles } from 'lucide-react';
import { playKidMelody, playXylophoneNote, CULTURAL_SCALES, XYLOPHONE_NOTES } from './kidsMusicEngine';
import { speakKidText, stopKidSpeech } from './kidsSpeech';

interface KidsTheaterModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  culturalScaleId?: string;
}

const STORIES = [
  {
    id: 'twinkle',
    emoji: '🌟',
    titleVi: 'Bài Hát: Ngôi Sao Lấp Lánh',
    titleEn: 'Song: Twinkle Little Star',
    scenes: [
      { emoji: '🌙✨', vi: 'Đêm xuống dịu êm, bầu trời khoác áo nhung xanh thẳm...', en: 'Soft night falls across the starry blue sky...' },
      { emoji: '🌟💫', vi: 'Lấp lánh ngôi sao nhỏ như viên kim cương tỏa sáng trên cao!', en: 'Twinkle, twinkle, little star, like a diamond in the sky!' },
      { emoji: '🦉🎶', vi: 'Bạn Cú Mèo AstroOwl cất tiếng hát ru cả khu rừng ngủ ngon!', en: 'AstroOwl sings a gentle lullaby to the whole forest!' },
    ],
  },
  {
    id: 'safari',
    emoji: '🦁',
    titleVi: 'Hoạt Hình: Đại Nhạc Hội Muôn Thú',
    titleEn: 'Story: Animal Jungle Concert',
    scenes: [
      { emoji: '🦁🥁', vi: 'Sáng sớm ở Thảo Nguyên, chú Sư Tử gõ trống tùng tùng!', en: 'Early morning in the savanna, Brave Lion plays the drum!' },
      { emoji: '🐘🎺', vi: 'Chú Voi Con giơ vòi thổi kèn vang khắp núi rừng!', en: 'Friendly Elephant trumpets a cheerful tune!' },
      { emoji: '🦋💃', vi: 'Đàn Bướm rực rỡ và Cá Heo cùng nhảy múa tưng bừng!', en: 'Colorful Butterflies and Dolphins dance together!' },
    ],
  },
  {
    id: 'fairy',
    emoji: '🧚',
    titleVi: 'Cổ Tích: Lâu Đài Cầu Vồng',
    titleEn: 'Fairy Tale: Rainbow Castle',
    scenes: [
      { emoji: '🌈🏰', vi: 'Sau cơn mưa rào, chiếc cầu vồng bắc qua lâu đài pha lê.', en: 'After the rain, a rainbow bridge leads to the crystal castle.' },
      { emoji: '🦄✨', vi: 'Chú Kỳ Lân Ánh Sao đón bé bước vào khu vườn đom đóm.', en: 'Star Unicorn welcomes you into the glowing firefly garden.' },
      { emoji: '🧚💖', vi: 'Cô Tiên rắc bụi sao ước mơ chúc bé mỗi ngày thêm thông minh!', en: 'Garden Fairy sprinkles stardust to make every dream shine!' },
    ],
  },
];

export const KidsTheaterModal: React.FC<KidsTheaterModalProps> = ({ isOpen, onClose, lang, culturalScaleId = 'western_major' }) => {
  const [selectedId, setSelectedId] = useState('twinkle');
  const [sceneIdx, setSceneIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [customVideoUrl, setCustomVideoUrl] = useState('');
  const [activeScaleId, setActiveScaleId] = useState(culturalScaleId);

  useEffect(() => {
    setActiveScaleId(culturalScaleId);
  }, [culturalScaleId]);

  const isVi = lang.toLowerCase().startsWith('vi');
  const story = STORIES.find((s) => s.id === selectedId) || STORIES[0];
  const scene = story.scenes[sceneIdx] || story.scenes[0];

  useEffect(() => {
    if (!isOpen || !isPlaying) return;
    const text = isVi ? scene.vi : scene.en;
    speakKidText(text, lang);
    const stopMelody = playKidMelody(selectedId === 'twinkle' ? 'twinkle' : 'happy');
    const timer = window.setTimeout(() => {
      if (sceneIdx + 1 < story.scenes.length) {
        setSceneIdx((i) => i + 1);
      } else {
        setIsPlaying(false);
        setSceneIdx(0);
      }
    }, 4500);

    return () => {
      window.clearTimeout(timer);
      stopMelody();
      stopKidSpeech();
    };
  }, [isOpen, isPlaying, sceneIdx, selectedId, isVi]);

  if (!isOpen) return null;

  const embedYoutube = customVideoUrl.includes('youtube.com/watch?v=')
    ? customVideoUrl.replace('watch?v=', 'embed/')
    : customVideoUrl.includes('youtu.be/')
    ? `https://www.youtube.com/embed/${customVideoUrl.split('youtu.be/')[1]?.split('?')[0]}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-[2rem] bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 border-4 border-amber-300/60 p-5 sm:p-6 text-white shadow-2xl space-y-5">
        <button
          type="button"
          onClick={() => { setIsPlaying(false); stopKidSpeech(); onClose(); }}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-pink-500 to-amber-400 text-white shadow-lg">
            <Film size={22} />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black">
              {isVi ? 'Rạp Phim Hoạt Hình & Sân Khấu Âm Nhạc' : 'Kids Theater & Sing-Along Stage'}
            </h3>
            <p className="text-xs text-purple-200">
              {isVi ? 'Nghe kể chuyện cổ tích, hát theo giai điệu hoặc gõ đàn cầu vồng!' : 'Watch animated stories, sing along, or play the rainbow xylophone!'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {STORIES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => { setSelectedId(s.id); setSceneIdx(0); setIsPlaying(true); }}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-black transition ${
                selectedId === s.id
                  ? 'bg-gradient-to-r from-amber-400 to-pink-500 text-slate-950 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <span>{s.emoji}</span> {isVi ? s.titleVi : s.titleEn}
            </button>
          ))}
        </div>

        <div className="rounded-3xl bg-slate-950/70 border-2 border-purple-400/30 p-6 text-center space-y-4">
          {customVideoUrl.trim() ? (
            embedYoutube ? (
              <iframe src={embedYoutube} title="Kids Video" className="w-full h-64 rounded-2xl border-0" allowFullScreen />
            ) : (
              <video src={customVideoUrl} controls className="w-full max-h-64 rounded-2xl mx-auto" />
            )
          ) : (
            <>
              <div className="text-7xl sm:text-8xl animate-bounce" style={{ animationDuration: '2s' }}>
                {scene.emoji}
              </div>
              <p className="text-base sm:text-xl font-black text-amber-200 max-w-xl mx-auto">
                {isVi ? scene.vi : scene.en}
              </p>
              <div className="flex items-center justify-center gap-2">
                {story.scenes.map((_, i) => (
                  <span key={i} className={`h-2.5 rounded-full transition-all ${i === sceneIdx ? 'w-8 bg-amber-400' : 'w-2.5 bg-white/30'}`} />
                ))}
              </div>
            </>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-500 px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg"
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} />}
              {isPlaying ? (isVi ? 'Tạm dừng' : 'Pause') : (isVi ? 'Phát Truyện & Nhạc' : 'Play Story & Music')}
            </button>
            <input
              type="url"
              value={customVideoUrl}
              onChange={(e) => setCustomVideoUrl(e.target.value)}
              placeholder={isVi ? 'Dán link YouTube hoặc MP4 an toàn cho bé...' : 'Paste safe YouTube or MP4 link...'}
              className="w-full sm:w-72 rounded-xl bg-slate-900 border border-purple-400/40 px-3 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
              <Music size={14} /> {isVi ? 'Đàn Cầu Vồng Đa Âm Giai' : 'Cultural Rainbow Xylophone'}
            </div>
            <select
              value={activeScaleId}
              onChange={(e) => setActiveScaleId(e.target.value)}
              className="rounded-xl bg-slate-900 border border-amber-300/40 px-2.5 py-1 text-[11px] font-bold text-amber-200"
            >
              {Object.entries(CULTURAL_SCALES).map(([id, sc]) => (
                <option key={id} value={id}>{sc.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-8 gap-2">
            {(CULTURAL_SCALES[activeScaleId]?.notes || XYLOPHONE_NOTES).map((note) => (
              <button
                key={note.label}
                type="button"
                onClick={() => playXylophoneNote(note.freq)}
                className={`rounded-2xl bg-gradient-to-b ${note.color} py-4 text-sm font-black text-white shadow-md hover:scale-105 active:scale-95 transition flex flex-col items-center gap-1`}
              >
                <Sparkles size={12} />
                {note.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
