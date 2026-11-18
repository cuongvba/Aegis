import React, { useState } from 'react';
import { X, Globe, Plus, Loader2 } from 'lucide-react';
import { kidsCurriculumService, KidsLocaleProfile } from '@/services/kidsCurriculum.service';

interface KidsGlobalLocaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  locales: KidsLocaleProfile[];
  activeLocaleCode: string;
  onSelectLocale: (locale: KidsLocaleProfile) => void;
  onAddedLocale: (locale: KidsLocaleProfile) => void;
}

export const KidsGlobalLocaleModal: React.FC<KidsGlobalLocaleModalProps> = ({
  isOpen,
  onClose,
  locales,
  activeLocaleCode,
  onSelectLocale,
  onAddedLocale,
}) => {
  const [localeCode, setLocaleCode] = useState('');
  const [nativeName, setNativeName] = useState('');
  const [flagEmoji, setFlagEmoji] = useState('🌍');
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [scaleId, setScaleId] = useState('western_major');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localeCode.trim() || !nativeName.trim()) return;
    setIsSaving(true);
    try {
      const saved = await kidsCurriculumService.saveLocaleProfile({
        localeCode: localeCode.trim(),
        langCode: localeCode.trim().split('-')[0].toLowerCase(),
        nativeName: nativeName.trim(),
        flagEmoji: flagEmoji.trim() || '🌍',
        direction,
        speechTag: localeCode.trim(),
        culturalScaleId: scaleId,
        regionCode: (localeCode.trim().split('-')[1] || 'GLOBAL').toUpperCase(),
        isSystemDefault: false,
      });
      onAddedLocale(saved);
      onSelectLocale(saved);
      setLocaleCode('');
      setNativeName('');
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl max-h-[88vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700 p-6 text-slate-100 shadow-2xl space-y-4">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white">
          <X size={16} />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-300">
            <Globe size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Global Languages &amp; Cultural Registry</h3>
            <p className="text-xs text-slate-400">Open BCP-47 registry — add any language, script (LTR/RTL) or musical scale dynamically</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {locales.map((loc) => (
            <button
              key={loc.localeCode}
              type="button"
              onClick={() => { onSelectLocale(loc); onClose(); }}
              className={`rounded-2xl border px-3 py-2.5 text-left text-xs font-bold transition flex items-center gap-2 ${
                loc.localeCode === activeLocaleCode
                  ? 'bg-cyan-500/20 border-cyan-400 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600'
              }`}
            >
              <span className="text-lg">{loc.flagEmoji}</span>
              <div className="min-w-0">
                <div className="truncate">{loc.nativeName}</div>
                <div className="text-[10px] text-slate-400 font-mono">{loc.localeCode} ({loc.direction.toUpperCase()})</div>
              </div>
            </button>
          ))}
        </div>

        <form onSubmit={handleAdd} className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 space-y-3 text-xs">
          <div className="font-bold text-cyan-300 flex items-center gap-1.5">
            <Plus size={14} /> Add Any New Language / Region to DB
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <input required value={localeCode} onChange={(e) => setLocaleCode(e.target.value)} placeholder="BCP-47 (th-TH, de-DE)" className="rounded-xl bg-slate-900 border border-slate-700 px-2.5 py-2 text-white font-mono" />
            <input required value={nativeName} onChange={(e) => setNativeName(e.target.value)} placeholder="Native Name (ภาษาไทย)" className="rounded-xl bg-slate-900 border border-slate-700 px-2.5 py-2 text-white" />
            <input value={flagEmoji} onChange={(e) => setFlagEmoji(e.target.value)} placeholder="Flag 🇹🇭" className="rounded-xl bg-slate-900 border border-slate-700 px-2.5 py-2 text-center text-base" />
            <select value={direction} onChange={(e) => setDirection(e.target.value as 'ltr' | 'rtl')} className="rounded-xl bg-slate-900 border border-slate-700 px-2 py-2 text-white">
              <option value="ltr">LTR (Left → Right)</option>
              <option value="rtl">RTL (Right → Left)</option>
            </select>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <select value={scaleId} onChange={(e) => setScaleId(e.target.value)} className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white">
              <option value="western_major">Western Major Scale</option>
              <option value="eastern_pentatonic">Eastern Pentatonic Scale</option>
              <option value="japanese_hirajoshi">Japanese Hirajoshi Scale</option>
            </select>
            <button type="submit" disabled={isSaving} className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2 font-black text-white disabled:opacity-50">
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Save Language to DB
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
