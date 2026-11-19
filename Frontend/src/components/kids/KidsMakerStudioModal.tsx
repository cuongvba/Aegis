import React, { useRef, useState } from 'react';
import { BookOpen, Mic, Plus, Save, Sparkles, Square, Trash2, Volume2, X } from 'lucide-react';
import { speakKidText } from './kidsSpeech';
import {
  saveKidCreation,
  type KidAgeBand,
  type KidCreationItem,
  type KidStoryScene,
} from './kidsOfflineVault';

interface Props {
  open: boolean;
  profileId: string;
  ageBand: KidAgeBand;
  lang: string;
  onClose: () => void;
  onSaved: (items: KidCreationItem[]) => void;
  onExportToOffice: (title: string, markdown: string) => void;
}

const SCENES_BG = [
  { key: 'sky' as const, label: '☁️ Bầu Trời', cls: 'from-sky-400 to-indigo-500' },
  { key: 'ocean' as const, label: '🌊 Đáy Biển', cls: 'from-cyan-500 to-blue-700' },
  { key: 'fairy' as const, label: '🧚 Cổ Tích', cls: 'from-fuchsia-500 to-purple-700' },
  { key: 'meadow' as const, label: '🌿 Thảo Nguyên', cls: 'from-emerald-400 to-lime-600' },
  { key: 'space' as const, label: '🚀 Vũ Trụ', cls: 'from-slate-800 to-indigo-950' },
];

const STICKERS = ['🦉', '🦁', '🐘', '🐉', '🦋', '🦄', '🌟', '🌈', '🚀', '🌸', '🎈', '📚'];

const SOCRATIC_PROMPTS_VI = [
  'Gợi ý 1: Điều kỳ diệu nào xảy ra khi nhân vật chạm vào cầu vồng?',
  'Gợi ý 2: Bạn nhỏ gặp khó khăn gì và đã dùng lòng tốt để giải quyết ra sao?',
  'Gợi ý 3: Nếu con vật biết nói tiếng người, câu đầu tiên nó nói với em là gì?',
];

export const KidsMakerStudioModal: React.FC<Props> = ({
  open,
  profileId,
  ageBand,
  lang,
  onClose,
  onSaved,
  onExportToOffice,
}) => {
  const isVi = lang.startsWith('vi');
  const [title, setTitle] = useState(isVi ? 'Cuộc Phiêu Lưu Kỳ Diệu Của Em' : 'My Magical Adventure');
  const [category, setCategory] = useState<KidCreationItem['category']>('STORY');
  const [scenes, setScenes] = useState<KidStoryScene[]>([
    { id: 'sc-1', bgKey: 'sky', sticker: '🦉', caption: isVi ? 'Ngày xửa ngày xưa, có chú Cú Mèo thích khám phá bầu trời...' : 'Once upon a time...' },
    { id: 'sc-2', bgKey: 'fairy', sticker: '🌈', caption: isVi ? 'Chú tìm thấy chiếc cầu vồng phát sáng và chia sẻ niềm vui với các bạn!' : 'It found a glowing rainbow!' },
  ]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [socraticIdx, setSocraticIdx] = useState(0);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  if (!open) return null;

  const cur = scenes[activeIdx] || scenes[0];
  const updateScene = (patch: Partial<KidStoryScene>) => {
    setScenes((prev) => prev.map((s, i) => (i === activeIdx ? { ...s, ...patch } : s)));
  };

  const toggleRecord = async () => {
    if (recording && recorderRef.current) {
      recorderRef.current.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => updateScene({ audioDataUrl: String(reader.result || '') });
        reader.readAsDataURL(blob);
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch { /* mic denied */ }
  };

  const handleSave = (sendToOffice = false) => {
    const item: KidCreationItem = {
      id: `kid-work-${Date.now()}`,
      profileId,
      title: title.trim() || 'Tác phẩm nhí',
      ageBand,
      category,
      scenes,
      createdAt: new Date().toISOString(),
      synced: false,
    };
    const next = saveKidCreation(item);
    onSaved(next);

    if (sendToOffice) {
      const md = [
        `# ${item.title}`,
        `> Tác giả nhí (${ageBand} tuổi) — Aegis Kids Creative Factory`,
        ...scenes.map((s, i) => `## Cảnh ${i + 1} ${s.sticker}\n\n${s.caption}`),
      ].join('\n\n');
      onExportToOffice(item.title, md);
    }
    onClose();
  };

  const curBg = SCENES_BG.find((b) => b.key === cur.bgKey) || SCENES_BG[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border-4 border-amber-300 bg-white text-slate-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <h2 className="text-sm sm:text-base font-black">
              {isVi ? `Xưởng Sáng Tạo Kids (${ageBand} tuổi • Chạy Offline 100%)` : `Kids Creative Factory (${ageBand})`}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 min-w-[200px] rounded-2xl border-2 border-amber-200 px-3.5 py-2 text-sm font-black text-slate-900 focus:outline-none focus:border-amber-500"
              placeholder="Tên cuốn sách / câu chuyện của bé..."
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as KidCreationItem['category'])}
              className="rounded-2xl border-2 border-slate-200 px-3 py-2 font-bold text-slate-800"
            >
              <option value="STORY">📖 Truyện Kể</option>
              <option value="CULTURE">🐉 Văn Hóa & Cổ Tích</option>
              <option value="STEM">🔬 Khoa Học Diệu Kỳ</option>
              <option value="MUSIC">🎵 Bài Ca Vui</option>
            </select>
          </div>

          {/* Scene Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {scenes.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setActiveIdx(idx)}
                className={`px-3 py-1.5 rounded-xl font-black transition ${idx === activeIdx ? 'bg-amber-500 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {s.sticker} Cảnh {idx + 1}
              </button>
            ))}
            {scenes.length < 6 && (
              <button
                onClick={() => {
                  setScenes((p) => [...p, { id: `sc-${Date.now()}`, bgKey: 'meadow', sticker: '🌟', caption: '' }]);
                  setActiveIdx(scenes.length);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-black"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm cảnh
              </button>
            )}
          </div>

          {/* Visual Stage Preview + Editor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`rounded-3xl bg-gradient-to-br ${curBg.cls} p-6 text-white flex flex-col items-center justify-center min-h-[220px] shadow-inner relative`}>
              <div className="text-7xl mb-3 drop-shadow-md">{cur.sticker}</div>
              <p className="text-center text-sm font-bold bg-black/25 rounded-2xl px-4 py-2 backdrop-blur-sm">
                {cur.caption || 'Chọn nhân vật & kể câu chuyện của con...'}
              </p>
              {scenes.length > 1 && (
                <button
                  onClick={() => {
                    setScenes((p) => p.filter((_, i) => i !== activeIdx));
                    setActiveIdx(Math.max(0, activeIdx - 1));
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded-xl bg-black/30 hover:bg-rose-600 text-white"
                  title="Xóa cảnh này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <div className="font-black text-slate-600 mb-1">1. Chọn không gian cảnh</div>
                <div className="flex flex-wrap gap-1.5">
                  {SCENES_BG.map((b) => (
                    <button key={b.key} onClick={() => updateScene({ bgKey: b.key })} className={`px-2.5 py-1.5 rounded-xl font-bold border ${cur.bgKey === b.key ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-slate-200'}`}>
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="font-black text-slate-600 mb-1">2. Chọn nhân vật chính</div>
                <div className="flex flex-wrap gap-1.5">
                  {STICKERS.map((st) => (
                    <button key={st} onClick={() => updateScene({ sticker: st })} className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center border ${cur.sticker === st ? 'border-amber-500 bg-amber-50 scale-110' : 'border-slate-200'}`}>
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {ageBand !== '3-5' && (
                <textarea
                  rows={3}
                  value={cur.caption}
                  onChange={(e) => updateScene({ caption: e.target.value })}
                  placeholder="Viết lời kể của con cho cảnh này..."
                  className="w-full rounded-2xl border-2 border-slate-200 p-2.5 text-xs font-semibold focus:outline-none focus:border-amber-400"
                />
              )}

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => void toggleRecord()}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl font-black text-white ${recording ? 'bg-rose-600 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                >
                  {recording ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  {recording ? 'Dừng Thu Âm' : 'Thu Giọng Bé'}
                </button>
                <button
                  onClick={() => cur.audioDataUrl ? new Audio(cur.audioDataUrl).play() : speakKidText(cur.caption || title, lang)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-sky-100 text-sky-800 font-black"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Nghe Thử
                </button>
                <button
                  onClick={() => setSocraticIdx((i) => (i + 1) % SOCRATIC_PROMPTS_VI.length)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-2xl bg-amber-100 text-amber-800 font-black"
                >
                  🦉 Gợi Ý Ý Tưởng
                </button>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] font-semibold text-amber-900">
                {SOCRATIC_PROMPTS_VI[socraticIdx]}
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-end gap-2 text-xs">
          <button onClick={() => handleSave(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black">
            <BookOpen className="w-4 h-4" /> Xuất Sách Tranh (Office Studio)
          </button>
          <button onClick={() => handleSave(false)} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-md">
            <Save className="w-4 h-4" /> Lưu Vào Bảo Tàng (Offline Ready)
          </button>
        </div>
      </div>
    </div>
  );
};
