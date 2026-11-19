import React, { useRef, useState } from 'react';
import { Award, Download, FolderUp, Play, Plus, Sparkles, UserCheck, X } from 'lucide-react';
import { speakKidText } from './kidsSpeech';
import {
  getKidCreations,
  getKidProfiles,
  saveOfflineLessonCartridge,
  setActiveKidProfile,
  upsertKidProfile,
  type KidAgeBand,
  type KidCreationItem,
  type KidProfile,
} from './kidsOfflineVault';
import type { KidsLessonPlan } from '@/services/kidsCurriculum.service';

interface Props {
  open: boolean;
  lang: string;
  activeProfile: KidProfile;
  onProfileChanged: (profile: KidProfile) => void;
  onClose: () => void;
}

export const KidsCreativeMuseumModal: React.FC<Props> = ({
  open,
  lang,
  activeProfile,
  onProfileChanged,
  onClose,
}) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [profiles, setProfiles] = useState<KidProfile[]>(() => getKidProfiles());
  const [creations, setCreations] = useState<KidCreationItem[]>(() => getKidCreations(activeProfile.id));
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState('🦊');
  const [newAge, setNewAge] = useState<KidAgeBand>('6-8');
  const [cartridgeMsg, setCartridgeMsg] = useState<string | null>(null);

  if (!open) return null;

  const switchProfile = (p: KidProfile) => {
    const active = setActiveKidProfile(p.id);
    setCreations(getKidCreations(active.id));
    onProfileChanged(active);
  };

  const handleAddProfile = () => {
    if (!newName.trim()) return;
    const item: KidProfile = {
      id: `kid-${Date.now()}`,
      name: newName.trim(),
      avatar: newAvatar,
      ageBand: newAge,
      stars: 0,
    };
    const next = upsertKidProfile(item);
    setProfiles(next);
    setNewName('');
    switchProfile(item);
  };

  const exportPocketCartridge = () => {
    const payload = {
      schema: 'AEGIS_POCKET_CARTRIDGE_V1',
      exportedAt: new Date().toISOString(),
      profile: activeProfile,
      creations,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aegis-kids-cartridge-${activeProfile.name.replace(/\s+/g, '_')}.aegis-pack.json`;
    a.click();
    URL.revokeObjectURL(url);
    setCartridgeMsg('Đã xuất Băng Học Liệu Offline (.aegis-pack.json) để chia sẻ qua USB/Bluetooth!');
  };

  const importPocketCartridge = async (file?: File) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { lesson?: KidsLessonPlan; islandId?: string; creations?: KidCreationItem[] };
      if (parsed.lesson && parsed.islandId) {
        saveOfflineLessonCartridge(parsed.islandId, parsed.lesson);
      }
      setCartridgeMsg(`Đã nạp thành công gói học liệu offline "${file.name}" vào máy!`);
    } catch {
      setCartridgeMsg('Tệp băng học liệu không hợp lệ.');
    }
  };

  const storyCount = creations.filter((c) => c.category === 'STORY').length;
  const stemCount = creations.filter((c) => c.category === 'STEM').length;
  const musicCount = creations.filter((c) => c.category === 'MUSIC').length;
  const cultureCount = creations.filter((c) => c.category === 'CULTURE').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border-4 border-sky-300 bg-white text-slate-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            <h2 className="text-sm sm:text-base font-black">Bảo Tàng Tác Phẩm & Hồ Sơ Lớp Học Offline (1 Máy - Nhiều Bé)</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Shared-Device Kid Profiles */}
          <section className="rounded-2xl bg-sky-50 border-2 border-sky-200 p-4 space-y-3">
            <div className="font-black text-sky-900 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" /> Hồ Sơ Học Sinh Dùng Chung Thiết Bị (Offline Local-First)
            </div>
            <div className="flex flex-wrap gap-2">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => switchProfile(p)}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-2xl border-2 font-black transition ${p.id === activeProfile.id ? 'bg-sky-600 text-white border-sky-700 shadow' : 'bg-white text-slate-800 border-sky-200'}`}
                >
                  <span className="text-lg">{p.avatar}</span>
                  <span>{p.name} ({p.ageBand}t)</span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <select value={newAvatar} onChange={(e) => setNewAvatar(e.target.value)} className="rounded-xl border border-slate-300 px-2 py-1.5 bg-white text-base">
                {['🦊', '🐼', '🦁', '🐸', '🐰', '🦉'].map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Thêm tên bé mới..." className="rounded-xl border border-slate-300 px-3 py-1.5 bg-white font-bold" />
              <select value={newAge} onChange={(e) => setNewAge(e.target.value as KidAgeBand)} className="rounded-xl border border-slate-300 px-2.5 py-1.5 bg-white font-bold">
                <option value="3-5">3–5 tuổi</option>
                <option value="6-8">6–8 tuổi</option>
                <option value="9-11">9–11 tuổi</option>
              </select>
              <button onClick={handleAddProfile} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-black">
                <Plus className="w-3.5 h-3.5" /> Thêm Bé
              </button>
            </div>
          </section>

          {/* Multiple Intelligences Summary */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { label: '📖 Ngôn ngữ & Kể chuyện', val: storyCount, cls: 'bg-amber-50 border-amber-200 text-amber-900' },
              { label: '🔬 STEM & Logic', val: stemCount, cls: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
              { label: '🎵 Âm nhạc & Nhịp điệu', val: musicCount, cls: 'bg-pink-50 border-pink-200 text-pink-900' },
              { label: '🐉 Văn hóa & Thấu cảm', val: cultureCount, cls: 'bg-purple-50 border-purple-200 text-purple-900' },
            ].map((m) => (
              <div key={m.label} className={`rounded-2xl border-2 p-3 font-black ${m.cls}`}>
                <div className="text-[11px] opacity-80">{m.label}</div>
                <div className="text-xl mt-1">{m.val} tác phẩm</div>
              </div>
            ))}
          </section>

          {/* Creations List */}
          <section className="space-y-2">
            <div className="font-black text-slate-800 flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-amber-500" /> Tác phẩm của {activeProfile.name}</div>
            {creations.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center text-slate-500 font-semibold">
                Chưa có tác phẩm nào. Hãy mở <b>Xưởng Sáng Tạo</b> để làm cuốn sách đầu tiên nhé!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {creations.map((c) => (
                  <div key={c.id} className="rounded-2xl border-2 border-slate-200 p-3.5 flex items-center justify-between gap-3 bg-slate-50">
                    <div className="min-w-0">
                      <div className="font-black text-slate-900 truncate">{c.scenes[0]?.sticker || '🌟'} {c.title}</div>
                      <div className="text-[11px] text-slate-500">{c.scenes.length} cảnh • {c.category} • Offline Ready</div>
                    </div>
                    <button
                      onClick={() => {
                        const first = c.scenes[0];
                        if (first?.audioDataUrl) new Audio(first.audioDataUrl).play();
                        else speakKidText(c.scenes.map((s) => s.caption).join('. '), lang);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-black shrink-0"
                    >
                      <Play className="w-3.5 h-3.5" /> Phát
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Pocket Cartridge Export/Import */}
          <section className="rounded-2xl bg-amber-50 border-2 border-amber-200 p-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-black text-amber-900">Băng Học Liệu Offline (Thế giới thứ 3 / Vùng sâu)</div>
              <div className="text-[11px] text-amber-800">Chia sẻ tác phẩm & bài học qua USB/Bluetooth với dung lượng siêu nhỏ.</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <input ref={fileRef} type="file" accept=".json,.aegis-pack.json" className="hidden" onChange={(e) => void importPocketCartridge(e.target.files?.[0])} />
              <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 font-black">
                <FolderUp className="w-3.5 h-3.5" /> Nạp Băng Học Liệu
              </button>
              <button onClick={exportPocketCartridge} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-500 text-white font-black">
                <Download className="w-3.5 h-3.5" /> Xuất Băng Offline
              </button>
            </div>
          </section>
          {cartridgeMsg && <div className="text-emerald-700 font-bold">{cartridgeMsg}</div>}
        </div>
      </div>
    </div>
  );
};
