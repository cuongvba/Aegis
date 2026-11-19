import React, { useRef, useState } from 'react';
import { Brush, Film, Music, Plus, Upload, X } from 'lucide-react';
import {
  getStudioAssets,
  saveStudioAsset,
  type AssetKind,
  type StudioAssetItem,
} from './kidsStudioRegistry';

interface Props {
  open: boolean;
  onClose: () => void;
  onApplyAsset: (asset: StudioAssetItem) => void;
}

const TABS: { kind: AssetKind; label: string }[] = [
  { kind: 'BACKDROP', label: '🏞️ Phông Nền' },
  { kind: 'CHARACTER', label: '🦸 Nhân Vật' },
  { kind: 'PROP', label: '🌳 Phụ Cảnh' },
  { kind: 'VIDEO', label: '🎬 Video' },
  { kind: 'MUSIC', label: '🎵 Music' },
  { kind: 'AUDIO', label: '🎙️ Audio' },
];

export const KidsAssetDrawer: React.FC<Props> = ({ open, onClose, onApplyAsset }) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeKind, setActiveKind] = useState<AssetKind>('CHARACTER');
  const [assets, setAssets] = useState<StudioAssetItem[]>(() => getStudioAssets());
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🦊');
  const [drawingMode, setDrawingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  if (!open) return null;

  const filtered = assets.filter((a) => a.kind === activeKind);

  const handleUpload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const item: StudioAssetItem = {
        id: `ast-${Date.now()}`,
        kind: activeKind,
        name: newName.trim() || file.name,
        dataUrl: String(reader.result || ''),
        createdAt: new Date().toISOString(),
      };
      setAssets(saveStudioAsset(item));
      setNewName('');
    };
    reader.readAsDataURL(file);
  };

  const handleQuickCreateEmojiOrMusic = () => {
    const item: StudioAssetItem = activeKind === 'MUSIC'
      ? {
          id: `ast-${Date.now()}`,
          kind: 'MUSIC',
          name: newName.trim() || 'Giai điệu Mới (8 nốt)',
          emoji: '🎼',
          notes: [261.6, 293.6, 329.6, 392, 440, 523.2, 440, 392],
          createdAt: new Date().toISOString(),
        }
      : {
          id: `ast-${Date.now()}`,
          kind: activeKind,
          name: newName.trim() || `Tài nguyên ${newEmoji}`,
          emoji: newEmoji,
          createdAt: new Date().toISOString(),
        };
    setAssets(saveStudioAsset(item));
    setNewName('');
  };

  const handleSaveDrawing = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const item: StudioAssetItem = {
      id: `draw-${Date.now()}`,
      kind: activeKind === 'BACKDROP' || activeKind === 'PROP' ? activeKind : 'CHARACTER',
      name: newName.trim() || 'Tranh Tự Vẽ',
      dataUrl: canvas.toDataURL('image/png'),
      createdAt: new Date().toISOString(),
    };
    setAssets(saveStudioAsset(item));
    setDrawingMode(false);
    setNewName('');
  };

  const acceptMap: Record<AssetKind, string> = {
    BACKDROP: 'image/*,video/*',
    CHARACTER: 'image/*',
    PROP: 'image/*',
    VIDEO: 'video/mp4,video/webm',
    MUSIC: 'audio/*',
    AUDIO: 'audio/*',
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-3xl border-4 border-indigo-300 bg-white text-slate-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-indigo-600 to-sky-600 text-white">
          <h3 className="text-sm font-black">Kho Tài Nguyên Động — Tạo Mới & Nạp Vào Không Giới Hạn</h3>
          <button onClick={onClose} className="p-1 rounded-xl bg-white/20"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex flex-wrap gap-1 px-4 py-2 border-b border-slate-200 bg-slate-50 text-xs">
          {TABS.map((t) => (
            <button
              key={t.kind}
              onClick={() => { setActiveKind(t.kind); setDrawingMode(false); }}
              className={`px-3 py-1.5 rounded-xl font-black transition ${activeKind === t.kind ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Upload / Create Bar */}
          <div className="rounded-2xl bg-indigo-50 border-2 border-indigo-200 p-3 flex flex-wrap items-center gap-2">
            <input ref={fileRef} type="file" accept={acceptMap[activeKind]} className="hidden" onChange={(e) => handleUpload(e.target.files?.[0])} />
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Đặt tên tài nguyên mới..." className="flex-1 min-w-[160px] rounded-xl border border-indigo-200 bg-white px-3 py-1.5 font-bold" />
            <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-black">
              <Upload className="w-3.5 h-3.5" /> Nạp Từ Máy
            </button>
            {(activeKind === 'CHARACTER' || activeKind === 'PROP' || activeKind === 'BACKDROP') && (
              <button onClick={() => setDrawingMode((v) => !v)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 text-white font-black">
                <Brush className="w-3.5 h-3.5" /> Tự Vẽ Mới
              </button>
            )}
            {(activeKind === 'CHARACTER' || activeKind === 'PROP' || activeKind === 'MUSIC') && (
              <>
                {activeKind !== 'MUSIC' && (
                  <input value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} className="w-12 text-center rounded-xl border border-indigo-200 bg-white py-1 text-base" />
                )}
                <button onClick={handleQuickCreateEmojiOrMusic} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-black">
                  <Plus className="w-3.5 h-3.5" /> Tạo Nhanh
                </button>
              </>
            )}
          </div>

          {drawingMode && (
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-3 space-y-2">
              <div className="font-black text-amber-900">Bảng Vẽ Sáng Tạo (Kéo chuột / Ngón tay để vẽ nhân vật hoặc cảnh mới)</div>
              <canvas
                ref={drawCanvasRef}
                width={320}
                height={180}
                onMouseDown={(e) => {
                  setIsDrawing(true);
                  const ctx = drawCanvasRef.current?.getContext('2d');
                  const r = e.currentTarget.getBoundingClientRect();
                  if (ctx) { ctx.beginPath(); ctx.lineWidth = 4; ctx.strokeStyle = '#1e293b'; ctx.moveTo(e.clientX - r.left, e.clientY - r.top); }
                }}
                onMouseMove={(e) => {
                  if (!isDrawing) return;
                  const ctx = drawCanvasRef.current?.getContext('2d');
                  const r = e.currentTarget.getBoundingClientRect();
                  if (ctx) { ctx.lineTo(e.clientX - r.left, e.clientY - r.top); ctx.stroke(); }
                }}
                onMouseUp={() => setIsDrawing(false)}
                className="bg-white rounded-xl border-2 border-slate-300 cursor-crosshair mx-auto block"
              />
              <div className="flex justify-end gap-2">
                <button onClick={handleSaveDrawing} className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white font-black">Lưu Tranh Vào Kho</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => { onApplyAsset(item); onClose(); }}
                className="rounded-2xl border-2 border-slate-200 hover:border-indigo-500 p-2.5 text-center space-y-1.5 bg-slate-50 hover:bg-indigo-50 transition"
              >
                {item.dataUrl && (item.kind === 'CHARACTER' || item.kind === 'PROP' || item.kind === 'BACKDROP') ? (
                  <img src={item.dataUrl} alt={item.name} className="w-12 h-12 rounded-xl object-cover mx-auto" />
                ) : item.kind === 'VIDEO' ? (
                  <Film className="w-8 h-8 text-purple-600 mx-auto" />
                ) : item.kind === 'MUSIC' || item.kind === 'AUDIO' ? (
                  <Music className="w-8 h-8 text-pink-600 mx-auto" />
                ) : (
                  <div className="text-3xl">{item.emoji || '🎨'}</div>
                )}
                <div className="font-bold text-slate-800 truncate">{item.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
