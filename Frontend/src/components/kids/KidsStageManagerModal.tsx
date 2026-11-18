import React, { useEffect, useState } from 'react';
import { X, Palette, Plus, Loader2, Play } from 'lucide-react';
import { kidsCurriculumService, KidsStageTheme } from '@/services/kidsCurriculum.service';

interface KidsStageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStageToPlay: (stage: KidsStageTheme) => void;
  lang: string;
}

const GRADIENT_PRESETS = [
  { label: '☁️ Bầu Trời', grad: 'from-sky-400 via-cyan-300 to-indigo-400', pMode: 'sky' as const, sfx: 'pop' as const, env: 'SKY' },
  { label: '🌊 Đáy Biển', grad: 'from-cyan-500 via-teal-500 to-blue-700', pMode: 'ocean' as const, sfx: 'splash' as const, env: 'OCEAN' },
  { label: '🧚 Cổ Tích', grad: 'from-fuchsia-500 via-purple-600 to-indigo-700', pMode: 'fairy' as const, sfx: 'unwrap' as const, env: 'FAIRYTALE' },
  { label: '🌿 Thảo Nguyên', grad: 'from-emerald-400 via-lime-400 to-amber-300', pMode: 'meadow' as const, sfx: 'bounce' as const, env: 'MEADOW' },
];

export const KidsStageManagerModal: React.FC<KidsStageManagerModalProps> = ({
  isOpen,
  onClose,
  onSelectStageToPlay,
  lang,
}) => {
  const [stages, setStages] = useState<KidsStageTheme[]>([]);
  const [titleVi, setTitleVi] = useState('');
  const [badgeEmoji, setBadgeEmoji] = useState('🪐');
  const [presetIdx, setPresetIdx] = useState(2);
  const [propEmojis, setPropEmojis] = useState('🪐,🚀,🌟,🛸');
  const [isSaving, setIsSaving] = useState(false);

  const isVi = lang === 'vi';

  useEffect(() => {
    if (!isOpen) return;
    kidsCurriculumService.getStageThemes().then(setStages).catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleVi.trim()) return;
    setIsSaving(true);
    try {
      const preset = GRADIENT_PRESETS[presetIdx] || GRADIENT_PRESETS[0];
      const colors = ['#f43f5e', '#f59e0b', '#0ea5e9', '#a855f7', '#10b981'];
      const props = propEmojis
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((emoji, i) => ({
          emoji,
          labelVi: `${titleVi.trim()} #${i + 1}`,
          labelEn: `${titleVi.trim()} #${i + 1}`,
          colorHex: colors[i % colors.length],
        }));

      const saved = await kidsCurriculumService.saveStageTheme({
        stageCode: '',
        titleVi: titleVi.trim(),
        titleEn: titleVi.trim(),
        environment: preset.env,
        particleMode: preset.pMode,
        sfxType: preset.sfx,
        backgroundGradient: preset.grad,
        badgeEmoji: badgeEmoji || '🌟',
        isSystemDefault: false,
        preferredIslands: ['music', 'animals', 'toys', 'fairytale'],
        props,
      });

      setStages((prev) => [...prev, saved]);
      setTitleVi('');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700 p-6 text-slate-100 shadow-2xl space-y-5">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white">
          <X size={16} />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-500 text-white">
            <Palette size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-white">
              {isVi ? 'Kho Sân Khấu & Tài Nguyên Động (DB)' : 'Dynamic Stage & Prop Registry'}
            </h3>
            <p className="text-xs text-slate-400">
              {isVi ? 'Chọn sân khấu (Trên trời, Đáy biển, Cổ tích...) hoặc thêm sân khấu mới vào Database' : 'Pick any dynamic stage or save new custom themes to DB'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stages.map((st) => (
            <button
              key={st.stageCode}
              type="button"
              onClick={() => { onSelectStageToPlay(st); onClose(); }}
              className={`rounded-2xl bg-gradient-to-r ${st.backgroundGradient} p-4 text-left text-white shadow-md hover:scale-[1.02] transition flex items-center justify-between gap-2`}
            >
              <div>
                <div className="text-2xl">{st.badgeEmoji}</div>
                <div className="text-sm font-black mt-1">{isVi ? st.titleVi : st.titleEn}</div>
                <div className="text-[11px] opacity-90">{st.props.map((p) => p.emoji).join(' ')}</div>
              </div>
              <Play size={18} className="shrink-0 fill-current" />
            </button>
          ))}
        </div>

        <form onSubmit={handleSave} className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 space-y-3 text-xs">
          <div className="font-bold text-cyan-300 flex items-center gap-1.5">
            <Plus size={14} /> {isVi ? 'Thêm Sân Khấu Mới Vào Database' : 'Add New Stage to Database'}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input
              value={titleVi}
              onChange={(e) => setTitleVi(e.target.value)}
              placeholder={isVi ? 'Tên sân khấu (VD: Vũ Trụ Kẹo)...' : 'Stage title...'}
              className="sm:col-span-2 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white"
            />
            <input
              value={badgeEmoji}
              onChange={(e) => setBadgeEmoji(e.target.value)}
              placeholder="Emoji"
              className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-center text-base"
            />
            <select
              value={presetIdx}
              onChange={(e) => setPresetIdx(Number(e.target.value))}
              className="rounded-xl bg-slate-900 border border-slate-700 px-2 py-2 text-white"
            >
              {GRADIENT_PRESETS.map((g, i) => (
                <option key={g.env} value={i}>{g.label}</option>
              ))}
            </select>
          </div>
          <input
            value={propEmojis}
            onChange={(e) => setPropEmojis(e.target.value)}
            placeholder="Danh sách vật phẩm (cách nhau dấu phẩy): 🪐,🚀,🌟,🛸"
            className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white"
          />
          <button
            type="submit"
            disabled={isSaving || !titleVi.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2 font-black text-white disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {isVi ? 'Lưu Sân Khấu Vào DB' : 'Save Stage to DB'}
          </button>
        </form>
      </div>
    </div>
  );
};
