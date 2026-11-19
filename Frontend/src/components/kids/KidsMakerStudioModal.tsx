import React, { useRef, useState } from 'react';
import { FolderPlus, Mic, Play, Plus, Save, Sparkles, Square, Trash2, Wand2, X } from 'lucide-react';
import { KidsDynamicStageCanvas } from './KidsDynamicStageCanvas';
import { KidsAssetDrawer } from './KidsAssetDrawer';
import { KidsEntityTransformBar } from './KidsEntityTransformBar';
import {
  DYNAMIC_DOMAINS,
  saveDynamicCourse,
  type AmbientEffectType,
  type DynamicDomainCode,
  type DynamicEpisode,
  type DynamicKidsCourseGame,
  type DynamicStageScene,
  type StageEntityItem,
  type StudioAssetItem,
} from './kidsStudioRegistry';
import type { KidAgeBand } from './kidsOfflineVault';

interface Props {
  open: boolean;
  profileId: string;
  ageBand: KidAgeBand;
  lang: string;
  onClose: () => void;
  onSaved: (course: DynamicKidsCourseGame) => void;
  onPlayGameNow?: (course: DynamicKidsCourseGame) => void;
}

const makeScene = (idx: number): DynamicStageScene => ({
  id: `sc-${Date.now()}-${idx}`,
  sceneTitle: `Cảnh ${idx}`,
  backdropGradient: 'from-sky-400 via-cyan-300 to-indigo-500',
  ambientEffect: 'clouds',
  narration: 'Chạm vào nhân vật hoặc phụ cảnh rồi bấm lên sân khấu để đổi vị trí.',
  entities: [
    { id: `lead-${Date.now()}`, role: 'LEAD', name: 'Nhân Vật Chính', emoji: '🦉', x: 42, y: 62, animation: 'bounce', speech: 'Xin chào!' },
    { id: `prop-${Date.now()}`, role: 'PROP', name: 'Cây Xanh', emoji: '🌳', x: 18, y: 58, animation: 'idle' },
  ],
});

const makeEpisode = (idx: number): DynamicEpisode => ({
  id: `ep-${Date.now()}-${idx}`,
  episodeTitle: `Tập ${idx}: Khởi Đầu Mới`,
  scenes: [makeScene(1)],
  challengeQuestion: 'Đâu là hành động đẹp trong tập này?',
  challengeOptions: ['Giúp đỡ bạn bè & học điều mới', 'Bỏ cuộc giữa chừng'],
  challengeCorrectIndex: 0,
});

const RANDOM_PROPS = [
  { name: 'Cây Xanh', emoji: '🌳' },
  { name: 'Hoa Xinh', emoji: '🌸' },
  { name: 'Bướm Bay', emoji: '🦋' },
  { name: 'Ngôi Nhà', emoji: '🏡' },
  { name: 'Núi Đồi', emoji: '⛰️' },
  { name: 'Nấm Rừng', emoji: '🍄' },
];

export const KidsMakerStudioModal: React.FC<Props> = ({ open, ageBand, onClose, onSaved, onPlayGameNow }) => {
  const [domainCode, setDomainCode] = useState<DynamicDomainCode>('LANGUAGE');
  const [title, setTitle] = useState('Khóa Học & Game Phiêu Lưu Mới');
  const [heroBadgeTitle, setHeroBadgeTitle] = useState('Anh Hùng Tri Thức');
  const [episodes, setEpisodes] = useState<DynamicEpisode[]>([makeEpisode(1)]);
  const [epIdx, setEpIdx] = useState(0);
  const [scIdx, setScIdx] = useState(0);
  const [selectedEntId, setSelectedEntId] = useState<string | null>(null);
  const [assetDrawerOpen, setAssetDrawerOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  if (!open) return null;

  const ep = episodes[epIdx] || episodes[0];
  const sc = ep.scenes[scIdx] || ep.scenes[0];
  const selectedEnt = sc.entities.find((e) => e.id === selectedEntId) || null;

  const patchEpisode = (patch: Partial<DynamicEpisode>) =>
    setEpisodes((prev) => prev.map((item, i) => (i === epIdx ? { ...item, ...patch } : item)));

  const patchScene = (patch: Partial<DynamicStageScene>) =>
    patchEpisode({ scenes: ep.scenes.map((item, i) => (i === scIdx ? { ...item, ...patch } : item)) });

  const patchEntity = (id: string, patch: Partial<StageEntityItem>) =>
    patchScene({ entities: sc.entities.map((e) => (e.id === id ? { ...e, ...patch } : e)) });

  const deleteEpisode = (idx: number) => {
    if (episodes.length <= 1) return;
    setEpisodes((p) => p.filter((_, i) => i !== idx));
    setEpIdx(Math.max(0, idx - 1));
    setScIdx(0);
    setSelectedEntId(null);
  };

  const deleteScene = (idx: number) => {
    if (ep.scenes.length <= 1) return;
    patchEpisode({ scenes: ep.scenes.filter((_, i) => i !== idx) });
    setScIdx(Math.max(0, idx - 1));
    setSelectedEntId(null);
  };

  const duplicateSelectedEntity = () => {
    if (!selectedEnt) return;
    const clone: StageEntityItem = {
      ...selectedEnt,
      id: `clone-${Date.now()}`,
      name: `${selectedEnt.name} (Bản sao)`,
      x: Math.min(90, selectedEnt.x + 12),
      y: Math.min(85, selectedEnt.y + 8),
    };
    patchScene({ entities: [...sc.entities, clone] });
    setSelectedEntId(clone.id);
  };

  const scatterRandomProps = () => {
    const generated: StageEntityItem[] = Array.from({ length: 4 }).map((_, i) => {
      const pick = RANDOM_PROPS[Math.floor(Math.random() * RANDOM_PROPS.length)];
      return {
        id: `rnd-prop-${Date.now()}-${i}`,
        role: 'PROP',
        name: pick.name,
        emoji: pick.emoji,
        x: Math.round(12 + Math.random() * 76),
        y: Math.round(45 + Math.random() * 38),
        animation: 'idle',
      };
    });
    patchScene({ entities: [...sc.entities, ...generated] });
  };

  const handleApplyAsset = (asset: StudioAssetItem) => {
    if (asset.kind === 'BACKDROP') patchScene({ backdropImageUrl: asset.dataUrl, backdropGradient: asset.gradient || sc.backdropGradient, backdropVideoUrl: undefined });
    else if (asset.kind === 'VIDEO') patchScene({ backdropVideoUrl: asset.dataUrl });
    else if (asset.kind === 'MUSIC') patchScene({ musicAssetId: asset.id });
    else if (asset.kind === 'AUDIO') patchScene({ audioDataUrl: asset.dataUrl });
    else {
      const role: StageEntityItem['role'] = asset.kind === 'PROP' ? 'PROP' : sc.entities.some((e) => e.role === 'LEAD') ? 'SUPPORT' : 'LEAD';
      const created: StageEntityItem = { id: `ent-${Date.now()}`, role, name: asset.name, emoji: asset.emoji || '🌟', imageUrl: asset.dataUrl, x: 55, y: 55, animation: role === 'PROP' ? 'idle' : 'bounce' };
      patchScene({ entities: [...sc.entities, created] });
      setSelectedEntId(created.id);
    }
  };

  const toggleRecord = async () => {
    if (recording && recorderRef.current) { recorderRef.current.stop(); setRecording(false); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const reader = new FileReader();
        reader.onload = () => patchScene({ audioDataUrl: String(reader.result || '') });
        reader.readAsDataURL(new Blob(chunksRef.current, { type: 'audio/webm' }));
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch { /* ignore */ }
  };

  const buildCourse = (): DynamicKidsCourseGame => ({
    id: `course-${Date.now()}`,
    domainCode,
    title: title.trim() || 'Game Sáng Tạo Mới',
    ageBand,
    isGameMode: true,
    heroBadgeTitle: heroBadgeTitle.trim() || 'Anh Hùng Tri Thức',
    episodes,
    createdAt: new Date().toISOString(),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl max-h-[94vh] flex flex-col rounded-3xl border-4 border-amber-300 bg-white text-slate-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white">
          <div className="flex items-center gap-2"><Sparkles className="w-5 h-5" /><h2 className="text-sm sm:text-base font-black">Kids Dynamic Stage & Game Studio (Tập $\rightarrow$ Nhiều Cảnh $\rightarrow$ Hero)</h2></div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-white/20"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <select value={domainCode} onChange={(e) => setDomainCode(e.target.value as DynamicDomainCode)} className="sm:col-span-3 rounded-xl border-2 border-slate-200 px-2.5 py-1.5 font-black bg-slate-50">
              {DYNAMIC_DOMAINS.map((d) => <option key={d.code} value={d.code}>{d.emoji} {d.labelVi}</option>)}
            </select>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="sm:col-span-5 rounded-xl border-2 border-amber-200 px-3 py-1.5 font-black" placeholder="Tên khóa học / game..." />
            <input value={heroBadgeTitle} onChange={(e) => setHeroBadgeTitle(e.target.value)} className="sm:col-span-4 rounded-xl border-2 border-indigo-200 px-3 py-1.5 font-bold text-indigo-800" placeholder="Danh hiệu Hero..." />
          </div>

          {/* Episodes Bar (Add / Delete) */}
          <div className="flex flex-wrap items-center gap-1.5">
            {episodes.map((item, idx) => (
              <div key={item.id} className="inline-flex items-center rounded-xl overflow-hidden border border-indigo-200">
                <button onClick={() => { setEpIdx(idx); setScIdx(0); setSelectedEntId(null); }} className={`px-3 py-1 font-black ${idx === epIdx ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>🎬 Tập {idx + 1}</button>
                {episodes.length > 1 && <button onClick={() => deleteEpisode(idx)} className="px-1.5 py-1 bg-rose-100 text-rose-600 hover:bg-rose-200" title="Xóa tập"><Trash2 className="w-3 h-3" /></button>}
              </div>
            ))}
            <button onClick={() => { setEpisodes((p) => [...p, makeEpisode(p.length + 1)]); setEpIdx(episodes.length); setScIdx(0); }} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-black"><Plus className="w-3.5 h-3.5" /> Thêm Tập</button>
            <button onClick={() => setAssetDrawerOpen(true)} className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 text-white font-black shadow"><FolderPlus className="w-3.5 h-3.5" /> Kho Tài Nguyên</button>
          </div>

          {/* Scenes inside Episode Bar (Add / Delete / Auto-Scatter Props) */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 rounded-xl p-1.5">
            {ep.scenes.map((item, idx) => (
              <div key={item.id} className="inline-flex items-center rounded-lg overflow-hidden border border-slate-300">
                <button onClick={() => { setScIdx(idx); setSelectedEntId(null); }} className={`px-2.5 py-1 font-bold ${idx === scIdx ? 'bg-sky-600 text-white' : 'bg-white text-slate-700'}`}>🖼️ Cảnh {idx + 1}</button>
                {ep.scenes.length > 1 && <button onClick={() => deleteScene(idx)} className="px-1.5 py-1 bg-rose-50 text-rose-600" title="Xóa cảnh"><Trash2 className="w-3 h-3" /></button>}
              </div>
            ))}
            <button onClick={() => { patchEpisode({ scenes: [...ep.scenes, makeScene(ep.scenes.length + 1)] }); setScIdx(ep.scenes.length); }} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-100 text-sky-800 font-black"><Plus className="w-3 h-3" /> Thêm Cảnh</button>
            <button onClick={scatterRandomProps} className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 font-black"><Wand2 className="w-3 h-3" /> Rải Phụ Cảnh Ngẫu Nhiên</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-7">
              <KidsDynamicStageCanvas scene={sc} editable selectedEntityId={selectedEntId} onSelectEntity={setSelectedEntId} onMoveEntity={(id, x, y) => patchEntity(id, { x, y })} />
            </div>
            <div className="lg:col-span-5 rounded-2xl border-2 border-slate-200 bg-slate-50 p-3 space-y-2">
              <div className="grid grid-cols-2 gap-1.5">
                <input value={ep.episodeTitle} onChange={(e) => patchEpisode({ episodeTitle: e.target.value })} className="rounded-xl border border-slate-300 bg-white px-2.5 py-1 font-bold" placeholder="Tên tập..." />
                <input value={sc.sceneTitle} onChange={(e) => patchScene({ sceneTitle: e.target.value })} className="rounded-xl border border-slate-300 bg-white px-2.5 py-1 font-bold" placeholder="Tên cảnh..." />
              </div>
              <div className="flex gap-1.5">
                <select value={sc.ambientEffect} onChange={(e) => patchScene({ ambientEffect: e.target.value as AmbientEffectType })} className="flex-1 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 font-bold">
                  <option value="none">Hoạt cảnh: Không</option>
                  <option value="clouds">☁️ Mây trôi ngang</option>
                  <option value="rain">🌧️ Mưa rơi</option>
                  <option value="sunbeams">☀️ Mặt trời chiếu</option>
                  <option value="bubbles">🫧 Bọt biển nổi</option>
                  <option value="petals">🌸 Hoa lá bay</option>
                  <option value="stars">✨ Sao lấp lánh</option>
                </select>
                <button onClick={() => void toggleRecord()} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-black text-white ${recording ? 'bg-rose-600 animate-pulse' : 'bg-indigo-600'}`}>
                  {recording ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />} {recording ? 'Dừng' : 'Thu Audio'}
                </button>
              </div>
              <textarea rows={2} value={sc.narration} onChange={(e) => patchScene({ narration: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white p-2 font-semibold" placeholder="Lời dẫn cảnh này..." />
              <input value={ep.challengeQuestion || ''} onChange={(e) => patchEpisode({ challengeQuestion: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 font-semibold" placeholder="Câu hỏi thử thách cuối tập..." />

              {selectedEnt && (
                <KidsEntityTransformBar
                  entity={selectedEnt}
                  onPatch={(patch) => patchEntity(selectedEnt.id, patch)}
                  onDuplicate={duplicateSelectedEntity}
                  onDelete={() => { patchScene({ entities: sc.entities.filter((x) => x.id !== selectedEnt.id) }); setSelectedEntId(null); }}
                />
              )}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 text-xs">
          {onPlayGameNow && <button onClick={() => { const c = buildCourse(); saveDynamicCourse(c); onPlayGameNow(c); onClose(); }} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-indigo-600 text-white font-black"><Play className="w-4 h-4 fill-current" /> Hóa Thân Chơi Thử</button>}
          <button onClick={() => { const c = buildCourse(); saveDynamicCourse(c); onSaved(c); onClose(); }} className="inline-flex items-center gap-1.5 px-5 py-2 rounded-2xl bg-emerald-600 text-white font-black"><Save className="w-4 h-4" /> Lưu Khóa Học / Game</button>
        </div>
      </div>
      <KidsAssetDrawer open={assetDrawerOpen} onClose={() => setAssetDrawerOpen(false)} onApplyAsset={handleApplyAsset} />
    </div>
  );
};
