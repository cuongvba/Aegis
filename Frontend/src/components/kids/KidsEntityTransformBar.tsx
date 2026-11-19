import React from 'react';
import { Copy, FlipHorizontal2, Trash2 } from 'lucide-react';
import type { CharAnimationType, StageEntityItem } from './kidsStudioRegistry';

interface Props {
  entity: StageEntityItem;
  onPatch: (patch: Partial<StageEntityItem>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export const KidsEntityTransformBar: React.FC<Props> = ({
  entity,
  onPatch,
  onDuplicate,
  onDelete,
}) => {
  const scale = entity.scale ?? 1;
  const rotation = entity.rotation ?? 0;

  return (
    <div className="rounded-xl bg-amber-50 border border-amber-300 p-2.5 space-y-2">
      <div className="flex items-center justify-between gap-2 font-black text-amber-900">
        <span className="text-base">{entity.emoji}</span>
        <input
          value={entity.name}
          onChange={(e) => onPatch({ name: e.target.value })}
          placeholder="Đặt tên nhân vật / cảnh vật..."
          className="flex-1 min-w-0 rounded-lg border border-amber-200 bg-white px-2 py-0.5 text-xs font-black text-slate-900"
        />
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onPatch({ flipX: !entity.flipX })}
            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded font-bold ${entity.flipX ? 'bg-indigo-600 text-white' : 'bg-white border border-amber-200 text-slate-700'}`}
            title="Lật gương trái/phải"
          >
            <FlipHorizontal2 className="w-3 h-3" /> Gương
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-sky-100 text-sky-800"
            title="Nhân bản"
          >
            <Copy className="w-3 h-3" /> Nhân bản
          </button>
          <button type="button" onClick={onDelete} className="text-rose-600 p-0.5" title="Xóa">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <select
          value={entity.role}
          onChange={(e) => onPatch({ role: e.target.value as StageEntityItem['role'] })}
          className="rounded-lg border border-amber-200 bg-white px-2 py-1 font-bold"
        >
          <option value="LEAD">Nhân vật Chính</option>
          <option value="SUPPORT">Nhân vật Phụ</option>
          <option value="HELPER">Bổ trợ</option>
          <option value="PROP">Phụ cảnh</option>
        </select>
        <select
          value={entity.animation}
          onChange={(e) => onPatch({ animation: e.target.value as CharAnimationType })}
          className="rounded-lg border border-amber-200 bg-white px-2 py-1 font-bold"
        >
          <option value="idle">Đứng yên</option>
          <option value="bounce">Nhún nhảy</option>
          <option value="fly">Bay lơ lửng</option>
          <option value="wave">Vẫy chào</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-700">
        <label className="flex flex-col gap-0.5">
          <span>Kích cỡ (Gần/Xa): {scale.toFixed(1)}x</span>
          <input
            type="range"
            min={0.4}
            max={2.2}
            step={0.1}
            value={scale}
            onChange={(e) => onPatch({ scale: Number(e.target.value) })}
            className="accent-amber-500"
          />
        </label>
        <label className="flex flex-col gap-0.5">
          <span>Xoay góc: {rotation}°</span>
          <input
            type="range"
            min={-180}
            max={180}
            step={15}
            value={rotation}
            onChange={(e) => onPatch({ rotation: Number(e.target.value) })}
            className="accent-indigo-600"
          />
        </label>
      </div>

      <input
        value={entity.speech || ''}
        onChange={(e) => onPatch({ speech: e.target.value })}
        placeholder="Bong bóng thoại của nhân vật..."
        className="w-full rounded-lg border border-amber-200 bg-white px-2 py-1 font-semibold"
      />
    </div>
  );
};
