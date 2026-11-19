import React, { useRef, useState } from 'react';
import { FolderPlus, Mic, Play, Plus, Save, Sparkles, Square, Trash2, X } from 'lucide-react';
import { KidsDynamicStageCanvas } from './KidsDynamicStageCanvas';
import { KidsAssetDrawer } from './KidsAssetDrawer';
import {
  DYNAMIC_DOMAINS,
  saveDynamicCourse,
  type AmbientEffectType,
  type CharAnimationType,
  type DynamicDomainCode,
  type DynamicEpisodeScene,
  type DynamicKidsCourseGame,
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

const DEFAULT_EPISODE = (idx: number): DynamicEpisodeScene => ({
  id: `ep-${Date.now()}-${idx}`,
  episodeTitle: `Tập ${idx}: Khởi Đầu Mới`,
  backdropGradient: 'from-sky-400 via-cyan-300 to-indigo-500',
  ambientEffect: 'clouds',
  narration: 'Chào mừng Hero! Hãy chạm vào nhân vật để di chuyển vị trí trên sân khấu.',
  entities: [
    { id: `lead-${idx}`, role: 'LEAD', name: 'Nhân Vật Chính', emoji: '🦉', x: 40, y: 62, animation: 'bounce', speech: 'Xin chào các bạn!' },
    { id: `prop-${idx}`, role: 'PROP', name: 'Cây Cổ Thụ', emoji: '🌳', x: 18, y: 58, animation: 'idle' },
  ],
  challengeQuestion: 'Đâu là hành động đẹp trong tập này?',
  challengeOptions: ['Giúp đỡ bạn bè & học điều mới', 'Bỏ cuộc giữa chừng'],
  challengeCorrectIndex: 0,
});

export const KidsMakerStudioModal: React.FC<Props> = ({
  open,
  ageBand,
  onClose,
  onSaved,
  onPlayGameNow,
}) => {
  const [domainCode, setDomainCode] = useState<DynamicDomainCode>('LANGUAGE');
  const [title, setTitle] = useState('Khóa Học & Game Phiêu Lưu Mới');
  const [heroBadgeTitle, setHeroBadgeTitle] = useState('Anh Hùng Tri Thức');
  const [episodes, setEpisodes] = useState<DynamicEpisodeScene[]>([DEFAULT_EPISODE(1)]);
  const [epIdx, setEpIdx] = useState(0);
  const [selectedEntId, setSelectedEntId] = useState<string | null>(null);
  const [assetDrawerOpen, setAssetDrawerOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  if (!open) return null;

  const ep = episodes[epIdx] || episodes[0];
  const selectedEnt = ep.entities.find((e) => e.id === selectedEntId) || null;

  const patchEpisode = (patch: Partial<DynamicEpisodeScene>) => {
    setEpisodes((prev) => prev.map((item, i) => (i === epIdx ? { ...item, ...patch } : item)));
  };

  const patchEntity = (id: string, patch: Partial<StageEntityItem>) => {
    patchEpisode({ entities: ep.entities.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  };

  const handleApplyAsset = (asset: StudioAssetItem) => {
    if (asset.kind === 'BACKDROP') {
      patchEpisode({ backdropImageUrl: asset.dataUrl, backdropGradient: asset.gradient || ep.backdropGradient, backdropVideoUrl: undefined });
    } else if (asset.kind === 'VIDEO') {
      patchEpisode({ backdropVideoUrl: asset.dataUrl });
    } else if (asset.kind === 'MUSIC') {
      patchEpisode({ musicAssetId: asset.id });
    } else if (asset.kind === 'AUDIO') {
      patchEpisode({ audioDataUrl: asset.dataUrl });
    } else {
      const role: StageEntityItem['role'] = asset.kind === 'PROP' ? 'PROP' : ep.entities.some((e) => e.role === 'LEAD') ? 'SUPPORT' : 'LEAD';
      const created: StageEntityItem = {
        id: `ent-${Date.now()}`,
        role,
        name: asset.name,
        emoji: asset.emoji || '🌟',
        imageUrl: asset.dataUrl,
        x: 55,
        y: 55,
        animation: role === 'PROP' ? 'idle' : 'bounce',
      };
      patchEpisode({ entities: [...ep.entities, created] });
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
        reader.onload = () => patchEpisode({ audioDataUrl: String(reader.result || '') });
        reader.readAsDataURL(new Blob(chunksRef.current, { type: 'audio/webm' }));
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch { /* ignore */ }
  };

  const buildCourseObj = (): DynamicKidsCourseGame => ({
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
      <div className="w-full max-w-5xl max-h-[93vh] flex flex-col rounded-3xl border-4 border-amber-300 bg-white text-slate-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <h2 className="text-sm sm:text-base font-black">Kids Dynamic Stage & Game Studio (Đa Tập • Đa Lớp • Hóa Thân Hero)</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-white/20"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          {/* Dynamic Course Header */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <select value={domainCode} onChange={(e) => setDomainCode(e.target.value as DynamicDomainCode)} className="sm:col-span-3 rounded-xl border-2 border-slate-200 px-2.5 py-2 font-black bg-slate-50">
              {DYNAMIC_DOMAINS.map((d) => <option key={d.code} value={d.code}>{d.emoji} {d.labelVi}</option>)}
            </select>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tên khóa học / game..." className="sm:col-span-5 rounded-xl border-2 border-amber-200 px-3 py-2 font-black" />
            <input value={heroBadgeTitle} onChange={(e) => setHeroBadgeTitle(e.target.value)} placeholder="Danh hiệu Hero khi phá đảo..." className="sm:col-span-4 rounded-xl border-2 border-indigo-200 px-3 py-2 font-bold text-indigo-800" />
          </div>

          {/* Episode Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {episodes.map((item, idx) => (
              <button key={item.id} onClick={() => { setEpIdx(idx); setSelectedEntId(null); }} className={`px-3 py-1.5 rounded-xl font-black transition ${idx === epIdx ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 text-slate-700'}`}>
                🎬 Tập {idx + 1}
              </button>
            ))}
            <button onClick={() => { setEpisodes((p) => [...p, DEFAULT_EPISODE(p.length + 1)]); setEpIdx(episodes.length); }} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-black">
              <Plus className="w-3.5 h-3.5" /> Thêm Tập
            </button>
            <button onClick={() => setAssetDrawerOpen(true)} className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-black shadow">
              <FolderPlus className="w-4 h-4" /> Kho Tài Nguyên (Cảnh / Nhân vật / Video / Music / Audio)
            </button>
          </div>

          {/* 6-Layer Stage + Entity Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-7 space-y-2">
              <KidsDynamicStageCanvas
                scene={ep}
                editable
                selectedEntityId={selectedEntId}
                onSelectEntity={setSelectedEntId}
                onMoveEntity={(id, x, y) => patchEntity(id, { x, y })}
              />
              <div className="text-[11px] text-slate-500 font-semibold">Mẹo: Bấm chọn nhân vật/phụ cảnh trên sân khấu rồi bấm vào vị trí mới để đặt tọa độ.</div>
            </div>

            <div className="lg:col-span-5 rounded-2xl border-2 border-slate-200 bg-slate-50 p-3 space-y-2.5">
              <input value={ep.episodeTitle} onChange={(e) => patchEpisode({ episodeTitle: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 font-black" placeholder="Tên tập..." />
              <div className="flex flex-wrap items-center gap-2">
                <select value={ep.ambientEffect} onChange={(e) => patchEpisode({ ambientEffect: e.target.value as AmbientEffectType })} className="flex-1 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 font-bold">
                  <option value="none">Hoạt cảnh: Không</option>
                  <option value="clouds">☁️ Mây trôi</option>
                  <option value="stars">✨ Ánh sao</option>
                  <option value="bubbles">🫧 Bọt biển</option>
                  <option value="petals">🌸 Hoa lá bay</option>
                  <option value="rain">🌧️ Mưa rơi</option>
                </select>
                <button onClick={() => void toggleRecord()} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-black text-white ${recording ? 'bg-rose-600 animate-pulse' : 'bg-indigo-600'}`}>
                  {recording ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />} {recording ? 'Dừng' : 'Thu Audio'}
                </button>
              </div>
              <textarea rows={2} value={ep.narration} onChange={(e) => patchEpisode({ narration: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white p-2 font-semibold" placeholder="Lời dẫn chuyện của tập..." />
              <input value={ep.challengeQuestion || ''} onChange={(e) => patchEpisode({ challengeQuestion: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 font-semibold" placeholder="Câu hỏi thử thách qua tập (tùy chọn)..." />

              {selectedEnt && (
                <div className="rounded-xl bg-amber-50 border border-amber-300 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between font-black text-amber-900">
                    <span>Đang chọn: {selectedEnt.emoji} {selectedEnt.name}</span>
                    <button onClick={() => { patchEpisode({ entities: ep.entities.filter((x) => x.id !== selectedEnt.id) }); setSelectedEntId(null); }} className="text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <select value={selectedEnt.role} onChange={(e) => patchEntity(selectedEnt.id, { role: e.target.value as StageEntityItem['role'] })} className="rounded-lg border border-amber-200 bg-white px-2 py-1 font-bold">
                      <option value="LEAD">Nhân vật Chính (Hero)</option>
                      <option value="SUPPORT">Nhân vật Phụ</option>
                      <option value="HELPER">Nhân vật Bổ trợ</option>
                      <option value="PROP">Phụ cảnh</option>
                    </select>
                    <select value={selectedEnt.animation} onChange={(e) => patchEntity(selectedEnt.id, { animation: e.target.value as CharAnimationType })} className="rounded-lg border border-amber-200 bg-white px-2 py-1 font-bold">
                      <option value="idle">Đứng yên</option>
                      <option value="bounce">Nhún nhảy</option>
                      <option value="fly">Bay lượn</option>
                      <option value="wave">Vẫy chào</option>
                    </select>
                  </div>
                  <input value={selectedEnt.speech || ''} onChange={(e) => patchEntity(selectedEnt.id, { speech: e.target.value })} placeholder="Bong bóng thoại của nhân vật..." className="w-full rounded-lg border border-amber-200 bg-white px-2 py-1 font-semibold" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap justify-end gap-2 text-xs">
          {onPlayGameNow && (
            <button onClick={() => { const c = buildCourseObj(); saveDynamicCourse(c); onPlayGameNow(c); onClose(); }} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black shadow">
              <Play className="w-4 h-4 fill-current" /> Lưu & Hóa Thân Chơi Thử
            </button>
          )}
          <button onClick={() => { const c = buildCourseObj(); saveDynamicCourse(c); onSaved(c); onClose(); }} className="inline-flex items-center gap-1.5 px-5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow">
            <Save className="w-4 h-4" /> Lưu Khóa Học / Game (Offline)
          </button>
        </div>
      </div>

      <KidsAssetDrawer open={assetDrawerOpen} onClose={() => setAssetDrawerOpen(false)} onApplyAsset={handleApplyAsset} />
    </div>
  );
};
